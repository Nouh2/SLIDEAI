// apps/api/src/generate/document-parser.service.ts
// Smart Report Parsing: Extracts structured section/chapter information from documents
// Used for "Audit-to-Deck" feature - gives users control over document structure before generation

import { Injectable } from '@nestjs/common';
import { createRequire } from 'module';

// ============================================
// TYPES
// ============================================

export interface DocumentSection {
    id: string;
    title: string;
    level: number; // 1 = H1, 2 = H2, etc.
    pageStart: number;
    pageEnd: number;
    content: string;
    charCount: number;
    estimatedSlides: number; // Rough estimate: 1 slide per ~500 chars
}

export interface ParsedDocument {
    title: string;
    totalPages: number;
    totalChars: number;
    sections: DocumentSection[];
    rawText: string; // For fallback if structure detection fails
}

// ============================================
// HEURISTICS FOR TITLE DETECTION
// ============================================

// Common patterns for section titles in reports/audits
const SECTION_PATTERNS = [
    // Numbered sections: "1.", "1.1", "I.", "I.1", "A.", "A.1"
    /^(\d+\.|\d+\.\d+|[IVXLCDM]+\.|[IVXLCDM]+\.\d+|[A-Z]\.)\s+(.+)$/i,
    // Uppercase headers (often used in reports), allowing numbers now
    /^([A-Z0-9][A-Z0-9\s\-]{3,})$/,
    // Common report section names
    /^(executive summary|introduction|conclusion|recommendations?|appendix|annexe|synthèse|résumé|contexte|objectifs?|méthodologie|analyse|résultats?|discussion|chapter|chapitre)/i,
];

// Ignored patterns (Noise filtering)
const IGNORED_PATTERNS = [
    /^\d+$/, // Just numbers (e.g. "92")
    /^page\s*\d+$/i, // "Page 1"
    /^copyright/i,
    /^all rights reserved/i,
    /^\s*$/,
];

interface FontCluster {
    size: number;
    count: number;
    level: number; // 0 = Body, 1 = H1, 2 = H2, 3 = H3
}

@Injectable()
export class DocumentParserService {

    /**
     * Parse a PDF buffer and extract structured sections
     */
    async parsePDF(buffer: Buffer): Promise<ParsedDocument> {
        const require = createRequire(import.meta.url);
        const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

        const uint8Array = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdf = await loadingTask.promise;

        const pageData: { page: number; items: any[] }[] = [];
        let allText = '';

        // Step 1: Extract all text items with metadata (position, font size)
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pageData.push({ page: i, items: textContent.items });

            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            allText += pageText + '\n';
        }

        // Analyze Font Hierarchy (Clustering)
        const fontHierarchy = this.analyzeFontHierarchy(pageData);

        // Step 2: Detect section boundaries using dynamic hierarchy
        const sections = this.detectSections(pageData, allText, fontHierarchy);

        // Step 3: Infer document title from first section or first line
        const documentTitle = this.inferDocumentTitle(sections, allText);

        return {
            title: documentTitle,
            totalPages: pdf.numPages,
            totalChars: allText.length,
            sections,
            rawText: allText,
        };
    }

    /**
     * Parse a DOCX buffer and extract structured sections
     */
    async parseDOCX(buffer: Buffer): Promise<ParsedDocument> {
        const mammoth = await import('mammoth');

        // Get HTML output to detect headings
        const htmlResult = await mammoth.convertToHtml({ buffer });
        const rawResult = await mammoth.extractRawText({ buffer });

        const sections = this.detectSectionsFromHTML(htmlResult.value);
        const documentTitle = this.inferDocumentTitle(sections, rawResult.value);

        return {
            title: documentTitle,
            totalPages: 0, // DOCX doesn't have reliable page count without rendering
            totalChars: rawResult.value.length,
            sections,
            rawText: rawResult.value,
        };
    }

    /**
     * Analyze font sizes distribution to determine hierarchy dynamically
     */
    private analyzeFontHierarchy(pageData: { page: number; items: any[] }[]): Map<number, number> {
        const sizeCounts = new Map<number, number>();

        // 1. Collect all font sizes (rounded)
        for (const { items } of pageData) {
            for (const item of items) {
                if (item.height && item.str.trim().length > 0) {
                    const size = Math.round(item.height * 10) / 10; // Round to 0.1 precision
                    sizeCounts.set(size, (sizeCounts.get(size) || 0) + 1);
                }
            }
        }

        // 2. Identify Body Text (Mode - most frequent size)
        let bodySize = 0;
        let maxCount = 0;
        for (const [size, count] of sizeCounts.entries()) {
            if (count > maxCount) {
                maxCount = count;
                bodySize = size;
            }
        }

        // 3. Cluster significant sizes
        const clusters: FontCluster[] = [];
        for (const [size, count] of sizeCounts.entries()) {
            // Filter noise: must appear at least 3 times or be larger than body
            if (count > 2 || size > bodySize * 1.1) {
                clusters.push({ size, count, level: 0 });
            }
        }

        // Sort by size descending
        clusters.sort((a, b) => b.size - a.size);

        // 4. Assign Levels dynamically
        const mapping = new Map<number, number>(); // Size -> Level

        let h1Assigned = false;
        let h2Assigned = false;

        for (const cluster of clusters) {
            // Skip body text and smaller
            if (cluster.size <= bodySize * 1.05) {
                mapping.set(cluster.size, 0); // Body
                continue;
            }

            // Heuristic for Heading Levels
            if (!h1Assigned) {
                mapping.set(cluster.size, 1); // Biggest font is H1
                h1Assigned = true;
            } else if (!h2Assigned && cluster.size < clusters[0].size * 0.9) {
                mapping.set(cluster.size, 2); // Significant drop => H2
                h2Assigned = true;
            } else {
                mapping.set(cluster.size, 3); // Others are H3
            }
        }

        console.log('[DocumentParser] Font Hierarchy:', Object.fromEntries(mapping));
        return mapping;
    }

    /**
     * Detect sections from PDF page data using scoring heuristics & dynamic font hierarchy
     */
    private detectSections(
        pageData: { page: number; items: any[] }[],
        fullText: string,
        fontMapping: Map<number, number>
    ): DocumentSection[] {
        const sections: DocumentSection[] = [];
        let sectionId = 0;

        // 1. Analyze global text distribution to detect "Running Headers/Footers"
        const lineFrequency = new Map<string, Set<number>>();
        const totalPages = pageData.length;

        for (const { page, items } of pageData) {
            for (const item of items) {
                const text = item.str?.trim();
                if (text && text.length > 3) {
                    if (!lineFrequency.has(text)) {
                        lineFrequency.set(text, new Set());
                    }
                    lineFrequency.get(text)?.add(page);
                }
            }
        }

        const runningHeaders = new Set<string>();
        for (const [text, pages] of lineFrequency.entries()) {
            if (pages.size > totalPages * 0.4 && totalPages > 3) {
                runningHeaders.add(text);
            }
        }

        // Calculate avgGap for merging logic
        let totalGap = 0;
        let gapCount = 0;
        for (const { items } of pageData) {
            let prevY = -1;
            for (const item of items) {
                if (item.transform && item.transform.length >= 6) {
                    const y = item.transform[5];
                    if (prevY !== -1) {
                        const gap = Math.abs(y - prevY);
                        if (gap < 100) { totalGap += gap; gapCount++; }
                    }
                    prevY = y;
                }
            }
        }
        const avgGap = gapCount > 0 ? totalGap / gapCount : 12;

        let currentSection: DocumentSection | null = null;
        let currentContent: string[] = [];
        let previousWasHeading = false;

        for (const { page, items } of pageData) {
            let prevItem: any = null;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const text = item.str?.trim() || '';
                const fontSize = Math.round((item.height || 0) * 10) / 10;

                if (!text) continue;
                if (runningHeaders.has(text)) continue;

                // Determine hierarchy level from map
                const mappedLevel = fontMapping.get(fontSize) || 0; // 0 = Body

                // SCORING LOGIC (Refined)
                // We combine mapped level + patterns + positioning
                const isMappedHeading = mappedLevel > 0;

                const score = this.calculateHeadingScore(item, prevItem, avgGap, mappedLevel);
                const isHeading = score >= 25 || (isMappedHeading && score > 0);

                if (isHeading) {
                    const finalLevel = mappedLevel > 0 ? mappedLevel : 3;

                    // Check gap for merging (Multi-line titles)
                    let shouldMerge = false;
                    if (previousWasHeading && currentSection && currentSection.pageEnd === page) {
                        if (prevItem && prevItem.transform && item.transform) {
                            const prevY = prevItem.transform[5];
                            const currentY = item.transform[5];
                            const gap = Math.abs(prevY - currentY);

                            // Merge if gap is small AND levels are somewhat consistent (or same pattern)
                            if (gap < (item.height || 12) * 2.5) {
                                shouldMerge = true;
                            }
                        }
                    }

                    if (shouldMerge && currentSection) {
                        currentSection.title += ' ' + this.cleanTitle(text);
                    }
                    else {
                        // Close previous section
                        if (currentSection) {
                            currentSection.content = currentContent.join(' ');
                            currentSection.charCount = currentSection.content.length;
                            currentSection.pageEnd = page;
                            currentSection.estimatedSlides = Math.max(1, Math.ceil(currentSection.charCount / 500));
                            sections.push(currentSection);
                        }

                        // Start new section
                        sectionId++;
                        currentSection = {
                            id: `sec_${sectionId}`,
                            title: this.cleanTitle(text),
                            level: finalLevel,
                            pageStart: page,
                            pageEnd: page,
                            content: '',
                            charCount: 0,
                            estimatedSlides: 1,
                        };
                        currentContent = [];
                    }
                    previousWasHeading = true;
                } else {
                    if (currentSection) {
                        currentContent.push(text);
                    }
                    previousWasHeading = false;
                }
                prevItem = item;
            }
        }

        // Don't forget the last section
        if (currentSection) {
            currentSection.content = currentContent.join(' ');
            currentSection.charCount = currentSection.content.length;
            currentSection.pageEnd = pageData[pageData.length - 1]?.page || 1;
            currentSection.estimatedSlides = Math.max(1, Math.ceil(currentSection.charCount / 500));
            sections.push(currentSection);
        }

        // Fallback
        if (sections.length === 0) {
            sections.push({
                id: 'sec_1',
                title: 'Document Content',
                level: 1,
                pageStart: 1,
                pageEnd: pageData.length,
                content: fullText,
                charCount: fullText.length,
                estimatedSlides: Math.max(1, Math.ceil(fullText.length / 500)),
            });
        }

        return sections;
    }

    /**
     * Detect sections from HTML (for DOCX)
     */
    private detectSectionsFromHTML(html: string): DocumentSection[] {
        const sections: DocumentSection[] = [];
        const headingRegex = /<h(\d)[^>]*>([^<]+)<\/h\d>/gi;
        let match;
        let sectionId = 0;
        const parts = html.split(/<h\d[^>]*>/i);

        while ((match = headingRegex.exec(html)) !== null) {
            sectionId++;
            const level = parseInt(match[1], 10);
            const title = match[2].trim();
            const contentPart = parts[sectionId] || '';
            const content = contentPart.replace(/<[^>]+>/g, ' ').trim();

            sections.push({
                id: `sec_${sectionId}`,
                title,
                level,
                pageStart: 0,
                pageEnd: 0,
                content,
                charCount: content.length,
                estimatedSlides: Math.max(1, Math.ceil(content.length / 500)),
            });
        }
        return sections;
    }

    /**
     * Calculate a score indicating likelihood of being a heading
     * Now primarily relies on the Font Mapping Level (0-3)
     */
    private calculateHeadingScore(item: any, prevItem: any, avgGap: number, mappedLevel: number): number {
        let score = 0;
        const text = item.str.trim();
        const y = item.transform ? item.transform[5] : 0;

        // 1. Strict Ignored Patterns (Hard Reject)
        if (this.isNoise(text)) {
            return -1000;
        }

        // 2. Mapped Level Score (Strongest signal)
        if (mappedLevel === 1) score += 50; // H1
        else if (mappedLevel === 2) score += 30; // H2
        else if (mappedLevel === 3) score += 15; // H3
        else score -= 10; // Body text

        // 3. Vertical Gap Scoring
        if (prevItem && prevItem.transform) {
            const prevY = prevItem.transform[5];
            const gap = Math.abs(prevY - y);
            if (gap > avgGap * 1.8) {
                score += 10; // Significant break
            }
        } else {
            score += 10; // Start of page bonus
        }

        // 4. Pattern Bonus
        for (const pattern of SECTION_PATTERNS) {
            if (pattern.test(text)) {
                score += 20;
                break;
            }
        }

        // 5. Case/Formatting
        if (text.length < 100 && text.length > 3) {
            const isAllCaps = text === text.toUpperCase() && /[A-Z]/.test(text);
            if (isAllCaps) score += 10;
        }

        // Penalize long text
        if (text.length > 150) {
            score -= 20;
        }

        return score;
    }

    private isNoise(text: string): boolean {
        for (const pattern of IGNORED_PATTERNS) if (pattern.test(text)) return true;
        if (text.length < 3 && !/^[A-Z]\.$/.test(text)) return true;
        return false;
    }

    private cleanTitle(text: string): string {
        return text
            .replace(/^\d+\.\d*\s*/, '')
            .replace(/^[IVXLCDM]+\.\s*/i, '')
            .trim();
    }

    private inferDocumentTitle(sections: DocumentSection[], fullText: string): string {
        const h1 = sections.find(s => s.level === 1);
        if (h1) return h1.title;
        if (sections.length > 0) return sections[0].title;
        const firstLine = fullText.split('\n')[0]?.trim() || 'Untitled Document';
        return firstLine.slice(0, 50);
    }
}
