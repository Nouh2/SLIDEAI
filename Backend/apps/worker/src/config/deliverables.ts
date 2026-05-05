import type { Deck, Slide } from '../utils/sanitize.js';

export type DeliverableDefinition = {
  id: string;
  label: string;
  baseTheme: string;
  expectedSections: string[];
  preferredLayouts: string[];
  allowedLayouts: string[];
  requiredKeywords: string[];
  imageKeywords: string;
};

const DEFAULT_LAYOUTS = [
  'cover',
  'section',
  'text-columns',
  'bullets',
  'stats',
  'chart',
  'table',
  'comparison',
  'timeline',
  'infographic',
  'swot',
  'executive-summary',
  'bento',
  'image-focus',
];

export const DELIVERABLES: Record<string, DeliverableDefinition> = {
  'startup-pitch': {
    id: 'startup-pitch',
    label: 'Client / investor pitch',
    baseTheme: 'startup-pitch',
    expectedSections: ['Hook', 'Problem', 'Solution', 'Proof', 'Offer', 'Next steps'],
    preferredLayouts: ['cover', 'stats', 'comparison', 'bento', 'timeline'],
    allowedLayouts: DEFAULT_LAYOUTS,
    requiredKeywords: ['problem', 'solution', 'value', 'proof', 'next steps'],
    imageKeywords: 'business pitch startup client meeting',
  },
  'product-launch': {
    id: 'product-launch',
    label: 'Marketing recommendations',
    baseTheme: 'product-launch',
    expectedSections: ['Objectives', 'Target audience', 'Market analysis', 'Strategic pillars', 'Action plan', 'Budget'],
    preferredLayouts: ['cover', 'executive-summary', 'comparison', 'timeline', 'chart', 'table'],
    allowedLayouts: DEFAULT_LAYOUTS,
    requiredKeywords: ['objectives', 'audience', 'market', 'plan', 'budget'],
    imageKeywords: 'marketing strategy product launch team',
  },
  'corporate-report': {
    id: 'corporate-report',
    label: 'Client report / audit',
    baseTheme: 'corporate-report',
    expectedSections: ['Scope', 'Executive summary', 'Findings', 'Risks', 'Recommendations', 'Action plan'],
    preferredLayouts: ['cover', 'executive-summary', 'stats', 'chart', 'table', 'swot'],
    allowedLayouts: DEFAULT_LAYOUTS,
    requiredKeywords: ['scope', 'findings', 'risks', 'recommendations', 'action plan'],
    imageKeywords: 'corporate audit data report',
  },
  'marketing-campaign': {
    id: 'marketing-campaign',
    label: 'Advertising / marketing campaign',
    baseTheme: 'marketing-campaign',
    expectedSections: ['Brand context', 'Consumer insight', 'Campaign idea', 'Messages', 'Channels', 'Calendar', 'Budget', 'KPIs'],
    preferredLayouts: ['cover', 'executive-summary', 'bento', 'timeline', 'chart', 'table', 'image-focus'],
    allowedLayouts: ['cover', 'section', 'bullets', 'stats', 'chart', 'table', 'comparison', 'timeline', 'infographic', 'bento', 'image-focus', 'executive-summary'],
    requiredKeywords: ['campaign', 'audience', 'message', 'channels', 'calendar', 'budget', 'kpi'],
    imageKeywords: 'marketing advertising campaign creative strategy',
  },
  consulting: {
    id: 'consulting',
    label: 'Premium consulting deliverable',
    baseTheme: 'consulting',
    expectedSections: ['Executive summary', 'Situation analysis', 'Strategic issue', 'Options', 'Recommendation', 'Implementation roadmap', 'Impact'],
    preferredLayouts: ['cover', 'executive-summary', 'swot', 'comparison', 'timeline', 'chart', 'table'],
    allowedLayouts: DEFAULT_LAYOUTS,
    requiredKeywords: ['analysis', 'recommendation', 'roadmap', 'impact', 'decision'],
    imageKeywords: 'consulting strategy executive workshop',
  },
  'minimal-elegant': {
    id: 'minimal-elegant',
    label: 'Sober corporate client presentation',
    baseTheme: 'minimal-elegant',
    expectedSections: ['Context', 'Current status', 'Analysis', 'Options', 'Recommendation', 'Next steps'],
    preferredLayouts: ['cover', 'section', 'text-columns', 'comparison', 'table'],
    allowedLayouts: DEFAULT_LAYOUTS,
    requiredKeywords: ['context', 'analysis', 'options', 'recommendation'],
    imageKeywords: 'minimal corporate finance legal office',
  },
  'tech-modern': {
    id: 'tech-modern',
    label: 'Tech / SaaS presentation',
    baseTheme: 'tech-modern',
    expectedSections: ['Executive summary', 'Technical challenge', 'Solution architecture', 'Features', 'Integration', 'Security', 'Roadmap'],
    preferredLayouts: ['cover', 'bento', 'infographic', 'comparison', 'timeline', 'chart'],
    allowedLayouts: DEFAULT_LAYOUTS,
    requiredKeywords: ['technology', 'solution', 'architecture', 'features', 'roadmap'],
    imageKeywords: 'technology software saas digital',
  },
  educational: {
    id: 'educational',
    label: 'Training / course material',
    baseTheme: 'educational',
    expectedSections: ['Learning goals', 'Core concept', 'Method', 'Example', 'Exercise', 'Key takeaways'],
    preferredLayouts: ['cover', 'section', 'text-columns', 'infographic', 'timeline', 'table'],
    allowedLayouts: DEFAULT_LAYOUTS,
    requiredKeywords: ['learning', 'concept', 'method', 'example', 'takeaways'],
    imageKeywords: 'training education workshop learning',
  },
  'health-medical': {
    id: 'health-medical',
    label: 'Health / medical report',
    baseTheme: 'health-medical',
    expectedSections: ['Abstract', 'Background', 'Methodology', 'Findings', 'Discussion', 'Conclusion'],
    preferredLayouts: ['cover', 'executive-summary', 'stats', 'chart', 'table', 'text-columns'],
    allowedLayouts: DEFAULT_LAYOUTS,
    requiredKeywords: ['background', 'methodology', 'findings', 'discussion', 'conclusion'],
    imageKeywords: 'healthcare medical clinical report',
  },
  sustainability: {
    id: 'sustainability',
    label: 'CSR / sustainability report',
    baseTheme: 'sustainability',
    expectedSections: ['Commitment', 'Assessment', 'Achievements', 'Targets', 'Compliance', 'Stakeholder impact'],
    preferredLayouts: ['cover', 'stats', 'chart', 'timeline', 'infographic', 'table'],
    allowedLayouts: DEFAULT_LAYOUTS,
    requiredKeywords: ['assessment', 'targets', 'compliance', 'impact', 'stakeholders'],
    imageKeywords: 'sustainability environment csr climate',
  },
  'creative-portfolio': {
    id: 'creative-portfolio',
    label: 'Creative portfolio',
    baseTheme: 'creative-portfolio',
    expectedSections: ['Manifesto', 'Selected work', 'Case studies', 'Services', 'Process', 'Contact'],
    preferredLayouts: ['cover', 'image-focus', 'bento', 'comparison', 'timeline'],
    allowedLayouts: DEFAULT_LAYOUTS,
    requiredKeywords: ['work', 'case study', 'services', 'process'],
    imageKeywords: 'creative agency portfolio design',
  },
  'seo-audit': {
    id: 'seo-audit',
    label: 'SEO client audit',
    baseTheme: 'corporate-report',
    expectedSections: ['Scope', 'Executive summary', 'Technical SEO', 'Content gaps', 'Authority', 'Priority roadmap', 'Expected impact'],
    preferredLayouts: ['cover', 'executive-summary', 'stats', 'chart', 'table', 'timeline'],
    allowedLayouts: ['cover', 'section', 'bullets', 'stats', 'chart', 'table', 'comparison', 'timeline', 'infographic', 'executive-summary'],
    requiredKeywords: ['seo', 'technical', 'content', 'authority', 'roadmap', 'impact'],
    imageKeywords: 'seo analytics search engine audit',
  },
  'sales-proposal': {
    id: 'sales-proposal',
    label: 'Sales proposal',
    baseTheme: 'startup-pitch',
    expectedSections: ['Client context', 'Pain points', 'Proposed solution', 'Scope', 'Pricing', 'Timeline', 'Next steps'],
    preferredLayouts: ['cover', 'comparison', 'bento', 'table', 'timeline', 'stats'],
    allowedLayouts: ['cover', 'section', 'bullets', 'stats', 'table', 'comparison', 'timeline', 'bento', 'executive-summary'],
    requiredKeywords: ['client', 'solution', 'scope', 'pricing', 'timeline', 'next steps'],
    imageKeywords: 'business proposal sales client',
  },
  'business-review': {
    id: 'business-review',
    label: 'Business review / QBR',
    baseTheme: 'corporate-report',
    expectedSections: ['Executive summary', 'Performance review', 'KPI trends', 'Risks', 'Opportunities', 'Next quarter priorities'],
    preferredLayouts: ['cover', 'executive-summary', 'stats', 'chart', 'table', 'timeline'],
    allowedLayouts: ['cover', 'section', 'bullets', 'stats', 'chart', 'table', 'comparison', 'timeline', 'executive-summary'],
    requiredKeywords: ['performance', 'kpi', 'trend', 'risks', 'opportunities', 'priorities'],
    imageKeywords: 'business review quarterly performance',
  },
  'financial-audit': {
    id: 'financial-audit',
    label: 'Financial audit / credit analysis',
    baseTheme: 'minimal-elegant',
    expectedSections: ['Executive summary', 'Financial position', 'Revenue and costs', 'Liquidity', 'Risks', 'Recommendations'],
    preferredLayouts: ['cover', 'executive-summary', 'stats', 'chart', 'table', 'comparison'],
    allowedLayouts: ['cover', 'section', 'bullets', 'stats', 'chart', 'table', 'comparison', 'executive-summary'],
    requiredKeywords: ['financial', 'revenue', 'costs', 'liquidity', 'risks', 'recommendations'],
    imageKeywords: 'finance audit financial analysis',
  },
  'product-roadmap': {
    id: 'product-roadmap',
    label: 'Product roadmap',
    baseTheme: 'tech-modern',
    expectedSections: ['Product vision', 'User needs', 'Priorities', 'Roadmap', 'Dependencies', 'Success metrics'],
    preferredLayouts: ['cover', 'bento', 'comparison', 'timeline', 'chart', 'table'],
    allowedLayouts: ['cover', 'section', 'bullets', 'stats', 'chart', 'table', 'comparison', 'timeline', 'infographic', 'bento', 'executive-summary'],
    requiredKeywords: ['vision', 'users', 'priorities', 'roadmap', 'metrics'],
    imageKeywords: 'product roadmap software planning',
  },
  'cybersecurity-audit': {
    id: 'cybersecurity-audit',
    label: 'Cybersecurity audit',
    baseTheme: 'tech-modern',
    expectedSections: ['Scope', 'Security posture', 'Critical risks', 'Vulnerabilities', 'Remediation roadmap', 'Governance'],
    preferredLayouts: ['cover', 'executive-summary', 'stats', 'swot', 'table', 'timeline'],
    allowedLayouts: ['cover', 'section', 'bullets', 'stats', 'chart', 'table', 'comparison', 'timeline', 'swot', 'executive-summary'],
    requiredKeywords: ['security', 'risks', 'vulnerabilities', 'remediation', 'governance'],
    imageKeywords: 'cybersecurity audit risk technology',
  },
  'board-deck': {
    id: 'board-deck',
    label: 'Board deck / executive committee',
    baseTheme: 'consulting',
    expectedSections: ['Executive summary', 'Business performance', 'Strategic decisions', 'Risks', 'Financial impact', 'Asks'],
    preferredLayouts: ['cover', 'executive-summary', 'stats', 'chart', 'comparison', 'table'],
    allowedLayouts: ['cover', 'section', 'bullets', 'stats', 'chart', 'table', 'comparison', 'timeline', 'executive-summary'],
    requiredKeywords: ['executive', 'performance', 'decisions', 'risks', 'financial', 'asks'],
    imageKeywords: 'board meeting executive strategy',
  },
};

export function resolveDeliverable(input?: string | null): DeliverableDefinition {
  if (!input) return DELIVERABLES['startup-pitch'];
  const clean = input.toLowerCase().trim();
  return DELIVERABLES[clean] || DELIVERABLES['startup-pitch'];
}

function canonicalLayout(layout: string | undefined): string {
  const value = (layout || '').toLowerCase();
  if (value.includes('cover')) return 'cover';
  if (value.includes('executive')) return 'executive-summary';
  if (value.includes('timeline') || value.includes('roadmap')) return 'timeline';
  if (value.includes('chart') || value.includes('graph')) return 'chart';
  if (value.includes('table')) return 'table';
  if (value.includes('stat') || value.includes('metric') || value.includes('kpi')) return 'stats';
  if (value.includes('comparison') || value.includes('versus') || value.includes('vs')) return 'comparison';
  if (value.includes('swot')) return 'swot';
  if (value.includes('bento') || value.includes('feature')) return 'bento';
  if (value.includes('infographic') || value.includes('process') || value.includes('funnel')) return 'infographic';
  if (value.includes('column')) return 'text-columns';
  if (value.includes('image')) return 'image-focus';
  if (value.includes('section')) return 'section';
  return value || 'bullets';
}

function hasContentForLayout(slide: Slide, layout: string): boolean {
  const content = slide.content || {};
  switch (layout) {
    case 'chart':
      return Boolean(content.chart?.categories?.length && content.chart?.series?.some((s) => s.data?.length));
    case 'table':
      return Boolean(content.table?.columns?.length && content.table?.rows?.length);
    case 'timeline':
      return Boolean(content.timeline?.items?.length);
    case 'comparison':
      return Boolean(content.comparison?.left?.items?.length && content.comparison?.right?.items?.length);
    case 'stats':
      return Boolean(content.stats?.length);
    case 'swot':
      return Boolean(content.swot?.strengths?.length || content.swot?.weaknesses?.length || content.swot?.opportunities?.length || content.swot?.threats?.length);
    case 'bento':
      return Boolean(content.items?.length);
    default:
      return true;
  }
}

export function enforceDeliverableOnDeck(deck: Deck, deliverable: DeliverableDefinition): Deck {
  const allowed = new Set(deliverable.allowedLayouts);

  deck.slides = deck.slides.map((slide, index) => {
    if (index === 0) {
      return {
        ...slide,
        layout: 'cover',
        imageSearchQuery: slide.imageSearchQuery || deliverable.imageKeywords,
      };
    }

    const currentLayout = canonicalLayout(slide.layout);
    if (allowed.has(currentLayout) && hasContentForLayout(slide, currentLayout)) {
      return {
        ...slide,
        layout: currentLayout,
        imageSearchQuery: slide.imageSearchQuery || deliverable.imageKeywords,
      };
    }

    const fallback = deliverable.preferredLayouts.find((layout) => allowed.has(layout) && hasContentForLayout(slide, layout))
      || (slide.content?.bullets?.length ? 'bullets' : 'text-columns');

    return {
      ...slide,
      layout: fallback,
      imageSearchQuery: slide.imageSearchQuery || deliverable.imageKeywords,
    };
  });

  return {
    ...deck,
    theme: deliverable.id,
    slides: deck.slides,
  };
}

