import type { ColorPalette, PresentationData, SlideData } from '../types';
import { SLIDE_HEIGHT, SLIDE_WIDTH } from '../types';
import { resolvePptxFontFace } from './fontMap';
import type { SceneBuildContext, SceneBuildResult, SceneNode, SlideScene } from './types';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const x = (px: number) => (px / CANVAS_WIDTH) * SLIDE_WIDTH;
const y = (px: number) => (px / CANVAS_HEIGHT) * SLIDE_HEIGHT;

const DEFAULT_BLOB_TRANSPARENCY = 85;
const getSurfaceColor = (colors: ColorPalette) => (colors as any).surface || '#F0F0F0';

const readText = (value: any, fallback = ''): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (value && typeof value === 'object') {
        if (typeof value.value === 'string') return value.value;
        if (typeof value.text === 'string') return value.text;
    }
    return fallback;
};

const readArray = (value: any): string[] => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => readText(item)).filter(Boolean);
};

const getImageUrl = (slide: SlideData): string | undefined => {
    const rawImages = (slide as any).images || slide.content?.images || [];
    const backgroundImage = (slide.backgroundImage && !slide.backgroundImage.includes('placehold'))
        ? slide.backgroundImage
        : undefined;
    const searchedImage = slide.imageSearchQuery
        ? `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`
        : undefined;

    return backgroundImage || rawImages[0] || slide.content?.image || slide.content?.imageUrl || searchedImage || undefined;
};

const getImageUrls = (slide: SlideData): string[] => {
    const rawImages = ((slide as any).images || slide.content?.images || []) as any[];
    const normalized = rawImages
        .map((item) => readText(item))
        .filter(Boolean);

    const single = getImageUrl(slide);
    if (single && !normalized.includes(single)) normalized.unshift(single);
    return normalized;
};

const getBodyText = (slide: SlideData) =>
    readText(slide.text || slide.content?.text || slide.content?.description || '');

const getBullets = (slide: SlideData) =>
    readArray(slide.bullets || slide.content?.bullets || []);

const getTextColumns = (slide: SlideData) => {
    const sourceColumns = (slide.content as any)?.columns || (slide.content as any)?.['text-columns'] || [];
    if (Array.isArray(sourceColumns) && sourceColumns.length > 0) {
        return sourceColumns.map((col: any, index: number) => {
            if (typeof col === 'string') {
                const parts = col.split(':');
                return {
                    title: parts.length > 1 ? parts[0].trim() : `Point ${index + 1}`,
                    text: parts.length > 1 ? parts.slice(1).join(':').trim() : col,
                };
            }
            return {
                title: readText(col.header || col.title, `Point ${index + 1}`),
                text: readText(col.body || col.text),
            };
        }).filter((col: any) => col.title || col.text);
    }

    const fallbackText = getBodyText(slide);
    if (!fallbackText) return [];
    return fallbackText.split('. ').slice(0, 3).map((chunk, index) => ({
        title: `Point ${index + 1}`,
        text: chunk.trim(),
    }));
};

const getComparisonData = (slide: SlideData) => {
    const comparison = (slide as any).comparison || slide.content?.comparison;
    const columns = (slide as any).columns || slide.content?.columns;

    let left = comparison?.left || columns?.[0];
    let right = comparison?.right || columns?.[1];

    if (typeof left === 'string') left = { title: left, items: [] };
    if (typeof right === 'string') right = { title: right, items: [] };

    if (!left && ((slide.content as any)?.leftTitle || (slide.content as any)?.leftPoints || (slide.content as any)?.leftBullets)) {
        left = {
            title: readText((slide.content as any)?.leftTitle, 'Left Side'),
            items: readArray((slide.content as any)?.leftBullets || (slide.content as any)?.leftItems || (slide.content as any)?.leftPoints || []),
        };
    }

    if (!right && ((slide.content as any)?.rightTitle || (slide.content as any)?.rightPoints || (slide.content as any)?.rightBullets)) {
        right = {
            title: readText((slide.content as any)?.rightTitle, 'Right Side'),
            items: readArray((slide.content as any)?.rightBullets || (slide.content as any)?.rightItems || (slide.content as any)?.rightPoints || []),
        };
    }

    return {
        left: {
            title: readText(left?.title, 'Left Side'),
            items: readArray(left?.items || left?.points || left?.bullets || []),
        },
        right: {
            title: readText(right?.title, 'Right Side'),
            items: readArray(right?.items || right?.points || right?.bullets || []),
        },
    };
};

const getTimelineItems = (slide: SlideData) => {
    const timelineItems = slide.timeline?.items || slide.content?.timeline?.items || (slide.content as any)?.steps || (slide.content as any)?.events || [];
    return (Array.isArray(timelineItems) ? timelineItems : []).map((item: any, index: number) => {
        if (typeof item === 'string') {
            return { date: '', title: item, description: '' };
        }
        return {
            date: readText(item.date),
            title: readText(item.event || item.title, `Step ${index + 1}`),
            description: readText(item.description),
        };
    }).filter((item) => item.title);
};

const getInfographicSteps = (slide: SlideData) => {
    const raw = (slide as any).infographic?.steps || slide.content?.infographic?.steps || (slide.content as any)?.steps || [];
    return (Array.isArray(raw) ? raw : []).map((step: any, index: number) => {
        if (typeof step === 'string') {
            return { label: step, description: '' };
        }
        return {
            label: readText(step.label || step.title, `Step ${index + 1}`),
            description: readText(step.description || step.value),
        };
    }).filter((step) => step.label);
};

const getTableData = (slide: SlideData) => {
    const table = slide.table || slide.content?.table || ((slide.content as any)?.headers && (slide.content as any)?.rows
        ? { columns: (slide.content as any).headers, rows: (slide.content as any).rows }
        : undefined);

    const columns = readArray((table as any)?.columns || []);
    const rows = Array.isArray((table as any)?.rows)
        ? (table as any).rows.map((row: any[]) => (Array.isArray(row) ? row.map((cell) => readText(cell)) : []))
        : [];

    return { columns, rows };
};

const getQuoteData = (slide: SlideData) => {
    const quote = (slide as any).quote || slide.content?.quote || {};
    return {
        text: readText(quote.text || slide.content?.text || slide.text),
        author: readText(quote.author || slide.content?.author),
        role: readText(quote.role || slide.content?.role),
    };
};

const getShowcaseItems = (slide: SlideData) => {
    const source = (slide.content?.items || (slide as any).items || []) as any[];
    return source.map((item: any, index: number) => ({
        title: readText(item?.title, `Feature ${index + 1}`),
        description: readText(item?.description || item?.text),
    })).filter((item) => item.title || item.description);
};

const getExecutiveData = (slide: SlideData) => {
    const stats = getStatsItems(slide);
    const bullets = readArray(
        slide.content?.bullets ||
        (slide.content as any)?.keyFindings ||
        (slide.content as any)?.findings ||
        (slide as any).bullets ||
        (slide as any).keyFindings ||
        (slide as any).findings ||
        []
    );
    const nextSteps = readArray(
        (slide.content as any)?.nextSteps ||
        (slide.content as any)?.next_steps ||
        (slide as any).nextSteps ||
        (slide as any).next_steps ||
        []
    );

    return {
        stats,
        bullets,
        nextSteps,
    };
};

const getSwotQuadrants = (slide: SlideData) => {
    const swot = (slide as any).swot || slide.content?.swot || {};
    const titleText = readText(slide.title).toLowerCase().replace(/\s/g, '');
    const slideType = getNormalizedType(slide);
    const isTows = titleText.includes('tows') || titleText.includes('twos') || slideType.includes('tows') || slideType.includes('twos');

    const strengths = readArray(swot.strengths || (slide.content as any)?.strengths || []);
    const weaknesses = readArray(swot.weaknesses || (slide.content as any)?.weaknesses || []);
    const opportunities = readArray(swot.opportunities || (slide.content as any)?.opportunities || []);
    const threats = readArray(swot.threats || (slide.content as any)?.threats || []);

    const so = readArray(swot.so || (slide.content as any)?.so || []);
    const st = readArray(swot.st || (slide.content as any)?.st || []);
    const wo = readArray(swot.wo || (slide.content as any)?.wo || []);
    const wt = readArray(swot.wt || (slide.content as any)?.wt || []);

    const labels = readArray((slide.content as any)?.labels || (slide.content as any)?.chart?.labels || []);
    const datasets = (slide.content as any)?.datasets || (slide.content as any)?.chart?.datasets || [];
    const firstDataset = Array.isArray(datasets) ? datasets[0] : undefined;
    const datasetValues = Array.isArray(firstDataset?.data) ? firstDataset.data : [];

    const extractFromLabels = (patterns: string[]) => {
        const found: string[] = [];
        labels.forEach((label, index) => {
            const normalized = label.toLowerCase();
            if (patterns.some((pattern) => normalized.includes(pattern))) {
                const rawValue = datasetValues[index];
                const value = readText(rawValue);
                found.push(value ? `${label}: ${value}` : label);
            }
        });
        return found;
    };

    const finalStrengths = strengths.length > 0 ? strengths : extractFromLabels(['strength']);
    const finalWeaknesses = weaknesses.length > 0 ? weaknesses : extractFromLabels(['weakness']);
    const finalOpportunities = opportunities.length > 0 ? opportunities : extractFromLabels(['opportunity']);
    const finalThreats = threats.length > 0 ? threats : extractFromLabels(['threat']);

    const finalSO = so.length > 0 ? so : extractFromLabels(['so strategies', 'so (', 'maxi-maxi']);
    const finalST = st.length > 0 ? st : extractFromLabels(['st strategies', 'st (', 'maxi-mini']);
    const finalWO = wo.length > 0 ? wo : extractFromLabels(['wo strategies', 'wo (', 'mini-maxi']);
    const finalWT = wt.length > 0 ? wt : extractFromLabels(['wt strategies', 'wt (', 'mini-mini']);

    if (isTows) {
        return [
            { key: 'so', title: 'SO Strategies', items: finalSO, color: '#27AE60' },
            { key: 'st', title: 'ST Strategies', items: finalST, color: '#E74C3C' },
            { key: 'wo', title: 'WO Strategies', items: finalWO, color: '#3498DB' },
            { key: 'wt', title: 'WT Strategies', items: finalWT, color: '#F39C12' },
        ].map((item) => ({
            ...item,
            items: item.items.length > 0 ? item.items.slice(0, 5) : [item.title],
        }));
    }

    return [
        { key: 'strengths', title: 'Strengths', items: finalStrengths, color: '#27AE60' },
        { key: 'weaknesses', title: 'Weaknesses', items: finalWeaknesses, color: '#E74C3C' },
        { key: 'opportunities', title: 'Opportunities', items: finalOpportunities, color: '#3498DB' },
        { key: 'threats', title: 'Threats', items: finalThreats, color: '#F39C12' },
    ].map((item) => ({
        ...item,
        items: item.items.length > 0 ? item.items.slice(0, 5) : [item.title],
    }));
};

const getHeadingFont = (presentation: PresentationData) =>
    resolvePptxFontFace(presentation.fontConfig?.heading, 'heading');

const getBodyFont = (presentation: PresentationData) =>
    resolvePptxFontFace(presentation.fontConfig?.body, 'body');

const getTitleScale = (presentation: PresentationData) =>
    Number(presentation.themeConfig?.titleFontScale ?? presentation.themeConfig?.fontScale ?? 1);

const getTextScale = (presentation: PresentationData) =>
    Number(presentation.themeConfig?.textFontScale ?? presentation.themeConfig?.fontScale ?? 1);

const getThemeId = (presentation: PresentationData) => String(presentation.theme || '').toLowerCase();

const getNormalizedType = (slide: SlideData) => String(slide.type || slide.layout || '').toLowerCase();

const isDarkTheme = (colors: ColorPalette) =>
    !!colors.bg && ['#0', '#1', '#2'].some((prefix) => colors.bg.toLowerCase().startsWith(prefix));

const getReadableOnBackground = (preferred: string, bg: string) => {
    const safe = bg.replace('#', '');
    if (safe.length !== 6) return preferred;
    const r = parseInt(safe.slice(0, 2), 16);
    const g = parseInt(safe.slice(2, 4), 16);
    const b = parseInt(safe.slice(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? preferred : '#FFFFFF';
};

const addAbstractBackground = (nodes: SceneNode[], colors: ColorPalette) => {
    nodes.push(
        {
            kind: 'shape',
            shape: 'ellipse',
            x: x(1640),
            y: y(70),
            w: x(84),
            h: y(84),
            fillColor: colors.secondary || colors.accent || colors.primary,
            fillTransparency: 82,
            lineTransparency: 100,
        },
        {
            kind: 'shape',
            shape: 'ellipse',
            x: x(108),
            y: y(896),
            w: x(56),
            h: y(56),
            fillColor: colors.primary,
            fillTransparency: 86,
            lineTransparency: 100,
        }
    );
};

const resolveContentVariation = (slide: SlideData, presentation: PresentationData): string => {
    const theme = getThemeId(presentation);
    const variations = ['classic', 'split-card', 'hero-block', 'magazine', 'minimal-offset'] as const;
    if (slide.variation && variations.includes(slide.variation as typeof variations[number])) {
        return slide.variation;
    }

    const salt = slide.id || slide.title || 'salt';
    const slideIndex = slide.index || 0;
    const hashString = (str: string) => {
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    };

    const baseHash = hashString(`${salt}${slideIndex}variation`);
    const themeHash = hashString(`${salt}${slideIndex}theme`);
    const pseudoRandom = (themeHash % 100) / 100;
    let picked = variations[baseHash % variations.length];

    if (pseudoRandom > 0.3) {
        if (theme.includes('tech')) picked = variations[(baseHash % variations.length + 1) % variations.length];
        else if (theme.includes('minimal') || theme.includes('corporate')) picked = variations[baseHash % 2 === 0 ? 0 : 4];
        else if (theme.includes('creative') || theme.includes('marketing')) picked = variations[baseHash % 2 === 0 ? 1 : 3];
        else if (theme.includes('startup') || theme.includes('product')) picked = variations[baseHash % 2 === 0 ? 1 : 2];
        else if (theme.includes('consulting')) picked = variations[baseHash % 2 === 0 ? 0 : 2];
    }

    return picked;
};

const resolveCoverVariation = (slide: SlideData, presentation: PresentationData, colors: ColorPalette): string => {
    const theme = getThemeId(presentation);
    let variations = [
        'centered-minimal', 'full-split', 'diagonal-hero', 'typographic-giant',
        'boxed-modern', 'gradient-mesh', 'dark-tech', 'offset-gallery',
        'floating-glass', 'cinematic'
    ];

    if (!isDarkTheme(colors)) {
        variations = variations.filter((variation) => variation !== 'dark-tech' && variation !== 'cinematic');
    }

    if (slide.variation && variations.includes(slide.variation)) {
        return slide.variation;
    }

    const salt = `${slide.id || slide.title || 'cover'}${slide.subtitle || ''}`;
    const slideIndex = slide.index || 0;
    const hashString = (str: string) => {
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    };

    const baseHash = hashString(`${salt}${slideIndex}cover`);
    const themeHash = hashString(`${salt}${slideIndex}theme`);
    const pseudoRandom = (themeHash % 100) / 100;
    let picked = variations[baseHash % variations.length];

    if (pseudoRandom > 0.3) {
        const offset = themeHash % 3;
        if (theme.includes('tech')) picked = variations[(baseHash % variations.length + offset) % variations.length];
        else if (theme.includes('creative')) picked = variations[(baseHash % variations.length + offset + 2) % variations.length];
        else if (theme.includes('minimal')) picked = variations[(baseHash % variations.length + offset + 4) % variations.length];
        else if (theme.includes('corporate') || theme.includes('consulting')) picked = variations[themeHash % 2 === 0 ? 0 : 1];
        else if (theme.includes('marketing') || theme.includes('product')) picked = variations[themeHash % 2 === 0 ? 5 : Math.min(variations.length - 1, 5)];
        else if (theme.includes('startup')) picked = variations[themeHash % 2 === 0 ? Math.min(2, variations.length - 1) : Math.min(4, variations.length - 1)];
    }

    return picked;
};

const resolveImageVariation = (slide: SlideData): string => {
    const normalizedType = getNormalizedType(slide);
    if (slide.variation && ['default', 'text-mask', 'split-curtain', 'polaroid-pile', 'image-showcase', 'chart-showcase', 'chart-analysis'].includes(slide.variation)) {
        return slide.variation;
    }

    const text = `${slide.title || ''}${slide.content?.text || ''}`.toLowerCase();
    if (text.includes('mask') || text.includes('title')) return 'text-mask';
    if (text.includes('curtain') || text.includes('reveal')) return 'split-curtain';
    if (text.includes('pile') || text.includes('gallery') || normalizedType.includes('gallery') || normalizedType.includes('collage')) return 'polaroid-pile';
    if (text.includes('showcase') || text.includes('exhibit')) return 'image-showcase';

    const rawImages = (slide as any).images || slide.content?.images || [];
    if (rawImages.length > 1) return 'polaroid-pile';

    const seed = `${slide.id || ''}${slide.title || ''}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
    const variations = ['default', 'text-mask', 'split-curtain', 'polaroid-pile', 'image-showcase', 'chart-showcase', 'chart-analysis'] as const;
    return variations[Math.abs(hash) % variations.length];
};

const resolveBentoVariation = (slide: SlideData, presentation: PresentationData): string => {
    const theme = getThemeId(presentation);
    const variations = ['default', 'magazine-grid', 'feature-focus', 'asymmetric-masonry'] as const;
    if (slide.variation && variations.includes(slide.variation as typeof variations[number])) {
        return slide.variation;
    }

    const salt = slide.id || slide.title || 'bento';
    const slideIndex = slide.index || 0;
    const hashString = (str: string) => {
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    };

    const baseHash = hashString(salt + slideIndex + 'bento');
    const text = `${slide.title || ''}${slide.content?.description || ''}`.toLowerCase();

    if (text.includes('story') || text.includes('team') || text.includes('gallery') || text.includes('vision') || text.includes('contact')) return 'magazine-grid';
    if (text.includes('product') || text.includes('feature') || text.includes('core') || text.includes('spotlight')) return 'feature-focus';
    if (text.includes('idea') || text.includes('brainstorm') || text.includes('creative') || text.includes('inspiration') || text.includes('mood') || text.includes('audience') || text.includes('segment')) return 'asymmetric-masonry';
    if (theme.includes('creative') || theme.includes('marketing')) return baseHash % 2 === 0 ? 'asymmetric-masonry' : 'magazine-grid';

    return variations[baseHash % variations.length];
};

const resolveSectionVariation = (slide: SlideData, presentation: PresentationData): string => {
    const theme = getThemeId(presentation);
    const variations = ['default', 'big-number-outline', 'minimal-bar', 'abstract-mesh'] as const;
    if (slide.variation && variations.includes(slide.variation as typeof variations[number])) {
        return slide.variation;
    }
    if ((slide.index || 0) <= 3 && readText(slide.title).length < 20) return 'big-number-outline';
    if (theme.includes('minimal')) return 'minimal-bar';
    if (theme.includes('gradient') || theme.includes('modern')) return 'abstract-mesh';
    return variations[(slide.index || 0) % variations.length];
};

const resolveQuoteVariation = (slide: SlideData): string => {
    const variations = ['centered-hero', 'side-accent', 'minimal-elegant'] as const;
    if (slide.variation && variations.includes(slide.variation as typeof variations[number])) {
        return slide.variation;
    }
    const title = readText(slide.title);
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash = ((hash << 5) - hash) + title.charCodeAt(i);
    return variations[Math.abs(hash) % variations.length];
};

const resolveShowcaseVariation = (slide: SlideData, presentation: PresentationData): string => {
    const variations = ['default', 'lifestyle-split', 'app-mockup', 'exploded-view'] as const;
    if (slide.variation === 'split') return 'lifestyle-split';
    if (slide.variation === 'floating') return 'app-mockup';
    if (slide.variation === 'minimal') return 'exploded-view';
    if (slide.variation && variations.includes(slide.variation as typeof variations[number])) {
        return slide.variation;
    }
    const theme = getThemeId(presentation);
    if (theme.includes('tech') || theme.includes('product')) return 'app-mockup';
    if (theme.includes('lifestyle') || theme.includes('creative')) return 'lifestyle-split';
    return 'exploded-view';
};

const resolveSwotVariation = (slide: SlideData): string => {
    const variations = ['classic-grid', 'rounded-cards', 'minimal-list'] as const;
    if (slide.variation && variations.includes(slide.variation as typeof variations[number])) {
        return slide.variation;
    }
    return variations[(slide.index || 0) % variations.length];
};

const resolveExecutiveVariation = (slide: SlideData): string => {
    const variations = ['dashboard', 'split-columns', 'compact'] as const;
    if (slide.variation && variations.includes(slide.variation as typeof variations[number])) {
        return slide.variation;
    }
    return variations[(slide.index || 0) % variations.length];
};

const getBentoItems = (slide: SlideData) => {
    const source = (slide.content?.items || (slide as any).items || []) as any[];
    const images = getImageUrls(slide);
    return source.map((item: any, index: number) => ({
        title: readText(item?.title, `Item ${index + 1}`),
        description: readText(item?.description || item?.text),
        image: readText(item?.image) || images[index] || images[0] || slide.backgroundImage || `https://source.unsplash.com/900x700/?${encodeURIComponent(readText(item?.title || slide.title || `segment ${index + 1}`))}`,
    })).filter((item) => item.title || item.description);
};

const getStatsItems = (slide: SlideData): Array<{ value: string; label: string; description?: string }> => {
    const rawStats =
        slide.stats ||
        slide.content?.stats ||
        slide.content?.statistics ||
        slide.metrics ||
        slide.content?.metrics ||
        slide.content?.highlights ||
        [];

    if (!Array.isArray(rawStats)) return [];

    return rawStats
        .map((item: any, index) => {
            if (typeof item === 'string' || typeof item === 'number') {
                return {
                    value: readText(item),
                    label: `Metric ${index + 1}`,
                };
            }

            return {
                value: readText(item?.value ?? item?.metric ?? item?.number ?? item?.stat),
                label: readText(item?.label ?? item?.title ?? item?.name, `Metric ${index + 1}`),
                description: readText(item?.description ?? item?.text),
            };
        })
        .filter((item) => item.value || item.label);
};

const getStatPath = (slide: SlideData) => {
    if (slide.stats) return 'stats';
    if (slide.metrics) return 'metrics';
    if (slide.content?.metrics) return 'content.metrics';
    if (slide.content?.statistics) return 'content.statistics';
    if (slide.content?.highlights) return 'content.highlights';
    return 'content.stats';
};

const parseStatPercent = (value: string) => {
    const valStr = String(value || '');
    const isPercent = valStr.includes('%');
    const numVal = parseFloat(valStr.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(numVal)) return 75;
    if (isPercent && numVal <= 100) return numVal;
    return numVal < 100 ? numVal : 75;
};

const getChartPalette = (colors: ColorPalette) => [
    colors.primary,
    colors.secondary,
    colors.accent,
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
];

const normalizeChart = (slide: SlideData) => {
    let chart: any = slide.chart || slide.content?.chart;
    const aiLabels = slide.content?.labels;
    const aiDatasets = slide.content?.datasets;

    if (!chart && aiLabels && aiDatasets) {
        chart = {
            title: slide.content?.title || slide.title,
            type: slide.content?.chartType || 'bar',
            categories: aiLabels,
            series: aiDatasets.map((ds: any) => ({
                name: ds.label || 'Data',
                data: ds.data,
            })),
        };
    }

    if (!chart) return undefined;

    if (!chart.categories && chart.labels) chart.categories = chart.labels;
    if (!chart.series && chart.datasets) {
        chart.series = chart.datasets.map((ds: any) => ({
            name: ds.label || 'Data',
            data: ds.data,
        }));
    }

    let series: Array<{ name: string; labels: string[]; values: number[] }> = [];
    if (chart.datasets && chart.labels) {
        series = chart.datasets.map((dataset: any, index: number) => ({
            name: readText(dataset.label, `Series ${index + 1}`),
            labels: (chart.labels || []).map((label: any) => readText(label)),
            values: (dataset.data || []).map((value: any) => Number(value) || 0),
        }));
    } else if (chart.series && chart.categories) {
        series = chart.series.map((entry: any, index: number) => ({
            name: readText(entry.name, `Series ${index + 1}`),
            labels: (chart.categories || []).map((label: any) => readText(label)),
            values: (entry.data || []).map((value: any) => Number(value) || 0),
        }));
    } else if (chart.data && chart.categories) {
        series = [{
            name: readText(chart.title, 'Data'),
            labels: (chart.categories || []).map((label: any) => readText(label)),
            values: (chart.data || []).map((value: any) => Number(typeof value === 'number' ? value : value?.value ?? value) || 0),
        }];
    } else if (Array.isArray(chart.data)) {
        series = [{
            name: readText(chart.title, 'Data'),
            labels: chart.data.map((entry: any) => readText(entry?.name ?? entry?.label)),
            values: chart.data.map((entry: any) => Number(entry?.value ?? entry?.count ?? entry) || 0),
        }];
    }

    const chartTypeRaw = String(chart?.type || chart?.chartType || 'bar').toLowerCase();
    let chartType = 'bar';
    if (['line', 'pie', 'doughnut', 'donut', 'area', 'radar'].includes(chartTypeRaw)) {
        chartType = chartTypeRaw === 'donut' ? 'doughnut' : chartTypeRaw;
    }

    const isStacked = chartTypeRaw.includes('stacked');
    const isHorizontal = chartTypeRaw.includes('horizontal') || chartTypeRaw === 'bar-h';

    return {
        raw: chart,
        chartType,
        series,
        isStacked,
        isHorizontal,
    };
};

const resolveStatsVariation = (slide: SlideData, presentation: PresentationData): string => {
    if (slide.variation && ['classic-grid', 'metric-cards', 'big-hero-stat', 'data-progress', 'trend-focus'].includes(slide.variation)) {
        return slide.variation;
    }

    const theme = getThemeId(presentation);
    const salt = slide.id || slide.title || 'stats';
    const slideIndex = slide.index || 0;
    const hashString = (str: string) => {
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    };

    const baseHash = hashString(salt + slideIndex + 'stats');
    const themeHash = hashString(salt + slideIndex + 'theme');
    const variations = ['classic-grid', 'metric-cards', 'big-hero-stat', 'data-progress', 'trend-focus'] as const;
    const pseudoRandom = (themeHash % 100) / 100;
    let picked = variations[baseHash % variations.length];

    if (pseudoRandom > 0.3) {
        if (theme.includes('consulting') || theme.includes('corporate') || theme.includes('finance')) picked = variations[baseHash % 2 === 0 ? 2 : 4];
        else if (theme.includes('tech') || theme.includes('modern') || theme.includes('startup')) picked = variations[baseHash % 2 === 0 ? 1 : 3];
        else if (theme.includes('creative') || theme.includes('marketing')) picked = variations[baseHash % 2 === 0 ? 1 : 3];
    }

    return picked;
};

const resolveChartVariation = (slide: SlideData, presentation: PresentationData): string => {
    if (slide.variation && ['default-container', 'split-detail', 'floating-card', 'full-bleed-hero', 'minimal-stat', 'chart-showcase', 'chart-analysis'].includes(slide.variation)) {
        return slide.variation;
    }

    const theme = getThemeId(presentation);
    const isTech = theme.includes('tech') || theme.includes('modern') || theme.includes('startup');
    const isDark = theme.includes('dark') || theme.includes('black') || theme.includes('night');
    const text = `${slide.title || ''}${slide.content?.description || ''}`.toLowerCase();

    if (text.includes('analysis') || text.includes('breakdown') || text.includes('insight')) return 'split-detail';
    if (text.includes('growth') || text.includes('trend') || text.includes('impact')) return 'full-bleed-hero';
    if (text.includes('key') || text.includes('stat') || text.includes('highlight')) return 'minimal-stat';

    const str = `${slide.id || ''}${slide.title || ''}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    const index = Math.abs(hash) % 7;

    if (isTech && index % 2 === 0) return 'floating-card';
    if (isDark && index % 2 === 0) return 'full-bleed-hero';

    const variations = ['default-container', 'split-detail', 'floating-card', 'full-bleed-hero', 'minimal-stat', 'chart-showcase', 'chart-analysis'] as const;
    return variations[index];
};

const buildCoverCenteredMinimal = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Presentation');
    const subtitle = readText(slide.subtitle || slide.content?.subtitle);
    const bullets = getBullets(slide).slice(0, 3);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: SLIDE_HEIGHT,
            sizing: 'cover',
        });
        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: SLIDE_HEIGHT,
            fillColor: colors.bg,
            fillTransparency: 20,
            lineTransparency: 100,
        });
    }

    addAbstractBackground(nodes, colors);

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: x(912),
        y: y(286),
        w: x(96),
        h: y(4),
        fillColor: colors.primary,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'text',
        text: title,
        x: x(240),
        y: y(350),
        w: x(1440),
        h: y(180),
        fontFace: titleFont,
        fontSize: Math.round(44 * titleScale),
        bold: true,
        color: getReadableOnBackground(colors.text, colors.bg),
        align: 'center',
        valign: 'middle',
        fit: 'shrink',
    });

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(320),
            y: y(560),
            w: x(1280),
            h: y(90),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            color: getReadableOnBackground(colors.text, colors.bg),
            align: 'center',
            valign: 'middle',
            fit: 'shrink',
            transparency: 10,
        });
    }

    bullets.forEach((bullet, index) => {
        const pillWidth = Math.min(x(420), Math.max(x(250), x(130 + bullet.length * 12)));
        const gap = x(32);
        const totalWidth = bullets.length * pillWidth + Math.max(0, bullets.length - 1) * gap;
        const startX = (SLIDE_WIDTH - totalWidth) / 2;
        const pillX = startX + index * (pillWidth + gap);
        const pillY = y(720);

        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: pillX,
            y: pillY,
            w: pillWidth,
            h: y(68),
            fillColor: '#FFFFFF',
            fillTransparency: 75,
            lineColor: '#FFFFFF',
            lineTransparency: 80,
            lineWidth: 0.5,
        });
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: pillX + x(24),
            y: pillY + y(27),
            w: x(10),
            h: y(10),
            fillColor: colors.accent || colors.primary,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: bullet,
            x: pillX + x(48),
            y: pillY + y(12),
            w: pillWidth - x(68),
            h: y(42),
            fontFace: bodyFont,
            fontSize: Math.round(15 * textScale),
            bold: true,
            color: getReadableOnBackground(colors.text, colors.bg),
            valign: 'middle',
            fit: 'shrink',
        });
    });

    return {
        family: 'cover',
        variation: 'centered-minimal',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildCoverFullSplit = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Presentation');
    const subtitle = readText(slide.subtitle || slide.content?.subtitle);
    const bullets = getBullets(slide).slice(0, 3);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: 0,
            y: 0,
            w: SLIDE_WIDTH / 2,
            h: SLIDE_HEIGHT,
            sizing: 'cover',
        });
    } else {
        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: 0,
            y: 0,
            w: SLIDE_WIDTH / 2,
            h: SLIDE_HEIGHT,
            fillColor: colors.primary,
            lineTransparency: 100,
        });
    }

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH / 2,
        h: SLIDE_HEIGHT,
        fillColor: '#000000',
        fillTransparency: 80,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'text',
        text: title,
        x: x(1060),
        y: y(250),
        w: x(700),
        h: y(260),
        fontFace: titleFont,
        fontSize: Math.round(72 * titleScale),
        bold: true,
        color: colors.text,
        fit: 'shrink',
    });

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(1060),
            y: y(520),
            w: x(700),
            h: y(90),
            fontFace: bodyFont,
            fontSize: Math.round(27 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 30,
        });
    }

    nodes.push({
        kind: 'shape',
        shape: 'line',
        x: x(1060),
        y: y(610),
        w: x(700),
        h: 0,
        lineColor: colors.text,
        lineTransparency: 80,
        lineWidth: 0.5,
    });

    bullets.forEach((bullet, index) => {
        const bulletY = y(670 + index * 68);
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: x(1060),
            y: bulletY + y(12),
            w: x(10),
            h: y(10),
            fillColor: colors.primary,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: bullet,
            x: x(1090),
            y: bulletY,
            w: x(670),
            h: y(46),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            color: colors.text,
            fit: 'shrink',
        });
    });

    nodes.push(
        {
            kind: 'shape',
            shape: 'ellipse',
            x: x(1060),
            y: y(760),
            w: x(48),
            h: y(48),
            fillTransparency: 100,
            lineColor: colors.primary,
            lineWidth: 1.2,
            lineTransparency: 0,
        },
        {
            kind: 'shape',
            shape: 'ellipse',
            x: x(1128),
            y: y(760),
            w: x(48),
            h: y(48),
            fillTransparency: 100,
            lineColor: colors.secondary || colors.accent,
            lineWidth: 1.2,
            lineTransparency: 0,
        }
    );

    return {
        family: 'cover',
        variation: 'full-split',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildCoverBoxedModern = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Presentation');
    const subtitle = readText(slide.subtitle || slide.content?.subtitle);
    const bullets = getBullets(slide).slice(0, 3);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: SLIDE_HEIGHT,
            sizing: 'cover',
            transparency: 50,
        });
    }

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.secondary || colors.bg,
        fillTransparency: imageUrl ? 20 : 0,
        lineTransparency: 100,
    });

    // Soft shadow behind the central card.
    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: x(504),
        y: y(248),
        w: x(930),
        h: y(560),
        fillColor: '#000000',
        fillTransparency: 88,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: x(470),
        y: y(220),
        w: x(930),
        h: y(560),
        fillColor: colors.bg,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: x(610),
        y: y(300),
        w: x(650),
        h: y(160),
        fillTransparency: 100,
        lineColor: colors.primary,
        lineWidth: 2,
        lineTransparency: 0,
    });

    nodes.push({
        kind: 'text',
        text: title,
        x: x(650),
        y: y(335),
        w: x(570),
        h: y(92),
        fontFace: titleFont,
        fontSize: Math.round(44 * titleScale),
        bold: true,
        uppercase: true,
        color: getReadableOnBackground(colors.text, colors.bg),
        align: 'center',
        valign: 'middle',
        fit: 'shrink',
    });

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(580),
            y: y(500),
            w: x(710),
            h: y(52),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            bold: true,
            uppercase: true,
            color: colors.accent || colors.primary,
            align: 'center',
            valign: 'middle',
            fit: 'shrink',
        });
    }

    if (bullets.length > 0) {
        nodes.push({
            kind: 'shape',
            shape: 'line',
            x: x(590),
            y: y(610),
            w: x(690),
            h: 0,
            lineColor: colors.text,
            lineTransparency: 92,
            lineWidth: 0.6,
        });

        const columnWidth = x(190);
        const gap = x(38);
        const totalWidth = bullets.length * columnWidth + Math.max(0, bullets.length - 1) * gap;
        const startX = (SLIDE_WIDTH - totalWidth) / 2;

        bullets.forEach((bullet, index) => {
            const columnX = startX + index * (columnWidth + gap);
            nodes.push({
                kind: 'text',
                text: `0${index + 1}`,
                x: columnX,
                y: y(640),
                w: columnWidth,
                h: y(30),
                fontFace: bodyFont,
                fontSize: Math.round(13 * textScale),
                bold: true,
                color: colors.text,
                transparency: 40,
                align: 'center',
                valign: 'middle',
            });
            nodes.push({
                kind: 'text',
                text: bullet,
                x: columnX,
                y: y(680),
                w: columnWidth,
                h: y(70),
                fontFace: bodyFont,
                fontSize: Math.round(17 * textScale),
                color: getReadableOnBackground(colors.text, colors.bg),
                align: 'center',
                valign: 'top',
                fit: 'shrink',
            });
        });
    }

    return {
        family: 'cover',
        variation: 'boxed-modern',
        backgroundColor: colors.secondary || colors.bg,
        nodes,
    };
};

const buildCoverDiagonalHero = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Presentation');
    const subtitle = readText(slide.subtitle || slide.content?.subtitle);
    const bullets = getBullets(slide).slice(0, 3);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.primary,
        lineTransparency: 100,
    });

    // Large rotated panel to mimic the diagonal white slice from the front renderer.
    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: x(-180),
        y: y(-70),
        w: x(2350),
        h: y(640),
        rotation: -10,
        fillColor: colors.bg,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'text',
        text: title,
        x: x(120),
        y: y(120),
        w: x(900),
        h: y(120),
        fontFace: titleFont,
        fontSize: Math.round(44 * titleScale),
        bold: true,
        color: getReadableOnBackground(colors.text, colors.bg),
        fit: 'shrink',
    });

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(120),
            y: y(255),
            w: x(900),
            h: y(60),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            bold: true,
            color: colors.secondary || colors.primary,
            fit: 'shrink',
        });
    }

    bullets.forEach((bullet, index) => {
        const bulletY = y(390 + index * 72);
        nodes.push({
            kind: 'shape',
            shape: 'line',
            x: x(120),
            y: bulletY + y(18),
            w: x(48),
            h: 0,
            lineColor: colors.accent || colors.primary,
            lineWidth: 1.5,
            lineTransparency: 0,
        });
        nodes.push({
            kind: 'text',
            text: bullet,
            x: x(190),
            y: bulletY,
            w: x(760),
            h: y(44),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            bold: true,
            color: getReadableOnBackground(colors.text, colors.bg),
            fit: 'shrink',
            transparency: 20,
        });
    });

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: x(1200),
            y: y(360),
            w: x(760),
            h: y(720),
            sizing: 'cover',
        });
    }

    return {
        family: 'cover',
        variation: 'diagonal-hero',
        backgroundColor: colors.primary,
        nodes,
    };
};

const buildCoverGradientMesh = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Presentation');
    const subtitle = readText(slide.subtitle || slide.content?.subtitle);
    const bullets = getBullets(slide).slice(0, 3);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const foreground = getReadableOnBackground(colors.text, colors.bg);
    const nodes: SceneNode[] = [];

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.bg,
        lineTransparency: 100,
    });

    nodes.push(
        {
            kind: 'shape',
            shape: 'ellipse',
            x: x(1220),
            y: y(-180),
            w: x(980),
            h: y(980),
            fillColor: colors.primary,
            fillTransparency: 72,
            lineTransparency: 100,
        },
        {
            kind: 'shape',
            shape: 'ellipse',
            x: x(-220),
            y: y(520),
            w: x(840),
            h: y(840),
            fillColor: colors.secondary || colors.primary,
            fillTransparency: 78,
            lineTransparency: 100,
        },
        {
            kind: 'shape',
            shape: 'ellipse',
            x: x(650),
            y: y(250),
            w: x(620),
            h: y(620),
            fillColor: colors.accent || colors.primary,
            fillTransparency: 82,
            lineTransparency: 100,
        }
    );

    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(170),
        y: y(485),
        w: x(1280),
        h: y(430),
        fillColor: '#FFFFFF',
        fillTransparency: 82,
        lineColor: '#FFFFFF',
        lineTransparency: 72,
        lineWidth: 0.8,
    });

    nodes.push({
        kind: 'text',
        text: title,
        x: x(240),
        y: y(560),
        w: x(1120),
        h: y(110),
        fontFace: titleFont,
        fontSize: Math.round(42 * titleScale),
        bold: true,
        color: foreground,
        fit: 'shrink',
    });

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(240),
            y: y(680),
            w: x(1040),
            h: y(70),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            color: foreground,
            fit: 'shrink',
            transparency: 10,
        });
    }

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: x(240),
        y: y(790),
        w: x(150),
        h: y(8),
        fillColor: colors.accent || colors.primary,
        lineTransparency: 100,
    });

    bullets.forEach((bullet, index) => {
        const bulletY = y(840 + index * 56);
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: x(240),
            y: bulletY + y(9),
            w: x(14),
            h: y(14),
            fillColor: colors.primary,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: bullet,
            x: x(275),
            y: bulletY,
            w: x(1040),
            h: y(34),
            fontFace: bodyFont,
            fontSize: Math.round(20 * textScale),
            color: foreground,
            fit: 'shrink',
        });
    });

    return {
        family: 'cover',
        variation: 'gradient-mesh',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildCoverOffsetGallery = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Presentation');
    const subtitle = readText(slide.subtitle || slide.content?.subtitle);
    const bullets = getBullets(slide).slice(0, 3);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.bg,
        lineTransparency: 100,
    });

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: x(40),
            y: y(40),
            w: x(1220),
            h: y(1000),
            sizing: 'cover',
            rounding: true,
        });
    } else {
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(40),
            y: y(40),
            w: x(1220),
            h: y(1000),
            fillColor: '#E5E7EB',
            lineTransparency: 100,
        });
    }

    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(1330),
        y: y(40),
        w: x(550),
        h: y(480),
        fillColor: colors.secondary || colors.primary,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(1330),
        y: y(565),
        w: x(550),
        h: y(470),
        fillColor: colors.primary,
        fillTransparency: 80,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(110),
        y: y(700),
        w: x(760),
        h: y(250),
        fillColor: '#FFFFFF',
        fillTransparency: 10,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'text',
        text: title,
        x: x(170),
        y: y(760),
        w: x(610),
        h: y(95),
        fontFace: titleFont,
        fontSize: Math.round(38 * titleScale),
        bold: true,
        color: getReadableOnBackground(colors.primary, '#FFFFFF'),
        fit: 'shrink',
    });

    bullets.slice(0, 2).forEach((bullet, index) => {
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(170 + index * 220),
            y: y(875),
            w: x(190),
            h: y(42),
            fillColor: '#F3F4F6',
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: bullet,
            x: x(180 + index * 220),
            y: y(884),
            w: x(170),
            h: y(26),
            fontFace: bodyFont,
            fontSize: Math.round(13 * textScale),
            bold: true,
            color: '#4B5563',
            align: 'center',
            valign: 'middle',
            fit: 'shrink',
            transparency: 15,
        });
    });

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(1385),
            y: y(365),
            w: x(420),
            h: y(105),
            fontFace: bodyFont,
            fontSize: Math.round(28 * textScale),
            color: '#FFFFFF',
            fit: 'shrink',
            valign: 'bottom',
        });
    }

    if (bullets.length > 2) {
        nodes.push({
            kind: 'text',
            text: bullets[2],
            x: x(1385),
            y: y(940),
            w: x(420),
            h: y(36),
            fontFace: bodyFont,
            fontSize: Math.round(13 * textScale),
            italic: true,
            color: '#FFFFFF',
            fit: 'shrink',
            transparency: 40,
        });
    }

    return {
        family: 'cover',
        variation: 'offset-gallery',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildCoverFloatingGlass = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Presentation');
    const subtitle = readText(slide.subtitle || slide.content?.subtitle);
    const bullets = getBullets(slide).slice(0, 3);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.primary,
        lineTransparency: 100,
    });

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: SLIDE_HEIGHT,
            sizing: 'cover',
            transparency: 40,
        });
    }

    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(96),
        y: y(108),
        w: x(1728),
        h: y(864),
        fillColor: '#FFFFFF',
        fillTransparency: 88,
        lineColor: '#FFFFFF',
        lineTransparency: 65,
        lineWidth: 0.8,
    });

    nodes.push({
        kind: 'text',
        text: 'PRESENTATION',
        x: x(640),
        y: y(220),
        w: x(640),
        h: y(40),
        fontFace: bodyFont,
        fontSize: Math.round(13 * textScale),
        bold: true,
        uppercase: true,
        color: '#FFFFFF',
        align: 'center',
        valign: 'middle',
    });

    nodes.push({
        kind: 'text',
        text: title,
        x: x(300),
        y: y(355),
        w: x(1320),
        h: y(130),
        fontFace: titleFont,
        fontSize: Math.round(42 * titleScale),
        color: '#FFFFFF',
        bold: true,
        align: 'center',
        valign: 'middle',
        fit: 'shrink',
    });

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(420),
            y: y(515),
            w: x(1080),
            h: y(80),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            italic: true,
            color: '#FFFFFF',
            align: 'center',
            valign: 'middle',
            fit: 'shrink',
            transparency: 20,
        });
    }

    if (bullets.length > 0) {
        const itemWidth = x(250);
        const gap = x(80);
        const totalWidth = bullets.length * itemWidth + Math.max(0, bullets.length - 1) * gap;
        const startX = (SLIDE_WIDTH - totalWidth) / 2;

        bullets.forEach((bullet, index) => {
            const itemX = startX + index * (itemWidth + gap);
            nodes.push({
                kind: 'shape',
                shape: 'ellipse',
                x: itemX + x(118),
                y: y(665),
                w: x(14),
                h: y(14),
                fillColor: '#FFFFFF',
                lineTransparency: 100,
            });
            nodes.push({
                kind: 'text',
                text: bullet,
                x: itemX,
                y: y(700),
                w: itemWidth,
                h: y(52),
                fontFace: bodyFont,
                fontSize: Math.round(13 * textScale),
                uppercase: true,
                color: '#FFFFFF',
                align: 'center',
                valign: 'middle',
                fit: 'shrink',
                transparency: 30,
            });
        });
    }

    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(820),
        y: y(820),
        w: x(280),
        h: y(62),
        fillColor: '#FFFFFF',
        lineTransparency: 100,
    });
    nodes.push({
        kind: 'text',
        text: 'START',
        x: x(820),
        y: y(834),
        w: x(280),
        h: y(30),
        fontFace: bodyFont,
        fontSize: Math.round(15 * textScale),
        bold: true,
        color: '#000000',
        align: 'center',
        valign: 'middle',
    });

    return {
        family: 'cover',
        variation: 'floating-glass',
        backgroundColor: colors.primary,
        nodes,
    };
};

const buildContentClassic = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Slide');
    const body = getBodyText(slide);
    const bullets = getBullets(slide);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    addAbstractBackground(nodes, colors);

    nodes.push({
        kind: 'text',
        text: title,
        x: x(180),
        y: y(220),
        w: x(760),
        h: y(140),
        fontFace: titleFont,
        fontSize: Math.round(54 * titleScale),
        bold: true,
        color: colors.text,
        fit: 'shrink',
    });

    if (body) {
        nodes.push({
            kind: 'text',
            text: body,
            x: x(180),
            y: y(380),
            w: x(760),
            h: y(120),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 10,
        });
    }

    bullets.forEach((bullet, index) => {
        const bulletY = y(540 + index * 78);
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: x(180),
            y: bulletY + y(12),
            w: x(12),
            h: y(12),
            fillColor: colors.primary,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: bullet,
            x: x(215),
            y: bulletY,
            w: x(700),
            h: y(46),
            fontFace: bodyFont,
            fontSize: Math.round(18 * textScale),
            color: colors.text,
            fit: 'shrink',
        });
    });

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: x(1080),
            y: y(140),
            w: x(650),
            h: y(780),
            sizing: 'cover',
            rotation: 2,
            shadow: {
                type: 'outer',
                color: '000000',
                opacity: 0.18,
                blur: 8,
                offset: 3,
                angle: 45,
            },
        });
    } else {
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(1080),
            y: y(140),
            w: x(650),
            h: y(780),
            fillColor: colors.primary,
            fillTransparency: 90,
            lineTransparency: 100,
        });
    }

    return {
        family: 'content',
        variation: 'classic',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildContentSplitCard = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Slide');
    const bullets = getBullets(slide);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.primary,
        fillTransparency: 92,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(260),
        y: y(135),
        w: x(1400),
        h: y(810),
        fillColor: '#FFFFFF',
        fillTransparency: 15,
        lineColor: '#FFFFFF',
        lineTransparency: 80,
        lineWidth: 0.5,
    });

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: x(260),
            y: y(135),
            w: x(560),
            h: y(810),
            sizing: 'cover',
        });
        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: x(260),
            y: y(135),
            w: x(560),
            h: y(810),
            fillColor: colors.primary,
            fillTransparency: 60,
            lineTransparency: 100,
        });
    }

    nodes.push({
        kind: 'text',
        text: 'KEY INSIGHTS',
        x: x(900),
        y: y(240),
        w: x(620),
        h: y(40),
        fontFace: bodyFont,
        fontSize: Math.round(11 * textScale),
        bold: true,
        color: '#000000',
        transparency: 50,
    });

    nodes.push({
        kind: 'text',
        text: title,
        x: x(900),
        y: y(300),
        w: x(620),
        h: y(120),
        fontFace: titleFont,
        fontSize: Math.round(30 * titleScale),
        bold: true,
        color: '#000000',
        fit: 'shrink',
    });

    bullets.slice(0, 5).forEach((bullet, index) => {
        const boxY = y(455 + index * 98);
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(900),
            y: boxY,
            w: x(620),
            h: y(70),
            fillColor: '#000000',
            fillTransparency: 96,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: x(920),
            y: boxY + y(18),
            w: x(32),
            h: y(32),
            fillColor: colors.secondary || colors.primary,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: String(index + 1),
            x: x(920),
            y: boxY + y(4),
            w: x(32),
            h: y(32),
            fontFace: bodyFont,
            fontSize: Math.round(10 * textScale),
            bold: true,
            color: '#FFFFFF',
            align: 'center',
            valign: 'middle',
        });
        nodes.push({
            kind: 'text',
            text: bullet,
            x: x(970),
            y: boxY + y(10),
            w: x(520),
            h: y(50),
            fontFace: bodyFont,
            fontSize: Math.round(16 * textScale),
            bold: true,
            color: '#000000',
            fit: 'shrink',
            transparency: 20,
        });
    });

    return {
        family: 'content',
        variation: 'split-card',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildContentHeroBlock = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Slide');
    const bullets = getBullets(slide).slice(0, 3);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.bg,
        lineTransparency: 100,
    });

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: y(540),
            sizing: 'cover',
        });
    } else {
        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: y(540),
            fillColor: colors.primary,
            fillTransparency: 15,
            lineTransparency: 100,
        });
    }

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: y(280),
        w: SLIDE_WIDTH,
        h: y(260),
        fillColor: '#000000',
        fillTransparency: 42,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'text',
        text: title,
        x: x(130),
        y: y(390),
        w: x(1150),
        h: y(110),
        fontFace: titleFont,
        fontSize: Math.round(44 * titleScale),
        bold: true,
        color: '#FFFFFF',
        fit: 'shrink',
        valign: 'bottom',
    });

    const cardTop = y(610);
    const cardHeight = y(300);
    const gap = x(32);
    const cardWidth = x(538);

    bullets.forEach((bullet, index) => {
        const cardX = x(120) + index * (cardWidth + gap);
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: cardX,
            y: cardTop,
            w: cardWidth,
            h: cardHeight,
            fillColor: colors.bg,
            lineColor: colors.text,
            lineTransparency: 88,
            lineWidth: 0.6,
        });
        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: cardX + x(28),
            y: cardTop + y(34),
            w: x(48),
            h: y(6),
            fillColor: colors.accent || colors.primary,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: bullet,
            x: cardX + x(28),
            y: cardTop + y(74),
            w: cardWidth - x(56),
            h: y(170),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            color: colors.text,
            fit: 'shrink',
            valign: 'top',
        });
    });

    return {
        family: 'content',
        variation: 'hero-block',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildContentMagazine = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled').trim();
    const subtitle = readText(slide.subtitle || slide.content?.subtitle);
    const bullets = getBullets(slide).slice(0, 4);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const titleLines = title.split(/\s+/).join('\n');
    const year = new Date().getFullYear();
    const nodes: SceneNode[] = [];

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.bg,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: x(120),
        y: y(100),
        w: x(1680),
        h: y(6),
        fillColor: colors.primary,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'text',
        text: titleLines,
        x: x(130),
        y: y(165),
        w: x(560),
        h: y(540),
        fontFace: titleFont,
        fontSize: Math.round(56 * titleScale),
        bold: true,
        color: colors.text,
        fit: 'shrink',
    });

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(130),
            y: y(740),
            w: x(500),
            h: y(90),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            italic: true,
            color: colors.text,
            fit: 'shrink',
            transparency: 20,
        });
    }

    nodes.push({
        kind: 'text',
        text: `ISSUE 01 • ${year}`,
        x: x(130),
        y: y(930),
        w: x(420),
        h: y(40),
        fontFace: bodyFont,
        fontSize: Math.round(15 * textScale),
        color: colors.text,
        transparency: 40,
    });

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: x(1320),
            y: y(180),
            w: x(430),
            h: y(430),
            sizing: 'cover',
            rounding: true,
            transparency: 80,
        });
    }

    bullets.forEach((bullet, index) => {
        const rowY = y(260 + index * 150);
        nodes.push({
            kind: 'shape',
            shape: 'line',
            x: x(860),
            y: rowY + y(102),
            w: x(820),
            h: 0,
            lineColor: colors.text,
            lineTransparency: 88,
            lineWidth: 0.6,
        });
        nodes.push({
            kind: 'text',
            text: `0${index + 1}`,
            x: x(860),
            y: rowY,
            w: x(90),
            h: y(64),
            fontFace: bodyFont,
            fontSize: Math.round(34 * titleScale),
            italic: true,
            color: colors.secondary || colors.primary,
            transparency: 50,
        });
        nodes.push({
            kind: 'text',
            text: bullet,
            x: x(955),
            y: rowY + y(20),
            w: x(700),
            h: y(72),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            bold: true,
            color: colors.text,
            fit: 'shrink',
        });
    });

    return {
        family: 'content',
        variation: 'magazine',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildContentMinimalOffset = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Slide');
    const bullets = getBullets(slide).slice(0, 4);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.bg,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: x(1280),
        y: 0,
        w: x(640),
        h: SLIDE_HEIGHT,
        fillColor: colors.primary,
        fillTransparency: 90,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'shape',
        shape: 'ellipse',
        x: x(-120),
        y: y(-90),
        w: x(260),
        h: y(260),
        fillColor: colors.accent || colors.primary,
        fillTransparency: 80,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'text',
        text: 'OVERVIEW',
        x: x(170),
        y: y(230),
        w: x(420),
        h: y(36),
        fontFace: bodyFont,
        fontSize: Math.round(13 * textScale),
        bold: true,
        uppercase: true,
        color: colors.secondary || colors.primary,
    });

    nodes.push({
        kind: 'text',
        text: title,
        x: x(170),
        y: y(300),
        w: x(900),
        h: y(180),
        fontFace: titleFont,
        fontSize: Math.round(38 * titleScale),
        color: colors.text,
        fit: 'shrink',
    });

    const leftColumn = bullets.slice(0, 2);
    const rightColumn = bullets.slice(2, 4);
    [leftColumn, rightColumn].forEach((column, columnIndex) => {
        const colX = x(170 + columnIndex * 520);
        column.forEach((bullet, index) => {
            const blockY = y(610 + index * 150);
            nodes.push({
                kind: 'shape',
                shape: 'line',
                x: colX,
                y: blockY,
                w: x(420),
                h: 0,
                lineColor: colors.text,
                lineTransparency: 70,
                lineWidth: 0.6,
            });
            nodes.push({
                kind: 'text',
                text: bullet,
                x: colX,
                y: blockY + y(18),
                w: x(420),
                h: y(76),
                fontFace: bodyFont,
                fontSize: Math.round(22 * textScale),
                color: colors.text,
                fit: 'shrink',
            });
        });
    });

    return {
        family: 'content',
        variation: 'minimal-offset',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildContentBulletsLegacy = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Overview');
    const body = getBodyText(slide);
    const bullets = getBullets(slide).slice(0, 6);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    nodes.push({
        kind: 'text',
        text: title,
        x: x(180),
        y: y(150),
        w: x(1040),
        h: y(90),
        fontFace: titleFont,
        fontSize: Math.round(48 * titleScale),
        bold: true,
        color: colors.text,
        fit: 'shrink',
    });
    if (body) {
        nodes.push({
            kind: 'text',
            text: body,
            x: x(180),
            y: y(290),
            w: x(980),
            h: y(140),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 10,
        });
    }
    bullets.forEach((bullet, index) => {
        const top = 470 + index * 88;
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: x(188),
            y: y(top + 16),
            w: x(14),
            h: y(14),
            fillColor: colors.primary,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: bullet,
            x: x(220),
            y: y(top),
            w: x(1040),
            h: y(44),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            bold: true,
            color: colors.text,
            fit: 'shrink',
        });
    });
    return {
        family: 'content',
        variation: 'bullets-legacy',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildImageShowcase = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Slide');
    const subtitle = readText(slide.subtitle || slide.content?.text);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: SLIDE_HEIGHT,
            sizing: 'cover',
            transparency: 90,
        });
    }

    nodes.push({
        kind: 'text',
        text: title,
        x: x(120),
        y: y(110),
        w: x(1200),
        h: y(110),
        fontFace: titleFont,
        fontSize: Math.round(36 * titleScale),
        bold: true,
        color: colors.text,
        fit: 'shrink',
    });

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(120),
            y: y(220),
            w: x(1200),
            h: y(64),
            fontFace: bodyFont,
            fontSize: Math.round(18 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 40,
        });
    }

    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(120),
        y: y(310),
        w: x(1680),
        h: y(650),
        fillColor: '#000000',
        fillTransparency: 96,
        lineColor: colors.text,
        lineTransparency: 90,
        lineWidth: 0.6,
    });

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: x(180),
            y: y(350),
            w: x(1560),
            h: y(570),
            sizing: 'contain',
            shadow: {
                type: 'outer',
                color: '000000',
                opacity: 0.16,
                blur: 6,
                offset: 2,
                angle: 45,
            },
        });
    }

    return {
        family: 'image',
        variation: 'image-showcase',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildImageDefault = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Slide');
    const subtitle = readText(slide.subtitle || slide.content?.subtitle);
    const body = getBodyText(slide);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: SLIDE_HEIGHT,
            sizing: 'cover',
            transparency: 10,
        });
    } else {
        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: SLIDE_HEIGHT,
            fillColor: colors.primary,
            lineTransparency: 100,
        });
    }

    if (!(slide as any).isChartImage && (title || subtitle)) {
        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: SLIDE_HEIGHT,
            fillColor: '#000000',
            fillTransparency: 50,
            lineTransparency: 100,
        });
    }

    nodes.push({
        kind: 'text',
        text: title,
        x: x(180),
        y: y(250),
        w: x(1560),
        h: y(200),
        fontFace: titleFont,
        fontSize: Math.round(78 * titleScale),
        bold: true,
        color: '#FFFFFF',
        align: 'center',
        valign: 'middle',
        fit: 'shrink',
    });

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle.toUpperCase(),
            x: x(240),
            y: y(470),
            w: x(1440),
            h: y(72),
            fontFace: bodyFont,
            fontSize: Math.round(24 * textScale),
            color: '#FFFFFF',
            align: 'center',
            valign: 'middle',
            fit: 'shrink',
            transparency: 10,
        });
    }

    if (body) {
        nodes.push({
            kind: 'text',
            text: `"${body}"`,
            x: x(360),
            y: y(600),
            w: x(1200),
            h: y(180),
            fontFace: bodyFont,
            fontSize: Math.round(30 * textScale),
            italic: true,
            color: '#FFFFFF',
            align: 'center',
            valign: 'middle',
            fit: 'shrink',
            transparency: 10,
        });
    }

    return {
        family: 'image',
        variation: 'default',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildImageSplitCurtain = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Slide');
    const subtitle = readText(slide.subtitle, 'FEATURED');
    const body = getBodyText(slide);
    const imageUrl = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.bg,
        lineTransparency: 100,
    });

    if (imageUrl) {
        nodes.push({
            kind: 'image',
            path: imageUrl,
            x: 0,
            y: 0,
            w: SLIDE_WIDTH / 2,
            h: SLIDE_HEIGHT,
            sizing: 'cover',
        });
    } else {
        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: 0,
            y: 0,
            w: SLIDE_WIDTH / 2,
            h: SLIDE_HEIGHT,
            fillColor: colors.primary,
            fillTransparency: 20,
            lineTransparency: 100,
        });
    }

    if (!(slide as any).isChartImage) {
        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: 0,
            y: 0,
            w: SLIDE_WIDTH / 2,
            h: SLIDE_HEIGHT,
            fillColor: '#000000',
            fillTransparency: 90,
            lineTransparency: 100,
        });
    }

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: SLIDE_WIDTH / 2,
        y: 0,
        w: SLIDE_WIDTH / 2,
        h: SLIDE_HEIGHT,
        fillColor: colors.bg,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'text',
        text: subtitle || 'FEATURED',
        x: x(1070),
        y: y(250),
        w: x(650),
        h: y(42),
        fontFace: bodyFont,
        fontSize: Math.round(13 * textScale),
        bold: true,
        uppercase: true,
        color: colors.secondary || colors.primary,
        fit: 'shrink',
    });

    nodes.push({
        kind: 'text',
        text: title,
        x: x(1070),
        y: y(325),
        w: x(650),
        h: y(220),
        fontFace: titleFont,
        fontSize: Math.round(58 * titleScale),
        bold: true,
        color: colors.text,
        fit: 'shrink',
    });

    if (body) {
        nodes.push({
            kind: 'text',
            text: body,
            x: x(1070),
            y: y(590),
            w: x(620),
            h: y(180),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 20,
        });
    }

    return {
        family: 'image',
        variation: 'split-curtain',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildImagePolaroidPile = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const images = getImageUrls(slide);
    const title = readText(slide.title, 'Untitled Slide');
    const bodyFont = getBodyFont(presentation);
    const textScale = getTextScale(presentation);
    const fallbackImages = [
        'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800&h=800',
        'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=800&h=800',
    ];
    const displayImages = (images.length > 0 ? images : [getImageUrl(slide), ...fallbackImages].filter(Boolean) as string[]).slice(0, 5);
    const nodes: SceneNode[] = [];

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: getSurfaceColor(colors),
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.text,
        fillTransparency: 96,
        lineTransparency: 100,
    });

    const baseX = [x(230), x(470), x(735), x(1000), x(1245)];
    const baseY = [y(260), y(210), y(160), y(220), y(290)];
    const rotations = [-16, -7, 0, 9, 17];

    displayImages.forEach((img, index) => {
        const frameX = baseX[index] ?? x(320 + index * 220);
        const frameY = baseY[index] ?? y(220 + (index % 2) * 40);
        const frameW = x(300);
        const frameH = y(430);

        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: frameX + x(8),
            y: frameY + y(12),
            w: frameW,
            h: frameH,
            rotation: rotations[index] ?? 0,
            fillColor: '#000000',
            fillTransparency: 84,
            lineTransparency: 100,
        });

        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: frameX,
            y: frameY,
            w: frameW,
            h: frameH,
            rotation: rotations[index] ?? 0,
            fillColor: '#FFFFFF',
            lineTransparency: 100,
        });

        nodes.push({
            kind: 'image',
            path: img,
            x: frameX + x(22),
            y: frameY + y(22),
            w: x(256),
            h: y(256),
            rotation: rotations[index] ?? 0,
            sizing: 'cover',
        });

        nodes.push({
            kind: 'text',
            text: `${title} #${index + 1}`,
            x: frameX + x(20),
            y: frameY + y(312),
            w: x(260),
            h: y(46),
            rotation: rotations[index] ?? 0,
            fontFace: bodyFont,
            fontSize: Math.round(18 * textScale),
            color: '#5F6368',
            align: 'center',
            fit: 'shrink',
        });
    });

    return {
        family: 'image',
        variation: 'polaroid-pile',
        backgroundColor: getSurfaceColor(colors),
        nodes,
    };
};

const buildBentoAsymmetricMasonry = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Untitled Slide');
    const items = getBentoItems(slide).slice(0, 3);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    const cardShadow = {
        type: 'outer' as const,
        color: '000000',
        opacity: 0.15,
        blur: 3,
        offset: 1,
        angle: 45,
    };

    nodes.push({
        kind: 'text',
        text: title,
        x: x(66),
        y: y(60),
        w: x(980),
        h: y(70),
        fontFace: titleFont,
        fontSize: Math.round(34 * titleScale),
        bold: true,
        color: colors.text,
        fit: 'shrink',
    });

    [
        { color: colors.primary, opacity: 0 },
        { color: colors.secondary || colors.primary, opacity: 12 },
        { color: colors.accent || colors.secondary || colors.primary, opacity: 26 },
    ].forEach((dot, index) => {
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: x(1802 + index * 22),
            y: y(73),
            w: x(10),
            h: y(10),
            fillColor: dot.color,
            fillTransparency: dot.opacity,
            lineTransparency: 100,
        });
    });

    const layouts = [
        { x: 62, y: 150, w: 882, h: 825, overlayH: 188, badge: false, titleSize: 23, bodySize: 17 },
        { x: 972, y: 150, w: 848, h: 397, overlayH: 132, badge: true, titleSize: 20, bodySize: 16 },
        { x: 972, y: 579, w: 848, h: 396, overlayH: 132, badge: true, titleSize: 20, bodySize: 16 },
    ];

    items.forEach((item, index) => {
        const frame = layouts[index];
        if (!frame) return;

        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(frame.x),
            y: y(frame.y),
            w: x(frame.w),
            h: y(frame.h),
            fillColor: '#FFFFFF',
            lineTransparency: 100,
        });

        nodes.push({
            kind: 'image',
            path: item.image,
            x: x(frame.x + 4),
            y: y(frame.y + 4),
            w: x(frame.w - 8),
            h: y(frame.h - 8),
            sizing: 'cover',
            shadow: cardShadow,
        });

        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: x(frame.x + 4),
            y: y(frame.y + frame.h - frame.overlayH),
            w: x(frame.w - 8),
            h: y(frame.overlayH - 4),
            fillColor: '#000000',
            fillTransparency: index === 0 ? 46 : 40,
            lineTransparency: 100,
        });

        nodes.push({
            kind: 'text',
            text: item.title,
            x: x(frame.x + 28),
            y: y(frame.y + frame.h - frame.overlayH + 22),
            w: x(frame.w - 92),
            h: y(index === 0 ? 42 : 34),
            fontFace: titleFont,
            fontSize: Math.round(frame.titleSize * titleScale),
            bold: true,
            color: '#FFFFFF',
            fit: 'shrink',
        });

        nodes.push({
            kind: 'text',
            text: item.description,
            x: x(frame.x + 28),
            y: y(frame.y + frame.h - frame.overlayH + (index === 0 ? 66 : 58)),
            w: x(frame.w - 70),
            h: y(index === 0 ? 106 : 74),
            fontFace: bodyFont,
            fontSize: Math.round(frame.bodySize * textScale),
            color: '#FFFFFF',
            fit: 'shrink',
            transparency: 4,
        });

        if (frame.badge) {
            nodes.push({
                kind: 'shape',
                shape: 'ellipse',
                x: x(frame.x + frame.w - 48),
                y: y(frame.y + 18),
                w: x(26),
                h: y(26),
                fillColor: '#FFFFFF',
                fillTransparency: 72,
                lineColor: '#FFFFFF',
                lineTransparency: 86,
                lineWidth: 0.4,
            });
            nodes.push({
                kind: 'text',
                text: String(index + 1),
                x: x(frame.x + frame.w - 48),
                y: y(frame.y + 18),
                w: x(26),
                h: y(24),
                fontFace: bodyFont,
                fontSize: Math.round(11 * textScale),
                bold: true,
                color: '#FFFFFF',
                align: 'center',
                valign: 'middle',
            });
        }
    });

    return {
        family: 'bento',
        variation: 'asymmetric-masonry',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildBentoMagazineGrid = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const items = getBentoItems(slide).slice(0, 4);
    const main = items[0];
    const sideItems = items.slice(1, 4);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    if (main) {
        nodes.push({ kind: 'shape', shape: 'roundRect', x: x(100), y: y(130), w: x(980), h: y(820), fillColor: colors.text, lineTransparency: 100 });
        nodes.push({ kind: 'image', path: main.image, x: x(100), y: y(130), w: x(980), h: y(820), sizing: 'cover', rounding: true });
        nodes.push({ kind: 'shape', shape: 'rect', x: x(100), y: y(130), w: x(980), h: y(820), fillColor: '#000000', fillTransparency: 56, lineTransparency: 100 });
        nodes.push({ kind: 'shape', shape: 'roundRect', x: x(180), y: y(700), w: x(220), h: y(34), fillColor: '#FFFFFF', fillTransparency: 82, lineTransparency: 100 });
        nodes.push({ kind: 'text', text: 'COVER STORY', x: x(190), y: y(707), w: x(200), h: y(18), fontFace: bodyFont, fontSize: Math.round(11 * textScale), bold: true, uppercase: true, color: '#FFFFFF', fit: 'shrink' });
        nodes.push({ kind: 'text', text: main.title || readText(slide.title, 'Story'), x: x(180), y: y(760), w: x(760), h: y(92), fontFace: titleFont, fontSize: Math.round(44 * titleScale), bold: true, color: '#FFFFFF', fit: 'shrink' });
        nodes.push({ kind: 'text', text: main.description, x: x(180), y: y(850), w: x(720), h: y(64), fontFace: bodyFont, fontSize: Math.round(18 * textScale), color: '#FFFFFF', fit: 'shrink', transparency: 8 });
    }
    nodes.push({ kind: 'text', text: 'Related Topics', x: x(1160), y: y(165), w: x(420), h: y(26), fontFace: bodyFont, fontSize: Math.round(14 * textScale), bold: true, uppercase: true, color: colors.text, transparency: 36, fit: 'shrink' });
    nodes.push({ kind: 'shape', shape: 'line', x: x(1160), y: y(210), w: x(560), h: 0, lineColor: colors.text, lineTransparency: 88, lineWidth: 0.5 });
    sideItems.forEach((item, index) => {
        const top = 280 + index * 210;
        nodes.push({ kind: 'image', path: item.image, x: x(1160), y: y(top), w: x(110), h: y(110), sizing: 'cover', rounding: true });
        nodes.push({ kind: 'text', text: item.title, x: x(1300), y: y(top + 8), w: x(450), h: y(34), fontFace: titleFont, fontSize: Math.round(22 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
        nodes.push({ kind: 'text', text: item.description, x: x(1300), y: y(top + 48), w: x(450), h: y(54), fontFace: bodyFont, fontSize: Math.round(14 * textScale), color: colors.text, fit: 'shrink', transparency: 28 });
        nodes.push({ kind: 'shape', shape: 'line', x: x(1160), y: y(top + 135), w: x(590), h: 0, lineColor: colors.text, lineTransparency: 90, lineWidth: 0.4 });
    });
    return { family: 'bento', variation: 'magazine-grid', backgroundColor: colors.bg, nodes };
};

const buildBentoFeatureFocus = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const items = getBentoItems(slide).slice(0, 5);
    const center = items[0];
    const leftItems = items.slice(1, 3);
    const rightItems = items.slice(3, 5);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    nodes.push({ kind: 'shape', shape: 'ellipse', x: x(560), y: y(150), w: x(800), h: y(800), lineColor: colors.text, lineTransparency: 90, lineWidth: 0.5, fillTransparency: 100 });
    if (center) {
        nodes.push({ kind: 'shape', shape: 'roundRect', x: x(685), y: y(280), w: x(550), h: y(520), fillColor: '#FFFFFF', fillTransparency: 4, lineTransparency: 100 });
        nodes.push({ kind: 'image', path: center.image, x: x(685), y: y(280), w: x(550), h: y(520), sizing: 'cover', rounding: true });
        nodes.push({ kind: 'shape', shape: 'rect', x: x(685), y: y(680), w: x(550), h: y(120), fillColor: '#FFFFFF', fillTransparency: 10, lineTransparency: 100 });
        nodes.push({ kind: 'text', text: center.title || readText(slide.title, 'Feature'), x: x(735), y: y(712), w: x(450), h: y(34), fontFace: titleFont, fontSize: Math.round(26 * titleScale), bold: true, color: colors.text, align: 'center', fit: 'shrink' });
    }
    leftItems.forEach((item, index) => {
        const top = 290 + index * 270;
        nodes.push({ kind: 'text', text: item.title, x: x(150), y: y(top), w: x(420), h: y(30), fontFace: titleFont, fontSize: Math.round(22 * titleScale), bold: true, color: colors.text, align: 'right', fit: 'shrink' });
        nodes.push({ kind: 'text', text: item.description, x: x(130), y: y(top + 42), w: x(440), h: y(62), fontFace: bodyFont, fontSize: Math.round(14 * textScale), color: colors.text, align: 'right', fit: 'shrink', transparency: 24 });
        nodes.push({ kind: 'shape', shape: 'line', x: x(180), y: y(top + 120), w: x(390), h: 0, lineColor: colors.primary, lineTransparency: 84, lineWidth: 0.5 });
    });
    rightItems.forEach((item, index) => {
        const top = 290 + index * 270;
        nodes.push({ kind: 'text', text: item.title, x: x(1350), y: y(top), w: x(420), h: y(30), fontFace: titleFont, fontSize: Math.round(22 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
        nodes.push({ kind: 'text', text: item.description, x: x(1350), y: y(top + 42), w: x(440), h: y(62), fontFace: bodyFont, fontSize: Math.round(14 * textScale), color: colors.text, fit: 'shrink', transparency: 24 });
        nodes.push({ kind: 'shape', shape: 'line', x: x(1350), y: y(top + 120), w: x(390), h: 0, lineColor: colors.primary, lineTransparency: 84, lineWidth: 0.5 });
    });
    return { family: 'bento', variation: 'feature-focus', backgroundColor: colors.bg, nodes };
};

const buildBentoDefault = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const items = getBentoItems(slide).slice(0, 3);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    nodes.push({ kind: 'text', text: readText(slide.title, 'Overview'), x: x(120), y: y(82), w: x(1200), h: y(66), fontFace: titleFont, fontSize: Math.round(42 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
    const layouts = [
        { x0: 120, y0: 220, w: 820, h: 700 },
        { x0: 980, y0: 220, w: 820, h: 330 },
        { x0: 980, y0: 590, w: 820, h: 330 },
    ];
    items.forEach((item, index) => {
        const frame = layouts[index];
        if (!frame) return;
        nodes.push({ kind: 'image', path: item.image, x: x(frame.x0), y: y(frame.y0), w: x(frame.w), h: y(frame.h), sizing: 'cover' });
        nodes.push({ kind: 'shape', shape: 'rect', x: x(frame.x0), y: y(frame.y0), w: x(frame.w), h: y(frame.h), fillColor: '#000000', fillTransparency: 58, lineTransparency: 100 });
        nodes.push({ kind: 'text', text: item.title, x: x(frame.x0 + 28), y: y(frame.y0 + frame.h - 120), w: x(frame.w - 56), h: y(42), fontFace: titleFont, fontSize: Math.round((index === 0 ? 30 : 24) * titleScale), bold: true, color: '#FFFFFF', fit: 'shrink' });
        nodes.push({ kind: 'text', text: item.description, x: x(frame.x0 + 28), y: y(frame.y0 + frame.h - 72), w: x(frame.w - 56), h: y(46), fontFace: bodyFont, fontSize: Math.round(14 * textScale), color: '#FFFFFF', fit: 'shrink', transparency: 10 });
    });
    return { family: 'bento', variation: 'default', backgroundColor: colors.bg, nodes };
};

const buildSectionDefault = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Section');
    const subtitle = readText(slide.subtitle);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [
        {
            kind: 'shape',
            shape: 'rect',
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: SLIDE_HEIGHT,
            fillColor: colors.primary,
            lineTransparency: 100,
        },
        {
            kind: 'shape',
            shape: 'ellipse',
            x: x(1380),
            y: y(-120),
            w: x(700),
            h: y(700),
            fillColor: colors.secondary || colors.accent,
            fillTransparency: 74,
            lineTransparency: 100,
        },
        {
            kind: 'text',
            text: title,
            x: x(220),
            y: y(350),
            w: x(1480),
            h: y(130),
            fontFace: titleFont,
            fontSize: Math.round(68 * titleScale),
            bold: true,
            color: '#FFFFFF',
            align: 'center',
            fit: 'shrink',
        },
        {
            kind: 'shape',
            shape: 'roundRect',
            x: x(840),
            y: y(520),
            w: x(240),
            h: y(10),
            fillColor: '#FFFFFF',
            lineTransparency: 100,
        },
    ];

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(420),
            y: y(580),
            w: x(1080),
            h: y(84),
            fontFace: bodyFont,
            fontSize: Math.round(24 * textScale),
            color: '#FFFFFF',
            align: 'center',
            fit: 'shrink',
            transparency: 8,
        });
    }

    return { family: 'section', variation: 'default', backgroundColor: colors.primary, nodes };
};

const buildSectionBigNumberOutline = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Section');
    const subtitle = readText(slide.subtitle);
    const sectionIndex = slide.index || 1;
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [
        {
            kind: 'text',
            text: sectionIndex < 10 ? `0${sectionIndex}` : String(sectionIndex),
            x: x(520),
            y: y(170),
            w: x(880),
            h: y(520),
            fontFace: titleFont,
            fontSize: Math.round(240 * titleScale),
            bold: true,
            color: colors.primary,
            align: 'center',
            valign: 'middle',
            transparency: 84,
            fit: 'shrink',
        },
        {
            kind: 'shape',
            shape: 'rect',
            x: x(900),
            y: y(372),
            w: x(120),
            h: y(8),
            fillColor: colors.accent || colors.primary,
            lineTransparency: 100,
        },
        {
            kind: 'text',
            text: title,
            x: x(260),
            y: y(420),
            w: x(1400),
            h: y(120),
            fontFace: titleFont,
            fontSize: Math.round(78 * titleScale),
            bold: true,
            color: colors.text,
            align: 'center',
            fit: 'shrink',
        },
    ];

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle.toUpperCase(),
            x: x(420),
            y: y(575),
            w: x(1080),
            h: y(58),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            color: colors.text,
            align: 'center',
            fit: 'shrink',
            transparency: 38,
        });
    }

    return { family: 'section', variation: 'big-number-outline', backgroundColor: colors.bg, nodes };
};

const buildSectionMinimalBar = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Section');
    const subtitle = readText(slide.subtitle);
    const sectionIndex = slide.index || 1;
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [
        {
            kind: 'shape',
            shape: 'roundRect',
            x: x(210),
            y: y(120),
            w: x(18),
            h: y(840),
            fillColor: colors.primary,
            lineTransparency: 100,
        },
        {
            kind: 'text',
            text: `PART ${sectionIndex < 10 ? `0${sectionIndex}` : sectionIndex}`,
            x: x(300),
            y: y(270),
            w: x(420),
            h: y(48),
            fontFace: bodyFont,
            fontSize: Math.round(20 * textScale),
            bold: true,
            color: colors.secondary || colors.primary,
            transparency: 36,
            fit: 'shrink',
        },
        {
            kind: 'text',
            text: title,
            x: x(300),
            y: y(350),
            w: x(1320),
            h: y(210),
            fontFace: titleFont,
            fontSize: Math.round(82 * titleScale),
            bold: true,
            color: colors.text,
            fit: 'shrink',
        },
    ];

    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(308),
            y: y(610),
            w: x(860),
            h: y(120),
            fontFace: bodyFont,
            fontSize: Math.round(26 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 18,
        });
    }

    return { family: 'section', variation: 'minimal-bar', backgroundColor: colors.bg, nodes };
};

const buildSectionAbstractMesh = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Section');
    const subtitle = readText(slide.subtitle);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(360),
        y: y(250),
        w: x(1200),
        h: y(520),
        fillColor: '#FFFFFF',
        fillTransparency: 28,
        lineColor: '#FFFFFF',
        lineTransparency: 60,
        lineWidth: 0.8,
    });
    nodes.push({
        kind: 'text',
        text: title,
        x: x(440),
        y: y(360),
        w: x(1040),
        h: y(130),
        fontFace: titleFont,
        fontSize: Math.round(60 * titleScale),
        bold: true,
        color: colors.text,
        align: 'center',
        fit: 'shrink',
    });
    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(500),
            y: y(520),
            w: x(920),
            h: y(80),
            fontFace: bodyFont,
            fontSize: Math.round(24 * textScale),
            color: colors.text,
            align: 'center',
            fit: 'shrink',
            transparency: 10,
        });
    }
    return { family: 'section', variation: 'abstract-mesh', backgroundColor: colors.bg, nodes };
};

const buildQuoteCenteredHero = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const quote = getQuoteData(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const image = getImageUrl(slide);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    if (image) {
        nodes.push({
            kind: 'image',
            path: image,
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: SLIDE_HEIGHT,
            sizing: 'cover',
            transparency: 88,
        });
    }
    nodes.push({
        kind: 'text',
        text: '"',
        x: x(180),
        y: y(80),
        w: x(180),
        h: y(180),
        fontFace: titleFont,
        fontSize: Math.round(150 * titleScale),
        color: colors.primary,
        transparency: 80,
    });
    nodes.push({
        kind: 'text',
        text: quote.text,
        x: x(250),
        y: y(280),
        w: x(1420),
        h: y(260),
        fontFace: bodyFont,
        fontSize: Math.round(40 * textScale),
        color: colors.text,
        align: 'center',
        fit: 'shrink',
    });
    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(860),
        y: y(635),
        w: x(200),
        h: y(8),
        fillColor: colors.primary,
        lineTransparency: 100,
    });
    if (quote.author) {
        nodes.push({
            kind: 'text',
            text: quote.author,
            x: x(600),
            y: y(700),
            w: x(720),
            h: y(44),
            fontFace: titleFont,
            fontSize: Math.round(24 * titleScale),
            bold: true,
            color: colors.text,
            align: 'center',
            fit: 'shrink',
        });
    }
    if (quote.role) {
        nodes.push({
            kind: 'text',
            text: quote.role,
            x: x(520),
            y: y(754),
            w: x(880),
            h: y(34),
            fontFace: bodyFont,
            fontSize: Math.round(18 * textScale),
            color: colors.text,
            align: 'center',
            fit: 'shrink',
            transparency: 28,
        });
    }
    return { family: 'quote', variation: 'centered-hero', backgroundColor: colors.bg, nodes };
};

const buildQuoteSideAccent = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const quote = getQuoteData(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [
        {
            kind: 'shape',
            shape: 'rect',
            x: 0,
            y: 0,
            w: x(22),
            h: SLIDE_HEIGHT,
            fillColor: colors.primary,
            lineTransparency: 100,
        },
        {
            kind: 'text',
            text: '"',
            x: x(150),
            y: y(240),
            w: x(100),
            h: y(100),
            fontFace: titleFont,
            fontSize: Math.round(86 * titleScale),
            color: colors.primary,
            transparency: 68,
        },
        {
            kind: 'text',
            text: quote.text,
            x: x(180),
            y: y(320),
            w: x(1300),
            h: y(280),
            fontFace: bodyFont,
            fontSize: Math.round(34 * textScale),
            color: colors.text,
            fit: 'shrink',
        },
        {
            kind: 'shape',
            shape: 'line',
            x: x(180),
            y: y(700),
            w: x(90),
            h: 0,
            lineColor: colors.primary,
            lineWidth: 1.2,
        },
    ];
    if (quote.author) {
        nodes.push({
            kind: 'text',
            text: quote.author,
            x: x(300),
            y: y(675),
            w: x(520),
            h: y(36),
            fontFace: titleFont,
            fontSize: Math.round(22 * titleScale),
            bold: true,
            color: colors.text,
            fit: 'shrink',
        });
    }
    if (quote.role) {
        nodes.push({
            kind: 'text',
            text: quote.role,
            x: x(300),
            y: y(725),
            w: x(680),
            h: y(28),
            fontFace: bodyFont,
            fontSize: Math.round(17 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 34,
        });
    }
    return { family: 'quote', variation: 'side-accent', backgroundColor: colors.bg, nodes };
};

const buildQuoteMinimalElegant = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const quote = getQuoteData(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [
        {
            kind: 'text',
            text: `"${quote.text}"`,
            x: x(430),
            y: y(290),
            w: x(1060),
            h: y(230),
            fontFace: bodyFont,
            fontSize: Math.round(32 * textScale),
            color: colors.text,
            align: 'center',
            fit: 'shrink',
        },
        {
            kind: 'shape',
            shape: 'roundRect',
            x: x(934),
            y: y(590),
            w: x(56),
            h: y(3),
            fillColor: colors.primary,
            lineTransparency: 100,
        },
    ];
    if (quote.author) {
        nodes.push({
            kind: 'text',
            text: quote.author.toUpperCase(),
            x: x(700),
            y: y(640),
            w: x(520),
            h: y(30),
            fontFace: titleFont,
            fontSize: Math.round(16 * titleScale),
            bold: true,
            color: colors.primary,
            align: 'center',
            fit: 'shrink',
        });
    }
    if (quote.role) {
        nodes.push({
            kind: 'text',
            text: quote.role,
            x: x(680),
            y: y(688),
            w: x(560),
            h: y(26),
            fontFace: bodyFont,
            fontSize: Math.round(15 * textScale),
            color: colors.text,
            align: 'center',
            fit: 'shrink',
            transparency: 34,
        });
    }
    return { family: 'quote', variation: 'minimal-elegant', backgroundColor: colors.bg, nodes };
};

const buildStatsClassicGrid = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const stats = getStatsItems(slide).slice(0, 4);
    const title = readText(slide.title, 'Key Metrics');
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    addAbstractBackground(nodes, colors);

    nodes.push({
        kind: 'text',
        text: title,
        x: x(220),
        y: y(120),
        w: x(1480),
        h: y(120),
        fontFace: titleFont,
        fontSize: Math.round(54 * titleScale),
        bold: true,
        color: colors.text,
        align: 'center',
        fit: 'shrink',
    });

    const cardPositions = [
        { x: x(160), y: y(360) },
        { x: x(970), y: y(360) },
        { x: x(160), y: y(680) },
        { x: x(970), y: y(680) },
    ];

    stats.forEach((stat, index) => {
        const pos = cardPositions[index];
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: pos.x,
            y: pos.y,
            w: x(650),
            h: y(240),
            fillColor: getSurfaceColor(colors),
            fillTransparency: 18,
            lineColor: colors.text,
            lineTransparency: 80,
            lineWidth: 0.6,
        });
        nodes.push({
            kind: 'text',
            text: stat.value,
            x: pos.x + x(40),
            y: pos.y + y(52),
            w: x(570),
            h: y(74),
            fontFace: titleFont,
            fontSize: Math.round(46 * textScale),
            bold: true,
            color: getReadableOnBackground(colors.primary, colors.bg),
            align: 'center',
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: stat.label,
            x: pos.x + x(40),
            y: pos.y + y(150),
            w: x(570),
            h: y(42),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            color: colors.text,
            align: 'center',
            fit: 'shrink',
            transparency: 20,
        });
    });

    return {
        family: 'stats',
        variation: 'classic-grid',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildStatsMetricCards = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const stats = getStatsItems(slide).slice(0, 4);
    const title = readText(slide.title, 'Key Performance Indicators');
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    addAbstractBackground(nodes, colors);

    nodes.push({
        kind: 'text',
        text: title,
        x: x(260),
        y: y(110),
        w: x(1400),
        h: y(90),
        fontFace: titleFont,
        fontSize: Math.round(42 * titleScale),
        bold: true,
        color: colors.text,
        align: 'center',
        fit: 'shrink',
    });
    nodes.push({
        kind: 'text',
        text: 'Key Performance Indicators',
        x: x(420),
        y: y(215),
        w: x(1080),
        h: y(46),
        fontFace: bodyFont,
        fontSize: Math.round(22 * textScale),
        color: colors.text,
        align: 'center',
        transparency: 40,
    });

    const cardWidth = stats.length === 1 ? x(620) : stats.length === 2 ? x(540) : stats.length === 3 ? x(520) : x(390);
    const gap = x(30);
    const totalWidth = stats.length * cardWidth + Math.max(0, stats.length - 1) * gap;
    const startX = (SLIDE_WIDTH - totalWidth) / 2;

    stats.forEach((stat, index) => {
        const cardX = startX + index * (cardWidth + gap);
        const cardY = y(340);
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: cardX,
            y: cardY,
            w: cardWidth,
            h: y(450),
            fillColor: '#FFFFFF',
            fillTransparency: 90,
            lineColor: colors.text,
            lineTransparency: 88,
            lineWidth: 0.6,
        });
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: cardX + (cardWidth / 2) - x(36),
            y: cardY + y(55),
            w: x(72),
            h: y(72),
            fillColor: colors.primary,
            fillTransparency: 85,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: String(index + 1),
            x: cardX + (cardWidth / 2) - x(18),
            y: cardY + y(74),
            w: x(36),
            h: y(28),
            fontFace: bodyFont,
            fontSize: Math.round(24 * textScale),
            bold: true,
            color: colors.primary,
            align: 'center',
            valign: 'middle',
        });
        nodes.push({
            kind: 'text',
            text: stat.value,
            x: cardX + x(22),
            y: cardY + y(170),
            w: cardWidth - x(44),
            h: y(90),
            fontFace: titleFont,
            fontSize: Math.round(44 * textScale),
            bold: true,
            color: colors.primary,
            align: 'center',
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: stat.label,
            x: cardX + x(22),
            y: cardY + y(300),
            w: cardWidth - x(44),
            h: y(60),
            fontFace: bodyFont,
            fontSize: Math.round(16 * textScale),
            bold: true,
            uppercase: true,
            color: colors.text,
            align: 'center',
            fit: 'shrink',
            transparency: 25,
        });
    });

    return {
        family: 'stats',
        variation: 'metric-cards',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildStatsBigHero = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const stats = getStatsItems(slide);
    const hero = stats[0];
    const secondary = stats.slice(1, 4);
    const title = readText(slide.title, 'Key Metrics');
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: x(1120),
        h: SLIDE_HEIGHT,
        fillColor: colors.primary,
        lineTransparency: 100,
    });
    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: x(1120),
        y: 0,
        w: SLIDE_WIDTH - x(1120),
        h: SLIDE_HEIGHT,
        fillColor: colors.bg,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'text',
        text: 'PRIMARY METRIC',
        x: x(340),
        y: y(170),
        w: x(440),
        h: y(40),
        fontFace: bodyFont,
        fontSize: Math.round(13 * textScale),
        bold: true,
        uppercase: true,
        color: '#FFFFFF',
        align: 'center',
    });

    if (hero) {
        nodes.push({
            kind: 'text',
            text: hero.value,
            x: x(140),
            y: y(360),
            w: x(840),
            h: y(180),
            fontFace: titleFont,
            fontSize: Math.round(92 * textScale),
            bold: true,
            color: '#FFFFFF',
            align: 'center',
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: hero.label,
            x: x(180),
            y: y(560),
            w: x(760),
            h: y(80),
            fontFace: bodyFont,
            fontSize: Math.round(28 * textScale),
            color: '#FFFFFF',
            align: 'center',
            fit: 'shrink',
            transparency: 10,
        });
    }

    nodes.push({
        kind: 'text',
        text: title,
        x: x(1210),
        y: y(170),
        w: x(560),
        h: y(100),
        fontFace: titleFont,
        fontSize: Math.round(36 * titleScale),
        bold: true,
        color: colors.text,
        fit: 'shrink',
    });

    secondary.forEach((stat, index) => {
        const rowY = y(390 + index * 190);
        nodes.push({
            kind: 'shape',
            shape: 'line',
            x: x(1210),
            y: rowY + y(118),
            w: x(560),
            h: 0,
            lineColor: colors.text,
            lineTransparency: 88,
            lineWidth: 0.6,
        });
        nodes.push({
            kind: 'text',
            text: stat.value,
            x: x(1210),
            y: rowY,
            w: x(180),
            h: y(80),
            fontFace: titleFont,
            fontSize: Math.round(34 * textScale),
            bold: true,
            color: colors.secondary || colors.primary,
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: stat.label,
            x: x(1430),
            y: rowY + y(18),
            w: x(340),
            h: y(64),
            fontFace: bodyFont,
            fontSize: Math.round(18 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 25,
        });
    });

    return {
        family: 'stats',
        variation: 'big-hero-stat',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildStatsDataProgress = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const stats = getStatsItems(slide).slice(0, 4);
    const title = readText(slide.title, 'Performance');
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.bg,
        lineTransparency: 100,
    });

    nodes.push({
        kind: 'text',
        text: title,
        x: x(120),
        y: y(110),
        w: x(1200),
        h: y(100),
        fontFace: titleFont,
        fontSize: Math.round(48 * titleScale),
        bold: true,
        color: colors.text,
        fit: 'shrink',
    });
    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: x(120),
        y: y(235),
        w: x(80),
        h: y(12),
        fillColor: colors.accent || colors.primary,
        lineTransparency: 100,
    });

    stats.forEach((stat, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const blockX = x(120 + col * 860);
        const blockY = y(390 + row * 250);
        const progress = parseStatPercent(stat.value);

        nodes.push({
            kind: 'text',
            text: stat.label,
            x: blockX,
            y: blockY,
            w: x(430),
            h: y(38),
            fontFace: bodyFont,
            fontSize: Math.round(22 * textScale),
            uppercase: true,
            color: colors.text,
            fit: 'shrink',
            transparency: 20,
        });
        nodes.push({
            kind: 'text',
            text: stat.value,
            x: blockX + x(450),
            y: blockY - y(10),
            w: x(220),
            h: y(64),
            fontFace: titleFont,
            fontSize: Math.round(36 * textScale),
            bold: true,
            color: colors.primary,
            align: 'right',
            fit: 'shrink',
        });
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: blockX,
            y: blockY + y(72),
            w: x(670),
            h: y(24),
            fillColor: colors.text,
            fillTransparency: 90,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: blockX,
            y: blockY + y(72),
            w: x((670 * progress) / 100),
            h: y(24),
            fillColor: index % 2 === 0 ? colors.primary : colors.secondary,
            lineTransparency: 100,
        });
    });

    return {
        family: 'stats',
        variation: 'data-progress',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildStatsTrendFocus = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const stats = getStatsItems(slide).slice(0, 3);
    const title = readText(slide.title, 'Performance');
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    addAbstractBackground(nodes, colors);

    nodes.push({
        kind: 'text',
        text: 'PERFORMANCE',
        x: x(710),
        y: y(110),
        w: x(500),
        h: y(34),
        fontFace: bodyFont,
        fontSize: Math.round(13 * textScale),
        bold: true,
        uppercase: true,
        color: colors.text,
        align: 'center',
        transparency: 40,
    });
    nodes.push({
        kind: 'text',
        text: title,
        x: x(260),
        y: y(160),
        w: x(1400),
        h: y(100),
        fontFace: titleFont,
        fontSize: Math.round(48 * titleScale),
        bold: true,
        color: colors.text,
        align: 'center',
        fit: 'shrink',
    });
    nodes.push({
        kind: 'shape',
        shape: 'line',
        x: x(220),
        y: y(300),
        w: x(1480),
        h: 0,
        lineColor: colors.text,
        lineTransparency: 88,
        lineWidth: 0.6,
    });

    const cardWidth = x(480);
    stats.forEach((stat, index) => {
        const cardX = x(240 + index * 500);
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: cardX,
            y: y(380),
            w: cardWidth,
            h: y(420),
            fillColor: '#FFFFFF',
            fillTransparency: 92,
            lineColor: colors.text,
            lineTransparency: 88,
            lineWidth: 0.6,
        });
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: cardX + x(200),
            y: y(430),
            w: x(80),
            h: y(80),
            fillColor: index === 1 ? colors.primary : colors.secondary,
            fillTransparency: 88,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: index % 2 === 0 ? '↗' : '↑',
            x: cardX + x(218),
            y: y(445),
            w: x(44),
            h: y(46),
            fontFace: titleFont,
            fontSize: Math.round(24 * textScale),
            bold: true,
            color: index === 1 ? colors.primary : colors.secondary,
            align: 'center',
        });
        nodes.push({
            kind: 'text',
            text: stat.value,
            x: cardX + x(40),
            y: y(560),
            w: cardWidth - x(80),
            h: y(88),
            fontFace: titleFont,
            fontSize: Math.round(42 * textScale),
            bold: true,
            color: colors.text,
            align: 'center',
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: stat.label,
            x: cardX + x(40),
            y: y(665),
            w: cardWidth - x(80),
            h: y(42),
            fontFace: bodyFont,
            fontSize: Math.round(14 * textScale),
            bold: true,
            uppercase: true,
            color: colors.text,
            align: 'center',
            fit: 'shrink',
            transparency: 45,
        });
    });

    return {
        family: 'stats',
        variation: 'trend-focus',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildChartNode = (
    chartData: ReturnType<typeof normalizeChart>,
    colors: ColorPalette,
    xPos: number,
    yPos: number,
    width: number,
    height: number,
    options?: {
        showLegend?: boolean;
        legendPos?: 'b' | 't' | 'l' | 'r' | 'tr';
        showValue?: boolean;
        dataLabelPosition?: 'outEnd' | 'bestFit' | 'ctr' | 'inBase' | 'inEnd' | 'l' | 'r' | 't' | 'b';
        valAxisLabelColor?: string;
        catAxisLabelColor?: string;
        legendColor?: string;
        barGrouping?: 'stacked' | 'clustered' | 'percentStacked' | 'standard';
        barDir?: 'bar' | 'col';
        valAxisLineShow?: boolean;
        valGridLineColor?: string;
    }
): SceneNode | undefined => {
    if (!chartData || chartData.series.length === 0) return undefined;
    return {
        kind: 'chart',
        x: xPos,
        y: yPos,
        w: width,
        h: height,
        chartType: chartData.chartType,
        series: chartData.series,
        chartColors: getChartPalette(colors),
        options: {
            showLegend: options?.showLegend ?? true,
            legendPos: options?.legendPos ?? 'b',
            showTitle: false,
            showValue: options?.showValue ?? (chartData.chartType === 'pie' || chartData.chartType === 'doughnut'),
            dataLabelPosition: options?.dataLabelPosition ?? 'outEnd',
            valAxisLabelColor: options?.valAxisLabelColor ?? colors.text,
            catAxisLabelColor: options?.catAxisLabelColor ?? colors.text,
            legendColor: options?.legendColor ?? colors.text,
            barGrouping: options?.barGrouping ?? (chartData.isStacked ? 'stacked' : 'clustered'),
            barDir: options?.barDir ?? (chartData.isHorizontal ? 'bar' : 'col'),
            valAxisLineShow: options?.valAxisLineShow ?? false,
            valGridLineColor: options?.valGridLineColor ?? colors.text,
        },
    };
};

const buildChartDefaultContainer = (ctx: SceneBuildContext): SlideScene | undefined => {
    const { slide, presentation, colors } = ctx;
    const chart = normalizeChart(slide);
    if (!chart || chart.series.length === 0) return undefined;
    const title = readText(slide.title, 'Chart');
    const titleFont = getHeadingFont(presentation);
    const titleScale = getTitleScale(presentation);
    const nodes: SceneNode[] = [];

    addAbstractBackground(nodes, colors);
    nodes.push({
        kind: 'text',
        text: title,
        x: x(300),
        y: y(120),
        w: x(1320),
        h: y(90),
        fontFace: titleFont,
        fontSize: Math.round(40 * titleScale),
        bold: true,
        color: colors.text,
        align: 'center',
        fit: 'shrink',
    });
    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(180),
        y: y(270),
        w: x(1560),
        h: y(640),
        fillColor: '#FFFFFF',
        fillTransparency: 82,
        lineColor: colors.text,
        lineTransparency: 88,
        lineWidth: 0.6,
    });

    const chartNode = buildChartNode(chart, colors, x(250), y(320), x(1420), y(520));
    if (chartNode) nodes.push(chartNode);

    return {
        family: 'chart',
        variation: 'default-container',
        backgroundColor: colors.bg,
        nodes,
    };
};

const buildChartSplitDetail = (ctx: SceneBuildContext): SlideScene | undefined => {
    const { slide, presentation, colors } = ctx;
    const chart = normalizeChart(slide);
    if (!chart || chart.series.length === 0) return undefined;
    const title = readText(slide.title, 'Chart');
    const desc = readText(slide.content?.description, `Analysis of ${chart.raw?.title || title}.`);
    const totalValue = (chart.series[0]?.values || []).reduce((a, b) => a + b, 0);
    const avgValue = Math.round(totalValue / Math.max(1, chart.series[0]?.values?.length || 1));
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    nodes.push({ kind: 'shape', shape: 'line', x: x(1150), y: y(140), w: 0, h: y(820), lineColor: colors.text, lineTransparency: 90, lineWidth: 0.6 });
    nodes.push({
        kind: 'text', text: title, x: x(150), y: y(130), w: x(820), h: y(80),
        fontFace: titleFont, fontSize: Math.round(34 * titleScale), bold: true, color: colors.text, fit: 'shrink',
    });
    const chartNode = buildChartNode(chart, colors, x(120), y(260), x(920), y(560));
    if (chartNode) nodes.push(chartNode);
    nodes.push({ kind: 'text', text: 'TOTAL VALUE', x: x(1260), y: y(250), w: x(420), h: y(28), fontFace: bodyFont, fontSize: Math.round(14 * textScale), bold: true, uppercase: true, color: colors.text, transparency: 40 });
    nodes.push({ kind: 'text', text: totalValue.toLocaleString(), x: x(1260), y: y(290), w: x(480), h: y(90), fontFace: titleFont, fontSize: Math.round(48 * titleScale), bold: true, color: colors.primary, fit: 'shrink' });
    nodes.push({ kind: 'text', text: 'AVERAGE', x: x(1260), y: y(450), w: x(420), h: y(28), fontFace: bodyFont, fontSize: Math.round(14 * textScale), bold: true, uppercase: true, color: colors.text, transparency: 40 });
    nodes.push({ kind: 'text', text: avgValue.toLocaleString(), x: x(1260), y: y(490), w: x(420), h: y(70), fontFace: titleFont, fontSize: Math.round(36 * titleScale), bold: true, color: colors.text, fit: 'shrink', transparency: 20 });
    nodes.push({ kind: 'shape', shape: 'roundRect', x: x(1230), y: y(650), w: x(500), h: y(180), fillColor: colors.primary, fillTransparency: 96, lineColor: colors.text, lineTransparency: 90, lineWidth: 0.6 });
    nodes.push({ kind: 'text', text: 'KEY INSIGHT', x: x(1260), y: y(680), w: x(200), h: y(26), fontFace: bodyFont, fontSize: Math.round(13 * textScale), bold: true, color: colors.text });
    nodes.push({ kind: 'text', text: desc, x: x(1260), y: y(720), w: x(420), h: y(86), fontFace: bodyFont, fontSize: Math.round(14 * textScale), color: colors.text, fit: 'shrink', transparency: 20 });

    return { family: 'chart', variation: 'split-detail', backgroundColor: colors.bg, nodes };
};

const buildChartFloatingCard = (ctx: SceneBuildContext): SlideScene | undefined => {
    const { slide, presentation, colors } = ctx;
    const chart = normalizeChart(slide);
    if (!chart || chart.series.length === 0) return undefined;
    const title = readText(slide.title, 'Chart');
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    addAbstractBackground(nodes, colors);
    nodes.push({ kind: 'shape', shape: 'roundRect', x: x(240), y: y(170), w: x(1440), h: y(740), fillColor: colors.bg, fillTransparency: 6, lineColor: colors.text, lineTransparency: 90, lineWidth: 0.6 });
    nodes.push({ kind: 'text', text: title, x: x(320), y: y(240), w: x(760), h: y(72), fontFace: titleFont, fontSize: Math.round(34 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
    nodes.push({ kind: 'shape', shape: 'roundRect', x: x(1320), y: y(245), w: x(220), h: y(44), fillColor: colors.primary, fillTransparency: 84, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: `${chart.raw?.type || chart.chartType} Analysis`, x: x(1320), y: y(254), w: x(220), h: y(26), fontFace: bodyFont, fontSize: Math.round(14 * textScale), bold: true, color: colors.primary, align: 'center', valign: 'middle', fit: 'shrink' });
    const chartNode = buildChartNode(chart, colors, x(320), y(360), x(1280), y(450));
    if (chartNode) nodes.push(chartNode);

    return { family: 'chart', variation: 'floating-card', backgroundColor: colors.bg, nodes };
};

const buildChartFullBleedHero = (ctx: SceneBuildContext): SlideScene | undefined => {
    const { slide, presentation, colors } = ctx;
    const chart = normalizeChart(slide);
    if (!chart || chart.series.length === 0) return undefined;
    const title = readText(slide.title, 'Data Visualization');
    const desc = readText(slide.content?.description);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.primary, lineTransparency: 100 });
    nodes.push({ kind: 'shape', shape: 'ellipse', x: x(1150), y: y(-160), w: x(900), h: y(720), fillColor: colors.secondary || colors.accent, fillTransparency: 82, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: 'DATA VISUALIZATION', x: x(120), y: y(110), w: x(300), h: y(28), fontFace: bodyFont, fontSize: Math.round(12 * textScale), bold: true, uppercase: true, color: '#FFFFFF', transparency: 20 });
    nodes.push({ kind: 'text', text: title, x: x(120), y: y(170), w: x(980), h: y(120), fontFace: titleFont, fontSize: Math.round(48 * titleScale), bold: true, color: '#FFFFFF', fit: 'shrink' });
    if (desc) nodes.push({ kind: 'text', text: desc, x: x(120), y: y(320), w: x(760), h: y(80), fontFace: bodyFont, fontSize: Math.round(20 * textScale), color: '#FFFFFF', fit: 'shrink', transparency: 25 });
    nodes.push({ kind: 'shape', shape: 'roundRect', x: x(120), y: y(500), w: x(1680), h: y(430), fillColor: '#FFFFFF', fillTransparency: 88, lineColor: '#FFFFFF', lineTransparency: 75, lineWidth: 0.8 });
    const chartNode = buildChartNode(chart, { ...colors, text: '#FFFFFF', bg: colors.primary }, x(200), y(555), x(1520), y(300), { valAxisLabelColor: '#FFFFFF', catAxisLabelColor: '#FFFFFF', legendColor: '#FFFFFF', valGridLineColor: '#FFFFFF' });
    if (chartNode) nodes.push(chartNode);

    return { family: 'chart', variation: 'full-bleed-hero', backgroundColor: colors.primary, nodes };
};

const buildChartMinimalStat = (ctx: SceneBuildContext): SlideScene | undefined => {
    const { slide, presentation, colors } = ctx;
    const chart = normalizeChart(slide);
    if (!chart || chart.series.length === 0) return undefined;
    const title = readText(slide.title, 'Chart');
    const desc = readText(slide.content?.description);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: title, x: x(250), y: y(110), w: x(1420), h: y(90), fontFace: titleFont, fontSize: Math.round(40 * titleScale), color: colors.text, align: 'center', fit: 'shrink' });
    const chartNode = buildChartNode(chart, colors, x(300), y(280), x(1320), y(560), { showLegend: true, legendPos: 'b' });
    if (chartNode) nodes.push(chartNode);
    if (desc) nodes.push({ kind: 'text', text: desc, x: x(420), y: y(890), w: x(1080), h: y(50), fontFace: bodyFont, fontSize: Math.round(18 * textScale), color: colors.text, align: 'center', fit: 'shrink', transparency: 40 });

    return { family: 'chart', variation: 'minimal-stat', backgroundColor: colors.bg, nodes };
};

const buildChartShowcase = (ctx: SceneBuildContext): SlideScene | undefined => {
    const { slide, presentation, colors } = ctx;
    const chart = normalizeChart(slide);
    if (!chart || chart.series.length === 0) return undefined;
    const title = readText(slide.title, 'Exhibit');
    const insight = readText(slide.subtitle || slide.content?.text, 'Analyze the significant trends observed in this data visualization.');
    const source = readText(slide.content?.source, 'Source: Excel / Data Export');
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const cardText = '#111827';
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.primary, fillTransparency: 97, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: title, x: x(140), y: y(90), w: x(1280), h: y(70), fontFace: titleFont, fontSize: Math.round(34 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
    nodes.push({ kind: 'shape', shape: 'roundRect', x: x(1600), y: y(96), w: x(140), h: y(30), fillColor: colors.text, fillTransparency: 95, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: 'Exhibit 1.0', x: x(1600), y: y(100), w: x(140), h: y(22), fontFace: bodyFont, fontSize: Math.round(9 * textScale), bold: true, uppercase: true, color: colors.text, align: 'center', fit: 'shrink', transparency: 40 });
    nodes.push({ kind: 'shape', shape: 'roundRect', x: x(180), y: y(210), w: x(1560), h: y(710), fillColor: '#FFFFFF', lineColor: colors.text, lineTransparency: 95, lineWidth: 0.5 });
    const chartNode = buildChartNode(chart, { ...colors, bg: '#FFFFFF', text: cardText }, x(250), y(280), x(1420), y(390), { valAxisLabelColor: cardText, catAxisLabelColor: cardText, legendColor: cardText, valGridLineColor: '#D1D5DB' });
    if (chartNode) nodes.push(chartNode);
    nodes.push({ kind: 'shape', shape: 'rect', x: x(180), y: y(720), w: x(18), h: y(150), fillColor: colors.primary, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: 'KEY INSIGHT', x: x(230), y: y(745), w: x(180), h: y(24), fontFace: bodyFont, fontSize: Math.round(13 * textScale), bold: true, uppercase: true, color: colors.primary });
    nodes.push({ kind: 'text', text: insight, x: x(230), y: y(785), w: x(1020), h: y(54), fontFace: bodyFont, fontSize: Math.round(20 * textScale), bold: true, color: cardText, fit: 'shrink' });
    nodes.push({ kind: 'text', text: source, x: x(1380), y: y(820), w: x(280), h: y(24), fontFace: bodyFont, fontSize: Math.round(9 * textScale), uppercase: true, color: cardText, align: 'right', fit: 'shrink', transparency: 40 });

    return { family: 'chart', variation: 'chart-showcase', backgroundColor: colors.bg, nodes };
};

const buildChartAnalysis = (ctx: SceneBuildContext): SlideScene | undefined => {
    const { slide, presentation, colors } = ctx;
    const chart = normalizeChart(slide);
    if (!chart || chart.series.length === 0) return undefined;
    const title = readText(slide.title, 'Analysis');
    const subtitle = readText(slide.subtitle, 'Key Insight Overview');
    const body = getBodyText(slide);
    const source = readText(slide.content?.source, 'Source: Internal Business Intelligence');
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const chartText = '#111827';
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    nodes.push({ kind: 'shape', shape: 'line', x: x(120), y: y(140), w: 0, h: y(90), lineColor: colors.primary, lineWidth: 2, lineTransparency: 0 });
    nodes.push({ kind: 'text', text: title, x: x(160), y: y(130), w: x(900), h: y(70), fontFace: titleFont, fontSize: Math.round(34 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
    nodes.push({ kind: 'shape', shape: 'roundRect', x: x(110), y: y(270), w: x(980), h: y(620), fillColor: '#FFFFFF', lineColor: colors.text, lineTransparency: 95, lineWidth: 0.5 });
    const chartNode = buildChartNode(chart, { ...colors, bg: '#FFFFFF', text: chartText }, x(150), y(320), x(900), y(500), { valAxisLabelColor: chartText, catAxisLabelColor: chartText, legendColor: chartText, valGridLineColor: '#D1D5DB' });
    if (chartNode) nodes.push(chartNode);
    nodes.push({ kind: 'text', text: source, x: x(150), y: y(910), w: x(760), h: y(22), fontFace: bodyFont, fontSize: Math.round(9 * textScale), uppercase: true, italic: true, color: colors.text, transparency: 60 });
    nodes.push({ kind: 'shape', shape: 'roundRect', x: x(1200), y: y(265), w: x(180), h: y(30), fillColor: colors.primary, fillTransparency: 88, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: 'EXECUTIVE SUMMARY', x: x(1200), y: y(270), w: x(180), h: y(20), fontFace: bodyFont, fontSize: Math.round(9 * textScale), bold: true, uppercase: true, color: colors.primary, align: 'center', fit: 'shrink' });
    nodes.push({ kind: 'text', text: subtitle, x: x(1200), y: y(350), w: x(520), h: y(80), fontFace: titleFont, fontSize: Math.round(24 * titleScale), bold: true, color: colors.primary, fit: 'shrink' });
    nodes.push({ kind: 'text', text: body || 'Observation of primary growth trends across key segments.', x: x(1200), y: y(470), w: x(520), h: y(260), fontFace: bodyFont, fontSize: Math.round(18 * textScale), color: colors.text, fit: 'shrink', transparency: 20 });

    return { family: 'chart', variation: 'chart-analysis', backgroundColor: colors.bg, nodes };
};

const buildTextColumnsClassic = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const columns = getTextColumns(slide).slice(0, 3);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    addAbstractBackground(nodes, colors);
    nodes.push({ kind: 'text', text: readText(slide.title, 'Overview'), x: x(230), y: y(120), w: x(1460), h: y(90), fontFace: titleFont, fontSize: Math.round(40 * titleScale), bold: true, color: colors.text, align: 'center', fit: 'shrink' });

    columns.forEach((column, index) => {
        const startX = x(150 + (index * 560));
        nodes.push({ kind: 'shape', shape: 'roundRect', x: startX, y: y(290), w: x(470), h: y(520), fillColor: '#FFFFFF', fillTransparency: 12, lineColor: colors.primary, lineTransparency: 88, lineWidth: 0.6 });
        nodes.push({ kind: 'text', text: column.title, x: startX + x(32), y: y(340), w: x(406), h: y(60), fontFace: titleFont, fontSize: Math.round(22 * titleScale), bold: true, color: colors.primary, fit: 'shrink' });
        nodes.push({ kind: 'text', text: column.text, x: startX + x(32), y: y(420), w: x(406), h: y(320), fontFace: bodyFont, fontSize: Math.round(18 * textScale), color: colors.text, fit: 'shrink', transparency: 8 });
    });

    return { family: 'text-columns', variation: 'classic', backgroundColor: colors.bg, nodes };
};

const buildTextColumnsNumberedEditorial = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const columns = getTextColumns(slide).slice(0, 3);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: readText(slide.title, 'Overview'), x: x(70), y: y(70), w: x(1700), h: y(70), fontFace: titleFont, fontSize: Math.round(32 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
    nodes.push({ kind: 'shape', shape: 'line', x: x(70), y: y(152), w: x(1780), h: 0, lineColor: colors.text, lineTransparency: 92, lineWidth: 0.8 });

    columns.forEach((column, index) => {
        const startX = x(70 + (index * 610));
        nodes.push({ kind: 'text', text: `0${index + 1}`, x: startX - x(14), y: y(228), w: x(220), h: y(92), fontFace: titleFont, fontSize: Math.round(68 * titleScale), bold: true, color: colors.text, transparency: 92 });
        nodes.push({ kind: 'shape', shape: 'roundRect', x: startX + x(18), y: y(314), w: x(8), h: y(42), fillColor: colors.accent || colors.primary, lineTransparency: 100 });
        nodes.push({ kind: 'text', text: column.title, x: startX + x(42), y: y(318), w: x(448), h: y(48), fontFace: titleFont, fontSize: Math.round(20 * titleScale), bold: true, color: colors.primary, fit: 'shrink' });
        nodes.push({ kind: 'text', text: column.text, x: startX, y: y(388), w: x(500), h: y(432), fontFace: bodyFont, fontSize: Math.round(17 * textScale), color: colors.text, fit: 'shrink', transparency: 8 });
    });

    return { family: 'text-columns', variation: 'numbered-editorial', backgroundColor: colors.bg, nodes };
};

const buildComparisonBalancedSplit = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const { left, right } = getComparisonData(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    nodes.push({ kind: 'shape', shape: 'rect', x: SLIDE_WIDTH / 2, y: 0, w: SLIDE_WIDTH / 2, h: SLIDE_HEIGHT, fillColor: colors.primary, fillTransparency: 97, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: readText(slide.title, 'Comparison'), x: x(120), y: y(58), w: x(1680), h: y(104), fontFace: titleFont, fontSize: Math.round(46 * titleScale), bold: true, color: colors.text, align: 'center', fit: 'shrink' });
    nodes.push({ kind: 'shape', shape: 'line', x: x(960), y: y(176), w: 0, h: y(690), lineColor: colors.text, lineTransparency: 95, lineWidth: 0.55 });
    nodes.push({ kind: 'text', text: left.title, x: x(120), y: y(252), w: x(720), h: y(64), fontFace: titleFont, fontSize: Math.round(30 * titleScale), bold: true, color: colors.primary, align: 'center', fit: 'shrink' });
    nodes.push({ kind: 'text', text: right.title, x: x(1080), y: y(252), w: x(720), h: y(64), fontFace: titleFont, fontSize: Math.round(30 * titleScale), bold: true, color: colors.secondary || colors.accent, align: 'center', fit: 'shrink' });

    left.items.slice(0, 6).forEach((item, index) => {
        const itemY = y(338 + index * 92);
        nodes.push({ kind: 'shape', shape: 'ellipse', x: x(74), y: itemY + y(12), w: x(10), h: y(10), fillColor: '#9CA3AF', lineTransparency: 100 });
        nodes.push({ kind: 'text', text: item, x: x(102), y: itemY, w: x(760), h: y(60), fontFace: bodyFont, fontSize: Math.round(20 * textScale), color: colors.text, fit: 'shrink' });
    });

    right.items.slice(0, 6).forEach((item, index) => {
        const itemY = y(338 + index * 92);
        nodes.push({ kind: 'shape', shape: 'ellipse', x: x(1038), y: itemY + y(12), w: x(10), h: y(10), fillColor: '#9CA3AF', lineTransparency: 100 });
        nodes.push({ kind: 'text', text: item, x: x(1066), y: itemY, w: x(760), h: y(60), fontFace: bodyFont, fontSize: Math.round(20 * textScale), color: colors.text, fit: 'shrink' });
    });

    return { family: 'comparison', variation: 'balanced-split', backgroundColor: colors.bg, nodes };
};

const buildTimelineConnectedCards = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const items = getTimelineItems(slide).slice(0, 4);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    addAbstractBackground(nodes, colors);
    nodes.push({ kind: 'text', text: readText(slide.title, 'Roadmap'), x: x(450), y: y(320), w: x(1020), h: y(74), fontFace: titleFont, fontSize: Math.round(38 * titleScale), bold: true, color: colors.text, align: 'center', fit: 'shrink' });
    nodes.push({ kind: 'shape', shape: 'line', x: x(320), y: y(602), w: x(1280), h: 0, lineColor: colors.primary, lineTransparency: 72, lineWidth: 2.5 });

    items.forEach((item, index) => {
        const cardX = x(320 + (index * 325));
        nodes.push({ kind: 'shape', shape: 'roundRect', x: cardX, y: y(520), w: x(300), h: y(246), fillColor: '#FFFFFF', fillTransparency: 10, lineColor: colors.text, lineTransparency: 92, lineWidth: 0.6 });
        nodes.push({ kind: 'shape', shape: 'ellipse', x: cardX - x(16), y: y(590), w: x(24), h: y(24), fillColor: colors.bg, lineColor: colors.primary, lineTransparency: 0, lineWidth: 1.5 });
        nodes.push({ kind: 'text', text: item.date || `Step ${index + 1}`, x: cardX + x(18), y: y(548), w: x(120), h: y(30), fontFace: bodyFont, fontSize: Math.round(12 * textScale), bold: true, uppercase: true, color: colors.primary, fit: 'shrink' });
        nodes.push({ kind: 'text', text: item.title, x: cardX + x(18), y: y(604), w: x(260), h: y(44), fontFace: titleFont, fontSize: Math.round(16 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
        nodes.push({ kind: 'text', text: item.description, x: cardX + x(18), y: y(662), w: x(260), h: y(82), fontFace: bodyFont, fontSize: Math.round(14 * textScale), color: colors.text, fit: 'shrink', transparency: 20 });
    });

    return { family: 'timeline', variation: 'connected-cards', backgroundColor: colors.bg, nodes };
};

const buildInfographicCycleFlow = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const steps = getInfographicSteps(slide).slice(0, 3);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const imageUrl = getImageUrl(slide);
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    if (imageUrl) {
        nodes.push({ kind: 'image', path: imageUrl, x: x(340), y: y(80), w: x(1240), h: y(860), sizing: 'cover', transparency: 86 });
    }
    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: '#FFFFFF', fillTransparency: 14, lineTransparency: 100 });
    [640, 860, 1080, 1300, 1520].forEach((gridX) => {
        nodes.push({ kind: 'shape', shape: 'line', x: x(gridX), y: y(80), w: 0, h: y(860), lineColor: '#FFFFFF', lineTransparency: 55, lineWidth: 0.5 });
    });
    [350, 570, 790].forEach((gridY) => {
        nodes.push({ kind: 'shape', shape: 'line', x: x(340), y: y(gridY), w: x(1240), h: 0, lineColor: '#FFFFFF', lineTransparency: 55, lineWidth: 0.5 });
    });
    nodes.push({ kind: 'shape', shape: 'rect', x: x(92), y: y(18), w: x(120), h: y(152), fillColor: colors.primary, fillTransparency: 88, rotation: -6, lineTransparency: 100 });
    nodes.push({ kind: 'shape', shape: 'rect', x: x(1345), y: y(305), w: x(110), h: y(156), fillColor: colors.primary, fillTransparency: 88, rotation: 7, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: readText(slide.title, 'Cycle'), x: x(80), y: y(64), w: x(760), h: y(60), fontFace: titleFont, fontSize: Math.round(26 * titleScale), bold: true, color: colors.text, fit: 'shrink' });

    const stepColors = [colors.primary, colors.secondary || '#DC2626', colors.accent || '#F97316'];
    const bubbleSize = 108;
    const centerX = 960;
    const centerY = 520;
    const positions = [
        { px: centerX - (bubbleSize / 2), py: 210, lx: centerX - 92, ly: 328 },
        { px: 1145, py: 560, lx: 1104, ly: 678 },
        { px: 667, py: 560, lx: 626, ly: 678 },
    ];

    const addDirectedLine = (x1: number, y1: number, x2: number, y2: number) => {
        nodes.push({
            kind: 'shape',
            shape: 'line',
            x: x(Math.min(x1, x2)),
            y: y(Math.min(y1, y2)),
            w: x(Math.abs(x2 - x1)),
            h: y(Math.abs(y2 - y1)),
            flipH: x2 < x1,
            flipV: y2 < y1,
            lineColor: colors.primary,
            lineTransparency: 28,
            lineWidth: 2.8,
        });
    };

    const addArrowHead = (tipX: number, tipY: number, leftX: number, leftY: number, rightX: number, rightY: number) => {
        addDirectedLine(leftX, leftY, tipX, tipY);
        addDirectedLine(rightX, rightY, tipX, tipY);
    };

    addDirectedLine(centerX, 264, 1198, 614);
    addDirectedLine(1198, 614, 722, 614);
    addDirectedLine(722, 614, centerX, 264);

    addArrowHead(1198, 614, 1168, 604, 1180, 580);
    addArrowHead(722, 614, 748, 594, 748, 634);
    addArrowHead(centerX, 264, 944, 294, 976, 294);

    steps.forEach((step, index) => {
        const pos = positions[index];
        if (!pos) return;
        nodes.push({ kind: 'shape', shape: 'ellipse', x: x(pos.px), y: y(pos.py), w: x(bubbleSize), h: y(bubbleSize), fillColor: stepColors[index], lineColor: '#FFFFFF', lineTransparency: 0, lineWidth: 2 });
        nodes.push({ kind: 'text', text: String(index + 1), x: x(pos.px), y: y(pos.py + 22), w: x(bubbleSize), h: y(34), fontFace: titleFont, fontSize: Math.round(24 * titleScale), bold: true, color: '#FFFFFF', align: 'center', fit: 'shrink' });
        nodes.push({ kind: 'text', text: step.label, x: x(pos.lx), y: y(pos.ly), w: x(184), h: y(38), fontFace: bodyFont, fontSize: Math.round(11 * textScale), bold: true, uppercase: true, color: colors.text, align: 'center', fit: 'shrink' });
    });

    nodes.push({ kind: 'shape', shape: 'ellipse', x: x(centerX - 118), y: y(centerY - 118), w: x(236), h: y(236), fillColor: '#FFFFFF', fillTransparency: 4, lineColor: colors.primary, lineTransparency: 74, lineWidth: 1.4 });
    nodes.push({ kind: 'text', text: 'CYCLE', x: x(centerX - 60), y: y(centerY - 18), w: x(120), h: y(24), fontFace: bodyFont, fontSize: Math.round(11 * textScale), bold: true, uppercase: true, color: colors.primary, align: 'center' });
    nodes.push({ kind: 'text', text: 'PROCESS', x: x(centerX - 72), y: y(centerY + 16), w: x(144), h: y(20), fontFace: bodyFont, fontSize: Math.round(9 * textScale), uppercase: true, color: colors.text, align: 'center', transparency: 40 });

    return { family: 'infographic', variation: 'cycle-flow', backgroundColor: colors.bg, nodes };
};

const buildInfographicHubSpoke = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const steps = getInfographicSteps(slide).slice(0, 4);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const imageUrl = getImageUrl(slide);
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    if (imageUrl) {
        nodes.push({ kind: 'image', path: imageUrl, x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, sizing: 'cover', transparency: 84 });
    }
    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: '#FFFFFF', fillTransparency: 12, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: readText(slide.title, 'Process'), x: x(80), y: y(64), w: x(820), h: y(60), fontFace: titleFont, fontSize: Math.round(28 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
    nodes.push({ kind: 'shape', shape: 'ellipse', x: x(800), y: y(390), w: x(300), h: y(300), fillColor: '#FFFFFF', fillTransparency: 4, lineColor: colors.primary, lineTransparency: 78, lineWidth: 1.8 });
    nodes.push({ kind: 'text', text: readText(slide.title, 'Process'), x: x(840), y: y(485), w: x(220), h: y(60), fontFace: titleFont, fontSize: Math.round(20 * titleScale), bold: true, color: colors.text, align: 'center', fit: 'shrink' });

    const cardPositions = [
        { x0: 825, y0: 150 },
        { x0: 1175, y0: 485 },
        { x0: 825, y0: 790 },
        { x0: 505, y0: 485 },
    ];

    const connectors = [
        { px: 950, py: 274, pw: 0, ph: 116 },
        { px: 1100, py: 540, pw: 75, ph: 0 },
        { px: 950, py: 690, pw: 0, ph: 100 },
        { px: 735, py: 540, pw: 65, ph: 0 },
    ];

    connectors.forEach((connector) => {
        nodes.push({
            kind: 'shape',
            shape: 'line',
            x: x(connector.px),
            y: y(connector.py),
            w: x(connector.pw),
            h: y(connector.ph),
            lineColor: colors.primary,
            lineTransparency: 80,
            lineWidth: 1.1,
        });
    });

    steps.forEach((step, index) => {
        const pos = cardPositions[index];
        if (!pos) return;
        nodes.push({ kind: 'shape', shape: 'roundRect', x: x(pos.x0), y: y(pos.y0), w: x(250), h: y(124), fillColor: '#FFFFFF', fillTransparency: 4, lineColor: colors.text, lineTransparency: 94, lineWidth: 0.5 });
        nodes.push({ kind: 'shape', shape: 'ellipse', x: x(pos.x0 + 103), y: y(pos.y0 - 24), w: x(44), h: y(44), fillColor: [colors.primary, colors.secondary || colors.primary, colors.accent || colors.primary, '#DC2626'][index], lineColor: '#FFFFFF', lineTransparency: 0, lineWidth: 1.1 });
        nodes.push({ kind: 'text', text: String(index + 1), x: x(pos.x0 + 103), y: y(pos.y0 - 14), w: x(44), h: y(18), fontFace: titleFont, fontSize: Math.round(12 * titleScale), bold: true, color: '#FFFFFF', align: 'center' });
        nodes.push({ kind: 'text', text: step.label, x: x(pos.x0 + 16), y: y(pos.y0 + 24), w: x(218), h: y(28), fontFace: bodyFont, fontSize: Math.round(11 * textScale), bold: true, color: colors.text, align: 'center', fit: 'shrink' });
        if (step.description) {
            nodes.push({ kind: 'text', text: step.description, x: x(pos.x0 + 16), y: y(pos.y0 + 60), w: x(218), h: y(44), fontFace: bodyFont, fontSize: Math.round(8 * textScale), color: colors.text, align: 'center', fit: 'shrink', transparency: 34 });
        }
    });

    return { family: 'infographic', variation: 'hub-spoke', backgroundColor: colors.bg, nodes };
};

const buildTableDataGrid = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const { columns, rows } = getTableData(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    const colWidths = columns.length > 0
        ? columns.map((_, index) => index === columns.length - 1 ? x(727) : x(355))
        : undefined;

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: 'DATA REPORT', x: x(64), y: y(78), w: x(210), h: y(24), fontFace: bodyFont, fontSize: Math.round(10 * textScale), bold: true, uppercase: true, color: colors.text, transparency: 45 });
    nodes.push({ kind: 'text', text: readText(slide.title, 'Table'), x: x(64), y: y(110), w: x(860), h: y(54), fontFace: titleFont, fontSize: Math.round(24 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
    nodes.push({ kind: 'shape', shape: 'line', x: x(64), y: y(182), w: x(1780), h: 0, lineColor: colors.text, lineTransparency: 92, lineWidth: 0.6 });
    nodes.push({ kind: 'shape', shape: 'roundRect', x: x(1680), y: y(96), w: x(110), h: y(34), fillColor: '#FEE2E2', lineTransparency: 100 });
    nodes.push({ kind: 'text', text: '- Negative', x: x(1680), y: y(103), w: x(110), h: y(18), fontFace: bodyFont, fontSize: Math.round(9 * textScale), bold: true, color: '#DC2626', align: 'center' });
    nodes.push({ kind: 'shape', shape: 'roundRect', x: x(1798), y: y(96), w: x(100), h: y(34), fillColor: '#DCFCE7', lineTransparency: 100 });
    nodes.push({ kind: 'text', text: '+ Positive', x: x(1798), y: y(103), w: x(100), h: y(18), fontFace: bodyFont, fontSize: Math.round(9 * textScale), bold: true, color: '#16A34A', align: 'center' });
    nodes.push({ kind: 'shape', shape: 'roundRect', x: x(64), y: y(238), w: x(1792), h: y(820), fillColor: '#FFFFFF', fillTransparency: 4, lineColor: colors.text, lineTransparency: 95, lineWidth: 0.45 });
    nodes.push({
        kind: 'table',
        x: x(64),
        y: y(238),
        w: x(1792),
        h: y(820),
        columns,
        rows,
        fontFace: bodyFont,
        fontSize: Math.round(11 * textScale),
        color: colors.text,
        headerFillColor: '#FBEAE1',
        headerColor: colors.primary,
        rowStripeColor: '#FFFFFF',
        borderColor: '#F1F5F9',
        colWidths,
        alignments: columns.map((_, index) => index === 0 || index === columns.length - 1 ? 'left' : 'right'),
        rowHeights: [0.32, ...rows.map(() => 0.28)],
        margin: 0.04,
    });

    return { family: 'table', variation: 'data-grid', backgroundColor: colors.bg, nodes };
};

const buildShowcaseLifestyleSplit = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Product Showcase');
    const subtitle = readText(slide.subtitle);
    const items = getShowcaseItems(slide).slice(0, 3);
    const image = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    if (image) {
        nodes.push({
            kind: 'image',
            path: image,
            x: 0,
            y: 0,
            w: SLIDE_WIDTH * 0.6,
            h: SLIDE_HEIGHT,
            sizing: 'cover',
        });
    }
    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH * 0.6,
        h: SLIDE_HEIGHT,
        fillColor: '#000000',
        fillTransparency: 80,
        lineTransparency: 100,
    });
    nodes.push({
        kind: 'text',
        text: 'LIFESTYLE COLLECTION',
        x: x(130),
        y: y(760),
        w: x(360),
        h: y(34),
        fontFace: bodyFont,
        fontSize: Math.round(14 * textScale),
        bold: true,
        color: '#FFFFFF',
        fit: 'shrink',
    });
    nodes.push({
        kind: 'text',
        text: title,
        x: x(130),
        y: y(815),
        w: x(620),
        h: y(110),
        fontFace: titleFont,
        fontSize: Math.round(54 * titleScale),
        bold: true,
        color: '#FFFFFF',
        fit: 'shrink',
    });
    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: SLIDE_WIDTH * 0.6,
        y: 0,
        w: SLIDE_WIDTH * 0.4,
        h: SLIDE_HEIGHT,
        fillColor: colors.bg,
        lineTransparency: 100,
    });
    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(1230),
            y: y(220),
            w: x(500),
            h: y(120),
            fontFace: bodyFont,
            fontSize: Math.round(24 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 18,
        });
    }
    items.forEach((item, index) => {
        const baseY = 430 + index * 160;
        nodes.push({
            kind: 'text',
            text: item.title,
            x: x(1230),
            y: y(baseY),
            w: x(420),
            h: y(34),
            fontFace: titleFont,
            fontSize: Math.round(24 * titleScale),
            bold: true,
            color: colors.text,
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: item.description,
            x: x(1250),
            y: y(baseY + 42),
            w: x(450),
            h: y(72),
            fontFace: bodyFont,
            fontSize: Math.round(16 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 28,
        });
        nodes.push({
            kind: 'shape',
            shape: 'line',
            x: x(1220),
            y: y(baseY + 24),
            w: x(470),
            h: 0,
            lineColor: colors.text,
            lineTransparency: 84,
            lineWidth: 0.5,
        });
    });
    return { family: 'showcase', variation: 'lifestyle-split', backgroundColor: colors.bg, nodes };
};

const buildShowcaseAppMockup = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Platform Overview');
    const items = getShowcaseItems(slide).slice(0, 4);
    const image = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    nodes.push({
        kind: 'text',
        text: 'PLATFORM OVERVIEW',
        x: x(700),
        y: y(70),
        w: x(520),
        h: y(28),
        fontFace: bodyFont,
        fontSize: Math.round(13 * textScale),
        bold: true,
        color: colors.text,
        align: 'center',
        fit: 'shrink',
        transparency: 34,
    });
    nodes.push({
        kind: 'text',
        text: title,
        x: x(440),
        y: y(110),
        w: x(1040),
        h: y(70),
        fontFace: titleFont,
        fontSize: Math.round(42 * titleScale),
        bold: true,
        color: colors.text,
        align: 'center',
        fit: 'shrink',
    });
    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(780),
        y: y(265),
        w: x(360),
        h: y(560),
        fillColor: '#1F2937',
        lineColor: '#111827',
        lineWidth: 1,
    });
    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(808),
        y: y(300),
        w: x(304),
        h: y(490),
        fillColor: '#FFFFFF',
        lineTransparency: 100,
    });
    if (image) {
        nodes.push({
            kind: 'image',
            path: image,
            x: x(816),
            y: y(308),
            w: x(288),
            h: y(474),
            sizing: 'cover',
        });
    }
    items.slice(0, 2).forEach((item, index) => {
        const baseY = 330 + index * 190;
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(260),
            y: y(baseY),
            w: x(42),
            h: y(42),
            fillColor: getSurfaceColor(colors),
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: String(index + 1),
            x: x(260),
            y: y(baseY + 7),
            w: x(42),
            h: y(24),
            fontFace: bodyFont,
            fontSize: Math.round(14 * textScale),
            bold: true,
            color: colors.primary,
            align: 'center',
        });
        nodes.push({
            kind: 'text',
            text: item.title,
            x: x(110),
            y: y(baseY + 55),
            w: x(280),
            h: y(30),
            fontFace: titleFont,
            fontSize: Math.round(20 * titleScale),
            bold: true,
            color: colors.text,
            align: 'right',
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: item.description,
            x: x(70),
            y: y(baseY + 92),
            w: x(320),
            h: y(70),
            fontFace: bodyFont,
            fontSize: Math.round(15 * textScale),
            color: colors.text,
            align: 'right',
            fit: 'shrink',
            transparency: 26,
        });
    });
    items.slice(2, 4).forEach((item, index) => {
        const baseY = 330 + index * 190;
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(1618),
            y: y(baseY),
            w: x(42),
            h: y(42),
            fillColor: getSurfaceColor(colors),
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: String(index + 3),
            x: x(1618),
            y: y(baseY + 7),
            w: x(42),
            h: y(24),
            fontFace: bodyFont,
            fontSize: Math.round(14 * textScale),
            bold: true,
            color: colors.primary,
            align: 'center',
        });
        nodes.push({
            kind: 'text',
            text: item.title,
            x: x(1520),
            y: y(baseY + 55),
            w: x(300),
            h: y(30),
            fontFace: titleFont,
            fontSize: Math.round(20 * titleScale),
            bold: true,
            color: colors.text,
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: item.description,
            x: x(1520),
            y: y(baseY + 92),
            w: x(300),
            h: y(70),
            fontFace: bodyFont,
            fontSize: Math.round(15 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 26,
        });
    });
    return { family: 'showcase', variation: 'app-mockup', backgroundColor: colors.bg, nodes };
};

const buildShowcaseExplodedView = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Showcase');
    const subtitle = readText(slide.subtitle);
    const items = getShowcaseItems(slide).slice(0, 4);
    const image = getImageUrl(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: colors.bg,
        lineTransparency: 100,
    });
    for (let i = 0; i < 20; i++) {
        nodes.push({
            kind: 'shape',
            shape: 'line',
            x: x(i * 96),
            y: 0,
            w: 0,
            h: SLIDE_HEIGHT,
            lineColor: colors.text,
            lineTransparency: 92,
            lineWidth: 0.2,
        });
    }
    nodes.push({
        kind: 'text',
        text: title.toUpperCase(),
        x: x(240),
        y: y(90),
        w: x(1440),
        h: y(80),
        fontFace: titleFont,
        fontSize: Math.round(48 * titleScale),
        bold: true,
        color: colors.primary,
        align: 'center',
        fit: 'shrink',
    });
    if (subtitle) {
        nodes.push({
            kind: 'text',
            text: subtitle,
            x: x(400),
            y: y(180),
            w: x(1120),
            h: y(44),
            fontFace: bodyFont,
            fontSize: Math.round(20 * textScale),
            color: colors.text,
            align: 'center',
            fit: 'shrink',
            transparency: 20,
        });
    }
    nodes.push({
        kind: 'shape',
        shape: 'ellipse',
        x: x(690),
        y: y(330),
        w: x(540),
        h: y(540),
        lineColor: colors.text,
        lineTransparency: 84,
        lineWidth: 0.6,
        fillTransparency: 100,
    });
    if (image) {
        nodes.push({
            kind: 'image',
            path: image,
            x: x(760),
            y: y(395),
            w: x(400),
            h: y(400),
            sizing: 'contain',
        });
    }
    const positions = [
        { x: 250, y: 340, w: 300 },
        { x: 1370, y: 340, w: 300 },
        { x: 360, y: 785, w: 340 },
        { x: 1250, y: 785, w: 340 },
    ];
    items.forEach((item, index) => {
        const pos = positions[index];
        if (!pos) return;
        nodes.push({
            kind: 'text',
            text: item.title,
            x: x(pos.x),
            y: y(pos.y),
            w: x(pos.w),
            h: y(34),
            fontFace: titleFont,
            fontSize: Math.round(20 * titleScale),
            bold: true,
            color: colors.text,
            align: index % 2 === 0 ? 'right' : 'left',
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: item.description,
            x: x(pos.x),
            y: y(pos.y + 42),
            w: x(pos.w),
            h: y(70),
            fontFace: bodyFont,
            fontSize: Math.round(15 * textScale),
            color: colors.text,
            align: index % 2 === 0 ? 'right' : 'left',
            fit: 'shrink',
            transparency: 28,
        });
    });
    return { family: 'showcase', variation: 'exploded-view', backgroundColor: colors.bg, nodes };
};

const buildSwotClassicGrid = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'SWOT Analysis');
    const quadrants = getSwotQuadrants(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    nodes.push({
        kind: 'text',
        text: title,
        x: x(360),
        y: y(80),
        w: x(1200),
        h: y(70),
        fontFace: titleFont,
        fontSize: Math.round(42 * titleScale),
        bold: true,
        color: colors.text,
        align: 'center',
        fit: 'shrink',
    });
    const positions = [
        { x: 110, y: 220 },
        { x: 980, y: 220 },
        { x: 110, y: 640 },
        { x: 980, y: 640 },
    ];
    quadrants.forEach((quadrant, index) => {
        const pos = positions[index];
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(pos.x),
            y: y(pos.y),
            w: x(800),
            h: y(300),
            fillColor: quadrant.color,
            fillTransparency: 94,
            lineColor: quadrant.color,
            lineTransparency: 70,
            lineWidth: 0.8,
        });
        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: x(pos.x),
            y: y(pos.y),
            w: x(800),
            h: y(48),
            fillColor: quadrant.color,
            fillTransparency: 86,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: quadrant.title,
            x: x(pos.x + 26),
            y: y(pos.y + 10),
            w: x(300),
            h: y(22),
            fontFace: titleFont,
            fontSize: Math.round(17 * titleScale),
            bold: true,
            color: quadrant.color,
            fit: 'shrink',
        });
        quadrant.items.slice(0, 4).forEach((item, itemIndex) => {
            nodes.push({
                kind: 'text',
                text: `• ${item}`,
                x: x(pos.x + 28),
                y: y(pos.y + 70 + itemIndex * 48),
                w: x(720),
                h: y(34),
                fontFace: bodyFont,
                fontSize: Math.round(16 * textScale),
                color: colors.text,
                fit: 'shrink',
            });
        });
    });
    return { family: 'swot', variation: 'classic-grid', backgroundColor: colors.bg, nodes };
};

const buildSwotRoundedCards = (ctx: SceneBuildContext): SlideScene => {
    const scene = buildSwotClassicGrid(ctx);
    scene.variation = 'rounded-cards';
    return scene;
};

const buildSwotMinimalList = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'SWOT Analysis');
    const quadrants = getSwotQuadrants(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    nodes.push({
        kind: 'text',
        text: title,
        x: x(280),
        y: y(90),
        w: x(1360),
        h: y(62),
        fontFace: titleFont,
        fontSize: Math.round(40 * titleScale),
        bold: true,
        color: colors.text,
        align: 'center',
        fit: 'shrink',
    });
    quadrants.forEach((quadrant, index) => {
        const colX = 120 + index * 420;
        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: x(colX),
            y: y(240),
            w: x(280),
            h: y(4),
            fillColor: quadrant.color,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: quadrant.title.toUpperCase(),
            x: x(colX),
            y: y(255),
            w: x(280),
            h: y(24),
            fontFace: titleFont,
            fontSize: Math.round(15 * titleScale),
            bold: true,
            color: quadrant.color,
            fit: 'shrink',
        });
        quadrant.items.slice(0, 5).forEach((item, itemIndex) => {
            nodes.push({
                kind: 'text',
                text: item,
                x: x(colX),
                y: y(320 + itemIndex * 88),
                w: x(280),
                h: y(64),
                fontFace: bodyFont,
                fontSize: Math.round(15 * textScale),
                color: colors.text,
                fit: 'shrink',
                transparency: 12,
            });
        });
    });
    return { family: 'swot', variation: 'minimal-list', backgroundColor: colors.bg, nodes };
};

const buildExecutiveDashboard = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Executive Summary');
    const { stats, bullets, nextSteps } = getExecutiveData(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    nodes.push({
        kind: 'text',
        text: title,
        x: x(110),
        y: y(80),
        w: x(720),
        h: y(60),
        fontFace: titleFont,
        fontSize: Math.round(38 * titleScale),
        bold: true,
        color: colors.text,
        fit: 'shrink',
    });
    stats.slice(0, 3).forEach((stat, index) => {
        const left = 110 + index * 280;
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(left),
            y: y(185),
            w: x(240),
            h: y(135),
            fillColor: colors.primary,
            fillTransparency: 92,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: stat.value,
            x: x(left + 20),
            y: y(212),
            w: x(200),
            h: y(46),
            fontFace: titleFont,
            fontSize: Math.round(30 * titleScale),
            bold: true,
            color: colors.primary,
            align: 'center',
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: stat.label,
            x: x(left + 20),
            y: y(263),
            w: x(200),
            h: y(30),
            fontFace: bodyFont,
            fontSize: Math.round(13 * textScale),
            color: colors.text,
            align: 'center',
            fit: 'shrink',
            transparency: 26,
        });
    });
    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(110),
        y: y(380),
        w: x(840),
        h: y(510),
        fillColor: '#FFFFFF',
        fillTransparency: 10,
        lineColor: colors.text,
        lineTransparency: 88,
        lineWidth: 0.5,
    });
    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(1010),
        y: y(185),
        w: x(800),
        h: y(705),
        fillColor: '#FFFFFF',
        fillTransparency: 18,
        lineColor: colors.text,
        lineTransparency: 90,
        lineWidth: 0.5,
    });
    nodes.push({
        kind: 'text',
        text: 'Key Findings',
        x: x(150),
        y: y(410),
        w: x(260),
        h: y(26),
        fontFace: titleFont,
        fontSize: Math.round(18 * titleScale),
        bold: true,
        color: colors.accent || colors.primary,
    });
    bullets.slice(0, 6).forEach((bullet, index) => {
        nodes.push({
            kind: 'text',
            text: `• ${bullet}`,
            x: x(150),
            y: y(462 + index * 58),
            w: x(740),
            h: y(44),
            fontFace: bodyFont,
            fontSize: Math.round(16 * textScale),
            color: colors.text,
            fit: 'shrink',
        });
    });
    nodes.push({
        kind: 'text',
        text: 'Next Steps',
        x: x(1050),
        y: y(218),
        w: x(220),
        h: y(26),
        fontFace: titleFont,
        fontSize: Math.round(18 * titleScale),
        bold: true,
        color: '#27AE60',
    });
    nextSteps.slice(0, 6).forEach((step, index) => {
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: x(1052),
            y: y(280 + index * 82),
            w: x(26),
            h: y(26),
            fillColor: '#27AE60',
            fillTransparency: 86,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: String(index + 1),
            x: x(1052),
            y: y(285 + index * 82),
            w: x(26),
            h: y(16),
            fontFace: bodyFont,
            fontSize: Math.round(10 * textScale),
            bold: true,
            color: '#27AE60',
            align: 'center',
        });
        nodes.push({
            kind: 'text',
            text: step,
            x: x(1092),
            y: y(270 + index * 82),
            w: x(650),
            h: y(58),
            fontFace: bodyFont,
            fontSize: Math.round(16 * textScale),
            color: colors.text,
            fit: 'shrink',
        });
    });
    return { family: 'executive', variation: 'dashboard', backgroundColor: colors.bg, nodes };
};

const buildExecutiveSplitColumns = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Executive Summary');
    const { stats, bullets, nextSteps } = getExecutiveData(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    addAbstractBackground(nodes, colors);
    nodes.push({
        kind: 'text',
        text: title,
        x: x(310),
        y: y(76),
        w: x(1300),
        h: y(60),
        fontFace: titleFont,
        fontSize: Math.round(38 * titleScale),
        bold: true,
        color: colors.text,
        align: 'center',
        fit: 'shrink',
    });

    const columns = [
        { x0: 120, title: 'Key Metrics', titleColor: colors.primary, items: stats.slice(0, 4) },
        { x0: 700, title: 'Key Findings', titleColor: colors.accent || colors.primary, items: bullets.slice(0, 5) },
        { x0: 1280, title: 'Next Steps', titleColor: '#27AE60', items: nextSteps.slice(0, 5) },
    ];

    columns.forEach((column) => {
        nodes.push({
            kind: 'text',
            text: column.title,
            x: x(column.x0),
            y: y(214),
            w: x(460),
            h: y(24),
            fontFace: bodyFont,
            fontSize: Math.round(11 * textScale),
            bold: true,
            uppercase: true,
            color: column.titleColor,
            fit: 'shrink',
        });
    });

    stats.slice(0, 4).forEach((stat, index) => {
        const top = 260 + index * 128;
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(120),
            y: y(top),
            w: x(460),
            h: y(100),
            fillColor: colors.primary,
            fillTransparency: 92,
            lineColor: colors.primary,
            lineTransparency: 82,
            lineWidth: 0.5,
        });
        nodes.push({
            kind: 'text',
            text: stat.value,
            x: x(148),
            y: y(top + 18),
            w: x(404),
            h: y(34),
            fontFace: titleFont,
            fontSize: Math.round(28 * titleScale),
            bold: true,
            color: colors.primary,
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: stat.label,
            x: x(148),
            y: y(top + 56),
            w: x(404),
            h: y(20),
            fontFace: bodyFont,
            fontSize: Math.round(11 * textScale),
            color: colors.text,
            transparency: 24,
            fit: 'shrink',
        });
    });

    bullets.slice(0, 5).forEach((bullet, index) => {
        const top = 260 + index * 118;
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: x(700),
            y: y(top + 16),
            w: x(10),
            h: y(10),
            fillColor: colors.accent || colors.primary,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: bullet,
            x: x(724),
            y: y(top),
            w: x(500),
            h: y(72),
            fontFace: bodyFont,
            fontSize: Math.round(15 * textScale),
            color: colors.text,
            fit: 'shrink',
        });
    });

    nextSteps.slice(0, 5).forEach((step, index) => {
        const top = 260 + index * 118;
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: x(1280),
            y: y(top + 8),
            w: x(26),
            h: y(26),
            fillColor: '#27AE60',
            fillTransparency: 86,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: String(index + 1),
            x: x(1280),
            y: y(top + 12),
            w: x(26),
            h: y(14),
            fontFace: bodyFont,
            fontSize: Math.round(10 * textScale),
            bold: true,
            color: '#27AE60',
            align: 'center',
        });
        nodes.push({
            kind: 'text',
            text: step,
            x: x(1320),
            y: y(top),
            w: x(490),
            h: y(72),
            fontFace: bodyFont,
            fontSize: Math.round(15 * textScale),
            color: colors.text,
            fit: 'shrink',
        });
    });

    return { family: 'executive', variation: 'split-columns', backgroundColor: colors.bg, nodes };
};

const buildExecutiveCompact = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const title = readText(slide.title, 'Executive Summary');
    const { stats, bullets, nextSteps } = getExecutiveData(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    nodes.push({
        kind: 'text',
        text: title,
        x: x(100),
        y: y(90),
        w: x(900),
        h: y(54),
        fontFace: titleFont,
        fontSize: Math.round(36 * titleScale),
        bold: true,
        color: colors.text,
        fit: 'shrink',
    });
    stats.slice(0, 4).forEach((stat, index) => {
        const left = 100 + index * 430;
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(left),
            y: y(180),
            w: x(340),
            h: y(92),
            fillColor: colors.primary,
            fillTransparency: 94,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: stat.value,
            x: x(left + 20),
            y: y(195),
            w: x(300),
            h: y(30),
            fontFace: titleFont,
            fontSize: Math.round(22 * titleScale),
            bold: true,
            color: colors.primary,
            align: 'center',
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: stat.label,
            x: x(left + 20),
            y: y(228),
            w: x(300),
            h: y(20),
            fontFace: bodyFont,
            fontSize: Math.round(11 * textScale),
            color: colors.text,
            align: 'center',
            fit: 'shrink',
            transparency: 28,
        });
    });
    nodes.push({
        kind: 'text',
        text: 'Findings',
        x: x(110),
        y: y(340),
        w: x(260),
        h: y(24),
        fontFace: titleFont,
        fontSize: Math.round(18 * titleScale),
        bold: true,
        color: colors.primary,
    });
    bullets.slice(0, 5).forEach((bullet, index) => {
        nodes.push({
            kind: 'text',
            text: `▸ ${bullet}`,
            x: x(110),
            y: y(380 + index * 62),
            w: x(760),
            h: y(46),
            fontFace: bodyFont,
            fontSize: Math.round(16 * textScale),
            color: colors.text,
            fit: 'shrink',
        });
    });
    nodes.push({
        kind: 'text',
        text: 'Next Steps',
        x: x(1020),
        y: y(340),
        w: x(280),
        h: y(24),
        fontFace: titleFont,
        fontSize: Math.round(18 * titleScale),
        bold: true,
        color: '#27AE60',
    });
    nextSteps.slice(0, 5).forEach((step, index) => {
        nodes.push({
            kind: 'text',
            text: `${index + 1}. ${step}`,
            x: x(1020),
            y: y(380 + index * 62),
            w: x(690),
            h: y(46),
            fontFace: bodyFont,
            fontSize: Math.round(16 * textScale),
            color: colors.text,
            fit: 'shrink',
        });
    });
    return { family: 'executive', variation: 'compact', backgroundColor: colors.bg, nodes };
};

const buildCoverTypographicGiant = (ctx: SceneBuildContext): SlideScene => {
    const scene = buildCoverCenteredMinimal(ctx);
    const { slide, presentation, colors } = ctx;
    const titleFont = getHeadingFont(presentation);
    const titleScale = getTitleScale(presentation);
    scene.variation = 'typographic-giant';
    scene.nodes = [
        {
            kind: 'text',
            text: readText(slide.title, 'Untitled'),
            x: x(120),
            y: y(220),
            w: x(1680),
            h: y(280),
            fontFace: titleFont,
            fontSize: Math.round(108 * titleScale),
            bold: true,
            color: colors.text,
            fit: 'shrink',
        },
        ...scene.nodes.filter((node) => node.kind !== 'text' || node.text !== readText(slide.title, 'Untitled Slide')),
    ];
    return scene;
};

const buildCoverDarkTech = (ctx: SceneBuildContext): SlideScene => {
    const scene = buildCoverDiagonalHero(ctx);
    scene.variation = 'dark-tech';
    scene.backgroundColor = '#0F172A';
    scene.nodes.unshift({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: '#0F172A',
        lineTransparency: 100,
    });
    scene.nodes.push({
        kind: 'shape',
        shape: 'rect',
        x: 0,
        y: 0,
        w: SLIDE_WIDTH,
        h: SLIDE_HEIGHT,
        fillColor: '#000000',
        fillTransparency: 56,
        lineTransparency: 100,
    });
    return scene;
};

const buildCoverCinematic = (ctx: SceneBuildContext): SlideScene => {
    const scene = buildCoverFullSplit(ctx);
    scene.variation = 'cinematic';
    return scene;
};

const buildImageTextMask = (ctx: SceneBuildContext): SlideScene => {
    const scene = buildImageDefault(ctx);
    scene.variation = 'text-mask';
    return scene;
};

const buildTextColumnsModernCards = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const columns = getTextColumns(slide).slice(0, 3);
    const title = readText(slide.title, 'Overview');
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    nodes.push({ kind: 'text', text: title, x: x(300), y: y(90), w: x(1320), h: y(70), fontFace: titleFont, fontSize: Math.round(42 * titleScale), bold: true, color: colors.text, align: 'center', fit: 'shrink' });
    columns.forEach((col, index) => {
        const left = 120 + index * 560;
        nodes.push({ kind: 'shape', shape: 'roundRect', x: x(left), y: y(260), w: x(500), h: y(600), fillColor: '#FFFFFF', fillTransparency: 16, lineColor: colors.text, lineTransparency: 92, lineWidth: 0.5 });
        nodes.push({ kind: 'shape', shape: 'ellipse', x: x(left + 32), y: y(294), w: x(54), h: y(54), fillColor: colors.primary, fillTransparency: 85, lineTransparency: 100 });
        nodes.push({ kind: 'text', text: String(index + 1), x: x(left + 32), y: y(308), w: x(54), h: y(22), fontFace: bodyFont, fontSize: Math.round(16 * textScale), bold: true, color: colors.primary, align: 'center' });
        nodes.push({ kind: 'text', text: col.title, x: x(left + 32), y: y(380), w: x(430), h: y(60), fontFace: titleFont, fontSize: Math.round(26 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
        nodes.push({ kind: 'text', text: col.text, x: x(left + 32), y: y(460), w: x(430), h: y(320), fontFace: bodyFont, fontSize: Math.round(18 * textScale), color: colors.text, fit: 'shrink', transparency: 14 });
    });
    return { family: 'text-columns', variation: 'modern-cards', backgroundColor: colors.bg, nodes };
};

const buildTextColumnsSideHighlight = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const columns = getTextColumns(slide);
    const mainCol = columns[0];
    const sideCols = columns.slice(1, 3);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [
        { kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH / 2, h: SLIDE_HEIGHT, fillColor: colors.primary, lineTransparency: 100 },
        { kind: 'shape', shape: 'rect', x: SLIDE_WIDTH / 2, y: 0, w: SLIDE_WIDTH / 2, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 },
        { kind: 'text', text: readText(slide.title, 'Overview'), x: x(120), y: y(160), w: x(720), h: y(120), fontFace: titleFont, fontSize: Math.round(62 * titleScale), bold: true, color: '#FFFFFF', fit: 'shrink' },
    ];
    if (mainCol) {
        nodes.push({ kind: 'shape', shape: 'roundRect', x: x(120), y: y(420), w: x(720), h: y(360), fillColor: '#FFFFFF', fillTransparency: 86, lineTransparency: 100 });
        nodes.push({ kind: 'text', text: mainCol.title, x: x(160), y: y(460), w: x(620), h: y(56), fontFace: titleFont, fontSize: Math.round(30 * titleScale), bold: true, color: '#FFFFFF', fit: 'shrink' });
        nodes.push({ kind: 'text', text: mainCol.text, x: x(160), y: y(540), w: x(620), h: y(190), fontFace: bodyFont, fontSize: Math.round(20 * textScale), color: '#FFFFFF', fit: 'shrink', transparency: 10 });
    }
    sideCols.forEach((col, index) => {
        const top = 280 + index * 260;
        nodes.push({ kind: 'text', text: col.title, x: x(1080), y: y(top), w: x(620), h: y(44), fontFace: titleFont, fontSize: Math.round(24 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
        nodes.push({ kind: 'text', text: col.text, x: x(1080), y: y(top + 54), w: x(620), h: y(124), fontFace: bodyFont, fontSize: Math.round(18 * textScale), color: colors.text, fit: 'shrink', transparency: 18 });
        nodes.push({ kind: 'shape', shape: 'line', x: x(1080), y: y(top + 196), w: x(620), h: 0, lineColor: colors.text, lineTransparency: 88, lineWidth: 0.5 });
    });
    return { family: 'text-columns', variation: 'side-highlight', backgroundColor: colors.bg, nodes };
};

const buildTextColumnsVerticalSeparators = (ctx: SceneBuildContext): SlideScene => {
    const scene = buildTextColumnsClassic(ctx);
    scene.variation = 'vertical-separators';
    const columns = getTextColumns(ctx.slide).slice(0, 3);
    const extra: SceneNode[] = [];
    columns.slice(0, 2).forEach((_, index) => {
        extra.push({ kind: 'shape', shape: 'line', x: x(640 + index * 320), y: y(270), w: 0, h: y(620), lineColor: ctx.colors.text, lineTransparency: 90, lineWidth: 0.5 });
    });
    scene.nodes.push(...extra);
    return scene;
};

const buildTextColumnsBentoText = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const columns = getTextColumns(slide).slice(0, 3);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    addAbstractBackground(nodes, colors);

    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(120),
        y: y(96),
        w: x(800),
        h: y(252),
        fillColor: colors.text,
        fillTransparency: 94,
        lineTransparency: 100,
    });
    nodes.push({
        kind: 'shape',
        shape: 'roundRect',
        x: x(160),
        y: y(136),
        w: x(150),
        h: y(38),
        fillColor: '#FFFFFF',
        fillTransparency: 28,
        lineColor: '#FFFFFF',
        lineTransparency: 82,
        lineWidth: 0.5,
    });
    nodes.push({
        kind: 'text',
        text: 'OVERVIEW',
        x: x(168),
        y: y(147),
        w: x(132),
        h: y(16),
        fontFace: bodyFont,
        fontSize: Math.round(9 * textScale),
        bold: true,
        uppercase: true,
        color: colors.text,
        align: 'center',
    });
    nodes.push({
        kind: 'text',
        text: readText(slide.title, 'Overview'),
        x: x(160),
        y: y(204),
        w: x(700),
        h: y(110),
        fontFace: titleFont,
        fontSize: Math.round(40 * titleScale),
        bold: true,
        color: colors.text,
        fit: 'shrink',
    });

    if (columns[0]) {
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(980),
            y: y(96),
            w: x(820),
            h: y(792),
            fillColor: colors.primary,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'shape',
            shape: 'ellipse',
            x: x(1570),
            y: y(10),
            w: x(260),
            h: y(260),
            fillColor: '#FFFFFF',
            fillTransparency: 86,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: columns[0].title,
            x: x(1040),
            y: y(340),
            w: x(700),
            h: y(70),
            fontFace: titleFont,
            fontSize: Math.round(28 * titleScale),
            bold: true,
            color: '#FFFFFF',
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: columns[0].text,
            x: x(1040),
            y: y(432),
            w: x(700),
            h: y(280),
            fontFace: bodyFont,
            fontSize: Math.round(18 * textScale),
            color: '#FFFFFF',
            fit: 'shrink',
            transparency: 8,
        });
    }

    const lowerCards = [
        { x0: 120, column: columns[1] },
        { x0: 540, column: columns[2] },
    ];
    lowerCards.forEach(({ x0, column }) => {
        if (!column) return;
        nodes.push({
            kind: 'shape',
            shape: 'roundRect',
            x: x(x0),
            y: y(408),
            w: x(380),
            h: y(480),
            fillColor: '#FFFFFF',
            fillTransparency: 6,
            lineColor: colors.text,
            lineTransparency: 90,
            lineWidth: 0.5,
        });
        nodes.push({
            kind: 'text',
            text: column.title,
            x: x(x0 + 32),
            y: y(470),
            w: x(316),
            h: y(66),
            fontFace: titleFont,
            fontSize: Math.round(22 * titleScale),
            bold: true,
            color: colors.text,
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: column.text,
            x: x(x0 + 32),
            y: y(560),
            w: x(316),
            h: y(228),
            fontFace: bodyFont,
            fontSize: Math.round(15 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 18,
        });
    });

    return { family: 'text-columns', variation: 'bento-text', backgroundColor: colors.bg, nodes };
};

const buildComparisonVersusCards = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const comparison = getComparisonData(slide);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    nodes.push({ kind: 'text', text: readText(slide.title, 'Comparison'), x: x(320), y: y(80), w: x(1280), h: y(70), fontFace: titleFont, fontSize: Math.round(42 * titleScale), bold: true, color: colors.text, align: 'center', fit: 'shrink' });
    nodes.push({ kind: 'shape', shape: 'ellipse', x: x(910), y: y(470), w: x(100), h: y(100), fillColor: colors.primary, lineColor: colors.bg, lineWidth: 1.4 });
    nodes.push({ kind: 'text', text: 'VS', x: x(910), y: y(500), w: x(100), h: y(28), fontFace: titleFont, fontSize: Math.round(24 * titleScale), bold: true, color: '#FFFFFF', align: 'center' });
    const cards = [
        { x0: 150, title: comparison.left.title, items: comparison.left.items, fill: '#FFFFFF', text: colors.text },
        { x0: 1030, title: comparison.right.title, items: comparison.right.items, fill: colors.primary, text: '#FFFFFF' },
    ];
    cards.forEach((card, idx) => {
        nodes.push({ kind: 'shape', shape: 'roundRect', x: x(card.x0), y: y(230), w: x(740), h: y(620), fillColor: card.fill, fillTransparency: idx === 0 ? 12 : 0, lineColor: idx === 0 ? colors.text : colors.primary, lineTransparency: 88, lineWidth: 0.5 });
        nodes.push({ kind: 'text', text: card.title, x: x(card.x0 + 70), y: y(290), w: x(600), h: y(56), fontFace: titleFont, fontSize: Math.round(34 * titleScale), bold: true, color: card.text, align: 'center', fit: 'shrink' });
        card.items.slice(0, 6).forEach((item, itemIndex) => {
            nodes.push({ kind: 'text', text: item, x: x(card.x0 + 80), y: y(390 + itemIndex * 58), w: x(580), h: y(40), fontFace: bodyFont, fontSize: Math.round(18 * textScale), color: card.text, fit: 'shrink', transparency: idx === 0 ? 18 : 8 });
        });
    });
    return { family: 'comparison', variation: 'versus-cards', backgroundColor: colors.bg, nodes };
};

const buildComparisonFeatureGrid = (ctx: SceneBuildContext): SlideScene => buildComparisonBalancedSplit(ctx);
const buildComparisonBeforeAfter = (ctx: SceneBuildContext): SlideScene => buildComparisonBalancedSplit(ctx);
const buildComparisonProsCons = (ctx: SceneBuildContext): SlideScene => buildComparisonBalancedSplit(ctx);

const buildTimelineHorizontalLine = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const items = getTimelineItems(slide).slice(0, 4);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    nodes.push({ kind: 'text', text: readText(slide.title, 'Timeline'), x: x(300), y: y(90), w: x(1320), h: y(70), fontFace: titleFont, fontSize: Math.round(42 * titleScale), bold: true, color: colors.text, align: 'center', fit: 'shrink' });
    nodes.push({ kind: 'shape', shape: 'line', x: x(180), y: y(560), w: x(1560), h: 0, lineColor: colors.primary, lineTransparency: 72, lineWidth: 1.6 });
    items.forEach((item, index) => {
        const centerX = 260 + index * 470;
        nodes.push({ kind: 'shape', shape: 'ellipse', x: x(centerX), y: y(525), w: x(70), h: y(70), fillColor: '#FFFFFF', lineColor: colors.primary, lineWidth: 1.2 });
        nodes.push({ kind: 'text', text: String(index + 1), x: x(centerX), y: y(548), w: x(70), h: y(20), fontFace: bodyFont, fontSize: Math.round(14 * textScale), bold: true, color: colors.primary, align: 'center' });
        nodes.push({ kind: 'text', text: item.date || `Step ${index + 1}`, x: x(centerX - 80), y: y(440), w: x(230), h: y(28), fontFace: bodyFont, fontSize: Math.round(13 * textScale), bold: true, color: colors.primary, align: 'center', fit: 'shrink' });
        nodes.push({ kind: 'text', text: item.title, x: x(centerX - 100), y: y(620), w: x(270), h: y(36), fontFace: titleFont, fontSize: Math.round(20 * titleScale), bold: true, color: colors.text, align: 'center', fit: 'shrink' });
        nodes.push({ kind: 'text', text: item.description, x: x(centerX - 110), y: y(665), w: x(290), h: y(80), fontFace: bodyFont, fontSize: Math.round(14 * textScale), color: colors.text, align: 'center', fit: 'shrink', transparency: 24 });
    });
    return { family: 'timeline', variation: 'horizontal-line', backgroundColor: colors.bg, nodes };
};

const buildTimelineVerticalAlternating = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const items = getTimelineItems(slide).slice(0, 4);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [
        { kind: 'text', text: readText(slide.title, 'Timeline'), x: x(160), y: y(70), w: x(900), h: y(80), fontFace: titleFont, fontSize: Math.round(58 * titleScale), bold: true, color: colors.text, fit: 'shrink' },
        { kind: 'shape', shape: 'line', x: x(960), y: y(220), w: 0, h: y(660), lineColor: colors.text, lineTransparency: 84, lineWidth: 0.6 },
    ];
    items.forEach((item, index) => {
        const isLeft = index % 2 === 0;
        const top = 240 + index * 150;
        const boxX = isLeft ? 160 : 1060;
        nodes.push({ kind: 'shape', shape: 'ellipse', x: x(932), y: y(top + 30), w: x(56), h: y(56), fillColor: colors.primary, fillTransparency: 86, lineColor: colors.primary, lineWidth: 0.8 });
        nodes.push({ kind: 'text', text: item.date || String(index + 1), x: x(boxX), y: y(top), w: x(320), h: y(24), fontFace: bodyFont, fontSize: Math.round(12 * textScale), bold: true, color: colors.primary, align: isLeft ? 'right' : 'left', fit: 'shrink' });
        nodes.push({ kind: 'text', text: item.title, x: x(boxX), y: y(top + 30), w: x(540), h: y(34), fontFace: titleFont, fontSize: Math.round(22 * titleScale), bold: true, color: colors.text, align: isLeft ? 'right' : 'left', fit: 'shrink' });
        nodes.push({ kind: 'text', text: item.description, x: x(boxX), y: y(top + 72), w: x(540), h: y(54), fontFace: bodyFont, fontSize: Math.round(15 * textScale), color: colors.text, align: isLeft ? 'right' : 'left', fit: 'shrink', transparency: 22 });
    });
    return { family: 'timeline', variation: 'vertical-alternating', backgroundColor: colors.bg, nodes };
};

const buildTimelineSteppedProcess = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const items = getTimelineItems(slide).slice(0, 4);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];

    nodes.push({ kind: 'shape', shape: 'rect', x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT, fillColor: colors.bg, lineTransparency: 100 });
    nodes.push({ kind: 'text', text: readText(slide.title, 'Process'), x: x(120), y: y(90), w: x(1500), h: y(70), fontFace: titleFont, fontSize: Math.round(42 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
    nodes.push({ kind: 'shape', shape: 'line', x: x(120), y: y(182), w: x(1680), h: 0, lineColor: colors.text, lineTransparency: 92, lineWidth: 0.6 });

    items.forEach((item, index) => {
        const startX = 120 + index * 420;
        const borderColor = index % 2 === 0 ? colors.primary : (colors.secondary || colors.primary);
        nodes.push({
            kind: 'text',
            text: String(index + 1),
            x: x(startX),
            y: y(244),
            w: x(150),
            h: y(86),
            fontFace: titleFont,
            fontSize: Math.round(62 * titleScale),
            bold: true,
            color: colors.primary,
            transparency: 92,
        });
        nodes.push({
            kind: 'shape',
            shape: 'rect',
            x: x(startX + 26),
            y: y(380),
            w: x(8),
            h: y(370),
            fillColor: borderColor,
            lineTransparency: 100,
        });
        nodes.push({
            kind: 'text',
            text: item.date || `STEP ${index + 1}`,
            x: x(startX + 58),
            y: y(328),
            w: x(300),
            h: y(26),
            fontFace: bodyFont,
            fontSize: Math.round(12 * textScale),
            bold: true,
            uppercase: true,
            color: colors.text,
            transparency: 38,
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: item.title,
            x: x(startX + 58),
            y: y(388),
            w: x(310),
            h: y(66),
            fontFace: titleFont,
            fontSize: Math.round(22 * titleScale),
            bold: true,
            color: colors.text,
            fit: 'shrink',
        });
        nodes.push({
            kind: 'text',
            text: item.description,
            x: x(startX + 58),
            y: y(476),
            w: x(310),
            h: y(200),
            fontFace: bodyFont,
            fontSize: Math.round(17 * textScale),
            color: colors.text,
            fit: 'shrink',
            transparency: 14,
        });
    });

    return { family: 'timeline', variation: 'stepped-process', backgroundColor: colors.bg, nodes };
};

const buildTimelineMinimalList = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const items = getTimelineItems(slide).slice(0, 5);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [
        { kind: 'text', text: readText(slide.title, 'Timeline'), x: x(110), y: y(86), w: x(1100), h: y(64), fontFace: titleFont, fontSize: Math.round(42 * titleScale), bold: true, color: colors.text, fit: 'shrink' }
    ];
    items.forEach((item, index) => {
        const top = 250 + index * 145;
        nodes.push({ kind: 'shape', shape: 'line', x: x(180), y: y(top + 52), w: x(140), h: 0, lineColor: colors.primary, lineTransparency: 72, lineWidth: 1 });
        nodes.push({ kind: 'text', text: item.date || `0${index + 1}`, x: x(100), y: y(top + 36), w: x(70), h: y(24), fontFace: bodyFont, fontSize: Math.round(13 * textScale), bold: true, color: colors.primary, fit: 'shrink' });
        nodes.push({ kind: 'text', text: item.title, x: x(360), y: y(top + 18), w: x(520), h: y(32), fontFace: titleFont, fontSize: Math.round(20 * titleScale), bold: true, color: colors.text, fit: 'shrink' });
        nodes.push({ kind: 'text', text: item.description, x: x(360), y: y(top + 56), w: x(980), h: y(46), fontFace: bodyFont, fontSize: Math.round(15 * textScale), color: colors.text, fit: 'shrink', transparency: 22 });
    });
    return { family: 'timeline', variation: 'minimal-list', backgroundColor: colors.bg, nodes };
};

const buildInfographicFunnel = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const steps = getInfographicSteps(slide).slice(0, 5);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [{ kind: 'text', text: readText(slide.title, 'Funnel'), x: x(260), y: y(80), w: x(1400), h: y(64), fontFace: titleFont, fontSize: Math.round(40 * titleScale), bold: true, color: colors.text, align: 'center', fit: 'shrink' }];
    steps.forEach((step, index) => {
        const widthPx = 1280 - index * 170;
        const leftPx = (1920 - widthPx) / 2;
        const topPx = 220 + index * 125;
        const fill = [colors.primary, colors.secondary || colors.primary, colors.accent || colors.primary, '#60A5FA', '#A78BFA'][index % 5];
        nodes.push({ kind: 'shape', shape: 'roundRect', x: x(leftPx), y: y(topPx), w: x(widthPx), h: y(92), fillColor: fill, fillTransparency: 6, lineTransparency: 100 });
        nodes.push({ kind: 'text', text: step.label, x: x(leftPx + 20), y: y(topPx + 18), w: x(widthPx - 40), h: y(24), fontFace: titleFont, fontSize: Math.round(22 * titleScale), bold: true, color: getReadableOnBackground('#FFFFFF', fill), align: 'center', fit: 'shrink' });
        if (step.description) nodes.push({ kind: 'text', text: step.description, x: x(leftPx + 30), y: y(topPx + 48), w: x(widthPx - 60), h: y(22), fontFace: bodyFont, fontSize: Math.round(13 * textScale), color: getReadableOnBackground('#FFFFFF', fill), align: 'center', fit: 'shrink', transparency: 10 });
    });
    return { family: 'infographic', variation: 'funnel', backgroundColor: colors.bg, nodes };
};

const buildInfographicPyramid = (ctx: SceneBuildContext): SlideScene => {
    const scene = buildInfographicFunnel(ctx);
    scene.variation = 'pyramid';
    return scene;
};

const buildInfographicProcess = (ctx: SceneBuildContext): SlideScene => {
    const { slide, presentation, colors } = ctx;
    const steps = getInfographicSteps(slide).slice(0, 5);
    const titleFont = getHeadingFont(presentation);
    const bodyFont = getBodyFont(presentation);
    const titleScale = getTitleScale(presentation);
    const textScale = getTextScale(presentation);
    const nodes: SceneNode[] = [];
    addAbstractBackground(nodes, colors);
    nodes.push({ kind: 'text', text: readText(slide.title, 'Process'), x: x(260), y: y(80), w: x(1400), h: y(64), fontFace: titleFont, fontSize: Math.round(40 * titleScale), bold: true, color: colors.text, align: 'center', fit: 'shrink' });
    steps.forEach((step, index) => {
        const left = 120 + index * 340;
        nodes.push({ kind: 'shape', shape: 'roundRect', x: x(left), y: y(390), w: x(280), h: y(220), fillColor: [colors.primary, colors.secondary || colors.primary, colors.accent || colors.primary, '#60A5FA', '#A78BFA'][index % 5], fillTransparency: 10, lineTransparency: 100 });
        nodes.push({ kind: 'text', text: String(index + 1), x: x(left + 90), y: y(420), w: x(100), h: y(48), fontFace: titleFont, fontSize: Math.round(42 * titleScale), bold: true, color: '#FFFFFF', align: 'center', transparency: 50 });
        nodes.push({ kind: 'text', text: step.label, x: x(left + 20), y: y(470), w: x(240), h: y(44), fontFace: titleFont, fontSize: Math.round(20 * titleScale), bold: true, color: '#FFFFFF', align: 'center', fit: 'shrink' });
        nodes.push({ kind: 'text', text: step.description, x: x(left + 20), y: y(526), w: x(240), h: y(56), fontFace: bodyFont, fontSize: Math.round(13 * textScale), color: '#FFFFFF', align: 'center', fit: 'shrink', transparency: 8 });
        if (index < steps.length - 1) nodes.push({ kind: 'shape', shape: 'line', x: x(left + 280), y: y(500), w: x(60), h: 0, lineColor: colors.text, lineTransparency: 80, lineWidth: 1.1 });
    });
    return { family: 'infographic', variation: 'process', backgroundColor: colors.bg, nodes };
};

const buildTableDefault = (ctx: SceneBuildContext): SlideScene => buildTableDataGrid(ctx);
const buildTablePricingTiers = (ctx: SceneBuildContext): SlideScene => {
    const scene = buildTableDataGrid(ctx);
    scene.variation = 'pricing-tiers';
    return scene;
};
const buildTableFeatureMatrix = (ctx: SceneBuildContext): SlideScene => {
    const scene = buildTableDataGrid(ctx);
    scene.variation = 'feature-matrix';
    return scene;
};

const buildScene = (ctx: SceneBuildContext, family: 'cover' | 'content' | 'image' | 'stats' | 'chart' | 'text-columns' | 'comparison' | 'timeline' | 'infographic' | 'table' | 'bento' | 'section' | 'quote' | 'showcase' | 'swot' | 'executive', variation: string): SlideScene | undefined => {
    if (family === 'cover') {
        if (variation === 'centered-minimal') return buildCoverCenteredMinimal(ctx);
        if (variation === 'full-split') return buildCoverFullSplit(ctx);
        if (variation === 'diagonal-hero') return buildCoverDiagonalHero(ctx);
        if (variation === 'typographic-giant') return buildCoverTypographicGiant(ctx);
        if (variation === 'boxed-modern') return buildCoverBoxedModern(ctx);
        if (variation === 'gradient-mesh') return buildCoverGradientMesh(ctx);
        if (variation === 'dark-tech') return buildCoverDarkTech(ctx);
        if (variation === 'offset-gallery') return buildCoverOffsetGallery(ctx);
        if (variation === 'floating-glass') return buildCoverFloatingGlass(ctx);
        if (variation === 'cinematic') return buildCoverCinematic(ctx);
        return undefined;
    }

    if (family === 'content') {
        if (variation === 'classic') return buildContentClassic(ctx);
        if (variation === 'bullets-legacy') return buildContentBulletsLegacy(ctx);
        if (variation === 'split-card') return buildContentSplitCard(ctx);
        if (variation === 'hero-block') return buildContentHeroBlock(ctx);
        if (variation === 'magazine') return buildContentMagazine(ctx);
        if (variation === 'minimal-offset') return buildContentMinimalOffset(ctx);
        return undefined;
    }

    if (family === 'stats') {
        if (variation === 'classic-grid') return buildStatsClassicGrid(ctx);
        if (variation === 'metric-cards') return buildStatsMetricCards(ctx);
        if (variation === 'big-hero-stat') return buildStatsBigHero(ctx);
        if (variation === 'data-progress') return buildStatsDataProgress(ctx);
        if (variation === 'trend-focus') return buildStatsTrendFocus(ctx);
        return undefined;
    }

    if (family === 'chart') {
        if (variation === 'default-container') return buildChartDefaultContainer(ctx);
        if (variation === 'split-detail') return buildChartSplitDetail(ctx);
        if (variation === 'floating-card') return buildChartFloatingCard(ctx);
        if (variation === 'full-bleed-hero') return buildChartFullBleedHero(ctx);
        if (variation === 'minimal-stat') return buildChartMinimalStat(ctx);
        if (variation === 'chart-showcase') return buildChartShowcase(ctx);
        if (variation === 'chart-analysis') return buildChartAnalysis(ctx);
        return undefined;
    }

    if (family === 'text-columns') {
        if (variation === 'classic') return buildTextColumnsClassic(ctx);
        if (variation === 'modern-cards') return buildTextColumnsModernCards(ctx);
        if (variation === 'numbered-editorial') return buildTextColumnsNumberedEditorial(ctx);
        if (variation === 'side-highlight') return buildTextColumnsSideHighlight(ctx);
        if (variation === 'vertical-separators') return buildTextColumnsVerticalSeparators(ctx);
        if (variation === 'bento-text') return buildTextColumnsBentoText(ctx);
        return undefined;
    }

    if (family === 'comparison') {
        if (variation === 'balanced-split') return buildComparisonBalancedSplit(ctx);
        if (variation === 'versus-cards') return buildComparisonVersusCards(ctx);
        if (variation === 'feature-grid') return buildComparisonFeatureGrid(ctx);
        if (variation === 'before-after') return buildComparisonBeforeAfter(ctx);
        if (variation === 'pros-cons') return buildComparisonProsCons(ctx);
        return undefined;
    }

    if (family === 'timeline') {
        if (variation === 'horizontal-line') return buildTimelineHorizontalLine(ctx);
        if (variation === 'vertical-alternating') return buildTimelineVerticalAlternating(ctx);
        if (variation === 'connected-cards') return buildTimelineConnectedCards(ctx);
        if (variation === 'stepped-process') return buildTimelineSteppedProcess(ctx);
        if (variation === 'minimal-list') return buildTimelineMinimalList(ctx);
        return undefined;
    }

    if (family === 'infographic') {
        if (variation === 'funnel') return buildInfographicFunnel(ctx);
        if (variation === 'pyramid') return buildInfographicPyramid(ctx);
        if (variation === 'process') return buildInfographicProcess(ctx);
        if (variation === 'cycle-flow') return buildInfographicCycleFlow(ctx);
        if (variation === 'hub-spoke') return buildInfographicHubSpoke(ctx);
        return undefined;
    }

    if (family === 'table') {
        if (variation === 'default') return buildTableDefault(ctx);
        if (variation === 'pricing-tiers') return buildTablePricingTiers(ctx);
        if (variation === 'data-grid') return buildTableDataGrid(ctx);
        if (variation === 'feature-matrix') return buildTableFeatureMatrix(ctx);
        return undefined;
    }

    if (family === 'bento') {
        if (variation === 'default') return buildBentoDefault(ctx);
        if (variation === 'magazine-grid') return buildBentoMagazineGrid(ctx);
        if (variation === 'feature-focus') return buildBentoFeatureFocus(ctx);
        if (variation === 'asymmetric-masonry') return buildBentoAsymmetricMasonry(ctx);
        return undefined;
    }

    if (family === 'section') {
        if (variation === 'big-number-outline') return buildSectionBigNumberOutline(ctx);
        if (variation === 'minimal-bar') return buildSectionMinimalBar(ctx);
        if (variation === 'abstract-mesh') return buildSectionAbstractMesh(ctx);
        if (variation === 'default') return buildSectionDefault(ctx);
        return undefined;
    }

    if (family === 'quote') {
        if (variation === 'side-accent') return buildQuoteSideAccent(ctx);
        if (variation === 'minimal-elegant') return buildQuoteMinimalElegant(ctx);
        if (variation === 'centered-hero') return buildQuoteCenteredHero(ctx);
        return undefined;
    }

    if (family === 'showcase') {
        if (variation === 'lifestyle-split') return buildShowcaseLifestyleSplit(ctx);
        if (variation === 'app-mockup') return buildShowcaseAppMockup(ctx);
        if (variation === 'exploded-view' || variation === 'default') return buildShowcaseExplodedView(ctx);
        return undefined;
    }

    if (family === 'swot') {
        if (variation === 'rounded-cards') return buildSwotRoundedCards(ctx);
        if (variation === 'minimal-list') return buildSwotMinimalList(ctx);
        if (variation === 'classic-grid') return buildSwotClassicGrid(ctx);
        return undefined;
    }

    if (family === 'executive') {
        if (variation === 'split-columns') return buildExecutiveSplitColumns(ctx);
        if (variation === 'compact') return buildExecutiveCompact(ctx);
        if (variation === 'dashboard') return buildExecutiveDashboard(ctx);
        return undefined;
    }

    if (variation === 'default') return buildImageDefault(ctx);
    if (variation === 'text-mask') return buildImageTextMask(ctx);
    if (variation === 'image-showcase') return buildImageShowcase(ctx);
    if (variation === 'chart-showcase') return buildChartShowcase(ctx);
    if (variation === 'chart-analysis') return buildChartAnalysis(ctx);
    if (variation === 'split-curtain') return buildImageSplitCurtain(ctx);
    if (variation === 'polaroid-pile') return buildImagePolaroidPile(ctx);
    return undefined;
};

export const buildEditableSlideScene = (
    slide: SlideData,
    presentation: PresentationData,
    colors: ColorPalette,
    forcedLayout?: {
        family?: string;
        variation?: string;
    }
): SceneBuildResult => {
    const normalizedType = getNormalizedType(slide);
    const hasImage = !!getImageUrl(slide);
    const hasGallery = Array.isArray((slide as any).images) && (slide as any).images.length > 1;
    const hasStats = getStatsItems(slide).length > 0;
    const hasChart = !!normalizeChart(slide)?.series?.length;
    const isTextColumn = normalizedType.includes('text') && normalizedType.includes('column');
    const isSpecialized =
        normalizedType.includes('timeline') ||
        normalizedType.includes('roadmap') ||
        normalizedType.includes('comparison') ||
        normalizedType.includes('versus') ||
        normalizedType.includes('table') ||
        normalizedType.includes('section') ||
        normalizedType.includes('divider') ||
        normalizedType.includes('infographic') ||
        normalizedType.includes('funnel') ||
        normalizedType.includes('pyramid') ||
        normalizedType.includes('swot') ||
        normalizedType.includes('executive') ||
        normalizedType.includes('quote') ||
        normalizedType.includes('bento') ||
        normalizedType.includes('showcase') ||
        normalizedType.includes('product') ||
        normalizedType.includes('feature') ||
        isTextColumn;

    let family: 'cover' | 'content' | 'image' | 'stats' | 'chart' | 'text-columns' | 'comparison' | 'timeline' | 'infographic' | 'table' | 'bento' | 'section' | 'quote' | 'showcase' | 'swot' | 'executive' | undefined;
    let variation: string | undefined;

    if (forcedLayout?.family && forcedLayout?.variation) {
        family = forcedLayout.family as 'cover' | 'content' | 'image' | 'stats' | 'chart' | 'text-columns' | 'comparison' | 'timeline' | 'infographic' | 'table' | 'bento' | 'section' | 'quote' | 'showcase' | 'swot' | 'executive';
        variation = forcedLayout.variation;
    } else if (normalizedType.includes('cover') || normalizedType.includes('hero')) {
        family = 'cover';
        variation = resolveCoverVariation(slide, presentation, colors);
    } else if (normalizedType.includes('section') || normalizedType.includes('divider')) {
        family = 'section';
        variation = resolveSectionVariation(slide, presentation);
    } else if (normalizedType.includes('chart') || normalizedType.includes('graph') || hasChart) {
        family = 'chart';
        variation = resolveChartVariation(slide, presentation);
    } else if (normalizedType.includes('stats') || normalizedType.includes('statistics') || normalizedType.includes('metric') || hasStats) {
        family = 'stats';
        variation = resolveStatsVariation(slide, presentation);
    } else if (normalizedType.includes('executive') || normalizedType.includes('exec-summary') || normalizedType.includes('executive-summary') || normalizedType === 'summary') {
        family = 'executive';
        variation = resolveExecutiveVariation(slide);
    } else if (normalizedType.includes('swot') || normalizedType.includes('tows') || normalizedType.includes('twos')) {
        family = 'swot';
        variation = resolveSwotVariation(slide);
    } else if (normalizedType.includes('quote') || normalizedType.includes('testimonial')) {
        family = 'quote';
        variation = resolveQuoteVariation(slide);
    } else if (normalizedType.includes('showcase') || normalizedType.includes('product')) {
        family = 'showcase';
        variation = resolveShowcaseVariation(slide, presentation);
    } else if (normalizedType.includes('content') || normalizedType.includes('bullet') || normalizedType === 'text') {
        family = 'content';
        variation = resolveContentVariation(slide, presentation);
    } else if (normalizedType.includes('bento') || normalizedType.includes('grid') || normalizedType.includes('feature')) {
        family = 'bento';
        variation = resolveBentoVariation(slide, presentation);
    } else if ((normalizedType.includes('image') || normalizedType.includes('gallery') || normalizedType.includes('splash') || normalizedType.includes('photo') || (hasImage && !isSpecialized)) || hasGallery) {
        family = 'image';
        variation = resolveImageVariation(slide);
    }

    if (!family || !variation) {
        return {
            supported: false,
            fallbackReason: 'Unsupported slide family for faithful editable export.',
        };
    }

    const scene = buildScene({ slide, presentation, colors }, family, variation);
    if (!scene) {
        return {
            supported: false,
            fallbackReason: `Unsupported ${family} variation "${variation}" for faithful editable export.`,
        };
    }

    return {
        supported: true,
        scene,
    };
};
