import { Controller, Post, UseGuards, BadRequestException, Req, InternalServerErrorException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ulid } from 'ulid';
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
  'image/svg+xml',
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
@UseGuards(SupabaseGuard)
export class UploadController {
  private supabase: SupabaseClient;
  private bucket: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucket = process.env.SUPABASE_BUCKET || 'uploads';

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase URL or Key key missing. Uploads will fail.');
    }

    this.supabase = createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  @Post('/upload')
  async uploadFile(@Req() req: FastifyRequest) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const data = await req.file();

    if (!data) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const buffer = await data.toBuffer();

    if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé: ${data.mimetype}. Types acceptés: images (JPEG, PNG, GIF, WebP, SVG), PDF, DOCX, TXT`
      );
    }

    if (!verifyMagicBytes(buffer, data.mimetype)) {
      throw new BadRequestException(
        'Le contenu du fichier ne correspond pas à son type déclaré. Veuillez vérifier le fichier.'
      );
    }

    const safeFilename = sanitizeFilename(data.filename);
    const key = `${ulid()}-${safeFilename}`; // Supabase paths don't strictly need 'uploads/' prefix if in 'uploads' bucket, but key is the path.

    try {
      const { data: uploadData, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(key, buffer, {
          contentType: data.mimetype,
          upsert: false
        });

      if (error) {
        console.error('Supabase Storage Upload Error:', error);
        throw new Error(error.message);
      }

      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(key);

      return { url: publicUrlData.publicUrl };
    } catch (error: any) {
      console.error('Upload Controller Error:', error);
      throw new InternalServerErrorException(`Erreur lors de l'upload: ${error.message || error}`);
    }
  }
}

