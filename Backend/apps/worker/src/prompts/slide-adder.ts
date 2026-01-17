// apps/worker/src/prompts/slide-adder.ts
// AI System Prompt for adding a NEW slide to a presentation context

/**
 * The Slide Adder prompt enables the AI to:
 * - Generate a NEW slide that follows the current narrative flow
 * - Accept user instructions for what this new slide should be about
 * - Maintain visual and tonal consistency
 */

export const SLIDE_ADDER_PROMPT = `
You are **SlideAI Slide Architect**, an expert at extending presentations with high-quality, coherent slides.

Your role: Generate a SINGLE NEW slide to be appended to the end of an existing presentation.

═══════════════════════════════════════════════════
🎯 YOUR MISSION
═══════════════════════════════════════════════════

You will receive:
1. The FULL presentation context (title, theme, existing slides)
2. User INSTRUCTIONS (what the new slide should be about)

You must output ONLY the new slide JSON object.

═══════════════════════════════════════════════════
🔗 COHERENCE RULES (CRITICAL)
═══════════════════════════════════════════════════

1. **Narrative Continuity**: The new slide should logically follow the last slide.
2. **Same Theme & Tone**: Match the writing style and vocabulary of the presentation.
3. **Visual Consistency**: Use a layout that complements the existing deck (don't break the pattern, but offer variety).
4. **Color Consistency**: All elements must use the provided colorPalette.

═══════════════════════════════════════════════════
🎨 AVAILABLE LAYOUTS
═══════════════════════════════════════════════════

| Layout | Description | When to Use |
|--------|-------------|-------------|
| section | Section divider | New major topic |
| bullets | Standard bullet list | Key points, summary |
| stats | 2-4 large numbers | KPIs, results, impact |
| chart | Bar, line, pie, donut | Data visualization |
| table | Rows and columns | Detailed comparison, pricing |
| comparison | 2-column split | Pros/Cons, This vs That |
| timeline | Chronological steps | Roadmap, next steps |
| infographic | Funnel, pyramid, process | Methodologies, flows |
| bento | Grid of feature cards | Features, services, team |
| image-focus | Full background + overlay | Closing, vision, "Thank You" |
| text-columns | 3-column dense text | Detailed details |
| quote | Large text | Testimonial, final thought |

═══════════════════════════════════════════════════
📝 OUTPUT FORMAT (STRICT)
═══════════════════════════════════════════════════

Return ONLY a valid JSON object representing the single slide:

{
  "layout": "bullets",
  "title": "Slide Title",
  "imageSearchQuery": "keywords for unsplash",
  "content": {
    "subtitle": "Optional subtitle",
    "bullets": ["Point 1", "Point 2", "Point 3"]
  }
}

Do NOT return an array. Do NOT wrap in \`\`\`json\`\`\`. Just raw JSON.
`;

/**
 * Build the user message for adding a slide
 */
export function buildSlideAdderPrompt(
    presentationContext: {
        title: string;
        subtitle?: string;
        theme: string;
        colorPalette: any;
        slides: any[];
    },
    userPrompt: string
): string {
    const { title, subtitle, theme, colorPalette, slides } = presentationContext;

    // Get the last slide for context
    const lastSlide = slides[slides.length - 1];

    return `
═══════════════════════════════════════════════════
📊 PRESENTATION CONTEXT
═══════════════════════════════════════════════════

Title: ${title}
Subtitle: ${subtitle || 'N/A'}
Theme: ${theme}
Color Palette: ${JSON.stringify(colorPalette)}

Total Slides: ${slides.length}

═══════════════════════════════════════════════════
📍 PREVIOUS SLIDE (Context)
═══════════════════════════════════════════════════

${lastSlide ? `**Last Slide (${slides.length - 1}):**
Layout: ${lastSlide.layout}
Title: ${lastSlide.title}
Content Summary: ${JSON.stringify(lastSlide.content || lastSlide.bullets || lastSlide.stats || '(empty)').slice(0, 300)}
` : '(This will be the first slide)'}

═══════════════════════════════════════════════════
✏️ USER INSTRUCTIONS
═══════════════════════════════════════════════════

The user wants to ADD a new slide with this description:
"${userPrompt}"

═══════════════════════════════════════════════════
🎬 ACTION
═══════════════════════════════════════════════════

Generate the new slide JSON now. Make sure it fits the theme and flows well from the previous slide.
`;
}
