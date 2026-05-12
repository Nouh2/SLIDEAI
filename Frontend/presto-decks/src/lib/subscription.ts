export type SubscriptionFeature =
  | "export_pdf"
  | "export_pptx"
  | "export_editable_pptx"
  | "public_link"
  | "no_watermark"
  | "brand_kit"
  | "team_workspace"
  | "ai_priority"
  | "support_priority"
  | "web_viewer";

export interface SubscriptionSnapshot {
  plan?: string | null;
  effectivePlan?: string | null;
  accessState?: string | null;
  status?: string | null;
  features?: string[] | null;
  packActive?: boolean | null;
  canStartTrial?: boolean | null;
  isLegacyAccess?: boolean | null;
  creditsRemaining?: number | null;
  packCreditsRemaining?: number | null;
  trialDaysLeft?: number | null;
}

export const hasFeature = (
  subscription: SubscriptionSnapshot | null | undefined,
  feature: SubscriptionFeature,
): boolean => {
  if (subscription?.accessState === "trial_expired") {
    return false;
  }

  return Boolean(subscription?.features?.includes(feature));
};

export const isTrialingSubscription = (
  subscription: SubscriptionSnapshot | null | undefined,
): boolean => subscription?.accessState === "trialing";

export const isExpiredTrialSubscription = (
  subscription: SubscriptionSnapshot | null | undefined,
): boolean => subscription?.accessState === "trial_expired";

export const isPackSubscription = (
  subscription: SubscriptionSnapshot | null | undefined,
): boolean => Boolean(subscription?.packActive || subscription?.effectivePlan === "pack");

export const isLegacySubscription = (
  subscription: SubscriptionSnapshot | null | undefined,
): boolean => Boolean(subscription?.isLegacyAccess || subscription?.effectivePlan === "legacy");

export const getPlanDisplayKey = (
  subscription: SubscriptionSnapshot | null | undefined,
): "pro" | "business" | null => {
  if (!subscription) {
    return null;
  }

  if (subscription.accessState === "trial_expired") {
    return null;
  }

  if (subscription.plan === "business") {
    return "business";
  }

  if (subscription.plan === "pro" || isTrialingSubscription(subscription)) {
    return "pro";
  }

  return null;
};

export const getPlanRank = (
  planKey: string | null | undefined,
): number => {
  switch (planKey) {
    case "business":
      return 3;
    case "pro":
      return 2;
    default:
      return 0;
  }
};
