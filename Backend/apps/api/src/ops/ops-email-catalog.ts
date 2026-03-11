export type OpsEmailTemplateDefinition = {
  slug: string;
  name: string;
  category: string;
  kind: 'marketing' | 'transactional';
  flowSlug: string;
  sample: {
    legacyFree?: boolean;
    presentationCount?: number;
    trialEndsAtOffsetDays?: number;
  };
};

export type OpsEmailFlowDefinition = {
  slug: string;
  name: string;
  category: string;
  kind: 'marketing' | 'transactional';
  emailTypes: string[];
  defaultConfig: {
    timezone: string;
    sendWindowStart: string;
    sendWindowEnd: string;
    weekdaysOnly: boolean;
    enabled: boolean;
  };
};

export const OPS_EMAIL_TEMPLATE_DEFINITIONS: OpsEmailTemplateDefinition[] = [
  { slug: 'trial_welcome', name: 'Trial welcome', category: 'trial', kind: 'transactional', flowSlug: 'trial', sample: { presentationCount: 0, trialEndsAtOffsetDays: 7 } },
  { slug: 'trial_inactive_day1', name: 'Trial inactive day 1', category: 'trial', kind: 'marketing', flowSlug: 'trial', sample: { presentationCount: 0, trialEndsAtOffsetDays: 6 } },
  { slug: 'trial_value_day4', name: 'Trial value day 4', category: 'trial', kind: 'marketing', flowSlug: 'trial', sample: { presentationCount: 3, trialEndsAtOffsetDays: 3 } },
  { slug: 'trial_ending_day6', name: 'Trial ending day 6', category: 'trial', kind: 'marketing', flowSlug: 'trial', sample: { presentationCount: 2, trialEndsAtOffsetDays: 1 } },
  { slug: 'trial_expired', name: 'Trial expired', category: 'trial', kind: 'transactional', flowSlug: 'trial', sample: { presentationCount: 2, trialEndsAtOffsetDays: 0 } },
  { slug: 'trial_winback_day2', name: 'Trial winback day 2', category: 'trial', kind: 'marketing', flowSlug: 'trial', sample: { presentationCount: 2, trialEndsAtOffsetDays: -2 } },
  { slug: 'signup_day1_no_presentation', name: 'Signup day 1 no presentation', category: 'onboarding', kind: 'marketing', flowSlug: 'signup_onboarding', sample: { presentationCount: 0, trialEndsAtOffsetDays: 6 } },
  { slug: 'signup_day3_no_presentation', name: 'Signup day 3 no presentation', category: 'onboarding', kind: 'marketing', flowSlug: 'signup_onboarding', sample: { presentationCount: 0, trialEndsAtOffsetDays: 4 } },
  { slug: 'signup_day5_activated', name: 'Signup day 5 activated', category: 'onboarding', kind: 'marketing', flowSlug: 'signup_onboarding', sample: { presentationCount: 2, trialEndsAtOffsetDays: 2 } },
  { slug: 'pack_purchase_confirmation', name: 'Pack purchase confirmation', category: 'pack', kind: 'transactional', flowSlug: 'pack', sample: { presentationCount: 0, trialEndsAtOffsetDays: 7 } },
  { slug: 'pack_low_balance', name: 'Pack low balance', category: 'pack', kind: 'marketing', flowSlug: 'pack', sample: { presentationCount: 1, trialEndsAtOffsetDays: 7 } },
  { slug: 'pack_exhausted', name: 'Pack exhausted', category: 'pack', kind: 'marketing', flowSlug: 'pack', sample: { presentationCount: 1, trialEndsAtOffsetDays: 7 } },
  { slug: 'inactive_7d', name: 'Inactive 7d', category: 'reactivation', kind: 'marketing', flowSlug: 'inactivity', sample: { presentationCount: 3, trialEndsAtOffsetDays: 7 } },
  { slug: 'inactive_14d', name: 'Inactive 14d', category: 'reactivation', kind: 'marketing', flowSlug: 'inactivity', sample: { presentationCount: 3, trialEndsAtOffsetDays: 7 } },
  { slug: 'inactive_21d_offer', name: 'Inactive 21d offer', category: 'reactivation', kind: 'marketing', flowSlug: 'inactivity', sample: { presentationCount: 3, trialEndsAtOffsetDays: 7 } },
  { slug: 'cancel_confirmation', name: 'Cancel confirmation', category: 'churn', kind: 'transactional', flowSlug: 'cancel', sample: { presentationCount: 4, trialEndsAtOffsetDays: 7 } },
  { slug: 'cancel_day3_winback', name: 'Cancel day 3 winback', category: 'churn', kind: 'marketing', flowSlug: 'cancel', sample: { presentationCount: 4, trialEndsAtOffsetDays: 7 } },
  { slug: 'failed_payment_day0', name: 'Failed payment day 0', category: 'billing', kind: 'transactional', flowSlug: 'billing', sample: { presentationCount: 4, trialEndsAtOffsetDays: 7 } },
];

export const OPS_EMAIL_FLOW_DEFINITIONS: OpsEmailFlowDefinition[] = [
  {
    slug: 'trial',
    name: 'Free trial lifecycle',
    category: 'trial',
    kind: 'marketing',
    emailTypes: ['trial_welcome', 'trial_inactive_day1', 'trial_value_day4', 'trial_ending_day6', 'trial_expired', 'trial_winback_day2'],
    defaultConfig: { timezone: 'Europe/Paris', sendWindowStart: '09:00', sendWindowEnd: '18:00', weekdaysOnly: true, enabled: true },
  },
  {
    slug: 'signup_onboarding',
    name: 'Signup onboarding',
    category: 'onboarding',
    kind: 'marketing',
    emailTypes: ['signup_day1_no_presentation', 'signup_day3_no_presentation', 'signup_day5_activated'],
    defaultConfig: { timezone: 'Europe/Paris', sendWindowStart: '09:00', sendWindowEnd: '18:00', weekdaysOnly: true, enabled: true },
  },
  {
    slug: 'pack',
    name: 'Pack upsell',
    category: 'pack',
    kind: 'marketing',
    emailTypes: ['pack_purchase_confirmation', 'pack_low_balance', 'pack_exhausted'],
    defaultConfig: { timezone: 'Europe/Paris', sendWindowStart: '09:00', sendWindowEnd: '18:00', weekdaysOnly: true, enabled: true },
  },
  {
    slug: 'inactivity',
    name: 'Inactivity reactivation',
    category: 'reactivation',
    kind: 'marketing',
    emailTypes: ['inactive_7d', 'inactive_14d', 'inactive_21d_offer'],
    defaultConfig: { timezone: 'Europe/Paris', sendWindowStart: '09:00', sendWindowEnd: '18:00', weekdaysOnly: true, enabled: true },
  },
  {
    slug: 'cancel',
    name: 'Cancellation winback',
    category: 'churn',
    kind: 'marketing',
    emailTypes: ['cancel_confirmation', 'cancel_day3_winback'],
    defaultConfig: { timezone: 'Europe/Paris', sendWindowStart: '09:00', sendWindowEnd: '18:00', weekdaysOnly: true, enabled: true },
  },
  {
    slug: 'billing',
    name: 'Billing recovery',
    category: 'billing',
    kind: 'transactional',
    emailTypes: ['failed_payment_day0'],
    defaultConfig: { timezone: 'Europe/Paris', sendWindowStart: '09:00', sendWindowEnd: '18:00', weekdaysOnly: false, enabled: true },
  },
];

export const OPS_EMAIL_TEMPLATE_MAP = Object.fromEntries(
  OPS_EMAIL_TEMPLATE_DEFINITIONS.map((entry) => [entry.slug, entry]),
) as Record<string, OpsEmailTemplateDefinition>;

export const OPS_EMAIL_FLOW_MAP = Object.fromEntries(
  OPS_EMAIL_FLOW_DEFINITIONS.map((entry) => [entry.slug, entry]),
) as Record<string, OpsEmailFlowDefinition>;

export function getTemplateDefinition(slug: string) {
  return OPS_EMAIL_TEMPLATE_MAP[slug];
}

export function getFlowDefinition(slug: string) {
  return OPS_EMAIL_FLOW_MAP[slug];
}
