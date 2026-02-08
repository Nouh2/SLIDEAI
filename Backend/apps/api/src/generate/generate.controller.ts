// apps/api/src/generate/generate.controller.ts
// Document upload and presentation generation endpoint
// Supports PDF, DOCX, and TXT file uploads for RAG-based generation (Fastify multipart)

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { z } from 'zod';
import { QueueService } from '../queues/queue.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { DocumentParserService, ParsedDocument, DocumentSection } from './document-parser.service.js';
import { ulid } from 'ulid';
import IORedis from 'ioredis';
import { createRequire } from 'module';

// ============================================
// TEXT EXTRACTION UTILITIES
// ============================================

// Maximum characters to extract from documents (60K = ~15K tokens)
const MAX_DOCUMENT_CHARS = 60000;

/**
 * Extract text from PDF using pdfjs-dist v3 (Node 18 compatible)
 */
async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    // Use createRequire for pdfjs-dist in ESM context
    const require = createRequire(import.meta.url);
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

    // Convert Buffer to Uint8Array
    const uint8Array = new Uint8Array(buffer);

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let fullText = '';

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return { text: fullText, pageCount: pdf.numPages };
  } catch (error: any) {
    console.warn('[PDF] Extraction failed:', error.message);
    return { text: '', pageCount: 0 };
  }
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    // Approx page count for DOCX? Hard to get accurately without rendering.
    return { text: result.value || '', pageCount: 0 };
  } catch (error: any) {
    console.warn('[DOCX] Extraction failed:', error.message);
    return { text: '', pageCount: 0 };
  }
}

/**
 * Extract text from plain text file
 */
function extractTextFromTXT(buffer: Buffer): { text: string; pageCount: number } {
  try {
    return { text: buffer.toString('utf-8'), pageCount: 1 };
  } catch (error: any) {
    console.warn('[TXT] Extraction failed:', error.message);
    return { text: '', pageCount: 0 };
  }
}

/**
 * Smart truncation: Keep the first N characters (usually most important)
 */
function smartTruncate(text: string, maxChars: number = MAX_DOCUMENT_CHARS): string {
  if (!text || text.length <= maxChars) {
    return text;
  }

  const truncated = text.slice(0, maxChars);
  const lastParagraph = truncated.lastIndexOf('\n\n');
  const lastSentence = truncated.lastIndexOf('. ');

  if (lastParagraph > maxChars * 0.8) {
    return truncated.slice(0, lastParagraph) + '\n\n[... document truncated ...]';
  } else if (lastSentence > maxChars * 0.8) {
    return truncated.slice(0, lastSentence + 1) + ' [... document truncated ...]';
  }

  return truncated + ' [... document truncated ...]';
}

/**
 * Extract text from uploaded file based on MIME type or filename
 */
async function extractDocumentText(buffer: Buffer, mimetype: string, filename: string): Promise<{ text: string; pageCount: number }> {
  const mimeType = mimetype?.toLowerCase() || '';
  const fname = filename?.toLowerCase() || '';

  console.log(`[Extract] Processing file: ${filename} (${mimeType}, ${buffer.length} bytes)`);

  let result = { text: '', pageCount: 0 };

  if (mimeType === 'application/pdf' || fname.endsWith('.pdf')) {
    result = await extractTextFromPDF(buffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    fname.endsWith('.docx') ||
    fname.endsWith('.doc')
  ) {
    result = await extractTextFromDOCX(buffer);
  } else if (
    mimeType === 'text/plain' ||
    fname.endsWith('.txt') ||
    fname.endsWith('.md')
  ) {
    result = extractTextFromTXT(buffer);
  } else {
    console.warn(`[Extract] Unsupported file type: ${mimeType} (${filename})`);
    return { text: '', pageCount: 0 };
  }

  result.text = result.text.replace(/\s+/g, ' ').trim();
  const truncatedText = smartTruncate(result.text);

  console.log(`[Extract] Extracted ${result.text.length} chars, truncated to ${truncatedText.length} chars. Pages: ${result.pageCount}`);

  return { text: truncatedText, pageCount: result.pageCount };
}

// ============================================
// ZOD SCHEMA
// ============================================

const generateSchema = z.object({
  prompt: z.string().min(3),
  language: z.enum(['fr', 'en', 'es']).default('en'),
  tone: z.enum(['pro', 'casual']).default('pro'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  slideCount: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(3).max(50).default(8)
  ),
  theme: z.enum([
    'startup-pitch',
    'product-launch',
    'corporate-report',
    'creative-portfolio',
    'educational',
    'marketing-campaign',
    'minimal-elegant',
    'tech-modern',
    'consulting',
    'health-medical',
    'sustainability'
  ]).default('startup-pitch'),
  // Smart Report Parsing: Use previously parsed document instead of raw upload
  parseToken: z.string().optional(),
  // Section IDs to include (from /parse-document response). If empty, uses all sections.
  sectionIds: z.array(z.string()).optional(),
  // Section-specific visual preferences (e.g., "sec_1": "chart-bar", "sec_2": "text-only")
  // Section-specific visual preferences (e.g., "sec_1": "chart-bar", "sec_2": "text-only")
  sectionVisuals: z.record(z.string(), z.enum(['image', 'chart-bar', 'chart-pie', 'chart-line', 'text-only'])).optional(),

  // Brand Kit & Templates
  brandColors: z.preprocess(
    (val) => (typeof val === 'string' ? JSON.parse(val) : val),
    z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      background: z.string(),
      text: z.string(),
    }).optional()
  ),
  brandFonts: z.preprocess(
    (val) => (typeof val === 'string' ? JSON.parse(val) : val),
    z.object({
      heading: z.string(),
      body: z.string(),
    }).optional()
  ),
  brandLogoUrl: z.string().optional(),
  templateOverlay: z.preprocess(
    (val) => (typeof val === 'string' ? JSON.parse(val) : val),
    z.object({
      logo: z.object({
        position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).default('top-left'),
        size: z.enum(['small', 'medium', 'large']).default('medium'),
        showOnCover: z.boolean().default(true),
        showOnContent: z.boolean().default(true),
      }).optional(),
      footer: z.object({
        text: z.string().optional(),
        showPageNumber: z.boolean().default(true),
      }).optional(),
    }).optional()
  ),
});


// ============================================
// CONTROLLER
// ============================================

// Helper to get Redis URL (supports REDIS_URL or REDIS_HOST/PORT/PASSWORD)
function getRedisUrl(): string {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  const password = process.env.REDIS_PASSWORD;
  return password ? `redis://:${password}@${host}:${port}` : `redis://${host}:${port}`;
}

@Controller('/v1')
export class GenerateController {
  private redis: IORedis;

  constructor(
    private queues: QueueService,
    private subscriptionService: SubscriptionService,
    private documentParser: DocumentParserService,
  ) {
    this.redis = new IORedis(getRedisUrl(), {
      maxRetriesPerRequest: null,
    });
  }

  /**
   * Generate presentation from prompt + optional document upload
   * Accepts both JSON and multipart/form-data
   * PROTECTED: Requires valid Supabase JWT
   */
  @Post('/generate')
  @UseGuards(SupabaseGuard)
  async generate(@Req() req: FastifyRequest & { user: any }) {
    let formFields: Record<string, string> = {};
    let fileBuffer: Buffer | null = null;
    let fileMimetype = '';
    let fileFilename = '';

    // Check if request is multipart
    if (req.isMultipart()) {
      console.log('[DEBUG] Processing multipart request');

      const parts = req.parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          // Collect file buffer
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          fileBuffer = Buffer.concat(chunks);
          fileMimetype = part.mimetype;
          fileFilename = part.filename;
          console.log(`[DEBUG] Received file: ${part.filename} (${part.mimetype}, ${fileBuffer.length} bytes)`);
        } else {
          // Collect form field
          formFields[part.fieldname] = part.value as string;
        }
      }
    } else {
      // JSON body request (backward compatible)
      console.log('[DEBUG] Processing JSON request');
      formFields = req.body as Record<string, string>;
    }

    console.log('[DEBUG] Form fields:', formFields);
    console.log('[DEBUG] User:', req.user);

    // Parse and validate the schema
    const data = generateSchema.parse(formFields);
    const traceId = ulid();
    const userId = req.user.sub;

    // === CHECK SUBSCRIPTION CREDITS & LIMITS ===
    await this.subscriptionService.canGenerate(userId, req.user.email);
    // Check project/storage limit
    await this.subscriptionService.checkProjectLimit(userId);

    // Extract text from document (if provided)
    let documentText = '';
    if (fileBuffer) {
      try {
        const result = await extractDocumentText(fileBuffer, fileMimetype, fileFilename);
        documentText = result.text;

        // Enforce PDF page limit
        if (result.pageCount > 0) {
          await this.subscriptionService.checkPdfPageLimit(userId, result.pageCount);
        }

        console.log(`[DEBUG] Document text extracted: ${documentText.length} characters`);
      } catch (error: any) {
        // If it's a forbidden exception (limit reached), rethrow it
        if (error.status === 403) {
          throw error;
        }
        console.error('[DEBUG] Document extraction error:', error.message);
        // Continue without document - silent failure for other errors
      }
    }

    // === Smart Report Parsing: Use parsed document from Redis if parseToken provided ===
    if (data.parseToken) {
      const parsedRaw = await this.redis.get(`parsed:${data.parseToken}`);
      if (parsedRaw) {
        const parsed = JSON.parse(parsedRaw);

        // Verify user ownership
        if (parsed.userId !== userId) {
          throw new Error('Invalid parse token');
        }

        // Filter sections if sectionIds provided
        let sectionsToUse = parsed.sections || [];
        if (data.sectionIds && data.sectionIds.length > 0) {
          sectionsToUse = sectionsToUse.filter((s: any) => data.sectionIds!.includes(s.id));
        }

        // Build document text from selected sections WITH PAGE MARKERS for source tracing
        documentText = sectionsToUse
          .map((s: any) => {
            const pageInfo = s.pageStart === s.pageEnd
              ? `Page ${s.pageStart}`
              : `Pages ${s.pageStart}-${s.pageEnd}`;
            return `## ${s.title} [SOURCE: ${pageInfo}]\n\n${s.content}`;
          })
          .join('\n\n---\n\n');

        // Pass section metadata to worker for sourceRef generation
        (data as any).sectionMeta = sectionsToUse.map((s: any) => ({
          id: s.id,
          title: s.title,
          pageStart: s.pageStart,
          pageEnd: s.pageEnd,
          content: s.content ? s.content.substring(0, 500) + (s.content.length > 500 ? '...' : '') : ''
        }));

        console.log(`[DEBUG] Using ${sectionsToUse.length} sections from parsed document (${documentText.length} chars)`);

        // Pass section visuals to worker if provided
        if (data.sectionVisuals) {
          (data as any).sectionVisuals = data.sectionVisuals;
        }
      }
    }

    // Store initial job state
    await this.redis.set(
      `job:${traceId}`,
      JSON.stringify({
        status: 'accepted',
        type: 'generate',
        createdAt: Date.now(),
        hasDocument: documentText.length > 0,
      }),
      'EX',
      3600,
    );

    console.log('[DEBUG] Adding job to queue:', traceId);
    console.log('[DEBUG] 🔑 USER ID FOUND:', req.user?.sub || 'NO USER SUB');

    // Add job to queue with document text
    await this.queues.addGenerate({
      traceId,
      user: { sub: req.user.sub, org: req.user.org_id },
      data: {
        ...data,
        documentText,
      },
    });

    console.log('[DEBUG] Job added successfully:', traceId);

    // === CONSUME CREDIT AFTER SUCCESSFUL JOB SUBMISSION ===
    await this.subscriptionService.consumeCredit(userId, req.user.email);

    return {
      traceId,
      status: 'accepted' as const,
      documentExtracted: documentText.length > 0,
    };
  }

  /**
   * Job status tracking (Redis lookup)
   * PUBLIC: No auth required - just returns job status for polling
   */
  @Get('/jobs/:traceId')
  async jobStatus(@Param('traceId') traceId: string) {
    const raw = await this.redis.get(`job:${traceId}`);
    if (!raw) {
      return { traceId, status: 'unknown' as const };
    }
    const parsed = JSON.parse(raw);
    return { traceId, ...parsed };
  }

  /**
   * Parse document structure (Smart Report Parsing)
   * Returns detected sections/chapters for user selection before generation
   * PROTECTED: Requires valid Supabase JWT
   */
  @Post('/parse-document')
  @UseGuards(SupabaseGuard)
  async parseDocument(@Req() req: FastifyRequest & { user: any }) {
    let fileBuffer: Buffer | null = null;
    let fileMimetype = '';
    let fileFilename = '';

    if (!req.isMultipart()) {
      return { error: 'Multipart form data required', success: false };
    }

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        fileBuffer = Buffer.concat(chunks);
        fileMimetype = part.mimetype;
        fileFilename = part.filename;
      }
    }

    if (!fileBuffer) {
      return { error: 'No file uploaded', success: false };
    }

    console.log(`[ParseDocument] Parsing: ${fileFilename} (${fileMimetype}, ${fileBuffer.length} bytes)`);

    const userId = req.user.sub;

    // Check subscription limits for PDF page count
    // (We'll check after parsing to know page count)

    let parsed: ParsedDocument;

    try {
      const fname = fileFilename.toLowerCase();
      if (fileMimetype === 'application/pdf' || fname.endsWith('.pdf')) {
        parsed = await this.documentParser.parsePDF(fileBuffer);

        // Check PDF page limit
        await this.subscriptionService.checkPdfPageLimit(userId, parsed.totalPages);
      } else if (
        fileMimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fname.endsWith('.docx')
      ) {
        parsed = await this.documentParser.parseDOCX(fileBuffer);
      } else {
        return { error: 'Unsupported file type. Please upload PDF or DOCX.', success: false };
      }
    } catch (error: any) {
      if (error.status === 403) {
        throw error; // Rethrow subscription limit errors
      }
      console.error('[ParseDocument] Parsing error:', error.message);
      return { error: 'Failed to parse document', success: false };
    }

    console.log(`[ParseDocument] Found ${parsed.sections.length} sections in "${parsed.title}"`);

    return {
      success: true,
      document: {
        title: parsed.title,
        totalPages: parsed.totalPages,
        totalChars: parsed.totalChars,
        sections: parsed.sections.map(s => ({
          id: s.id,
          title: s.title,
          level: s.level,
          pageStart: s.pageStart,
          pageEnd: s.pageEnd,
          charCount: s.charCount,
          estimatedSlides: s.estimatedSlides,
          // Don't send full content to frontend - too heavy
        })),
      },
      // Store parsed data in Redis for later use in /generate
      parseToken: await this.storeParsedDocument(parsed, userId),
    };
  }

  /**
   * Store parsed document in Redis for subsequent generation
   */
  private async storeParsedDocument(parsed: ParsedDocument, userId: string): Promise<string> {
    const token = ulid();
    await this.redis.set(
      `parsed:${token}`,
      JSON.stringify({ ...parsed, userId }),
      'EX',
      3600 // 1 hour expiry
    );
    return token;
  }
}
