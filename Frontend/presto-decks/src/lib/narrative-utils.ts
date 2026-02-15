
import {
    Info,
    MessageSquare,
    BarChart3,
    Lightbulb,
    ArrowRightCircle,
    Layers,
    CheckCircle2
} from 'lucide-react';

export interface DynamicSegment {
    id: string;
    label: string;
    icon: any;
    color: string;
    slideCount: number;
    startIndex: number;
    slideTitles: string[];
}

const getIconForSection = (title: string, index: number, total: number, isAppendix: boolean = false) => {
    if (isAppendix) return Layers;
    const t = title.toLowerCase();
    if (index === 0) return Info;
    if (t.includes('analys') || t.includes('data') || t.includes('chiffre') || t.includes('market') || t.includes('swot')) return BarChart3;
    if (t.includes('solution') || t.includes('idée') || t.includes('recommand') || t.includes('concept')) return Lightbulb;
    if (t.includes('next') || t.includes('étape') || t.includes('plan') || t.includes('action') || t.includes('roadmap')) return ArrowRightCircle;
    if (t.includes('concl') || t.includes('merci') || t.includes('fin')) return CheckCircle2;
    if (t.includes('app') || t.includes('annex')) return Layers;
    return MessageSquare;
};

const getColors = (index: number) => {
    const colors = [
        'bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-800',
        'bg-purple-500/10 text-purple-500 border-purple-200 dark:border-purple-800',
        'bg-amber-500/10 text-amber-500 border-amber-200 dark:border-amber-800',
        'bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-800',
        'bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-800',
        'bg-indigo-500/10 text-indigo-500 border-indigo-200 dark:border-indigo-800',
        'bg-orange-500/10 text-orange-500 border-orange-200 dark:border-orange-800',
        'bg-cyan-500/10 text-cyan-500 border-cyan-200 dark:border-cyan-800'
    ];
    return colors[index % colors.length];
};

/**
 * Dynamically detects narrative segments based on slide content and layouts.
 */
export const calculateNarrativeSegments = (slides: any[]): DynamicSegment[] => {
    const segments: DynamicSegment[] = [];
    let currentSegment: DynamicSegment | null = null;
    let sectionIndex = 0;

    slides.forEach((slide, index) => {
        const layout = (slide.layout || "").toLowerCase();
        const title = slide.title || "";
        const isHeaderLayout = layout.includes('header') ||
            layout.includes('big') ||
            layout.includes('title-only') ||
            layout.includes('caption') ||
            layout.includes('cover');
        const isDivider = layout.includes('section') || layout.includes('divider');

        // Smart keyword detection for sections
        const sectionKeywords = ['introduction', 'analyse', 'market', 'chiffre', 'donnée', 'data', 'concept', 'strategie', 'stratégie', 'plan', 'conclu', 'annexe', 'appendix', 'merci'];
        const titleWords = title.toLowerCase().split(/\s+/);
        const hasKeywordMatch = sectionKeywords.some(kw => titleWords[0]?.includes(kw) || (titleWords.length > 1 && titleWords[1]?.includes(kw)));

        // Detect transitions between appendix and main flow
        const isEnteringAppendix = slide.isAppendix && (!currentSegment || !currentSegment.id.includes('appendix'));
        const isExitingAppendix = !slide.isAppendix && currentSegment?.id.includes('appendix');

        // Start a new segment if:
        // 1. First slide
        // 2. A section divider slide (Major split)
        // 3. A header/title-only layout (unless it's an appendix slide)
        // 4. A slide with a potential "Section Title" keyword at the start (unless it's an appendix slide)
        // 5. Appendix state transition (Enter or Exit)
        const isNewSegment = index === 0 ||
            isDivider ||
            isEnteringAppendix ||
            isExitingAppendix ||
            (isHeaderLayout && index > 0 && !slide.isAppendix) ||
            (hasKeywordMatch && index > 0 && !slide.isAppendix && (currentSegment?.slideCount || 0) > 1);

        if (isNewSegment) {
            let label = title || (index === 0 ? 'Introduction' : isDivider ? `Section ${sectionIndex + 1}` : 'Appendix');

            // Explicitly prefix appendix segments for visual clarity
            if (slide.isAppendix && !label.toLowerCase().includes('appendix') && !label.toLowerCase().includes('annex')) {
                label = `Appendix: ${label}`;
            }
            const segmentId = slide.isAppendix ? `appendix-${index}` : (isDivider || index === 0) ? `section-${slide.id || index}` : `topic-${index}`;

            currentSegment = {
                id: segmentId,
                label: label,
                icon: getIconForSection(label, index, slides.length, slide.isAppendix),
                color: getColors(sectionIndex),
                slideCount: 1,
                startIndex: index,
                slideTitles: [title || "Untitled Slide"]
            };
            segments.push(currentSegment);
            sectionIndex++;
        } else if (currentSegment) {
            currentSegment.slideCount++;
            currentSegment.slideTitles.push(title || "Untitled Slide");
        }
    });

    if (segments.length === 0 && slides.length > 0) {
        segments.push({
            id: 'default',
            label: 'Main Presentation',
            icon: MessageSquare,
            color: getColors(0),
            slideCount: slides.length,
            startIndex: 0,
            slideTitles: slides.map(s => s.title || "Untitled Slide")
        });
    }

    return segments;
};
