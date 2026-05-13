var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
const ALLOWED_EVENTS = new Set([
    'trial_started',
    'activation_use_case_selected',
    'activation_onboarding_started',
    'trial_activation_banner_view',
    'trial_activation_cta_click',
    'trial_conversion_cta_click',
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
    'begin_checkout',
    'purchase',
]);
const MAX_STRING_LENGTH = 240;
const MAX_ARRAY_LENGTH = 20;
const MAX_OBJECT_KEYS = 40;
let ProductEventsService = class ProductEventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordEvent(user, input) {
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
    async ensureUser(userId, email) {
        await this.prisma.user.upsert({
            where: { id: userId },
            create: {
                id: userId,
                email: email || `${userId}@unknown.slideai.local`,
            },
            update: email ? { email } : {},
        });
    }
    sanitizeProperties(value, depth = 0) {
        if (depth > 3)
            return undefined;
        if (value === null || value === undefined)
            return undefined;
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
            return Object.fromEntries(Object.entries(value)
                .filter(([key]) => !this.isSensitiveKey(key))
                .slice(0, MAX_OBJECT_KEYS)
                .map(([key, item]) => [key, this.sanitizeProperties(item, depth + 1)])
                .filter(([, item]) => item !== undefined));
        }
        return undefined;
    }
    isSensitiveKey(key) {
        const normalized = key.toLowerCase();
        return (normalized.includes('email') ||
            normalized.includes('token') ||
            normalized.includes('password') ||
            normalized.includes('secret'));
    }
};
ProductEventsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ProductEventsService);
export { ProductEventsService };
