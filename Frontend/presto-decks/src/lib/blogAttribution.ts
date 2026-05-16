export type BlogCtaPlacement = "top" | "inline" | "inline_markdown" | "bottom";

export type BlogAttribution = {
  source: "blog";
  medium: "seo";
  campaign: "blog_article_cta";
  content: string;
  postSlug: string;
  postTitle: string;
  placement: BlogCtaPlacement;
  templateId: string;
  slideCount: number;
  prompt: string;
  wasAuthenticated?: boolean;
  createdAt: string;
};

const STORAGE_KEY = "slideai-blog-attribution";
const REPLAY_PREFIX = "slideai-blog-cta-replayed";

const CATEGORY_TEMPLATE: Record<string, { templateId: string; slideCount: number }> = {
  seo: { templateId: "seo-audit", slideCount: 10 },
  marketing: { templateId: "marketing-campaign", slideCount: 10 },
  business: { templateId: "business-review", slideCount: 10 },
  sales: { templateId: "sales-proposal", slideCount: 9 },
  startup: { templateId: "startup-pitch", slideCount: 10 },
  education: { templateId: "educational", slideCount: 12 },
};

function inferPreset(postSlug: string, category?: string | null) {
  const normalized = `${category || ""} ${postSlug}`.toLowerCase();

  if (normalized.includes("pdf") || normalized.includes("powerpoint")) {
    return { templateId: "corporate-report", slideCount: 10 };
  }

  if (normalized.includes("seo")) {
    return CATEGORY_TEMPLATE.seo;
  }

  if (normalized.includes("gamma") || normalized.includes("canva") || normalized.includes("alternative")) {
    return { templateId: "business-review", slideCount: 10 };
  }

  if (category && CATEGORY_TEMPLATE[category]) {
    return CATEGORY_TEMPLATE[category];
  }

  return { templateId: "business-review", slideCount: 10 };
}

function buildPrompt(postTitle: string, postSlug: string, category?: string | null) {
  const title = postTitle.trim() || postSlug.replace(/-/g, " ");
  const isPdf = postSlug.toLowerCase().includes("pdf");
  const angle = category === "seo"
    ? "avec diagnostic, priorites, quick wins et plan d'action"
    : "avec structure claire, exemples concrets, messages actionnables et conclusion";

  if (isPdf) {
    return `Cree une presentation PowerPoint professionnelle a partir du sujet "${title}". Structure le deck pour expliquer le probleme, la methode, les etapes, les avantages, les limites et les prochaines actions.`;
  }

  return `Cree une presentation professionnelle sur "${title}", ${angle}. Le rendu doit etre pret a presenter a un client, une equipe ou une direction.`;
}

export function createBlogAttribution({
  postSlug,
  postTitle,
  placement,
  category,
  wasAuthenticated,
}: {
  postSlug: string;
  postTitle: string;
  placement: BlogCtaPlacement;
  category?: string | null;
  wasAuthenticated?: boolean;
}): BlogAttribution {
  const preset = inferPreset(postSlug, category);

  return {
    source: "blog",
    medium: "seo",
    campaign: "blog_article_cta",
    content: `${postSlug}_${placement}`,
    postSlug,
    postTitle,
    placement,
    templateId: preset.templateId,
    slideCount: preset.slideCount,
    prompt: buildPrompt(postTitle, postSlug, category),
    wasAuthenticated,
    createdAt: new Date().toISOString(),
  };
}

export function buildBlogCreatePath(attribution: BlogAttribution) {
  const params = new URLSearchParams({
    utm_source: attribution.source,
    utm_medium: attribution.medium,
    utm_campaign: attribution.campaign,
    utm_content: attribution.content,
    post_slug: attribution.postSlug,
    post_title: attribution.postTitle,
    placement: attribution.placement,
    template: attribution.templateId,
    slides: String(attribution.slideCount),
    prompt: attribution.prompt,
  });

  return `/create?${params.toString()}`;
}

export function rememberBlogAttribution(attribution: BlogAttribution) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Ignore storage failures; URL params still carry the current click.
  }
}

export function getStoredBlogAttribution(): BlogAttribution | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BlogAttribution;
    return parsed?.source === "blog" && parsed.postSlug ? parsed : null;
  } catch {
    return null;
  }
}

export function getBlogAttributionFromSearch(params: URLSearchParams): BlogAttribution | null {
  if (params.get("utm_source") !== "blog") return null;

  const postSlug = params.get("post_slug") || parseBlogContent(params.get("utm_content")).postSlug;
  const placement = (params.get("placement") || parseBlogContent(params.get("utm_content")).placement || "inline") as BlogCtaPlacement;
  const postTitle = params.get("post_title") || postSlug.replace(/-/g, " ");
  const templateId = params.get("template") || inferPreset(postSlug).templateId;
  const slideCount = Number(params.get("slides") || 10);

  if (!postSlug) return null;

  return {
    source: "blog",
    medium: "seo",
    campaign: "blog_article_cta",
    content: params.get("utm_content") || `${postSlug}_${placement}`,
    postSlug,
    postTitle,
    placement,
    templateId,
    slideCount: Number.isFinite(slideCount) ? slideCount : 10,
    prompt: params.get("prompt") || buildPrompt(postTitle, postSlug),
    createdAt: new Date().toISOString(),
  };
}

export function getBlogAttributionEventParams(attribution: BlogAttribution | null) {
  if (!attribution) return {};

  return {
    utm_source: attribution.source,
    utm_medium: attribution.medium,
    utm_campaign: attribution.campaign,
    utm_content: attribution.content,
    post_slug: attribution.postSlug,
    post_title: attribution.postTitle,
    placement: attribution.placement,
    blog_template_id: attribution.templateId,
    blog_slide_count: attribution.slideCount,
  };
}

export function shouldReplayBlogCta(attribution: BlogAttribution | null) {
  if (!attribution || attribution.wasAuthenticated) return false;
  if (typeof window === "undefined") return false;
  return !window.localStorage.getItem(`${REPLAY_PREFIX}-${attribution.content}`);
}

export function markBlogCtaReplayed(attribution: BlogAttribution) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${REPLAY_PREFIX}-${attribution.content}`, "1");
}

function parseBlogContent(value?: string | null) {
  if (!value) return { postSlug: "", placement: "" };
  const match = value.match(/^(.*)_(top|inline_markdown|inline|bottom)$/);
  return {
    postSlug: match?.[1] || value,
    placement: match?.[2] || "",
  };
}
