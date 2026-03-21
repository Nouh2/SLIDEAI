import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class SupabaseMirrorService {
  private readonly logger = new Logger(SupabaseMirrorService.name);
  private readonly supabase: SupabaseClient | null;

  constructor(private readonly prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const databaseUrl = process.env.DATABASE_URL || '';
    const enabled = Boolean(
      supabaseUrl &&
      supabaseKey &&
      (process.env.NODE_ENV === 'development' || databaseUrl.includes('slideai_trial_local')),
    );

    this.supabase = enabled
      ? createClient(supabaseUrl!, supabaseKey!, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : null;
  }

  async syncUserAndSubscription(userId: string, userEmail?: string) {
    if (!this.supabase) {
      return;
    }

    try {
      const remoteUser = await this.fetchRemoteUser(userId, userEmail);
      if (remoteUser) {
        await this.prisma.user.upsert({
          where: { id: remoteUser.id },
          update: {
            email: remoteUser.email,
            createdAt: this.toDate(remoteUser.createdAt) || undefined,
          },
          create: {
            id: remoteUser.id,
            email: remoteUser.email,
            createdAt: this.toDate(remoteUser.createdAt) || new Date(),
          },
        });
      }

      const { data: remoteSubscription, error } = await this.supabase
        .from('Subscription')
        .select('*')
        .eq('userId', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!remoteSubscription) {
        return;
      }

      await this.prisma.subscription.upsert({
        where: { userId: remoteSubscription.userId },
        update: this.mapSubscription(remoteSubscription),
        create: {
          id: remoteSubscription.id,
          userId: remoteSubscription.userId,
          ...this.mapSubscription(remoteSubscription),
        },
      });
    } catch (error: any) {
      this.logger.warn(`Supabase user/subscription sync skipped for ${userId}: ${error.message}`);
    }
  }

  async syncPresentations(userId: string) {
    if (!this.supabase) {
      return;
    }

    try {
      const { data: remotePresentations, error } = await this.supabase
        .from('presentations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      for (const remotePresentation of remotePresentations || []) {
        await this.prisma.presentations.upsert({
          where: { id: remotePresentation.id },
          update: this.mapPresentation(remotePresentation),
          create: {
            id: remotePresentation.id,
            ...this.mapPresentation(remotePresentation),
          },
        });
      }
    } catch (error: any) {
      this.logger.warn(`Supabase presentation sync skipped for ${userId}: ${error.message}`);
    }
  }

  private async fetchRemoteUser(userId: string, userEmail?: string) {
    const byId = await this.supabase!
      .from('User')
      .select('id,email,createdAt')
      .eq('id', userId)
      .maybeSingle();

    if (!byId.error && byId.data) {
      return byId.data;
    }

    if (!userEmail) {
      return null;
    }

    const byEmail = await this.supabase!
      .from('User')
      .select('id,email,createdAt')
      .eq('email', userEmail)
      .maybeSingle();

    if (byEmail.error) {
      throw byEmail.error;
    }

    return byEmail.data;
  }

  private mapSubscription(remoteSubscription: any) {
    return {
      plan: remoteSubscription.plan,
      status: remoteSubscription.status,
      creditsRemaining: remoteSubscription.creditsRemaining,
      creditsResetAt: this.toDate(remoteSubscription.creditsResetAt),
      trialStartedAt: this.toDate(remoteSubscription.trialStartedAt),
      trialEndsAt: this.toDate(remoteSubscription.trialEndsAt),
      trialConsumedAt: this.toDate(remoteSubscription.trialConsumedAt),
      legacyFree: Boolean(remoteSubscription.legacyFree),
      requiresPayment: Boolean(remoteSubscription.requiresPayment),
      stripeCustomerId: remoteSubscription.stripeCustomerId,
      stripeSubscriptionId: remoteSubscription.stripeSubscriptionId,
      currentPeriodEnd: this.toDate(remoteSubscription.currentPeriodEnd),
      createdAt: this.toDate(remoteSubscription.createdAt) || new Date(),
      updatedAt: this.toDate(remoteSubscription.updatedAt) || new Date(),
    };
  }

  private mapPresentation(remotePresentation: any) {
    return {
      user_id: remotePresentation.user_id,
      title: remotePresentation.title,
      slides: remotePresentation.slides,
      theme: remotePresentation.theme,
      status: remotePresentation.status || 'ready',
      created_at: this.toDate(remotePresentation.created_at) || new Date(),
      updated_at: this.toDate(remotePresentation.updated_at) || new Date(),
      share_token: remotePresentation.share_token,
      shared_with_user_ids: remotePresentation.shared_with_user_ids || [],
      view_only_token: remotePresentation.view_only_token,
      view_only_user_ids: remotePresentation.view_only_user_ids || [],
      orgId: remotePresentation.orgId ?? null,
    };
  }

  private toDate(value: string | Date | null | undefined) {
    if (!value) {
      return null;
    }

    return value instanceof Date ? value : new Date(value);
  }
}
