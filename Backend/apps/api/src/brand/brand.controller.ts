import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    NotFoundException,
    Param,
    Post,
    Put,
    Req,
    UseGuards,
} from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { PrismaService } from '../prisma.service.js';
import AdmZip from 'adm-zip';
import { FastifyRequest } from 'fastify';

type BrandKitBody = {
    name?: string;
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
    logo_url?: string | null;
    template_overlay?: Record<string, any> | null;
    is_default?: boolean;
};

@Controller('/v1/brand')
@UseGuards(SupabaseGuard)
export class BrandController {
    constructor(private readonly prisma: PrismaService) {}

    @Get('/kits')
    async listBrandKits(@Req() req: FastifyRequest & { user: any }) {
        return this.prisma.brand_kits.findMany({
            where: this.buildScopeWhere(req.user),
            orderBy: [
                { is_default: 'desc' },
                { created_at: 'desc' },
            ],
        });
    }

    @Post('/kits')
    async createBrandKit(
        @Req() req: FastifyRequest & { user: any },
        @Body() body: BrandKitBody,
    ) {
        this.validateBrandKitBody(body);
        const orgId = req.user.org_id ?? null;

        if (body.is_default) {
            await this.clearDefaultInScope(req.user);
        }

        return this.prisma.brand_kits.create({
            data: {
                user_id: req.user.sub,
                org_id: orgId,
                name: body.name!.trim(),
                colors: body.colors!,
                fonts: body.fonts!,
                logo_url: body.logo_url || null,
                template_overlay: body.template_overlay || {},
                is_default: Boolean(body.is_default),
            },
        });
    }

    @Put('/kits/:id')
    async updateBrandKit(
        @Req() req: FastifyRequest & { user: any },
        @Param('id') id: string,
        @Body() body: BrandKitBody,
    ) {
        this.validateBrandKitBody(body);
        await this.ensureBrandKitAccess(id, req.user);

        if (body.is_default) {
            await this.clearDefaultInScope(req.user, id);
        }

        return this.prisma.brand_kits.update({
            where: { id },
            data: {
                name: body.name!.trim(),
                colors: body.colors!,
                fonts: body.fonts!,
                logo_url: body.logo_url || null,
                template_overlay: body.template_overlay || {},
                is_default: Boolean(body.is_default),
                updated_at: new Date(),
            },
        });
    }

    @Delete('/kits/:id')
    async deleteBrandKit(
        @Req() req: FastifyRequest & { user: any },
        @Param('id') id: string,
    ) {
        await this.ensureBrandKitAccess(id, req.user);
        await this.prisma.brand_kits.delete({ where: { id } });
        return { success: true };
    }

    @Post('/extract-theme')
    async extractTheme(@Req() req: FastifyRequest) {
        const data = await req.file();
        if (!data) {
            throw new BadRequestException('Aucun fichier fourni');
        }
        const buffer = await data.toBuffer();

        // Basic check for PPTX signature (PK zip)
        if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
            throw new BadRequestException('Fichier invalide. Veuillez uploader un fichier .pptx');
        }

        try {
            const zip = new AdmZip(buffer);
            const entries = zip.getEntries();

            // Collect all XML content from relevant PPTX parts
            const xmlContents: string[] = [];
            const slideXmls: string[] = [];
            const masterXmls: string[] = [];
            const themeXmls: string[] = [];

            for (const entry of entries) {
                const name = entry.entryName;
                if (!name.endsWith('.xml')) continue;

                // Only parse relevant XML files (skip metadata, rels, etc.)
                if (name.startsWith('ppt/slides/') ||
                    name.startsWith('ppt/slideMasters/') ||
                    name.startsWith('ppt/slideLayouts/') ||
                    name.startsWith('ppt/theme/')) {
                    const content = entry.getData().toString('utf8');
                    xmlContents.push(content);

                    if (name.startsWith('ppt/slides/slide')) slideXmls.push(content);
                    if (name.startsWith('ppt/slideMasters/')) masterXmls.push(content);
                    if (name.startsWith('ppt/theme/')) themeXmls.push(content);
                }
            }

            if (xmlContents.length === 0) {
                throw new BadRequestException('Aucun contenu trouvé dans ce fichier PowerPoint');
            }

            const allXml = xmlContents.join('\n');

            // ============ EXTRACT COLORS ============
            const colors = this.extractColors(allXml, slideXmls, masterXmls, themeXmls);

            // ============ EXTRACT FONTS ============
            const fonts = this.extractFonts(allXml, themeXmls);

            console.log('[BrandExtractor] Extracted colors:', colors);
            console.log('[BrandExtractor] Extracted fonts:', fonts);

            return { colors, fonts };

        } catch (e) {
            if (e instanceof BadRequestException) throw e;
            console.error('Error extracting theme:', e);
            throw new BadRequestException('Erreur lors de la lecture du fichier PowerPoint');
        }
    }

    /**
     * Extract the most representative colors from the PPTX.
     * Strategy:
     * 1. Collect ALL srgbClr values from slides, masters, layouts
     * 2. Also collect background colors from slide masters
     * 3. Rank by frequency and classify by luminance
     */
    private extractColors(
        allXml: string,
        slideXmls: string[],
        masterXmls: string[],
        themeXmls: string[],
    ) {
        // Collect all explicit hex colors (srgbClr)
        const colorCounts = new Map<string, number>();
        const colorRegex = /srgbClr val="([0-9A-Fa-f]{6})"/g;
        let match: RegExpExecArray | null;

        while ((match = colorRegex.exec(allXml)) !== null) {
            const hex = match[1].toUpperCase();
            colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
        }

        // Also extract background colors from slide masters (solidFill in bg)
        const bgColors: string[] = [];
        for (const masterXml of masterXmls) {
            // Look for <p:bg> ... <a:srgbClr val="XXX">
            const bgMatch = masterXml.match(/<p:bg>[\s\S]*?<a:srgbClr val="([0-9A-Fa-f]{6})"/);
            if (bgMatch) {
                bgColors.push(bgMatch[1].toUpperCase());
            }
            // Also look for solidFill in cSld > bg
            const bgMatch2 = masterXml.match(/<p:cSld>[\s\S]*?<p:bg>[\s\S]*?<a:solidFill>[\s\S]*?<a:srgbClr val="([0-9A-Fa-f]{6})"/);
            if (bgMatch2) {
                bgColors.push(bgMatch2[1].toUpperCase());
            }
        }

        // Also check slide backgrounds
        for (const slideXml of slideXmls) {
            const bgMatch = slideXml.match(/<p:bg>[\s\S]*?<a:srgbClr val="([0-9A-Fa-f]{6})"/);
            if (bgMatch) {
                bgColors.push(bgMatch[1].toUpperCase());
            }
        }

        // Remove very common/generic colors that aren't useful
        const genericColors = new Set(['000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF']);

        // Sort colors by frequency
        const sortedColors = Array.from(colorCounts.entries())
            .filter(([hex]) => !genericColors.has(hex))
            .sort((a, b) => b[1] - a[1]);

        // Classify colors by luminance
        const darkColors: Array<{ hex: string; count: number; lum: number }> = [];
        const lightColors: Array<{ hex: string; count: number; lum: number }> = [];
        const vibrantColors: Array<{ hex: string; count: number; sat: number }> = [];

        for (const [hex, count] of sortedColors) {
            const { lum, sat } = this.getColorProperties(hex);

            if (lum < 0.15) {
                darkColors.push({ hex, count, lum });
            } else if (lum > 0.85) {
                lightColors.push({ hex, count, lum });
            } else if (sat > 0.2) {
                vibrantColors.push({ hex, count, sat });
            }
        }

        // Determine background color
        let background = '#FFFFFF';
        if (bgColors.length > 0) {
            background = '#' + bgColors[0];
        } else if (darkColors.length > 0) {
            // If the most frequent dark color appears a lot, it's probably the background
            background = '#' + darkColors[0].hex;
        }

        const bgLum = this.getColorProperties(background.replace('#', '')).lum;
        const isDarkTheme = bgLum < 0.5;

        // Determine text color (opposite of background)
        let text: string;
        if (isDarkTheme) {
            text = lightColors.length > 0 ? '#' + lightColors[0].hex : '#FFFFFF';
        } else {
            text = darkColors.length > 0 ? '#' + darkColors[0].hex : '#000000';
        }

        // Pick primary, secondary, accent from vibrant colors (most frequent)
        const primary = vibrantColors.length > 0 ? '#' + vibrantColors[0].hex : '#3B82F6';
        const secondary = vibrantColors.length > 1 ? '#' + vibrantColors[1].hex : this.shiftHue(primary);
        const accent = vibrantColors.length > 2 ? '#' + vibrantColors[2].hex : this.shiftHue(secondary);

        return { primary, secondary, accent, background, text };
    }

    /**
     * Extract the most commonly used fonts from the PPTX.
     * Scans typeface attributes across all XML, filtering out symbol/system fonts.
     */
    private extractFonts(allXml: string, themeXmls: string[]) {
        const fontCounts = new Map<string, number>();
        const ignoredFonts = new Set([
            'Wingdings', 'Wingdings 2', 'Wingdings 3',
            'Symbol', 'Webdings', 'Courier New',
            '+mj-lt', '+mn-lt', '+mj-ea', '+mn-ea', '+mj-cs', '+mn-cs',
        ]);

        // Scan all XML for typeface attributes
        const fontRegex = /typeface="([^"]+)"/g;
        let match: RegExpExecArray | null;

        while ((match = fontRegex.exec(allXml)) !== null) {
            const font = match[1].trim();
            if (font && !ignoredFonts.has(font) && !font.startsWith('+')) {
                fontCounts.set(font, (fontCounts.get(font) || 0) + 1);
            }
        }

        // Also extract theme fonts as fallback
        let themeMajorFont: string | null = null;
        let themeMinorFont: string | null = null;

        for (const themeXml of themeXmls) {
            // Major font (headings)
            const majorMatch = themeXml.match(/<a:majorFont>[\s\S]*?<a:latin typeface="([^"]+)"/);
            if (majorMatch && !majorMatch[1].startsWith('+')) {
                themeMajorFont = majorMatch[1];
            }

            // Minor font (body)
            const minorMatch = themeXml.match(/<a:minorFont>[\s\S]*?<a:latin typeface="([^"]+)"/);
            if (minorMatch && !minorMatch[1].startsWith('+')) {
                themeMinorFont = minorMatch[1];
            }
        }

        // Sort by frequency
        const sortedFonts = Array.from(fontCounts.entries())
            .sort((a, b) => b[1] - a[1]);

        // The most used font is typically the body font
        // The second most used is typically the heading font
        const topFonts = sortedFonts.slice(0, 5).map(f => f[0]);

        let heading = themeMajorFont || topFonts[1] || topFonts[0] || 'Inter';
        let body = themeMinorFont || topFonts[0] || 'Inter';

        // If both are the same, that's fine (some presentations use one font throughout)
        // But try to differentiate if possible
        if (heading === body && topFonts.length > 1) {
            heading = topFonts[1];
        }

        return { heading, body };
    }

    /**
     * Calculate luminance and saturation of a hex color.
     */
    private getColorProperties(hex: string): { lum: number; sat: number } {
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;

        // Relative luminance (perceived brightness)
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        // Simple saturation calculation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;

        return { lum, sat };
    }

    /**
     * Create a shifted hue variant of a color for fallback secondary/accent.
     */
    private shiftHue(hex: string): string {
        const clean = hex.replace('#', '');
        let r = parseInt(clean.slice(0, 2), 16);
        let g = parseInt(clean.slice(2, 4), 16);
        let b = parseInt(clean.slice(4, 6), 16);

        // Simple hue shift: rotate RGB channels
        const temp = r;
        r = g;
        g = b;
        b = temp;

        return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
    }

    private buildScopeWhere(user: any) {
        if (user.org_id) {
            return { org_id: user.org_id };
        }

        return {
            user_id: user.sub,
            org_id: null,
        };
    }

    private async clearDefaultInScope(user: any, exceptId?: string) {
        await this.prisma.brand_kits.updateMany({
            where: {
                ...this.buildScopeWhere(user),
                ...(exceptId ? { id: { not: exceptId } } : {}),
            },
            data: { is_default: false },
        });
    }

    private async ensureBrandKitAccess(id: string, user: any) {
        const kit = await this.prisma.brand_kits.findUnique({ where: { id } });

        if (!kit) {
            throw new NotFoundException('Brand kit introuvable');
        }

        if (kit.org_id) {
            if (kit.org_id !== user.org_id) {
                throw new ForbiddenException("Ce brand kit appartient a un autre workspace.");
            }
            return kit;
        }

        if (kit.user_id !== user.sub || user.org_id) {
            throw new ForbiddenException("Vous ne pouvez pas modifier ce brand kit.");
        }

        return kit;
    }

    private validateBrandKitBody(body: BrandKitBody) {
        if (!body?.name?.trim()) {
            throw new BadRequestException('Le nom du brand kit est requis.');
        }

        if (!body.colors || typeof body.colors !== 'object') {
            throw new BadRequestException('Les couleurs du brand kit sont requises.');
        }

        if (!body.fonts || typeof body.fonts !== 'object') {
            throw new BadRequestException('Les polices du brand kit sont requises.');
        }
    }
}
