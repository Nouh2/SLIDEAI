// apps/api/src/upload/upload.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import AWS from 'aws-sdk';
import { ulid } from 'ulid';
import type { Express } from 'express';
import { SupabaseGuard } from '../auth/supabase.guard.js';

// ============================================
// FILE VALIDATION UTILITIES
// ============================================

// Allowed MIME types for upload
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain',
];

// Magic bytes signatures for file type verification
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header (WebP starts with RIFF)
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04], // PK (ZIP-based)
};

/**
 * Verify file type using magic bytes
 * Returns true if the file's magic bytes match its claimed MIME type
 */
function verifyMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const signature = MAGIC_BYTES[mimetype];
  if (!signature) {
    // For types without signature verification (like text/plain), allow
    return true;
  }

  if (buffer.length < signature.length) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let sanitized = filename
    .replace(/[/\\]/g, '_')
    .replace(/\x00/g, '')
    .replace(/\.\./g, '_');

  // Limit filename length
  if (sanitized.length > 100) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.slice(0, 90);
    sanitized = `${name}.${ext}`;
  }

  return sanitized;
}

@Controller('/v1')
@UseGuards(SupabaseGuard) // ✅ SÉCURISÉ : Requiert une authentification pour tous les endpoints
export class UploadController {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      signatureVersion: 'v4',
      s3ForcePathStyle: true,
    });
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // ✅ Validate file exists
    if (!file || !file.buffer) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // ✅ Validate MIME type is allowed
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé: ${file.mimetype}. Types acceptés: images (JPEG, PNG, GIF, WebP), PDF, DOCX, TXT`
      );
    }

    // ✅ Verify magic bytes match claimed MIME type (prevents fake extensions)
    if (!verifyMagicBytes(file.buffer, file.mimetype)) {
      throw new BadRequestException(
        'Le contenu du fichier ne correspond pas à son type déclaré. Veuillez vérifier le fichier.'
      );
    }

    // ✅ Sanitize filename to prevent path traversal
    const safeFilename = sanitizeFilename(file.originalname);
    const key = `uploads/${ulid()}-${safeFilename}`;

    await this.s3
      .putObject({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      .promise();

    // Note: Consider using a CDN domain instead of exposing the R2 account ID
    const url = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}/${key}`;
    return { url };
  }
}

