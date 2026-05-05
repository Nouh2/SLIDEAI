// apps/worker/src/schemas/deck-schema.ts
// Gemini responseSchema for strict JSON output
// Defines STRUCTURE (required fields) but NOT LIMITS (array lengths are unlimited)

import { SchemaType } from '@google/generative-ai';

/**
 * Response schema for full deck generation (generate worker)
 * Forces Gemini to output the exact structure expected by the frontend
 */
export const DECK_RESPONSE_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        title: { type: SchemaType.STRING, description: "Presentation title" },
        subtitle: { type: SchemaType.STRING, description: "Presentation subtitle", nullable: true },
        colorPalette: {
            type: SchemaType.OBJECT,
            properties: {
                primary: { type: SchemaType.STRING, description: "Primary brand color (hex)" },
                secondary: { type: SchemaType.STRING, description: "Secondary accent color (hex)" },
                accent: { type: SchemaType.STRING, description: "Highlight color for CTAs (hex)" },
                bg: { type: SchemaType.STRING, description: "Background color (hex)" },
                text: { type: SchemaType.STRING, description: "Main text color (hex)" }
            },
            required: ["primary", "secondary", "accent", "bg", "text"]
        },
        slides: {
            type: SchemaType.ARRAY,
            description: "Array of slides in the presentation",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    layout: {
                        type: SchemaType.STRING,
                        description: "Layout type: cover, section, bullets, stats, chart, table, comparison, timeline, infographic, bento, image-focus, text-columns, quote"
                    },
                    title: { type: SchemaType.STRING, description: "Slide title" },
                    imageSearchQuery: { type: SchemaType.STRING, description: "English keywords for Unsplash image search" },
                    content: {
                        type: SchemaType.OBJECT,
                        description: "Slide content - include only fields relevant to the layout",
                        properties: {
                            // Basic content (cover, section, bullets, image-focus)
                            subtitle: { type: SchemaType.STRING, nullable: true },
                            text: { type: SchemaType.STRING, nullable: true },
                            bullets: {
                                type: SchemaType.ARRAY,
                                items: { type: SchemaType.STRING },
                                nullable: true
                            },

                            // Stats layout - array of value/label pairs
                            stats: {
                                type: SchemaType.ARRAY,
                                nullable: true,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        value: { type: SchemaType.STRING, description: "The metric value (e.g., '+300%', '$10M')" },
                                        label: { type: SchemaType.STRING, description: "Description of the metric" }
                                    },
                                    required: ["value", "label"]
                                }
                            },

                            // Bento/Grid layout - array of feature items
                            items: {
                                type: SchemaType.ARRAY,
                                nullable: true,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        title: { type: SchemaType.STRING, description: "Item title" },
                                        description: { type: SchemaType.STRING, description: "Item description (2-3 sentences)" }
                                    },
                                    required: ["title", "description"]
                                }
                            },

                            // Chart layout - data visualization
                            chart: {
                                type: SchemaType.OBJECT,
                                nullable: true,
                                properties: {
                                    type: {
                                        type: SchemaType.STRING,
                                        enum: ["bar", "line", "pie", "donut"],
                                        description: "Chart type: bar, line, pie, donut"
                                    },
                                    title: { type: SchemaType.STRING, nullable: true },
                                    categories: {
                                        type: SchemaType.ARRAY,
                                        items: { type: SchemaType.STRING },
                                        description: "X-axis labels"
                                    },
                                    series: {
                                        type: SchemaType.ARRAY,
                                        items: {
                                            type: SchemaType.OBJECT,
                                            properties: {
                                                name: { type: SchemaType.STRING, description: "Series name" },
                                                data: {
                                                    type: SchemaType.ARRAY,
                                                    items: { type: SchemaType.NUMBER },
                                                    description: "Numeric data points"
                                                }
                                            },
                                            required: ["name", "data"]
                                        }
                                    }
                                },
                                required: ["type", "categories", "series"]
                            },

                            // Table layout - structured data
                            table: {
                                type: SchemaType.OBJECT,
                                nullable: true,
                                properties: {
                                    columns: {
                                        type: SchemaType.ARRAY,
                                        items: { type: SchemaType.STRING },
                                        description: "Column headers"
                                    },
                                    rows: {
                                        type: SchemaType.ARRAY,
                                        items: {
                                            type: SchemaType.ARRAY,
                                            items: { type: SchemaType.STRING }
                                        },
                                        description: "Row data as 2D array"
                                    }
                                },
                                required: ["columns", "rows"]
                            },

                            // Timeline layout - chronological events
                            timeline: {
                                type: SchemaType.OBJECT,
                                nullable: true,
                                properties: {
                                    items: {
                                        type: SchemaType.ARRAY,
                                        items: {
                                            type: SchemaType.OBJECT,
                                            properties: {
                                                date: { type: SchemaType.STRING, description: "Date or time period" },
                                                title: { type: SchemaType.STRING, description: "Event title" },
                                                description: { type: SchemaType.STRING, nullable: true }
                                            },
                                            required: ["date", "title"]
                                        }
                                    }
                                },
                                required: ["items"]
                            },

                            // Comparison layout - two-column comparison
                            comparison: {
                                type: SchemaType.OBJECT,
                                nullable: true,
                                properties: {
                                    left: {
                                        type: SchemaType.OBJECT,
                                        properties: {
                                            title: { type: SchemaType.STRING },
                                            subtitle: { type: SchemaType.STRING, nullable: true },
                                            items: {
                                                type: SchemaType.ARRAY,
                                                items: { type: SchemaType.STRING }
                                            }
                                        },
                                        required: ["title", "items"]
                                    },
                                    right: {
                                        type: SchemaType.OBJECT,
                                        properties: {
                                            title: { type: SchemaType.STRING },
                                            subtitle: { type: SchemaType.STRING, nullable: true },
                                            items: {
                                                type: SchemaType.ARRAY,
                                                items: { type: SchemaType.STRING }
                                            }
                                        },
                                        required: ["title", "items"]
                                    }
                                },
                                required: ["left", "right"]
                            },

                            // Infographic layout - funnel/pyramid/process
                            infographic: {
                                type: SchemaType.OBJECT,
                                nullable: true,
                                properties: {
                                    type: { type: SchemaType.STRING, description: "Infographic type: funnel, pyramid, process" },
                                    steps: {
                                        type: SchemaType.ARRAY,
                                        items: {
                                            type: SchemaType.OBJECT,
                                            properties: {
                                                label: { type: SchemaType.STRING },
                                                value: { type: SchemaType.STRING, nullable: true }
                                            },
                                            required: ["label"]
                                        }
                                    }
                                },
                                required: ["type", "steps"]
                            },

                            // Quote layout - testimonial or quote
                            quote: {
                                type: SchemaType.OBJECT,
                                nullable: true,
                                properties: {
                                    text: { type: SchemaType.STRING, description: "The quote text" },
                                    author: { type: SchemaType.STRING, nullable: true },
                                    role: { type: SchemaType.STRING, nullable: true }
                                },
                                required: ["text"]
                            },

                            // Text-columns layout - MUST be array of objects, NOT array of strings
                            columns: {
                                type: SchemaType.ARRAY,
                                nullable: true,
                                description: "Text columns - each column MUST have title and text properties",
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        title: { type: SchemaType.STRING, description: "Column header/title" },
                                        text: { type: SchemaType.STRING, description: "Column body text (can be long paragraph)" }
                                    },
                                    required: ["title", "text"]
                                }
                            }
                        }
                    },

                    // Source Reference - for Evidence Linking (traceability)
                    // This is at SLIDE level, not inside content
                    sourceRef: {
                        type: SchemaType.OBJECT,
                        nullable: true,
                        description: "Source reference for content traceability (from parsed documents)",
                        properties: {
                            sectionTitle: { type: SchemaType.STRING, description: "Original section title from the source document" },
                            pageStart: { type: SchemaType.NUMBER, description: "Starting page number in source document" },
                            pageEnd: { type: SchemaType.NUMBER, description: "Ending page number in source document" },
                            verified: { type: SchemaType.BOOLEAN, nullable: true, description: "Whether the source reference was verified by strict evidence post-processing" }
                        },
                        required: ["sectionTitle", "pageStart", "pageEnd"]
                    }
                },
                required: ["layout", "title", "imageSearchQuery", "content"]
            }
        }
    },
    required: ["title", "colorPalette", "slides"]
};

/**
 * Response schema for single slide generation (regenerate-slide, add-slide workers)
 */
export const SINGLE_SLIDE_RESPONSE_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        layout: {
            type: SchemaType.STRING,
            description: "Layout type: cover, section, bullets, stats, chart, table, comparison, timeline, infographic, bento, image-focus, text-columns, quote"
        },
        title: { type: SchemaType.STRING, description: "Slide title" },
        imageSearchQuery: { type: SchemaType.STRING, description: "English keywords for Unsplash image search" },
        content: DECK_RESPONSE_SCHEMA.properties.slides.items.properties.content
    },
    required: ["layout", "title", "imageSearchQuery", "content"]
};
