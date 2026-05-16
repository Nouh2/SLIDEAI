import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

const ALLOWED_EVENTS = new Set([
  'trial_started',
  'activation_use_case_selected',
  'activation_onboarding_started',
  'trial_activation_banner_view',
  'trial_activation_cta_click',
  'trial_conversion_cta_click',
  'create_opened',
  'create_started',
  'deck_generated',
  'deck_opened',
  'export_clicked',
  'deck_exported',
  'share_clicked',
  'deck_shared',
  'activation_completed',
  'paywall_view',
  'paywall_cta_click',
  'paywall_dismiss',
  'blog_cta_click',
  'begin_checkout',
  'purchase',
]);

const MAX_STRING_LENGTH = 240;
const MAX_ARRAY_LENGTH = 20;
const MAX_OBJECT_KEYS = 40;

type RecordEventInput = {
  eventName?: string;
  properties?: Record<string, any>;
  occurredAt?: string;
};

@Injectable()
export class ProductEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(user: { sub: string; email?: string | null }, input: RecordEventInput) {
    const eventName = String(input?.eventName || '').trim();
    if (!ALLOWED_EVENTS.has(eventName)) {
      return { stored: false, reason: 'event_not_tracked' };
    }

    await this.ensureUser(user.sub, user.email);

    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
    const safeOccurredAt = Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt;

    await this.prisma.productEvent.create({
      data: {
        userId: user.sub,
        eventName,
        occurredAt: safeOccurredAt,
        properties: this.sanitizeProperties(input.properties || {}),
      },
    });

    return { stored: true };
  }

  private async ensureUser(userId: string, email?: string | null) {
    await this.prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: email || `${userId}@unknown.slideai.local`,
      },
      update: email ? { email } : {},
    });
  }

  private sanitizeProperties(value: any, depth = 0): any {
    if (depth > 3) return undefined;
    if (value === null || value === undefined) return undefined;

    if (typeof value === 'string') {
      return value.slice(0, MAX_STRING_LENGTH);
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      return value
        .slice(0, MAX_ARRAY_LENGTH)
        .map((item) => this.sanitizeProperties(item, depth + 1))
        .filter((item) => item !== undefined);
    }

    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => !this.isSensitiveKey(key))
          .slice(0, MAX_OBJECT_KEYS)
          .map(([key, item]) => [key, this.sanitizeProperties(item, depth + 1)])
          .filter(([, item]) => item !== undefined),
      );
    }

    return undefined;
  }

  private isSensitiveKey(key: string) {
    const normalized = key.toLowerCase();
    return (
      normalized.includes('email') ||
      normalized.includes('token') ||
      normalized.includes('password') ||
      normalized.includes('secret')
    );
  }
}
