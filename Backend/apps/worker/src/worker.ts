// apps/worker/src/worker.ts
// SlideAI Worker - Professional Presentation Generation Engine
// Modular architecture with support for rich content types

import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { ulid } from 'ulid';
import AWS from 'aws-sdk';
import OpenAI from 'openai';
import PptxGenJS from 'pptxgenjs';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Local modules
import { THEMES, normalizeTheme, type ThemeConfig } from './config/themes';
import { DECK_ARCHITECT_PROMPT, buildUserPrompt } from './prompts/deck-architect';
import { getUnsplashImage } from './utils/unsplash';
import { sanitizeDeck, type Deck, type Slide } from './utils/sanitize';
import { renderSlide, defineThemeMasters } from './renderers';

// ============================================
// FILE-BASED LOGGING
// ============================================
const LOG_FILE = path.join(process.cwd(), 'worker-debug.log');

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

// Redis connections
const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});
const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
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

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

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
    let { prompt, slideCount, theme, language, documentText } = data ?? {};
    const userId = user?.sub || 'anonymous'; // Extract user ID from JWT

    console.log(`\n========== GENERATE JOB: ${traceId} ==========`);
    console.log(`[Generate] User ID: ${userId}`);
    console.log(`[Generate] Prompt: "${prompt?.slice(0, 100)}..."`);
    console.log(`[Generate] Requested slides: ${slideCount}, Theme: ${theme}`);
    console.log(`[Generate] Document text provided: ${documentText ? `Yes (${documentText.length} chars)` : 'No'}`);

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
      const isHighDensityMode = !!documentText && documentText.length > 0;
      const tokenLimit = isHighDensityMode ? 8000 : 4000;

      console.log(`[Generate] Mode: ${isHighDensityMode ? 'HIGH-DENSITY (document)' : 'Standard'}, max_tokens: ${tokenLimit}`);

      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: DECK_ARCHITECT_PROMPT },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: tokenLimit,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) throw new Error('Empty AI response');

      logToFile(`[Generate] AI response length: ${raw.length} chars`);
      logToFile('======== RAW AI RESPONSE (ChatGPT) ========', raw);

      // 3. Parse and sanitize the deck
      let deck: Deck;
      try {
        deck = JSON.parse(raw);
      } catch (parseError) {
        console.error('[Generate] JSON parse error:', parseError);
        throw new Error('Invalid JSON from AI');
      }

      logToFile('======== PARSED DECK (Before Sanitization) ========', deck);

      // SAVE TO SUPABASE with real user ID
      if (supabase) {
        try {
          const { data: savedDeck, error: saveError } = await supabase
            .from('presentations')
            .insert({
              user_id: userId, // Use real user ID from JWT
              title: deck.title || 'Untitled Presentation',
              slides: deck,
              theme: themeConfig.id,
              status: 'ready'
            })
            .select()
            .single();

          if (saveError) {
            console.error('[Generate] ❌ Failed to save to Supabase:', saveError.message);
          } else {
            console.log('[Generate] ✅ Saved to Supabase ID:', savedDeck.id);
          }
        } catch (err: any) {
          console.error('[Generate] ❌ Supabase Save Exception:', err.message);
        }
      }

      deck = sanitizeDeck(deck, prompt);
      deck.theme = themeConfig.id;
      deck.themeConfig = themeConfig;

      console.log(`[Generate] Deck has ${deck.slides.length} slides`);

      // Log each slide's layout and content types
      logToFile('======== SLIDE LAYOUTS & CONTENT ========');
      deck.slides.forEach((slide, i) => {
        const contentKeys = Object.keys(slide.content || {});
        logToFile(`Slide ${i + 1}: layout="${slide.layout}" | content keys: [${contentKeys.join(', ')}]`);

        // Log chart details if present
        if (slide.content?.chart) {
          logToFile(`  └─ Chart: type="${slide.content.chart.type}" | categories=[${slide.content.chart.categories?.join(', ')}] | series count=${slide.content.chart.series?.length}`);
        }
        // Log infographic details if present
        if (slide.content?.infographic) {
          logToFile(`  └─ Infographic: type="${slide.content.infographic.type}" | steps count=${slide.content.infographic.steps?.length}`);
        }
        // Log timeline details if present
        if (slide.content?.timeline) {
          logToFile(`  └─ Timeline: items count=${slide.content.timeline.items?.length}`);
        }
      });

      // 4. Fetch images for each slide
      console.log('[Generate] Fetching images from Unsplash...');
      deck.slides = await Promise.all(
        deck.slides.map(async (slide: Slide) => {
          let backgroundImage = '';
          if (slide.imageSearchQuery) {
            backgroundImage = await getUnsplashImage(
              slide.imageSearchQuery,
              themeConfig.imageKeywords
            );
          }
          return { ...slide, backgroundImage };
        })
      );

      // Log FINAL deck being sent to frontend
      logToFile('======== FINAL DECK (Sent to Frontend) ========', deck);

      console.log('[Generate] ✅ Generation complete');

      await setJob(traceId, {
        status: 'succeeded',
        type: 'generate',
        deck,
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

console.log('[Worker] Waiting for jobs...');
