import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const BASE_URL = process.env.VR_BASE_URL || 'http://127.0.0.1:8080/qa/visual-regression';
const MAX_DIFF_RATIO = Number(process.env.VR_MAX_DIFF_RATIO || 0.015);
const MAX_DIFF_RATIO_COVER = Number(process.env.VR_MAX_DIFF_RATIO_COVER || 0.042);
const READY_TIMEOUT_MS = Number(process.env.VR_READY_TIMEOUT_MS || 120000);
const BATCH_SIZE = Number(process.env.VR_BATCH_SIZE || 20);

const TYPE_THRESHOLDS = {
    content: Number(process.env.VR_MAX_DIFF_RATIO_CONTENT || 0.03),
    'text-columns': Number(process.env.VR_MAX_DIFF_RATIO_TEXT_COLUMNS || 0.025),
    stats: Number(process.env.VR_MAX_DIFF_RATIO_STATS || 0.04),
    table: Number(process.env.VR_MAX_DIFF_RATIO_TABLE || 0.021),
    bento: Number(process.env.VR_MAX_DIFF_RATIO_BENTO || 0.02),
    timeline: Number(process.env.VR_MAX_DIFF_RATIO_TIMELINE || 0.03),
    comparison: Number(process.env.VR_MAX_DIFF_RATIO_COMPARISON || 0.024),
    showcase: Number(process.env.VR_MAX_DIFF_RATIO_SHOWCASE || 0.026),
    section: Number(process.env.VR_MAX_DIFF_RATIO_SECTION || 0.02),
    'tows-distribution': Number(process.env.VR_MAX_DIFF_RATIO_TOWS_DISTRIBUTION || 0.05),
    infographic: Number(process.env.VR_MAX_DIFF_RATIO_INFOGRAPHIC || 0.024),
};

const getAllowedDiffRatio = (slideType) => {
    const normalized = (slideType || '').toLowerCase();
    if (normalized.includes('cover')) return MAX_DIFF_RATIO_COVER;
    return TYPE_THRESHOLDS[normalized] ?? MAX_DIFF_RATIO;
};
const ARTIFACT_DIR = path.join(projectRoot, 'tests', 'visual-artifacts');
const FRONT_DIR = path.join(ARTIFACT_DIR, 'front');
const EXPORT_DIR = path.join(ARTIFACT_DIR, 'export');
const DIFF_DIR = path.join(ARTIFACT_DIR, 'diff');

const ensureDirs = async () => {
    await fs.mkdir(FRONT_DIR, { recursive: true });
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    await fs.mkdir(DIFF_DIR, { recursive: true });
};

const parsePng = (buffer) => PNG.sync.read(buffer);

const toBufferFromDataUrl = (dataUrl) => {
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    return Buffer.from(base64, 'base64');
};

const compare = (frontBuffer, exportBuffer) => {
    const frontPng = parsePng(frontBuffer);
    const exportPng = parsePng(exportBuffer);

    if (frontPng.width !== exportPng.width || frontPng.height !== exportPng.height) {
        throw new Error(
            `Dimension mismatch: front=${frontPng.width}x${frontPng.height}, export=${exportPng.width}x${exportPng.height}`,
        );
    }

    const diffPng = new PNG({ width: frontPng.width, height: frontPng.height });
    const diffPixels = pixelmatch(
        frontPng.data,
        exportPng.data,
        diffPng.data,
        frontPng.width,
        frontPng.height,
        { threshold: 0.1 },
    );

    const totalPixels = frontPng.width * frontPng.height;
    return {
        diffPixels,
        totalPixels,
        diffRatio: diffPixels / totalPixels,
        diffPng,
    };
};

const run = async () => {
    await ensureDirs();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 2100, height: 1400 } });
    const failures = [];
    let offset = 0;
    let totalProcessed = 0;
    let keepGoing = true;

    while (keepGoing) {
        const url = new URL(BASE_URL);
        if (BATCH_SIZE > 0) {
            url.searchParams.set('max', String(BATCH_SIZE));
            url.searchParams.set('offset', String(offset));
        }

        await page.goto(url.toString(), { waitUntil: 'networkidle' });
        await page.waitForFunction(() => {
            if (window.__VISUAL_ERROR__) {
                throw new Error(`QA page setup failed: ${window.__VISUAL_ERROR__}`);
            }
            return window.__VISUAL_READY__ === true;
        }, undefined, { timeout: READY_TIMEOUT_MS });

        const slideCount = await page.locator('[data-qa-slide-root]').count();
        if (slideCount === 0) {
            if (totalProcessed === 0) {
                throw new Error('No QA slides found on visual regression page');
            }
            break;
        }

        for (let i = 0; i < slideCount; i += 1) {
            const locator = page.locator(`[data-qa-slide-root="${i}"]`);
            const frontBuffer = await locator.screenshot({ type: 'png' });
            const slideType = (await locator.getAttribute('data-qa-slide-type')) || '';
            const slideKey = (await locator.getAttribute('data-qa-slide-key')) || '';

            const exportDataUrl = await page.evaluate(async (index) => {
                if (!window.__captureExportSlide__) {
                    throw new Error('window.__captureExportSlide__ is not available');
                }
                const dataUrl = await window.__captureExportSlide__(index);

                if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
                    throw new Error('Invalid export data URL');
                }

                // Normalize export capture to front dimensions (1920x1080),
                // regardless of original export scale/format.
                const img = new Image();
                img.src = dataUrl;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                const canvas = document.createElement('canvas');
                canvas.width = 1920;
                canvas.height = 1080;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('2D context unavailable for export normalization');
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/png');
            }, i);
            const exportBuffer = toBufferFromDataUrl(exportDataUrl);

            const result = compare(frontBuffer, exportBuffer);
            const allowedDiffRatio = getAllowedDiffRatio(slideType);
            const globalIndex = offset + i + 1;

            const baseName = `slide-${String(globalIndex).padStart(3, '0')}.png`;
            await fs.writeFile(path.join(FRONT_DIR, baseName), frontBuffer);
            await fs.writeFile(path.join(EXPORT_DIR, baseName), exportBuffer);
            await fs.writeFile(path.join(DIFF_DIR, baseName), PNG.sync.write(result.diffPng));

            if (result.diffRatio > allowedDiffRatio) {
                failures.push({
                    index: globalIndex,
                    slideKey,
                    diffRatio: result.diffRatio,
                    diffPixels: result.diffPixels,
                    totalPixels: result.totalPixels,
                    allowedDiffRatio,
                });
            }

            process.stdout.write(
                `Slide ${globalIndex}${slideKey ? ` (${slideKey})` : ''} - diff ratio ${(result.diffRatio * 100).toFixed(3)}%\n`,
            );
        }

        totalProcessed += slideCount;
        if (BATCH_SIZE <= 0 || slideCount < BATCH_SIZE) {
            keepGoing = false;
        } else {
            offset += slideCount;
        }
    }

    await browser.close();

    if (failures.length > 0) {
        process.stderr.write('\nVisual regression failed:\n');
        failures.forEach((f) => {
            process.stderr.write(
                `- Slide ${f.index}${f.slideKey ? ` (${f.slideKey})` : ''}: ${(f.diffRatio * 100).toFixed(3)}% (${f.diffPixels}/${f.totalPixels})\n`,
            );
            process.stderr.write(
                `  threshold: ${(f.allowedDiffRatio * 100).toFixed(2)}%\n`,
            );
        });
        process.stderr.write(
            `\nArtifacts written to: ${ARTIFACT_DIR}\nThresholds: default ${(MAX_DIFF_RATIO * 100).toFixed(2)}%, cover ${(MAX_DIFF_RATIO_COVER * 100).toFixed(2)}%\n`,
        );
        process.exit(1);
    }

    process.stdout.write(
        `\nVisual regression passed for ${totalProcessed} slides. Artifacts: ${ARTIFACT_DIR}\n`,
    );
};

run().catch((error) => {
    process.stderr.write(`Visual regression runner error: ${error.message}\n`);
    process.exit(1);
});
