import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import AdmZip from 'adm-zip';

@Controller('/v1/brand')
@UseGuards(SupabaseGuard)
export class BrandController {

    @Post('/extract-theme')
    @UseInterceptors(FileInterceptor('file'))
    async extractTheme(@UploadedFile() file: Express.Multer.File) {
        if (!file || !file.buffer) {
            throw new BadRequestException('Aucun fichier fourni');
        }

        // Basic check for PPTX/Keynote (Keynote export as PPTX) signature
        // PK.. for zip
        if (file.buffer[0] !== 0x50 || file.buffer[1] !== 0x4B) {
            throw new BadRequestException('Fichier invalide. Veuillez uploader un fichier .pptx');
        }

        try {
            const zip = new AdmZip(file.buffer);
            const themeEntry = zip.getEntry('ppt/theme/theme1.xml');

            if (!themeEntry) {
                // Try searching for any theme file if default path fails
                const entries = zip.getEntries();
                const found = entries.find(e => e.entryName.match(/ppt\/theme\/theme\d+\.xml/));
                if (!found) {
                    throw new BadRequestException('Thème introuvable dans ce fichier PowerPoint');
                }
                return this.parseThemeXml(found.getData().toString('utf8'));
            }

            return this.parseThemeXml(themeEntry.getData().toString('utf8'));

        } catch (e) {
            console.error('Error extracting theme:', e);
            throw new BadRequestException('Erreur lors de la lecture du fichier PowerPoint');
        }
    }

    private parseThemeXml(xml: string) {
        // Helper to extract color by scheme name
        // Office XML uses <a:clrScheme name="Office"> with children <a:dk1>, <a:lt1>, <a:accent1> etc.
        // Inside them, <a:srgbClr val="FFFFFF"/> or <a:sysClr val="windowText" lastClr="000000"/>

        const extractColor = (tag: string) => {
            // Regex to find the tag and then the inner srgbClr val
            // Example: <a:dk1> ... <a:srgbClr val="000000"/> ... </a:dk1>
            // or <a:dk1> ... <a:sysClr ... lastClr="000000"/> ... </a:dk1>

            const tagRegex = new RegExp(`<a:${tag}>(.*?)<\\/a:${tag}>`, 's');
            const match = xml.match(tagRegex);
            if (!match) return null;

            const content = match[1];

            // Try srgbClr first (explicit color)
            const srgbMatch = content.match(/<a:srgbClr val="([0-9A-Fa-f]{6})"/);
            if (srgbMatch) return '#' + srgbMatch[1];

            // Try sysClr (system color with fallback)
            const sysMatch = content.match(/<a:sysClr.*lastClr="([0-9A-Fa-f]{6})"/);
            if (sysMatch) return '#' + sysMatch[1];

            return null;
        };

        const dk1 = extractColor('dk1') || '#000000';
        const lt1 = extractColor('lt1') || '#FFFFFF';
        const accent1 = extractColor('accent1') || '#3B82F6';
        const accent2 = extractColor('accent2') || '#10B981';
        const accent3 = extractColor('accent3') || '#F59E0B';

        // Extract Fonts
        // <a:latin typeface="Calibri" panose="..." pitchFamily="..."/> under <a:majorFont> (Heading) and <a:minorFont> (Body)
        const extractFont = (type: 'majorFont' | 'minorFont') => {
            const tagRegex = new RegExp(`<a:${type}>(.*?)<\\/a:${type}>`, 's');
            const match = xml.match(tagRegex);
            if (!match) return 'Inter'; // Fallback

            const latinMatch = match[1].match(/<a:latin typeface="([^"]+)"/);
            return latinMatch ? latinMatch[1] : 'Inter';
        };

        const headingFont = extractFont('majorFont');
        const bodyFont = extractFont('minorFont');

        return {
            colors: {
                primary: accent1,
                secondary: accent2,
                accent: accent3,
                background: lt1,
                text: dk1
            },
            fonts: {
                heading: headingFont,
                body: bodyFont
            }
        };
    }
}
