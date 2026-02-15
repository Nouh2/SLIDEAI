// apps/api/src/generate/pptx-parser.service.ts
import { Injectable } from '@nestjs/common';
import AdmZip from 'adm-zip';
import { DocumentSection, ParsedDocument } from './document-parser.service.js';

@Injectable()
export class PPTXParserService {
    /**
     * Parse a PPTX buffer and extract structured slides/sections
     */
    async parsePPTX(buffer: Buffer): Promise<ParsedDocument> {
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        // 1. Find all slide files: ppt/slides/slideN.xml
        const slideEntries = zipEntries
            .filter(e => e.entryName.startsWith('ppt/slides/slide') && e.entryName.endsWith('.xml'))
            .sort((a, b) => {
                const numA = parseInt(a.entryName.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
                const numB = parseInt(b.entryName.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
                return numA - numB;
            });

        const sections: DocumentSection[] = [];
        let totalChars = 0;
        let allText = '';

        // 2. Extract text from each slide
        for (let i = 0; i < slideEntries.length; i++) {
            const entry = slideEntries[i];
            const content = entry.getData().toString('utf8');

            // Basic extraction of text nodes <a:t>...</a:t>
            // We also try to identify placeholders like titles
            const slideTextItems: string[] = [];
            const textMatches = content.matchAll(/<a:t>([^<]*)<\/a:t>/g);
            for (const match of textMatches) {
                if (match[1]) slideTextItems.push(match[1]);
            }

            // Heuristic for title: first text item or most prominent one
            // In OpenXML, titles are often within shapes with ph type="title"
            // But for a simple V1, we take the first few words or the first paragraph
            const title = slideTextItems[0] || `Slide ${i + 1}`;
            const slideContent = slideTextItems.slice(1).join(' ');

            allText += title + '\n' + slideContent + '\n\n';
            totalChars += title.length + slideContent.length;

            sections.push({
                id: `slide_${i + 1}`,
                title: title.length > 100 ? title.substring(0, 97) + '...' : title,
                level: 1, // Every slide starts a section for now
                pageStart: i + 1,
                pageEnd: i + 1,
                content: slideContent,
                charCount: slideContent.length,
                estimatedSlides: 1,
            });
        }

        // 3. Infer document title from first slide
        const documentTitle = sections.length > 0 ? sections[0].title : 'Untitled Presentation';

        return {
            title: documentTitle,
            totalPages: slideEntries.length,
            totalChars,
            sections,
            rawText: allText,
        };
    }
}
