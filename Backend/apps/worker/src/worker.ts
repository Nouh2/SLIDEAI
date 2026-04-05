// apps/worker/src/worker.ts
// SlideAI Worker - Professional Presentation Generation Engine
// Modular architecture with support for rich content types

import 'dotenv/config';
import * as crypto from 'crypto';
import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { ulid } from 'ulid';
import AWS from 'aws-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import PptxGenJS from 'pptxgenjs';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import {
  buildTrialEmailContent as buildLifecycleEmailContent,
  sendLifecycleEmail as deliverLifecycleEmail,
  type EmailContentPatch,
  type WinbackOffer,
} from './lifecycle-email.js';

// Local modules
import { THEMES, normalizeTheme, type ThemeConfig } from './config/themes.js';
import { DECK_ARCHITECT_PROMPT, buildUserPrompt } from './prompts/deck-architect.js';
import { SLIDE_REGENERATOR_PROMPT, buildSlideRegeneratorPrompt } from './prompts/slide-regenerator.js';
import { SLIDE_ADDER_PROMPT, buildSlideAdderPrompt } from './prompts/slide-adder.js';
import { TRANSLATE_DECK_PROMPT, buildTranslateDeckPrompt } from './prompts/translate-deck.js';
import { getUnsplashImage, fetchImagesForDeck } from './utils/unsplash.js';
import { sanitizeDeck, type Deck, type Slide } from './utils/sanitize.js';
import { renderSlide, defineThemeMasters } from './renderers/index.js';
import { DECK_RESPONSE_SCHEMA, SINGLE_SLIDE_RESPONSE_SCHEMA } from './schemas/deck-schema.js';

// ============================================
// FILE-BASED LOGGING
// ============================================
const LOG_FILE = path.join(process.cwd(), 'worker-debug.log');
const DAY_MS = 24 * 60 * 60 * 1000;

function logToFile(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  let logEntry = `[${timestamp}] ${message}\n`;
  if (data !== undefined) {
    logEntry += typeof data === 'string' ? data + '\n' : JSON.stringify(data, null, 2) + '\n';
  }
  logEntry += '\n';

  // Also log to console
  console.log(message);
  if (data) console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));

  // Append to file
  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (err) {
    console.error('[Log] Error writing to log file:', err);
  }
}

// Clear log file on startup
try {
  fs.writeFileSync(LOG_FILE, `=== SlideAI Worker Log Started: ${new Date().toISOString()} ===\n\n`);
  console.log(`[Log] Writing detailed logs to: ${LOG_FILE}`);
} catch (err) {
  console.error('[Log] Could not create log file:', err);
}

// ============================================
// INITIALIZATION
// ============================================

const PptxGen = (PptxGenJS as any).default || PptxGenJS;

// Helper to get Redis URL (supports REDIS_URL or REDIS_HOST/PORT/PASSWORD)
function getRedisUrl(): string {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  const password = process.env.REDIS_PASSWORD;
  return password ? `redis://:${password}@${host}:${port}` : `redis://${host}:${port}`;
}

const redisUrl = getRedisUrl();
console.log('[Worker] Connecting to Redis:', redisUrl.replace(/:[^:@]+@/, ':***@'));

// Redis connections
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});
const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Log Redis connection status
connection.on('connect', () => {
  console.log('[Worker] ✅ Redis connected successfully');
});
connection.on('error', (err) => {
  console.error('[Worker] ❌ Redis connection error:', err.message);
});

// R2/S3 Storage
const hasR2 = !!process.env.R2_ACCOUNT_ID && !!process.env.R2_ACCESS_KEY_ID;
const r2 = hasR2
  ? new AWS.S3({
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    signatureVersion: 'v4',
    s3ForcePathStyle: true,
  })
  : null;
const bucket = process.env.R2_BUCKET ?? 'slideai-exports';

// Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia' as any,
    })
  : null;

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (!supabase) {
  console.warn('[Worker] ⚠️ Supabase credentials missing. Data saving disabled.');
} else {
  console.log('[Worker] ✅ Supabase client initialized');
}

// ============================================
// HELPERS
// ============================================

/**
 * Store job status in Redis
 */
async function setJob(traceId: string, value: any, ttlSec = 3600) {
  await redis.set(`job:${traceId}`, JSON.stringify(value), 'EX', ttlSec);
}

/**
 * Save token usage to database for cost tracking
 */
async function saveTokenUsage(params: {
  userId: string;
  presentationId?: string;
  jobType: string;
  traceId?: string;
  inputTokens: number;
  outputTokens: number;
  model?: string;
}) {
  if (!supabase) return;

  const inputCost = (params.inputTokens / 1_000_000) * 0.50;
  const outputCost = (params.outputTokens / 1_000_000) * 3.00;
  const totalCost = inputCost + outputCost;

  try {
    const { error } = await supabase.from('token_usage').insert({
      user_id: params.userId,
      presentation_id: params.presentationId || null,
      job_type: params.jobType,
      trace_id: params.traceId || null,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      total_tokens: params.inputTokens + params.outputTokens,
      input_cost: inputCost,
      output_cost: outputCost,
      total_cost: totalCost,
      model: params.model || model,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[TokenUsage] ❌ Failed to save:', error.message);
    } else {
      console.log(`[TokenUsage] ✅ Saved: ${params.inputTokens} in / ${params.outputTokens} out = $${totalCost.toFixed(6)}`);
    }
  } catch (err: any) {
    console.error('[TokenUsage] ❌ Exception:', err.message);
  }
}

type SubscriptionRow = {
  userId: string;
  plan: string;
  status: string;
  creditsRemaining: number;
  creditsResetAt?: string | null;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  trialConsumedAt?: string | null;
  legacyFree?: boolean | null;
  requiresPayment?: boolean | null;
  stripeSubscriptionId?: string | null;
};

function buildNextMonthlyResetAt(from: Date): string {
  return new Date(from.getFullYear(), from.getMonth() + 1, 1).toISOString();
}

function sameInstant(left?: string | null, right?: string | null): boolean {
  if (!left || !right) return false;
  return new Date(left).getTime() === new Date(right).getTime();
}

function hasPaidAccess(subscription: SubscriptionRow | null): boolean {
  if (!subscription) return false;
  if (subscription.status === 'trialing') return false;
  if (subscription.requiresPayment) return false;
  return ['starter', 'pro', 'business'].includes(subscription.plan);
}

async function getSubscriptionRow(userId: string): Promise<SubscriptionRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('Subscription')
    .select('*')
    .eq('userId', userId)
    .maybeSingle();

  if (error) {
    console.error('[LifecycleEmail] Failed to load subscription:', error.message);
    return null;
  }

  return data as SubscriptionRow | null;
}

async function normalizeSubscriptionRow(subscription: SubscriptionRow | null): Promise<SubscriptionRow | null> {
  if (!subscription || subscription.status !== 'trialing' || !subscription.trialEndsAt) {
    return subscription;
  }

  if (new Date(subscription.trialEndsAt) > new Date()) {
    return subscription;
  }

  if (!supabase) return subscription;

  const now = new Date().toISOString();

  if (subscription.legacyFree) {
    const patch = {
      plan: 'free',
      status: 'active',
      creditsRemaining: 2,
      creditsResetAt: buildNextMonthlyResetAt(new Date()),
      requiresPayment: false,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from('Subscription')
      .update(patch)
      .eq('userId', subscription.userId)
      .select('*')
      .single();

    if (error) {
      console.error('[LifecycleEmail] Failed to restore legacy free after trial:', error.message);
      return subscription;
    }

    return data as SubscriptionRow;
  }

  const patch = {
    status: 'trial_expired',
    creditsRemaining: 0,
    creditsResetAt: null,
    requiresPayment: true,
    updatedAt: now,
  };

  const { data, error } = await supabase
    .from('Subscription')
    .update(patch)
    .eq('userId', subscription.userId)
    .select('*')
    .single();

  if (error) {
    console.error('[LifecycleEmail] Failed to mark trial as expired:', error.message);
    return subscription;
  }

  return data as SubscriptionRow;
}

async function getPresentationCount(userId: string): Promise<number> {
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from('presentations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('[LifecycleEmail] Failed to count presentations:', error.message);
    return 0;
  }

  return count || 0;
}

async function getRecentPresentationCount(userId: string, days: number): Promise<number> {
  if (!supabase) return 0;

  const since = new Date(Date.now() - days * DAY_MS).toISOString();

  const { count, error } = await supabase
    .from('presentations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since);

  if (error) {
    console.error(`[LifecycleEmail] Failed to count presentations over ${days}d:`, error.message);
    return 0;
  }

  return count || 0;
}

async function getLifecycleEmailStatus(dedupeKey: string): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('LifecycleEmailLog')
    .select('status')
    .eq('dedupeKey', dedupeKey)
    .maybeSingle();

  if (error) {
    console.error('[LifecycleEmail] Failed to load lifecycle log:', error.message);
    return null;
  }

  return (data as { status?: string } | null)?.status || null;
}

async function getLifecycleEmailLog(dedupeKey: string): Promise<{ status?: string; payload?: any } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('LifecycleEmailLog')
    .select('status, payload')
    .eq('dedupeKey', dedupeKey)
    .maybeSingle();

  if (error) {
    console.error('[LifecycleEmail] Failed to load lifecycle log details:', error.message);
    return null;
  }

  return (data as { status?: string; payload?: any } | null) || null;
}

async function setLifecycleEmailStatus(
  dedupeKey: string,
  status: 'sent' | 'skipped',
  options?: { statusReason?: string; providerMessageId?: string | null },
) {
  if (!supabase) return;

  const patch: Record<string, any> = {
    status,
    updatedAt: new Date().toISOString(),
    ...(options?.statusReason ? { statusReason: options.statusReason } : {}),
    ...(options?.providerMessageId ? { providerMessageId: options.providerMessageId } : {}),
  };

  if (status === 'sent') {
    patch.sentAt = new Date().toISOString();
  }

  const { error } = await supabase
    .from('LifecycleEmailLog')
    .update(patch)
    .eq('dedupeKey', dedupeKey);

  if (error) {
    console.error('[LifecycleEmail] Failed to update lifecycle log:', error.message);
  }
}

async function mergeLifecycleEmailPayload(dedupeKey: string, payloadPatch: Record<string, any>) {
  if (!supabase) return;

  const existing = await getLifecycleEmailLog(dedupeKey);
  const nextPayload = {
    ...(existing?.payload || {}),
    ...payloadPatch,
  };

  const { error } = await supabase
    .from('LifecycleEmailLog')
    .update({
      payload: nextPayload,
      updatedAt: new Date().toISOString(),
    })
    .eq('dedupeKey', dedupeKey);

  if (error) {
    console.error('[LifecycleEmail] Failed to merge lifecycle payload:', error.message);
  }
}

function buildWinbackPromoCode() {
  return `TRIAL20-${ulid().slice(-6).toUpperCase()}`;
}

async function ensureWinbackOffer(params: {
  dedupeKey: string;
  userId: string;
  email: string;
}): Promise<WinbackOffer | null> {
  if (!stripe) {
    console.warn('[LifecycleEmail] STRIPE_SECRET_KEY missing, winback promo will not be generated');
    return null;
  }

  const existing = await getLifecycleEmailLog(params.dedupeKey);
  const existingOffer = existing?.payload?.winbackOffer as WinbackOffer | undefined;

  if (existingOffer?.code && existingOffer?.expiresAt && new Date(existingOffer.expiresAt).getTime() > Date.now()) {
    return existingOffer;
  }

  const percentOff = Number(process.env.STRIPE_WINBACK_PERCENT_OFF || 20);
  const expiresInHours = Number(process.env.STRIPE_WINBACK_EXPIRY_HOURS || 72);
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  const code = buildWinbackPromoCode();

  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: 'once',
    name: `SlideAI trial winback ${percentOff}%`,
    metadata: {
      managedBy: 'slideai-worker',
      dedupeKey: params.dedupeKey,
      userId: params.userId,
      email: params.email,
      offerType: 'trial_winback_day2',
    },
  });

  const promotionCode = await stripe.promotionCodes.create({
    promotion: {
      type: 'coupon',
      coupon: coupon.id,
    },
    code,
    expires_at: Math.floor(expiresAt.getTime() / 1000),
    max_redemptions: 1,
    metadata: {
      managedBy: 'slideai-worker',
      dedupeKey: params.dedupeKey,
      userId: params.userId,
      email: params.email,
      offerType: 'trial_winback_day2',
    },
  });

  const offer: WinbackOffer = {
    code: promotionCode.code,
    expiresAt: expiresAt.toISOString(),
    percentOff,
    expiresInHours,
  };

  await mergeLifecycleEmailPayload(params.dedupeKey, {
    winbackOffer: {
      ...offer,
      couponId: coupon.id,
      promotionCodeId: promotionCode.id,
    },
  });

  return offer;
}

function buildTrialEmailContent(params: {
  emailType: string;
  legacyFree: boolean;
  trialEndsAt: string;
  presentationCount: number;
}) {
  const appUrl = process.env.FRONTEND_URL || 'https://slideai.fr';
  const pricingUrl = `${appUrl.replace(/\/$/, '')}/pricing`;
  const createUrl = `${appUrl.replace(/\/$/, '')}/create`;
  const daysLeft = Math.max(0, Math.ceil((new Date(params.trialEndsAt).getTime() - Date.now()) / DAY_MS));

  switch (params.emailType) {
    case 'trial_welcome':
      return {
        subject: 'Bienvenue dans votre essai Pro SlideAI',
        html: `<p>Votre essai Pro de 7 jours est activé.</p><p>Commencez par créer votre première présentation pour voir la valeur tout de suite.</p><p><a href="${createUrl}">Créer ma première présentation</a></p>`,
      };
    case 'trial_inactive_day1':
      return {
        subject: 'Votre essai est lancé: créez votre première présentation',
        html: `<p>Vous avez activé SlideAI mais vous n'avez pas encore créé de présentation.</p><p>Commencez avec un document client et obtenez un deck en quelques minutes.</p><p><a href="${createUrl}">Lancer une génération</a></p>`,
      };
    case 'trial_value_day4':
      return {
        subject: 'Continuez à profiter de votre essai Pro',
        html: `<p>Vous avez déjà créé ${params.presentationCount} présentation(s) pendant l'essai.</p><p>Profitez du reste de votre accès Pro pour générer, exporter et livrer plus vite.</p><p><a href="${pricingUrl}">Voir l'offre Pro</a></p>`,
      };
    case 'trial_ending_day6':
      return {
        subject: 'Votre essai SlideAI se termine demain',
        html: `<p>Il vous reste environ ${daysLeft} jour avant la fin de votre essai Pro.</p><p>Si vous voulez garder l'accès complet, passez au plan Pro maintenant.</p><p><a href="${pricingUrl}">Passer à Pro</a></p>`,
      };
    case 'trial_expired':
      return {
        subject: params.legacyFree
          ? 'Votre essai Pro est terminé'
          : 'Votre essai Pro SlideAI est terminé',
        html: params.legacyFree
          ? `<p>Votre essai Pro est terminé. Votre compte revient maintenant sur votre accès gratuit historique.</p><p>Pour retrouver toutes les fonctionnalités Pro, activez un abonnement.</p><p><a href="${pricingUrl}">Voir l'offre Pro</a></p>`
          : `<p>Votre essai Pro est terminé et les nouvelles créations sont maintenant bloquées.</p><p>Activez l'abonnement Pro pour continuer à utiliser SlideAI.</p><p><a href="${pricingUrl}">Débloquer SlideAI</a></p>`,
      };
    case 'trial_winback_day2':
      return {
        subject: 'Offre de relance: -20% sur votre premier mois',
        html: `<p>Vous pouvez reprendre SlideAI maintenant avec -20% sur votre premier mois.</p><p>Utilisez le code <strong>TRIAL20</strong> au checkout dans les prochaines 72 heures.</p><p><a href="${pricingUrl}">Activer mon offre</a></p>`,
      };
    default:
      return null;
  }
}

async function sendLifecycleEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'SlideAI <noreply@slideai.fr>';

  if (!resendApiKey) {
    console.warn('[LifecycleEmail] RESEND_API_KEY missing, skipping actual send');
    return { skipped: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error (${response.status}): ${body}`);
  }

  return response.json();
}

/**
 * Determine theme based on prompt keywords if not specified
 */
function inferThemeFromPrompt(prompt: string, explicitTheme?: string): string {
  if (explicitTheme) return explicitTheme;

  const lowerPrompt = prompt.toLowerCase();

  // Keyword-based theme inference
  const themeKeywords: Record<string, string[]> = {
    'tech-modern': ['cyber', 'ai', 'tech', 'hacker', 'digital', 'neon', 'matrix', 'dark', 'future'],
    'startup-pitch': ['startup', 'pitch', 'investor', 'funding', 'series', 'venture'],
    'corporate-report': ['report', 'quarterly', 'annual', 'business', 'corporate', 'finance'],
    'creative-portfolio': ['portfolio', 'creative', 'design', 'artistic', 'visual'],
    'product-launch': ['launch', 'product', 'release', 'announcement', 'new'],
    'educational': ['course', 'training', 'education', 'tutorial', 'learn', 'school'],
    'health-medical': ['health', 'medical', 'healthcare', 'clinic', 'hospital'],
    'sustainability': ['green', 'eco', 'sustainable', 'climate', 'environment'],
    'marketing-campaign': ['marketing', 'campaign', 'ads', 'social', 'brand'],
    'consulting': ['consulting', 'strategy', 'advisory', 'management'],
  };

  for (const [themeId, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some((kw) => lowerPrompt.includes(kw))) {
      console.log(`[Theme] Inferred "${themeId}" from prompt keywords`);
      return themeId;
    }
  }

  return 'startup-pitch'; // Default
}

// ============================================
// PPTX GENERATION
// ============================================

/**
 * Generate a PowerPoint file from a deck
 */
async function generatePPTX(deck: Deck): Promise<Buffer> {
  const pptx = new PptxGen();
  const theme = deck.themeConfig || normalizeTheme(deck.theme);

  // Set presentation properties
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = deck.title || 'Presentation';
  pptx.author = 'SlideAI';
  pptx.company = 'SlideAI';

  // Define slide masters
  defineThemeMasters(pptx, theme);

  // Render each slide
  for (let i = 0; i < deck.slides.length; i++) {
    const slide = deck.slides[i];
    const layout = (slide.layout || '').toLowerCase();
    const masterName = layout.includes('cover') || i === 0 ? 'MASTER_COVER' : 'MASTER_CONTENT';

    try {
      renderSlide(pptx, slide, theme, i, masterName);
    } catch (error) {
      console.error(`[PPTX] Error rendering slide ${i}:`, error);
      // Add a fallback slide
      const fallbackSlide = pptx.addSlide({ masterName });
      fallbackSlide.addText(slide.title || `Slide ${i + 1}`, {
        x: 0.5,
        y: 3,
        w: 12.5,
        h: 1,
        fontSize: 36,
        bold: true,
        color: theme.colors.text.replace('#', ''),
        align: 'center',
      });
    }
  }

  return (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
}

// ============================================
// WORKER: GENERATE
// ============================================

const generateWorker = new Worker(
  'generate',
  async (job) => {
    const { traceId, data, user } = job.data as any;
    let { prompt, slideCount, theme, language, documentText, brandLogoUrl, templateOverlay, brandColors, brandFonts } = data ?? {};
    const userId = user?.sub || 'anonymous'; // Extract user ID from JWT
    const orgId = user?.org; // Extract orgId from user context

    console.log(`\n========== GENERATE JOB: ${traceId} ==========`);
    console.log(`[Generate] User ID: ${userId}`);
    console.log(`[Generate] Prompt: "${prompt?.slice(0, 100)}..."`);
    console.log(`[Generate] Requested slides: ${slideCount}, Theme: ${theme}`);
    console.log(`[Generate] Brand colors provided: ${!!brandColors}`);

    await setJob(traceId, {
      status: 'processing',
      type: 'generate',
      startedAt: Date.now(),
      hasDocument: !!documentText,
      userId,
    });

    try {
      // 1. Infer theme if not provided
      const inferredTheme = inferThemeFromPrompt(prompt, theme);
      const themeConfig = normalizeTheme(inferredTheme);

      console.log(`[Generate] Theme resolved: "${inferredTheme}" -> "${themeConfig.id}"`);

      // 2. Call OpenAI with the Deck Architect prompt (with optional document context)
      const userMessage = buildUserPrompt(prompt, slideCount, themeConfig.id, language, documentText);

      // Use higher token limit for document mode (needs more slides)
      // Gemini 3 Flash supports up to 64K output tokens
      const isHighDensityMode = !!documentText && documentText.length > 0;
      const tokenLimit = isHighDensityMode ? 16000 : 8000;

      console.log(`[Generate] Mode: ${isHighDensityMode ? 'HIGH-DENSITY (document)' : 'Standard'}, max_tokens: ${tokenLimit}`);

      // Create Gemini model with JSON response mode AND strict schema
      const geminiModel = genAI.getGenerativeModel({
        model,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: tokenLimit,
          responseMimeType: 'application/json',
          responseSchema: DECK_RESPONSE_SCHEMA as any, // Strict schema enforcement
        },
      });

      // Combine system and user prompts for Gemini
      const fullPrompt = `${DECK_ARCHITECT_PROMPT}\n\n---\n\nUser Request:\n${userMessage}`;

      // Helper function to call Gemini and track tokens
      const callGemini = async (promptText: string, isRetry = false) => {
        const response = await geminiModel.generateContent(promptText);
        const responseText = response.response.text();
        const metadata = response.response.usageMetadata;
        return {
          raw: responseText,
          inputTokens: metadata?.promptTokenCount || 0,
          outputTokens: metadata?.candidatesTokenCount || 0,
          isRetry,
        };
      };

      // First attempt
      let result = await callGemini(fullPrompt);
      let raw = result.raw;
      let totalInputTokens = result.inputTokens;
      let totalOutputTokens = result.outputTokens;

      // Get token usage from response
      const totalTokens = totalInputTokens + totalOutputTokens;

      // Calculate cost (Gemini 3 Flash: $0.50/1M input, $3.00/1M output)
      const inputCost = (totalInputTokens / 1_000_000) * 0.50;
      const outputCost = (totalOutputTokens / 1_000_000) * 3.00;
      const totalCost = inputCost + outputCost;

      console.log(`[Generate] 📊 Tokens: ${totalInputTokens} in / ${totalOutputTokens} out (${totalTokens} total)`);
      console.log(`[Generate] 💰 Cost: $${totalCost.toFixed(6)} ($${inputCost.toFixed(6)} in + $${outputCost.toFixed(6)} out)`);

      // Save token usage to database
      await saveTokenUsage({
        userId,
        jobType: 'generate',
        traceId,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      });

      if (!raw) throw new Error('Empty AI response');

      // === DEBUG: Save raw AI response to file ===
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const debugDir = path.join(process.cwd(), 'debug-logs');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(debugDir, `${timestamp}_raw_ai_response.json`),
        raw,
        'utf-8'
      );
      console.log(`[Generate] 📝 DEBUG: Raw AI response saved to debug-logs/${timestamp}_raw_ai_response.json`);

      // 3. Parse the deck with RETRY mechanism
      let deck: Deck;
      try {
        deck = JSON.parse(raw);
      } catch (parseError) {
        console.error('[Generate] ⚠️ JSON parse error, attempting RETRY with correction prompt...');

        // Save the failed response for debugging
        fs.writeFileSync(
          path.join(debugDir, `${timestamp}_FAILED_response.json`),
          raw,
          'utf-8'
        );

        // Retry with a correction prompt
        const correctionPrompt = `${fullPrompt}\n\n---\n\nCRITICAL: Your previous response was not valid JSON. Please output ONLY valid JSON matching the exact schema. No markdown, no explanation, just the JSON object.`;

        try {
          const retryResult = await callGemini(correctionPrompt, true);
          raw = retryResult.raw;

          // Save retry token usage
          await saveTokenUsage({
            userId,
            jobType: 'generate-retry',
            traceId,
            inputTokens: retryResult.inputTokens,
            outputTokens: retryResult.outputTokens,
          });

          console.log(`[Generate] 🔄 Retry used ${retryResult.inputTokens + retryResult.outputTokens} additional tokens`);

          // Save retry response
          fs.writeFileSync(
            path.join(debugDir, `${timestamp}_retry_response.json`),
            raw,
            'utf-8'
          );

          deck = JSON.parse(raw);
          console.log('[Generate] ✅ Retry successful!');
        } catch (retryError) {
          console.error('[Generate] ❌ Retry also failed:', retryError);
          throw new Error('Invalid JSON from AI after retry');
        }
      }

      // Deck parsed successfully

      // INJECT COLORS FROM THEME OR BRAND KIT
      // INJECT COLORS FROM THEME OR BRAND KIT
      if (brandColors) {
        console.log('[Generate] Applying Brand Kit Colors');
        deck.colorPalette = {
          primary: brandColors.primary,
          secondary: brandColors.secondary,
          accent: brandColors.accent,
          bg: brandColors.background,
          text: brandColors.text
        };

        // CRITICAL: Also update themeConfig to ensure consistency across all renderers (PPTX, etc.)
        themeConfig.colors = {
          ...themeConfig.colors,
          background: brandColors.background,
          surface: brandColors.background, // Use bg for surface to keep it consistent
          text: brandColors.text,
          textSecondary: brandColors.text, // Fallback for now
          accent: brandColors.primary, // Brand Primary -> Theme Accent (Standard mapping)
          accentSecondary: brandColors.secondary,
          chartColors: [
            brandColors.primary,
            brandColors.secondary,
            brandColors.accent,
            brandColors.text,
            brandColors.background
          ]
        };
      } else {
        // We force the specific colors defined in the theme config
        deck.colorPalette = {
          primary: themeConfig.colors.accent,
          secondary: themeConfig.colors.accentSecondary,
          accent: themeConfig.colors.chartColors[2] || themeConfig.colors.accent, // Use a third color for accent if possible
          bg: themeConfig.colors.background,
          text: themeConfig.colors.text
        };
      }

      // Inject Brand Fonts if available
      if (brandFonts) {
        deck.fontConfig = brandFonts;
        themeConfig.fonts = brandFonts; // Propagate to themeConfig as well
      }

      // BRAND KIT ENFORCEMENT: Strip AI-generated style overrides
      if (brandColors && deck.slides) {
        console.log('[Generate] Enforcing Brand Kit: Stripping AI style overrides...');
        deck.slides.forEach((slide: any) => {
          // 1. Clean Floating Elements
          if (slide.elements && Array.isArray(slide.elements)) {
            slide.elements.forEach((el: any) => {
              if (el.style) {
                // Remove specific color overrides so they fall back to the palette
                delete el.style.color;
                delete el.style.backgroundColor;
                delete el.style.borderColor;
                // Enforce font if needed
                if (brandFonts) {
                  el.style.fontFamily = brandFonts.body;
                }
              }
            });
          }

          // 2. Clean Chart Colors (if AI tried to set them)
          if (slide.content?.chart?.series) {
            // We generally let the renderer assign colors from chartColors palette,
            // but if the series has specific 'color' property, we should remove it?
            slide.content.chart.series.forEach((s: any) => {
              if (s.color) delete s.color;
            });
          }
        });
      }

      deck = sanitizeDeck(deck, prompt);
      deck.theme = themeConfig.id;
      deck.themeConfig = themeConfig;

      // === POST-PROCESSING: Enrich SourceRef with Content Snippets ===
      const sectionMeta = data.sectionMeta as any[];
      if (sectionMeta && Array.isArray(sectionMeta) && deck.slides) {
        console.log(`[Generate] Enriching ${deck.slides.length} slides with source content...`);
        deck.slides.forEach(slide => {
          const sourceRef = slide.sourceRef;
          if (sourceRef && sourceRef.sectionTitle) {
            // Find matching section by title (fuzzy match or exact)
            const matchedSection = sectionMeta.find(s =>
              s.title.toLowerCase().includes(sourceRef.sectionTitle.toLowerCase()) ||
              sourceRef.sectionTitle.toLowerCase().includes(s.title.toLowerCase())
            );

            if (matchedSection && matchedSection.content) {
              sourceRef.originalText = matchedSection.content;
            }
          }
        });
      }

      // Inject Custom Templates data
      if (brandLogoUrl) deck.brandLogoUrl = brandLogoUrl;
      if (templateOverlay) deck.templateOverlay = templateOverlay;

      // === DEBUG: Save final processed deck to file ===
      fs.writeFileSync(
        path.join(debugDir, `${timestamp}_final_deck.json`),
        JSON.stringify(deck, null, 2),
        'utf-8'
      );
      console.log(`[Generate] 📝 DEBUG: Final deck saved to debug-logs/${timestamp}_final_deck.json`);

      console.log(`[Generate] Deck has ${deck.slides.length} slides`);

      // Slides processed

      // 4. Fetch images for each slide
      // Fetch Unsplash images silently (Batched to avoid rate limiting)

      console.log(`[Generate] Fetching images for ${deck.slides.length} slides (batched)...`);

      // We need to map the results back to the slides
      // fetchImagesForDeck takes a simplified array, so we need to coordinate
      const slidesWithQueries = deck.slides.map(s => ({
        imageSearchQuery: s.imageSearchQuery
      }));

      const imageResults = await fetchImagesForDeck(
        slidesWithQueries,
        themeConfig.imageKeywords
      );

      // Apply results to slides
      deck.slides = deck.slides.map((slide, index) => {
        const result = imageResults[index];
        return {
          ...slide,
          backgroundImage: result?.url || '',
          unsplashPhotographer: result?.photographer
        };
      });

      // SAVE TO SUPABASE with real user ID (AFTER images are fetched)
      if (supabase) {
        try {
          // Generate a UUID for the presentation (Supabase doesn't auto-generate like Prisma)
          const presentationId = crypto.randomUUID();

          const { data: savedDeck, error: saveError } = await supabase
            .from('presentations')
            .insert({
              id: presentationId, // Explicit UUID
              user_id: userId, // Use real user ID from JWT
              orgId: orgId, // Save orgId
              title: deck.title || 'Untitled Presentation',
              slides: deck, // Now contains images
              theme: themeConfig.id,
              status: 'ready',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (saveError) {
            console.error('[Generate] ❌ Failed to save to Supabase:', saveError.message);
          } else {
            console.log('[Generate] ✅ Saved to Supabase ID:', savedDeck.id);
            // Update deck ID with the real DB ID
            deck.id = savedDeck.id;
          }
        } catch (err: any) {
          console.error('[Generate] ❌ Supabase Save Exception:', err.message);
        }
      }

      // Generation complete

      console.log('[Generate] ✅ Generation complete');

      await setJob(traceId, {
        status: 'succeeded',
        type: 'generate',
        deck: {
          ...deck,
          id: deck.id // This should now be the UUID from Supabase if save was successful
        },
        finishedAt: Date.now(),
      });

      return { traceId, deck };
    } catch (err: any) {
      console.error('[Generate] ❌ Error:', err.message);
      const fallbackConfig = normalizeTheme('startup-pitch');
      await setJob(traceId, {
        status: 'failed',
        type: 'generate',
        error: err.message,
        deck: { themeConfig: fallbackConfig, slides: [] },
        finishedAt: Date.now(),
      });
      throw err;
    }
  },
  { connection }
);

// ============================================
// WORKER: EXPORT
// ============================================

const exportWorker = new Worker(
  'export',
  async (job) => {
    const { traceId, data } = job.data as any;

    console.log(`\n========== EXPORT JOB: ${traceId} ==========`);

    await setJob(traceId, {
      status: 'processing',
      type: 'export',
      startedAt: Date.now(),
    });

    try {
      // Ensure themeConfig exists
      if (data.deck && !data.deck.themeConfig) {
        console.log('[Export] Restoring themeConfig...');
        const themeId = data.deck.theme || 'startup-pitch';
        data.deck.themeConfig = normalizeTheme(themeId);
      }

      // Sanitize the deck before export
      const deck = sanitizeDeck(data.deck, data.deck?.title);
      deck.themeConfig = data.deck.themeConfig;

      console.log(`[Export] Generating PPTX for "${deck.title}" with ${deck.slides.length} slides`);

      // Generate PPTX
      const buffer = await generatePPTX(deck);

      console.log(`[Export] PPTX generated: ${buffer.length} bytes`);

      // Upload to R2 or save locally
      if (hasR2 && r2) {
        const key = `exports/${ulid()}.pptx`;
        await r2.putObject({ Bucket: bucket, Key: key, Body: buffer }).promise();
        const url = r2.getSignedUrl('getObject', { Bucket: bucket, Key: key, Expires: 3600 });

        console.log('[Export] ✅ Uploaded to R2');

        await setJob(traceId, {
          status: 'succeeded',
          type: 'export',
          url,
          finishedAt: Date.now(),
        });
        return { traceId, url };
      }

      // Local file fallback
      const fsPromises = await import('fs/promises');
      const pathModule = await import('path');

      // Sanitize filename
      const sanitizedTitle = (deck.title || 'presentation')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .slice(0, 50);
      const filename = `${sanitizedTitle}-${ulid()}.pptx`;
      const exportsDir = pathModule.join(process.cwd(), '../../exports');

      await fsPromises.mkdir(exportsDir, { recursive: true });
      await fsPromises.writeFile(pathModule.join(exportsDir, filename), buffer);

      console.log(`[Export] ✅ Saved locally: ${filename}`);

      await setJob(traceId, {
        status: 'succeeded',
        type: 'export',
        url: `/exports/${filename}`,
        finishedAt: Date.now(),
      });
      return { traceId, url: `/exports/${filename}` };
    } catch (e: any) {
      console.error('[Export] ❌ Error:', e.message);
      await setJob(traceId, {
        status: 'failed',
        type: 'export',
        error: e.message,
        finishedAt: Date.now(),
      });
      throw e;
    }
  },
  { connection }
);

// ============================================
// WORKER: REGENERATE SLIDE
// ============================================

const regenerateSlideWorker = new Worker(
  'regenerate-slide',
  async (job) => {
    const { traceId, presentationId, slideIndex, prompt, mode, tone, command, context, user } = job.data as any;
    const userId = user?.sub || 'anonymous';

    console.log(`\n========== REGENERATE SLIDE JOB: ${traceId} ==========`);
    console.log(`[RegenerateSlide] User ID: ${userId}`);
    console.log(`[RegenerateSlide] Presentation: ${presentationId}, Slide Index: ${slideIndex}`);
    console.log(`[RegenerateSlide] Mode: ${mode || 'default'}, Tone: ${tone || 'default'}, Command: ${command || 'none'}`);
    console.log(`[RegenerateSlide] Custom Prompt: "${prompt?.slice(0, 100) || 'none'}"`);

    await setJob(traceId, {
      status: 'processing',
      type: 'regenerate-slide',
      startedAt: Date.now(),
      slideIndex,
      userId,
    });

    try {
      // Build the prompt for slide regeneration
      const userMessage = buildSlideRegeneratorPrompt(context, slideIndex, prompt, mode, tone, command);

      // Create Gemini model with JSON response mode AND strict schema for single slide
      const geminiModel = genAI.getGenerativeModel({
        model,
        generationConfig: {
          temperature: 0.8, // Slightly higher for more variety
          maxOutputTokens: 2000, // Single slide doesn't need much
          responseMimeType: 'application/json',
          responseSchema: SINGLE_SLIDE_RESPONSE_SCHEMA as any, // Strict schema for single slide
        },
      });

      const fullPrompt = `${SLIDE_REGENERATOR_PROMPT}\n\n---\n\n${userMessage}`;
      const response = await geminiModel.generateContent(fullPrompt);
      const raw = response.response.text();

      // Log token usage
      const usageMetadata = response.response.usageMetadata;
      const inputTokens = usageMetadata?.promptTokenCount || 0;
      const outputTokens = usageMetadata?.candidatesTokenCount || 0;
      const totalCost = (inputTokens / 1_000_000) * 0.50 + (outputTokens / 1_000_000) * 3.00;
      console.log(`[RegenerateSlide] 📊 Tokens: ${inputTokens} in / ${outputTokens} out`);
      console.log(`[RegenerateSlide] 💰 Cost: $${totalCost.toFixed(6)}`);

      // Save token usage to database
      await saveTokenUsage({
        userId,
        presentationId,
        jobType: 'regenerate-slide',
        traceId,
        inputTokens,
        outputTokens,
      });

      if (!raw) throw new Error('Empty AI response');

      // Parse the single slide JSON
      let newSlide: Slide;
      try {
        newSlide = JSON.parse(raw);
      } catch (parseError) {
        console.error('[RegenerateSlide] JSON parse error:', parseError);
        throw new Error('Invalid JSON from AI');
      }

      // Fetch background image
      const themeConfig = context.themeConfig || normalizeTheme(context.theme);
      if (newSlide.imageSearchQuery) {
        const imageResult = await getUnsplashImage(
          newSlide.imageSearchQuery,
          themeConfig.imageKeywords
        );
        newSlide.backgroundImage = imageResult.url;
        (newSlide as any).unsplashPhotographer = imageResult.photographer;
      }

      // Assign a new ID to the slide
      newSlide.id = `slide-${slideIndex}-${Date.now()}`;

      console.log(`[RegenerateSlide] ✅ New slide generated: layout="${newSlide.layout}", title="${newSlide.title}"`);

      // Update presentation in Supabase
      if (supabase) {
        try {
          // Fetch the current presentation
          const { data: presentation, error: fetchError } = await supabase
            .from('presentations')
            .select('slides')
            .eq('id', presentationId)
            .single();

          if (fetchError) {
            console.error('[RegenerateSlide] ❌ Failed to fetch presentation:', fetchError.message);
          } else if (presentation) {
            // The slides field contains the full deck object
            const deckData = presentation.slides;
            const slidesArray = deckData.slides || [];

            // Replace the slide at the given index
            if (slideIndex >= 0 && slideIndex < slidesArray.length) {
              slidesArray[slideIndex] = newSlide;
              deckData.slides = slidesArray;

              const { error: updateError } = await supabase
                .from('presentations')
                .update({
                  slides: deckData,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', presentationId);

              if (updateError) {
                console.error('[RegenerateSlide] ❌ Failed to update presentation:', updateError.message);
              } else {
                console.log('[RegenerateSlide] ✅ Presentation updated in Supabase');
              }
            }
          }
        } catch (err: any) {
          console.error('[RegenerateSlide] ❌ Supabase exception:', err.message);
        }
      }

      await setJob(traceId, {
        status: 'succeeded',
        type: 'regenerate-slide',
        slideIndex,
        newSlide,
        finishedAt: Date.now(),
      });

      return { traceId, slideIndex, newSlide };
    } catch (err: any) {
      console.error('[RegenerateSlide] ❌ Error:', err.message);
      await setJob(traceId, {
        status: 'failed',
        type: 'regenerate-slide',
        error: err.message,
        slideIndex,
        finishedAt: Date.now(),
      });
      throw err;
    }
  },
  { connection }
);

// ============================================
// MODIFY COLOR PALETTE WORKER
// ============================================
import { COLOR_PALETTE_MODIFIER_PROMPT, buildColorPalettePrompt } from './prompts/color-palette-modifier.js';

const modifyColorPaletteWorker = new Worker(
  'modify-color-palette',
  async (job: Job) => {
    const { traceId, presentationId, prompt, currentPalette, currentTheme, presentationTitle, user } = job.data;
    console.log(`[ModifyColorPalette] 🎨 Starting palette modification for presentation: ${presentationId}`);
    console.log(`[ModifyColorPalette] User instruction: "${prompt}"`);

    await setJob(traceId, {
      status: 'processing',
      type: 'modify-color-palette',
      startedAt: Date.now(),
    });

    try {
      // Build the prompt
      const userPrompt = buildColorPalettePrompt(currentPalette, presentationTitle, currentTheme, prompt);

      // Call Gemini
      const geminiModelPalette = genAI.getGenerativeModel({ model });
      const result = await geminiModelPalette.generateContent({
        contents: [
          { role: 'user', parts: [{ text: COLOR_PALETTE_MODIFIER_PROMPT }] },
          { role: 'model', parts: [{ text: 'I understand. I will generate a harmonious color palette based on the user instruction. Please provide the current palette and instruction.' }] },
          { role: 'user', parts: [{ text: userPrompt }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });

      const text = result.response.text();
      console.log('[ModifyColorPalette] Raw AI response:', text.substring(0, 500));

      // Parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const newPalette = parsed.colorPalette || parsed;

      console.log('[ModifyColorPalette] New palette:', JSON.stringify(newPalette, null, 2));

      // Update presentation in Supabase
      if (supabase) {
        try {
          // First fetch the current presentation data
          const { data: presentation, error: fetchError } = await supabase
            .from('presentations')
            .select('slides')
            .eq('id', presentationId)
            .single();

          if (fetchError) {
            console.error('[ModifyColorPalette] ❌ Failed to fetch presentation:', fetchError.message);
          } else if (presentation) {
            // Update the colorPalette in the slides data
            const slidesData = presentation.slides as any;

            // Handle both array and object formats
            const isArray = Array.isArray(slidesData);
            const deckData = isArray ? { slides: slidesData, colorPalette: newPalette } : { ...slidesData, colorPalette: newPalette };

            const { error: updateError } = await supabase
              .from('presentations')
              .update({
                slides: deckData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', presentationId);

            if (updateError) {
              console.error('[ModifyColorPalette] ❌ Failed to update presentation:', updateError.message);
            } else {
              console.log('[ModifyColorPalette] ✅ Presentation updated in Supabase');
            }
          }
        } catch (err: any) {
          console.error('[ModifyColorPalette] ❌ Supabase exception:', err.message);
        }
      }

      await setJob(traceId, {
        status: 'succeeded',
        type: 'modify-color-palette',
        newPalette,
        finishedAt: Date.now(),
      });

      return { traceId, newPalette };
    } catch (err: any) {
      console.error('[ModifyColorPalette] ❌ Error:', err.message);
      await setJob(traceId, {
        status: 'failed',
        type: 'modify-color-palette',
        error: err.message,
        finishedAt: Date.now(),
      });
      throw err;
    }
  },
  { connection }
);

// ============================================
// WORKER: ADD SLIDE
// ============================================

const addSlideWorker = new Worker(
  'add-slide',
  async (job) => {
    const { traceId, presentationId, prompt, context, user } = job.data as any;
    const userId = user?.sub || 'anonymous';

    console.log(`\n========== ADD SLIDE JOB: ${traceId} ==========`);
    console.log(`[AddSlide] User ID: ${userId}`);
    console.log(`[AddSlide] Presentation: ${presentationId}`);
    console.log(`[AddSlide] Custom Prompt: "${prompt?.slice(0, 100) || 'none'}"`);

    await setJob(traceId, {
      status: 'processing',
      type: 'add-slide',
      startedAt: Date.now(),
      userId,
    });

    try {
      const userMessage = buildSlideAdderPrompt(context, prompt);

      // Create Gemini model with strict schema for single slide
      const geminiModel = genAI.getGenerativeModel({
        model,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
          responseSchema: SINGLE_SLIDE_RESPONSE_SCHEMA as any, // Strict schema for single slide
        },
      });

      const fullPrompt = `${SLIDE_ADDER_PROMPT}\n\n---\n\n${userMessage}`;
      const response = await geminiModel.generateContent(fullPrompt);
      const raw = response.response.text();

      // Track token usage
      const usageMetadata = response.response.usageMetadata;
      const inputTokens = usageMetadata?.promptTokenCount || 0;
      const outputTokens = usageMetadata?.candidatesTokenCount || 0;

      await saveTokenUsage({
        userId,
        presentationId,
        jobType: 'add-slide',
        traceId,
        inputTokens,
        outputTokens,
      });

      if (!raw) throw new Error('Empty AI response');

      let newSlide: Slide;
      try {
        newSlide = JSON.parse(raw);
      } catch (parseError) {
        throw new Error('Invalid JSON from AI');
      }

      const themeConfig = context.themeConfig || normalizeTheme(context.theme);
      if (newSlide.imageSearchQuery) {
        const imageResult = await getUnsplashImage(
          newSlide.imageSearchQuery,
          themeConfig.imageKeywords
        );
        newSlide.backgroundImage = imageResult.url;
        (newSlide as any).unsplashPhotographer = imageResult.photographer;
      }

      newSlide.id = `slide-${Date.now()}`;

      console.log(`[AddSlide] ✅ New slide generated: layout="${newSlide.layout}"`);

      if (supabase) {
        const { data: presentation } = await supabase
          .from('presentations')
          .select('slides')
          .eq('id', presentationId)
          .single();

        if (presentation) {
          const rawSlides = presentation.slides as any;
          const isArray = Array.isArray(rawSlides);
          const deckData = isArray ? { slides: rawSlides } : rawSlides;
          const slidesArray = isArray ? rawSlides : (rawSlides?.slides || []);

          slidesArray.push(newSlide);
          deckData.slides = slidesArray;

          await supabase
            .from('presentations')
            .update({
              slides: deckData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', presentationId);
          console.log('[AddSlide] ✅ Presentation updated in Supabase');
        }
      }

      await setJob(traceId, {
        status: 'succeeded',
        type: 'add-slide',
        newSlide,
        finishedAt: Date.now(),
      });

      return { traceId, newSlide };
    } catch (err: any) {
      console.error('[AddSlide] ❌ Error:', err.message);
      await setJob(traceId, {
        status: 'failed',
        type: 'add-slide',
        error: err.message,
        finishedAt: Date.now(),
      });
      throw err;
    }
  },
  { connection }
);


const translateDeckWorker = new Worker(
  'translate-deck',
  async (job) => {
    const { traceId, deck, targetLanguage, user, duplicate } = job.data as any;
    const userId = user?.sub || 'anonymous';

    console.log(`\n========== TRANSLATE DECK JOB: ${traceId} ==========`);
    console.log(`[TranslateDeck] User ID: ${userId}`);
    console.log(`[TranslateDeck] Target Language: ${targetLanguage}`);

    await setJob(traceId, {
      status: 'processing',
      type: 'translate-deck',
      startedAt: Date.now(),
      userId,
    });

    try {
      const userMessage = buildTranslateDeckPrompt(deck, targetLanguage);

      const geminiModel = genAI.getGenerativeModel({
        model,
        generationConfig: {
          temperature: 0.3, // Lower temperature for "pure" translation
          maxOutputTokens: 30000,
          responseMimeType: 'application/json',
        },
      });

      const fullPrompt = `${TRANSLATE_DECK_PROMPT}\n\n---\n\n${userMessage}`;
      const response = await geminiModel.generateContent(fullPrompt);
      const raw = response.response.text();

      // Log token usage
      const usageMetadata = response.response.usageMetadata;
      const inputTokens = usageMetadata?.promptTokenCount || 0;
      const outputTokens = usageMetadata?.candidatesTokenCount || 0;

      console.log(`[TranslateDeck] 📊 Tokens: ${inputTokens} in / ${outputTokens} out`);

      // Save token usage to database
      await saveTokenUsage({
        userId,
        jobType: 'translate-deck',
        traceId,
        inputTokens,
        outputTokens,
      });

      if (!raw) throw new Error('Empty AI response');

      let translatedDeck: any;
      try {
        translatedDeck = JSON.parse(raw);
      } catch (parseError) {
        console.error('[TranslateDeck] JSON parse error:', parseError);
        throw new Error('Invalid JSON from AI');
      }

      console.log('[TranslateDeck] ✅ Translation complete');

      let newPresentationId: string | undefined;

      if (duplicate && supabase) {
        try {
          newPresentationId = ulid();
          const { error: insertError } = await supabase
            .from('presentations')
            .insert({
              id: newPresentationId,
              user_id: userId,
              title: translatedDeck.title || `Translated Deck (${targetLanguage})`,
              slides: translatedDeck.slides,
              theme: translatedDeck.theme || 'light',
              updated_at: new Date().toISOString(),
              orgId: user.org || null,
            });

          if (insertError) {
            console.error('[TranslateDeck] ❌ Failed to save duplicated deck:', insertError);
            // We don't throw here to avoid failing the translation itself, but we log it.
            // The frontend will check for newPresentationId.
          } else {
            console.log(`[TranslateDeck] ✅ Created new presentation: ${newPresentationId}`);
          }
        } catch (dbError: any) {
          console.error('[TranslateDeck] ❌ Exception saving duplicated deck:', dbError.message);
        }
      }

      await setJob(traceId, {
        status: 'succeeded',
        type: 'translate-deck',
        deck: translatedDeck,
        newPresentationId,
        finishedAt: Date.now(),
      });

      return { traceId, deck: translatedDeck, newPresentationId };
    } catch (err: any) {
      console.error('[TranslateDeck] ❌ Error:', err.message);
      await setJob(traceId, {
        status: 'failed',
        type: 'translate-deck',
        error: err.message,
        finishedAt: Date.now(),
      });
      throw err;
    }
  },
  { connection }
);

const lifecycleEmailWorker = new Worker(
  'lifecycle-email',
  async (job) => {
      const {
        userId,
        email,
        emailType,
        dedupeKey,
        trialStartedAt,
        trialEndsAt,
        legacyFree,
        canceledAt,
        invoiceId,
        packType,
        forceSend,
        unsubscribeUrl,
        templateSlug,
        templateVersion,
        templatePatch,
        flowSlug,
        flowVersion,
        footerReason,
        firstName,
      } = job.data as {
        userId: string;
        email: string;
        emailType: string;
        firstName?: string;
        dedupeKey: string;
        trialStartedAt?: string;
        trialEndsAt?: string;
        legacyFree?: boolean;
        canceledAt?: string;
        invoiceId?: string;
        packType?: string;
        forceSend?: boolean;
        unsubscribeUrl?: string;
        templateSlug?: string;
        templateVersion?: number;
        templatePatch?: EmailContentPatch;
        flowSlug?: string;
        flowVersion?: number;
        footerReason?: string;
      };

    console.log(`\n========== LIFECYCLE EMAIL JOB: ${dedupeKey} ==========`);
    console.log(`[LifecycleEmail] User ID: ${userId} | Type: ${emailType}`);

    const existingStatus = await getLifecycleEmailStatus(dedupeKey);
    if (existingStatus === 'sent' || existingStatus === 'skipped') {
      console.log(`[LifecycleEmail] Skipping ${dedupeKey}, already ${existingStatus}`);
      return { dedupeKey, status: existingStatus };
    }

    let subscription = await getSubscriptionRow(userId);
    subscription = await normalizeSubscriptionRow(subscription);

    if (!subscription) {
      await setLifecycleEmailStatus(dedupeKey, 'skipped');
      return { dedupeKey, status: 'skipped' };
    }

    const presentationCount = await getPresentationCount(userId);
    const recent7dCount = await getRecentPresentationCount(userId, 7);
    const recent14dCount = await getRecentPresentationCount(userId, 14);
    const recent21dCount = await getRecentPresentationCount(userId, 21);
    const sameTrial = trialStartedAt
      ? sameInstant(subscription.trialConsumedAt || subscription.trialStartedAt, trialStartedAt)
      : false;

    let shouldSend = false;

      switch (emailType) {
      case 'signup_day1_no_presentation':
        shouldSend = presentationCount === 0;
        break;
      case 'signup_day3_no_presentation':
        shouldSend = presentationCount === 0;
        break;
      case 'signup_day5_activated':
        shouldSend = presentationCount > 0;
        break;
      case 'trial_welcome':
        shouldSend = subscription.status === 'trialing' && sameInstant(subscription.trialStartedAt, trialStartedAt);
        break;
      case 'trial_inactive_day1':
        shouldSend = subscription.status === 'trialing' && sameInstant(subscription.trialStartedAt, trialStartedAt) && presentationCount === 0;
        break;
      case 'trial_value_day4':
        shouldSend = subscription.status === 'trialing' && sameInstant(subscription.trialStartedAt, trialStartedAt) && presentationCount > 0;
        break;
      case 'trial_ending_day6':
        shouldSend = subscription.status === 'trialing' && sameInstant(subscription.trialStartedAt, trialStartedAt);
        break;
      case 'trial_expired':
        shouldSend = sameTrial && !hasPaidAccess(subscription) && (Boolean(subscription.requiresPayment) || Boolean(subscription.legacyFree));
        break;
      case 'trial_winback_day2':
        shouldSend = sameTrial && !hasPaidAccess(subscription);
        break;
      case 'pack_purchase_confirmation':
        shouldSend = Boolean(packType);
        break;
      case 'pack_low_balance':
        shouldSend =
          !subscription.legacyFree &&
          subscription.plan === 'free' &&
          subscription.creditsRemaining > 0 &&
          subscription.creditsRemaining <= 2 &&
          !hasPaidAccess(subscription);
        break;
      case 'pack_exhausted':
        shouldSend =
          !subscription.legacyFree &&
          subscription.plan === 'free' &&
          subscription.creditsRemaining <= 0 &&
          !hasPaidAccess(subscription);
        break;
      case 'inactive_7d':
        shouldSend = presentationCount > 0 && recent7dCount === 0;
        break;
      case 'inactive_14d':
        shouldSend = presentationCount > 0 && recent14dCount === 0;
        break;
      case 'inactive_21d_offer':
        shouldSend = presentationCount > 0 && recent21dCount === 0 && !hasPaidAccess(subscription);
        break;
      case 'cancel_confirmation':
        shouldSend = Boolean(canceledAt);
        break;
      case 'cancel_day3_winback':
        shouldSend = Boolean(canceledAt);
        break;
      case 'failed_payment_day0':
        shouldSend = Boolean(invoiceId);
        break;
        default:
          shouldSend = false;
          break;
      }

      if (forceSend) {
        console.log(`[LifecycleEmail] Force send enabled for ${emailType}`);
        shouldSend = true;
      }

      if (!shouldSend) {
        console.log(`[LifecycleEmail] Conditions not met for ${emailType}, skipping`);
        await setLifecycleEmailStatus(dedupeKey, 'skipped', { statusReason: 'conditions_not_met' });
        return { dedupeKey, status: 'skipped' };
      }

    const winbackOffer =
      emailType === 'trial_winback_day2'
        ? (await ensureWinbackOffer({
            dedupeKey,
            userId,
            email,
          })) || undefined
        : undefined;

      const content = buildLifecycleEmailContent({
        emailType,
        legacyFree: Boolean(legacyFree),
        trialEndsAt: trialEndsAt || subscription.trialEndsAt || new Date().toISOString(),
        presentationCount,
        winbackOffer,
        contentPatch: templatePatch,
        unsubscribeUrl,
        footerReason,
        firstName,
      });

    if (!content) {
      await setLifecycleEmailStatus(dedupeKey, 'skipped', { statusReason: 'renderer_returned_null' });
      return { dedupeKey, status: 'skipped' };
    }

    const delivery = await deliverLifecycleEmail({
      to: email,
      subject: content.subject,
      html: content.html,
    });

    const finalStatus = (delivery as { skipped?: boolean }).skipped ? 'skipped' : 'sent';
    await setLifecycleEmailStatus(dedupeKey, finalStatus, {
      statusReason: finalStatus === 'sent' ? 'provider_accepted' : 'provider_skipped',
      providerMessageId: (delivery as { id?: string }).id || null,
    });
    await mergeLifecycleEmailPayload(dedupeKey, {
      templateSlug,
      templateVersion,
      flowSlug,
      flowVersion,
    });
    console.log(`[LifecycleEmail] Email ${finalStatus}: ${dedupeKey}`);

    return { dedupeKey, status: finalStatus };
  },
  { connection }
);

// ============================================
// STARTUP
// ============================================

console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║                                                           ║');
console.log('║   🚀 SlideAI Worker v2.0 - Professional Edition          ║');
console.log('║                                                           ║');
console.log('║   Features:                                               ║');
console.log('║   • 10 Rich Themes                                        ║');
console.log('║   • 12 Layout Types                                       ║');
console.log('║   • Charts, Tables, Infographics                          ║');
console.log('║   • Timelines, Comparisons, Quotes                        ║');
console.log('║   • Modular Rendering Engine                              ║');
console.log('║   • Supabase Data Persistence                             ║');
console.log('║                                                           ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`[Worker] OpenAI Model: ${model}`);
console.log(`[Worker] R2 Storage: ${hasR2 ? 'Enabled' : 'Disabled (local)'}`);
console.log(`[Worker] Supabase: ${supabase ? 'Enabled' : 'Disabled'}`);
console.log(`[Worker] Available themes: ${Object.keys(THEMES).join(', ')}`);
console.log(`[Worker] Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
console.log('');

// Worker event listeners for debugging
generateWorker.on('ready', () => {
  console.log('✅ [Generate Worker] READY - Connected to Redis and listening for jobs');
});

generateWorker.on('active', (job) => {
  console.log(`🔄 [Generate Worker] ACTIVE - Processing job: ${job.id}`);
});

generateWorker.on('completed', (job) => {
  console.log(`✅ [Generate Worker] COMPLETED - Job ${job.id} finished successfully`);
});

generateWorker.on('failed', (job, err) => {
  console.error(`❌ [Generate Worker] FAILED - Job ${job?.id} failed:`, err.message);
});

generateWorker.on('error', (err) => {
  console.error('❌ [Generate Worker] ERROR:', err);
});

exportWorker.on('ready', () => {
  console.log('✅ [Export Worker] READY - Connected and listening');
});

exportWorker.on('error', (err) => {
  console.error('❌ [Export Worker] ERROR:', err);
});

addSlideWorker.on('ready', () => {
  console.log('✅ [AddSlide Worker] READY - Connected and listening');
});

addSlideWorker.on('completed', (job) => {
  console.log(`✅ [AddSlide Worker] COMPLETED - Job ${job.id} finished successfully`);
});

addSlideWorker.on('failed', (job, err) => {
  console.error(`❌ [AddSlide Worker] FAILED - Job ${job?.id} failed:`, err.message);
});

console.log('[Worker] Waiting for jobs...');

translateDeckWorker.on('ready', () => {
  console.log('✅ [TranslateDeck Worker] READY - Connected and listening');
});

translateDeckWorker.on('completed', (job) => {
  console.log(`✅ [TranslateDeck Worker] COMPLETED - Job ${job.id} finished successfully`);
});

translateDeckWorker.on('failed', (job, err) => {
  console.error(`❌ [TranslateDeck Worker] FAILED - Job ${job?.id} failed:`, err.message);
});
lifecycleEmailWorker.on('ready', () => {
  console.log('✅ [LifecycleEmail Worker] READY - Connected and listening');
});

lifecycleEmailWorker.on('completed', (job) => {
  console.log(`✅ [LifecycleEmail Worker] COMPLETED - Job ${job.id} finished successfully`);
});

lifecycleEmailWorker.on('failed', (job, err) => {
  console.error(`❌ [LifecycleEmail Worker] FAILED - Job ${job?.id} failed:`, err.message);
});
// ============================================
// WORKER: ANALYZE IMAGE
// ============================================

const analyzeImageWorker = new Worker(
  'analyze-image',
  async (job) => {
    const { traceId, imageUrl, context, userId } = job.data as any;

    console.log(`\n========== ANALYZE IMAGE JOB: ${traceId} ==========`);
    console.log(`[AnalyzeImage] User ID: ${userId}`);
    console.log(`[AnalyzeImage] Image URL: ${imageUrl}`);

    await setJob(traceId, {
      status: 'processing',
      type: 'analyze-image',
      startedAt: Date.now(),
      userId,
    });

    try {
      // 1. Fetch the image
      console.log('[AnalyzeImage] Fetching image...');
      const imageResp = await fetch(imageUrl);
      if (!imageResp.ok) throw new Error(`Failed to fetch image: ${imageResp.statusText}`);
      const arrayBuffer = await imageResp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = buffer.toString('base64');
      const mimeType = imageResp.headers.get('content-type') || 'image/png';

      // 2. Prepare Gemini Vision request
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Use flash for vision

      const prompt = `
        Analyze this chart image and extract the underlying data structure.
        Return a valid JSON object with the following schema:
        {
          "chartType": "bar" | "line" | "pie" | "area" | "column" | "donut",
          "title": "Chart Title",
          "summary": "Brief summary of what the chart shows",
          "data": {
            "categories": ["Category 1", "Category 2", ...],
            "series": [
              { "name": "Series 1", "data": [10, 20, 30, ...] },
              { "name": "Series 2", "data": [5, 15, 25, ...] }
            ]
          }
        }
        
        If the image is not a chart, return null for data and a relevant summary.
        ${context ? `Context: ${context}` : ''}
      `;

      console.log('[AnalyzeImage] Calling Gemini Vision...');
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType,
          },
        },
      ]);

      const response = await result.response;
      let text = response.text();

      // Clean up markdown code blocks if present
      text = text.replace(/```json\n/g, '').replace(/```/g, '');

      console.log('[AnalyzeImage] AI Response:', text.slice(0, 100) + '...');

      let analysisResult;
      try {
        analysisResult = JSON.parse(text);
      } catch (e) {
        console.error('[AnalyzeImage] Failed to parse JSON:', e);
        throw new Error('Invalid JSON response from AI');
      }

      console.log('[AnalyzeImage] ✅ Analysis complete');

      await setJob(traceId, {
        status: 'succeeded',
        type: 'analyze-image',
        result: analysisResult,
        finishedAt: Date.now(),
      });

      return { traceId, result: analysisResult };

    } catch (err: any) {
      console.error('[AnalyzeImage] ❌ Error:', err.message);
      await setJob(traceId, {
        status: 'failed',
        type: 'analyze-image',
        error: err.message,
        finishedAt: Date.now(),
      });
      throw err;
    }
  },
  { connection }
);
