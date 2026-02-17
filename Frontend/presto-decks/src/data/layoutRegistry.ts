export type LayoutFamilyEntry = {
    id: string;
    label: string;
    icon: string;
    variations: string[];
};

const QA_IMAGE_DATA_URI =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#dbeafe"/>
                    <stop offset="100%" stop-color="#e2e8f0"/>
                </linearGradient>
            </defs>
            <rect width="1600" height="900" fill="url(#g)"/>
            <circle cx="280" cy="220" r="120" fill="#93c5fd" fill-opacity="0.35"/>
            <circle cx="1180" cy="640" r="180" fill="#a78bfa" fill-opacity="0.22"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#334155" font-size="54" font-family="Arial, sans-serif">QA Placeholder</text>
        </svg>`,
    );

export const DEMO_LAYOUT_FAMILIES: LayoutFamilyEntry[] = [
    { id: 'cover', label: 'Cover & Hero', icon: 'maximize', variations: ['centered-minimal', 'full-split', 'diagonal-hero', 'typographic-giant', 'gradient-mesh', 'boxed-modern', 'cinematic'] },
    { id: 'content', label: 'Content & Bullets', icon: 'list', variations: ['classic', 'split-card', 'hero-block', 'magazine', 'minimal-offset'] },
    { id: 'text-columns', label: 'Text Columns', icon: 'columns', variations: ['classic', 'modern-cards', 'numbered-editorial', 'side-highlight', 'vertical-separators', 'bento-text'] },
    { id: 'stats', label: 'Stats & Metrics', icon: 'hash', variations: ['classic-grid', 'metric-cards', 'big-hero-stat', 'data-progress', 'trend-focus'] },
    { id: 'chart', label: 'Charts', icon: 'bar-chart', variations: ['default', 'chart-showcase', 'chart-analysis', 'split-curtain'] },
    { id: 'table', label: 'Tables', icon: 'table', variations: ['default', 'data-grid', 'feature-matrix', 'pricing-tiers'] },
    { id: 'bento', label: 'Bento Grid', icon: 'grid', variations: ['default', 'magazine-grid', 'feature-focus', 'asymmetric-masonry'] },
    { id: 'timeline', label: 'Timeline & Process', icon: 'history', variations: ['horizontal-line', 'vertical-alternating', 'connected-cards', 'stepped-process'] },
    { id: 'comparison', label: 'Comparison (VS)', icon: 'arrow-left-right', variations: ['balanced-split', 'versus-cards', 'feature-grid', 'before-after', 'pros-cons'] },
    { id: 'showcase', label: 'Showcase', icon: 'maximize', variations: ['default', 'split', 'floating', 'minimal'] },
    { id: 'section', label: 'Section Divider', icon: 'columns', variations: ['default', 'big-number-outline', 'minimal-bar', 'abstract-mesh'] },
    { id: 'image', label: 'Image & Gallery', icon: 'image', variations: ['default', 'image-showcase', 'chart-showcase', 'chart-analysis', 'text-mask', 'split-curtain', 'polaroid-pile'] },
    { id: 'swot', label: 'SWOT Analysis', icon: 'grid', variations: ['classic-grid', 'rounded-cards', 'minimal-list'] },
    { id: 'tows', label: 'TOWS Matrix', icon: 'grid', variations: ['classic-grid', 'rounded-cards'] },
    { id: 'tows-distribution', label: 'TOWS Distribution', icon: 'pie-chart', variations: ['default-container', 'floating-card'] },
    { id: 'executive-summary', label: 'Executive Summary', icon: 'file-text', variations: ['dashboard', 'split-columns', 'compact'] },
    { id: 'infographic', label: 'Infographics', icon: 'pie-chart', variations: ['funnel', 'process', 'pyramid', 'cycle-flow', 'hub-spoke'] },
];

export const DEMO_MOCK_DATA: Record<string, any> = {
    cover: {
        title: 'SLIDEAI Presentation',
        subtitle: 'The future of automated design and professional visualization',
        author: 'Google DeepMind Team',
        company: 'Advanced Agentic Coding',
        backgroundImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2069',
    },
    content: {
        title: 'Core Features',
        subtitle: 'What makes SLIDEAI different',
        bullets: ['Automated layout switching', 'McKinsey style charts', 'AI-powered content generation', 'Seamless export to PDF/PPTX'],
    },
    'text-columns': {
        title: 'Key Modules',
        columns: [
            { title: 'Design Engine', text: 'Proprietary algorithms for visual balance and hierarchy.' },
            { title: 'Data Processor', text: 'Transforms raw data into high-impact visuals instantly.' },
            { title: 'Theme Manager', text: 'Maintains brand consistency across every single slide.' },
        ],
    },
    stats: {
        title: 'Performance Metrics',
        metrics: [
            { label: 'Efficiency Gain', value: '85%', change: '+12%' },
            { label: 'Design Time', value: '2.5m', change: '-15m' },
            { label: 'User NPS', value: '72', change: '+5' },
        ],
    },
    chart: {
        title: 'Market Share Analysis',
        chart: {
            type: 'bar',
            categories: ['Product A', 'Product B', 'Product C', 'Product D'],
            series: [{ name: 'Market Share', data: [45, 25, 20, 10] }],
        },
    },
    table: {
        title: 'Pricing Comparison',
        table: {
            headers: ['Feature', 'Starter', 'Pro', 'Enterprise'],
            rows: [
                ['AI Gen', 'Check', 'Check', 'Check'],
                ['Unlimited', 'Cross', 'Check', 'Check'],
                ['Support', 'Email', 'Priority', '24/7'],
            ],
        },
    },
    timeline: {
        title: 'Project Roadmap',
        steps: [
            { title: 'Phase 1', description: 'MVP Development', date: 'Jan 2024' },
            { title: 'Phase 2', description: 'Beta Launch', date: 'Mar 2024' },
            { title: 'Phase 3', description: 'Scale Up', date: 'Jun 2024' },
        ],
    },
    comparison: {
        title: 'Solution Comparison',
        left: { title: 'Legacy Tools', items: ['Manual effort', 'Inconsistent branding', 'No AI context'] },
        right: { title: 'SLIDEAI', items: ['Fully automated', 'Pixel perfect', 'Data-aware designs'] },
    },
    bento: {
        title: 'Capabilities Overview',
        items: [
            { title: 'Fast', description: 'Weeks to seconds.' },
            { title: 'Smart', description: 'Context-aware UI.' },
            { title: 'Beautiful', description: 'Consultant grade.' },
            { title: 'Ready', description: 'Export instantly.' },
        ],
    },
    swot: {
        title: 'Strategic SWOT Analysis',
        strengths: ['Fast speed', 'High quality'],
        weaknesses: ['Beta status', 'Complex data'],
        opportunities: ['Enterprise adoption'],
        threats: ['Crowded market'],
    },
    tows: {
        title: 'Matrice T W O S',
        type: 'tows',
        content: {
            labels: [
                'SO (Maxi-Maxi): Exploit market growth with high quality',
                'ST (Maxi-Mini): Use speed to mitigate competition',
                'WO (Mini-Maxi): Hire experts to fix beta status',
                'WT (Mini-Mini): Focus on niches to avoid crowded market',
            ],
            datasets: [{ data: [1, 1, 1, 1] }],
        },
    },
    'tows-distribution': {
        title: 'Matrice T W O S : Distribution Strategique',
        type: 'chart',
        chart: {
            type: 'doughnut',
            labels: ['SO Strategies', 'ST Strategies', 'WO Strategies', 'WT Strategies'],
            datasets: [{
                label: 'Distribution',
                data: [25, 25, 25, 25],
                backgroundColor: ['#27AE60', '#E74C3C', '#3498DB', '#F39C12'],
            }],
        },
    },
    'executive-summary': {
        title: 'Executive Summary',
        highlights: [
            { title: 'Growth', text: 'Significant increase in user base.' },
            { title: 'Churn', text: 'Lowest in category at 2%.' },
            { title: 'Revenue', text: 'On track for $10M ARR.' },
        ],
    },
    image: {
        title: 'World Wide Reach',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072',
        images: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072'],
        chart: {
            type: 'line',
            title: 'Projected Monthly Revenue by Channel ($)',
            series: [
                { data: [20000, 45000, 85000, 140000, 190000, 250000], name: 'DTC Revenue' },
                { data: [5000, 15000, 40000, 90000, 130000, 180000], name: 'Retail Revenue' },
            ],
            categories: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
        },
    },
    showcase: {
        title: 'Product Showcase',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426',
        description: 'A revolutionary way to think about presentations.',
        items: [
            { title: 'Smart Layouts', description: 'Context-aware design logic.' },
            { title: 'Real-time Sync', description: 'Seamless multi-device editing.' },
            { title: 'Advanced Metrics', description: 'Deep visual analytics built-in.' },
            { title: 'Cloud Integration', description: 'Access anywhere, anytime.' },
        ],
    },
    infographic: {
        title: 'Iterative Growth Cycle',
        steps: [
            { label: 'Market Research', description: 'Deep dive into user needs' },
            { label: 'Prototyping', description: 'Rapid iteration of ideas' },
            { label: 'User Testing', description: 'Validation with real users' },
            { label: 'Development', description: 'Building scalable features' },
            { label: 'Deployment', description: 'Releasing to production' },
            { label: 'Analysis', description: 'Measuring impact & KPIs' },
        ],
    },
    section: {
        title: 'Next Section',
        subtitle: 'Diving deeper into the technology',
        backgroundImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2072',
    },
};

const sanitizeMediaForQa = (value: any): any => {
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeMediaForQa(item));
    }
    if (value && typeof value === 'object') {
        const out: Record<string, any> = {};
        for (const [key, child] of Object.entries(value)) {
            if (key === 'backgroundImage' || key === 'image' || key === 'imageUrl') {
                out[key] = QA_IMAGE_DATA_URI;
                continue;
            }
            if (key === 'images' && Array.isArray(child)) {
                out[key] = child.map(() => QA_IMAGE_DATA_URI);
                continue;
            }
            out[key] = sanitizeMediaForQa(child);
        }
        return out;
    }
    return value;
};

export const createRegistrySlide = (familyId: string, variation: string, qaSafe: boolean = false) => {
    const rawBase = DEMO_MOCK_DATA[familyId] || {};
    const base = qaSafe ? sanitizeMediaForQa(rawBase) : rawBase;
    return {
        id: `registry-${familyId}-${variation}`,
        title: base.title || 'Demo Slide',
        ...base,
        type: familyId,
        layout: familyId,
        variation,
        theme: 'modern',
        content: qaSafe ? sanitizeMediaForQa(base) : base,
    };
};

export const buildLayoutRegistrySlides = (maxSlides?: number, offset: number = 0, qaSafe: boolean = false) => {
    const slides: any[] = [];
    let globalIndex = 0;
    for (const family of DEMO_LAYOUT_FAMILIES) {
        for (const variation of family.variations) {
            if (globalIndex >= offset) {
                slides.push(createRegistrySlide(family.id, variation, qaSafe));
            }
            globalIndex += 1;
            if (typeof maxSlides === 'number' && slides.length >= maxSlides) {
                return slides;
            }
        }
    }
    return slides;
};

export const buildLayoutRegistryDeck = (maxSlides?: number, offset: number = 0, qaSafe: boolean = false) => ({
    id: 'vr-layout-registry',
    title: 'Visual Regression Layout Registry',
    theme: 'startup-pitch',
    colorScheme: {
        primary: '#2563EB',
        secondary: '#7C3AED',
        accent: '#2563EB',
        bg: '#FFFFFF',
        text: '#0F172A',
    },
    slides: buildLayoutRegistrySlides(maxSlides, offset, qaSafe),
});
