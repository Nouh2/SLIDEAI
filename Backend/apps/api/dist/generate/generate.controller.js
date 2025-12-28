// apps/api/src/generate/generate.controller.ts
// Document upload and presentation generation endpoint
// Supports PDF, DOCX, and TXT file uploads for RAG-based generation (Fastify multipart)
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Param, Post, Req, UseGuards, } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { z } from 'zod';
import { QueueService } from '../queues/queue.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
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
async function extractTextFromPDF(buffer) {
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
                .map((item) => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }
        return fullText;
    }
    catch (error) {
        console.warn('[PDF] Extraction failed:', error.message);
        return '';
    }
}
/**
 * Extract text from DOCX using mammoth
 */
async function extractTextFromDOCX(buffer) {
    try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
    }
    catch (error) {
        console.warn('[DOCX] Extraction failed:', error.message);
        return '';
    }
}
/**
 * Extract text from plain text file
 */
function extractTextFromTXT(buffer) {
    try {
        return buffer.toString('utf-8');
    }
    catch (error) {
        console.warn('[TXT] Extraction failed:', error.message);
        return '';
    }
}
/**
 * Smart truncation: Keep the first N characters (usually most important)
 */
function smartTruncate(text, maxChars = MAX_DOCUMENT_CHARS) {
    if (!text || text.length <= maxChars) {
        return text;
    }
    const truncated = text.slice(0, maxChars);
    const lastParagraph = truncated.lastIndexOf('\n\n');
    const lastSentence = truncated.lastIndexOf('. ');
    if (lastParagraph > maxChars * 0.8) {
        return truncated.slice(0, lastParagraph) + '\n\n[... document truncated ...]';
    }
    else if (lastSentence > maxChars * 0.8) {
        return truncated.slice(0, lastSentence + 1) + ' [... document truncated ...]';
    }
    return truncated + ' [... document truncated ...]';
}
/**
 * Extract text from uploaded file based on MIME type or filename
 */
async function extractDocumentText(buffer, mimetype, filename) {
    const mimeType = mimetype?.toLowerCase() || '';
    const fname = filename?.toLowerCase() || '';
    console.log(`[Extract] Processing file: ${filename} (${mimeType}, ${buffer.length} bytes)`);
    let rawText = '';
    if (mimeType === 'application/pdf' || fname.endsWith('.pdf')) {
        rawText = await extractTextFromPDF(buffer);
    }
    else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword' ||
        fname.endsWith('.docx') ||
        fname.endsWith('.doc')) {
        rawText = await extractTextFromDOCX(buffer);
    }
    else if (mimeType === 'text/plain' ||
        fname.endsWith('.txt') ||
        fname.endsWith('.md')) {
        rawText = extractTextFromTXT(buffer);
    }
    else {
        console.warn(`[Extract] Unsupported file type: ${mimeType} (${filename})`);
        return '';
    }
    rawText = rawText.replace(/\s+/g, ' ').trim();
    const truncatedText = smartTruncate(rawText);
    console.log(`[Extract] Extracted ${rawText.length} chars, truncated to ${truncatedText.length} chars`);
    return truncatedText;
}
// ============================================
// ZOD SCHEMA
// ============================================
const generateSchema = z.object({
    prompt: z.string().min(3),
    language: z.enum(['fr', 'en', 'es']).default('en'),
    tone: z.enum(['pro', 'casual']).default('pro'),
    length: z.enum(['short', 'medium', 'long']).default('medium'),
    slideCount: z.preprocess((val) => (typeof val === 'string' ? parseInt(val, 10) : val), z.number().int().min(3).max(20).default(8)),
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
});
// ============================================
// CONTROLLER
// ============================================
// Helper to get Redis URL (supports REDIS_URL or REDIS_HOST/PORT/PASSWORD)
function getRedisUrl() {
    if (process.env.REDIS_URL)
        return process.env.REDIS_URL;
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || '6379';
    const password = process.env.REDIS_PASSWORD;
    return password ? `redis://:${password}@${host}:${port}` : `redis://${host}:${port}`;
}
let GenerateController = class GenerateController {
    queues;
    subscriptionService;
    redis;
    constructor(queues, subscriptionService) {
        this.queues = queues;
        this.subscriptionService = subscriptionService;
        this.redis = new IORedis(getRedisUrl(), {
            maxRetriesPerRequest: null,
        });
    }
    /**
     * Generate presentation from prompt + optional document upload
     * Accepts both JSON and multipart/form-data
     * PROTECTED: Requires valid Supabase JWT
     */
    async generate(req) {
        let formFields = {};
        let fileBuffer = null;
        let fileMimetype = '';
        let fileFilename = '';
        // Check if request is multipart
        if (req.isMultipart()) {
            console.log('[DEBUG] Processing multipart request');
            const parts = req.parts();
            for await (const part of parts) {
                if (part.type === 'file') {
                    // Collect file buffer
                    const chunks = [];
                    for await (const chunk of part.file) {
                        chunks.push(chunk);
                    }
                    fileBuffer = Buffer.concat(chunks);
                    fileMimetype = part.mimetype;
                    fileFilename = part.filename;
                    console.log(`[DEBUG] Received file: ${part.filename} (${part.mimetype}, ${fileBuffer.length} bytes)`);
                }
                else {
                    // Collect form field
                    formFields[part.fieldname] = part.value;
                }
            }
        }
        else {
            // JSON body request (backward compatible)
            console.log('[DEBUG] Processing JSON request');
            formFields = req.body;
        }
        console.log('[DEBUG] Form fields:', formFields);
        console.log('[DEBUG] User:', req.user);
        // Parse and validate the schema
        const data = generateSchema.parse(formFields);
        const traceId = ulid();
        const userId = req.user.sub;
        // === CHECK SUBSCRIPTION CREDITS ===
        await this.subscriptionService.canGenerate(userId, req.user.email);
        // Extract text from document (if provided)
        let documentText = '';
        if (fileBuffer) {
            try {
                documentText = await extractDocumentText(fileBuffer, fileMimetype, fileFilename);
                console.log(`[DEBUG] Document text extracted: ${documentText.length} characters`);
            }
            catch (error) {
                console.error('[DEBUG] Document extraction error:', error.message);
                // Continue without document - silent failure
            }
        }
        // Store initial job state
        await this.redis.set(`job:${traceId}`, JSON.stringify({
            status: 'accepted',
            type: 'generate',
            createdAt: Date.now(),
            hasDocument: documentText.length > 0,
        }), 'EX', 3600);
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
            status: 'accepted',
            documentExtracted: documentText.length > 0,
        };
    }
    /**
     * Job status tracking (Redis lookup)
     * PUBLIC: No auth required - just returns job status for polling
     */
    async jobStatus(traceId) {
        const raw = await this.redis.get(`job:${traceId}`);
        if (!raw) {
            return { traceId, status: 'unknown' };
        }
        const parsed = JSON.parse(raw);
        return { traceId, ...parsed };
    }
};
__decorate([
    Post('/generate'),
    UseGuards(SupabaseGuard),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GenerateController.prototype, "generate", null);
__decorate([
    Get('/jobs/:traceId'),
    __param(0, Param('traceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GenerateController.prototype, "jobStatus", null);
GenerateController = __decorate([
    Controller('/v1'),
    __metadata("design:paramtypes", [QueueService,
        SubscriptionService])
], GenerateController);
export { GenerateController };
