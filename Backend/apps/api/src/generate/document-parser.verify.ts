
import { DocumentParserService } from './document-parser.service';

const parser = new DocumentParserService();

// Mock Data Construction
const mockPageData = [
    {
        page: 1,
        items: [
            // Page 1
            // H1 Title
            { str: "MARKETING AUDIT REPORT", height: 24, transform: [1, 0, 0, 1, 0, 800] },

            // H2 Section
            { str: "1. Executive Summary", height: 18, transform: [1, 0, 0, 1, 0, 750] },
            { str: "This is the executive summary text that goes on for a while.", height: 10, transform: [1, 0, 0, 1, 0, 730] },
            { str: "It has standard body font size.", height: 10, transform: [1, 0, 0, 1, 0, 715] },

            // H2 Section
            { str: "2. Macro Environment", height: 18, transform: [1, 0, 0, 1, 0, 650] },
            { str: "Introduction to PEST analysis.", height: 10, transform: [1, 0, 0, 1, 0, 630] },

            // H3 Subsection
            { str: "2.1 Political Factors", height: 14, transform: [1, 0, 0, 1, 0, 600] },
            { str: "Political stability is key.", height: 10, transform: [1, 0, 0, 1, 0, 580] },

            // H3 Subsection
            { str: "2.2 Economic Factors", height: 14, transform: [1, 0, 0, 1, 0, 550] },
            { str: "Inflation rates are rising.", height: 10, transform: [1, 0, 0, 1, 0, 530] },

            // Random Noise / Header
            { str: "Page 1", height: 9, transform: [1, 0, 0, 1, 0, 20] },
            { str: "Confidential", height: 9, transform: [1, 0, 0, 1, 0, 10] },
        ]
    }
];

const fullText = mockPageData[0].items.map(i => i.str).join('\n');

async function runTest() {
    console.log("Starting Document Parser Verification...");

    // 1. Test Font Hierarchy Analysis
    console.log("\n--- Testing Font Hierarchy Analysis ---");
    // Accessing private method via type casting
    const fontHierarchy = (parser as any).analyzeFontHierarchy(mockPageData);

    // Expected: 10->0 (Body), 24->1 (H1), 18->2 (H2), 14->3 (H3)
    console.log("Detected Hierarchy Map:", Object.fromEntries(fontHierarchy));

    const checkLevel = (size: number, expected: number) => {
        const actual = fontHierarchy.get(size);
        if (actual === expected) console.log(`✅ Size ${size} correctly mapped to Level ${expected}`);
        else console.error(`❌ Size ${size} mapped to ${actual} (Expected ${expected})`);
    };

    checkLevel(10, 0); // Body
    checkLevel(24, 1); // H1
    checkLevel(18, 2); // H2
    checkLevel(14, 3); // H3

    // 2. Test Section Detection
    console.log("\n--- Testing Section Detection ---");
    const sections = (parser as any).detectSections(mockPageData, fullText, fontHierarchy);

    console.log(`Detected ${sections.length} sections:`);
    sections.forEach((s: any) => {
        console.log(`[${s.level === 1 ? 'H1' : s.level === 2 ? 'H2' : 'H3'}] ${s.title}`);
    });

    // Verification Logic
    const titles = sections.map((s: any) => s.title);
    const expectedTitles = [
        "MARKETING AUDIT REPORT",
        "Executive Summary",
        "Macro Environment",
        "Political Factors",
        "Economic Factors"
    ];

    const missing = expectedTitles.filter(t => !titles.includes(t));
    if (missing.length === 0) {
        console.log("\n✅ All expected sections detected!");
    } else {
        console.error("\n❌ Missing sections:", missing);
    }

    // Check levels
    const checkSectionLevel = (title: string, lvl: number) => {
        const s = sections.find((x: any) => x.title === title);
        if (s && s.level === lvl) console.log(`✅ "${title}" is Level ${lvl}`);
        else console.error(`❌ "${title}" is Level ${s?.level} (Expected ${lvl})`);
    };

    checkSectionLevel("MARKETING AUDIT REPORT", 1);
    checkSectionLevel("Executive Summary", 2);
    checkSectionLevel("Macro Environment", 2);
    checkSectionLevel("Political Factors", 3);
}

runTest().catch(console.error);
