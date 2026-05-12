type Tone = 'info' | 'warning' | 'success';
type Stat = {
    value: string;
    label: string;
};
type FeatureCard = {
    imageUrl: string;
    label: string;
    ctaLabel: string;
};
type Spotlight = {
    tone: Tone;
    title: string;
    body: string;
};
export type EmailContent = {
    subject: string;
    preview: string;
    badge: string;
    title: string;
    intro: string;
    body: string[];
    stats?: Stat[];
    bullets?: string[];
    spotlight?: Spotlight;
    ctaLabel: string;
    ctaUrl: string;
    note?: string;
    unsubscribeUrl?: string;
    footerReason?: string;
    layout?: 'default' | 'welcome' | 'newsletter';
    heroImageUrl?: string;
    featureGrid?: FeatureCard[];
    darkFooterStats?: Stat[];
};
export type EmailContentPatch = Partial<EmailContent> & {
    body?: string[];
    bullets?: string[];
    stats?: Stat[];
    spotlight?: Spotlight | null;
};
export type WinbackOffer = {
    code: string;
    expiresAt: string;
    percentOff: number;
    expiresInHours: number;
};
export declare function buildLifecycleEmailModel(params: {
    emailType: string;
    legacyFree: boolean;
    trialEndsAt: string;
    presentationCount: number;
    winbackOffer?: WinbackOffer;
    contentPatch?: EmailContentPatch;
    unsubscribeUrl?: string;
    footerReason?: string;
    firstName?: string;
}): EmailContent | null;
export declare function buildTrialEmailContent(params: {
    emailType: string;
    legacyFree: boolean;
    trialEndsAt: string;
    presentationCount: number;
    winbackOffer?: WinbackOffer;
    contentPatch?: EmailContentPatch;
    unsubscribeUrl?: string;
    footerReason?: string;
    firstName?: string;
}): {
    subject: string;
    html: string;
} | null;
export type BroadcastEmailParams = {
    subject: string;
    badge: string;
    title: string;
    intro: string;
    body: string[];
    bullets?: string[];
    ctaLabel: string;
    ctaUrl: string;
    note?: string;
    unsubscribeUrl?: string;
    footerReason?: string;
};
export declare function buildBroadcastEmailContent(params: BroadcastEmailParams): {
    subject: string;
    html: string;
};
export declare function sendLifecycleEmail(params: {
    to: string;
    subject: string;
    html: string;
}): Promise<any>;
export {};
