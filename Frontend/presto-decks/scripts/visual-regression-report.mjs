import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const ARTIFACT_DIR = path.join(projectRoot, 'tests', 'visual-artifacts');
const FRONT_DIR = path.join(ARTIFACT_DIR, 'front');
const EXPORT_DIR = path.join(ARTIFACT_DIR, 'export');
const REPORT_MD = path.join(ARTIFACT_DIR, 'analysis-report.md');
const REPORT_JSON = path.join(ARTIFACT_DIR, 'analysis-report.json');

const PIXEL_DELTA_THRESHOLD = Number(process.env.VR_PIXEL_DELTA || 32);
const FAIL_THRESHOLD = Number(process.env.VR_MAX_DIFF_RATIO || 0.015);

const readPng = async (filePath) => PNG.sync.read(await fs.readFile(filePath));

const pixelDelta = (a, b, idx) => {
    const dr = Math.abs(a[idx] - b[idx]);
    const dg = Math.abs(a[idx + 1] - b[idx + 1]);
    const db = Math.abs(a[idx + 2] - b[idx + 2]);
    return dr + dg + db;
};

const classify = (stats, w, h) => {
    const findings = [];

    const headerRatio = stats.header / stats.total;
    const footerRatio = stats.footer / stats.total;
    const centerRatio = stats.center / stats.total;
    const leftRatio = stats.left / stats.total;
    const rightRatio = stats.right / stats.total;
    const spreadRows = stats.rowsTouched / h;
    const spreadCols = stats.colsTouched / w;

    if (headerRatio > 0.18) findings.push('header/title typography');
    if (footerRatio > 0.08) findings.push('footer/page-number overlay');
    if (centerRatio > 0.55) findings.push('main content block (chart/table/cards)');
    if (Math.max(leftRatio, rightRatio) > 0.45) findings.push('column alignment/layout split');
    if (spreadRows > 0.75 && spreadCols > 0.75) findings.push('global background/gradient/color tone');

    if (findings.length === 0) {
        findings.push('localized element spacing/anti-aliasing');
    }

    return findings;
};

const analyzePair = (front, exported) => {
    if (front.width !== exported.width || front.height !== exported.height) {
        throw new Error(
            `Dimension mismatch: ${front.width}x${front.height} vs ${exported.width}x${exported.height}`,
        );
    }

    const w = front.width;
    const h = front.height;
    const total = w * h;

    const rowHit = new Uint8Array(h);
    const colHit = new Uint8Array(w);

    let diffPixels = 0;
    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;

    let header = 0;
    let footer = 0;
    let center = 0;
    let left = 0;
    let right = 0;

    for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
            const idx = (y * w + x) * 4;
            const d = pixelDelta(front.data, exported.data, idx);
            if (d <= PIXEL_DELTA_THRESHOLD) continue;

            diffPixels += 1;
            rowHit[y] = 1;
            colHit[x] = 1;

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (y < h * 0.22) header += 1;
            else if (y > h * 0.86) footer += 1;
            else center += 1;

            if (x < w * 0.33) left += 1;
            else if (x > w * 0.66) right += 1;
        }
    }

    const rowsTouched = rowHit.reduce((acc, v) => acc + v, 0);
    const colsTouched = colHit.reduce((acc, v) => acc + v, 0);
    const diffRatio = diffPixels / total;
    const bbox = maxX >= 0
        ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
        : null;

    const stats = {
        total: diffPixels || 1,
        header,
        footer,
        center,
        left,
        right,
        rowsTouched,
        colsTouched,
    };

    return {
        width: w,
        height: h,
        diffPixels,
        totalPixels: total,
        diffRatio,
        bbox,
        rowsTouched,
        colsTouched,
        spreadRowsRatio: rowsTouched / h,
        spreadColsRatio: colsTouched / w,
        findings: classify(stats, w, h),
    };
};

const loadSlides = async () => {
    const frontFiles = (await fs.readdir(FRONT_DIR))
        .filter((f) => f.endsWith('.png'))
        .sort();
    const exportFiles = new Set((await fs.readdir(EXPORT_DIR)).filter((f) => f.endsWith('.png')));

    return frontFiles.filter((f) => exportFiles.has(f));
};

const buildBacklog = (entries) => {
    const failing = entries.filter((e) => e.diffRatio > FAIL_THRESHOLD);
    const buckets = new Map();

    for (const entry of failing) {
        for (const finding of entry.findings) {
            buckets.set(finding, (buckets.get(finding) || 0) + 1);
        }
    }

    const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked.slice(0, 5);

    return top.map(([topic, count], idx) => {
        const prio = idx === 0 ? 'P0' : idx < 3 ? 'P1' : 'P2';
        return {
            priority: prio,
            topic,
            impactedSlides: count,
            action:
                topic === 'header/title typography'
                    ? 'Align font rendering/scaling for heading blocks between preview and capture.'
                    : topic === 'footer/page-number overlay'
                        ? 'Unify footer baseline and page number placement in overlay and export layer.'
                        : topic === 'main content block (chart/table/cards)'
                            ? 'Audit chart/table/card layout tokens and spacing in normalized export contract.'
                            : topic === 'column alignment/layout split'
                                ? 'Normalize split ratios and x-axis anchoring for left/right columns.'
                                : 'Stabilize global background gradients and color blending prior to capture.',
        };
    });
};

const buildMarkdown = (entries, backlog) => {
    const lines = [];
    lines.push('# Visual Regression Analysis Report');
    lines.push('');
    lines.push(`- Fail threshold: **${(FAIL_THRESHOLD * 100).toFixed(2)}%**`);
    lines.push(`- Pixel delta threshold: **${PIXEL_DELTA_THRESHOLD}**`);
    lines.push(`- Slides analyzed: **${entries.length}**`);
    lines.push('');

    lines.push('## Slide Results');
    lines.push('');
    lines.push('| Slide | Diff % | Diff Pixels | BBox | Findings |');
    lines.push('|---|---:|---:|---|---|');
    for (const e of entries) {
        const bbox = e.bbox ? `${e.bbox.x},${e.bbox.y},${e.bbox.w}x${e.bbox.h}` : 'none';
        lines.push(
            `| ${e.file} | ${(e.diffRatio * 100).toFixed(3)}% | ${e.diffPixels}/${e.totalPixels} | ${bbox} | ${e.findings.join(', ')} |`,
        );
    }

    lines.push('');
    lines.push('## Suggested Backlog');
    lines.push('');
    if (backlog.length === 0) {
        lines.push('- No failing slide above threshold.');
    } else {
        for (const item of backlog) {
            lines.push(`- ${item.priority} - ${item.topic} (${item.impactedSlides} slide(s)): ${item.action}`);
        }
    }
    lines.push('');

    return lines.join('\n');
};

const run = async () => {
    const files = await loadSlides();
    if (files.length === 0) {
        throw new Error('No matching PNG files found in front/export artifact folders.');
    }

    const entries = [];
    for (const file of files) {
        const front = await readPng(path.join(FRONT_DIR, file));
        const exported = await readPng(path.join(EXPORT_DIR, file));
        const analysis = analyzePair(front, exported);
        entries.push({ file, ...analysis });
    }

    const backlog = buildBacklog(entries);
    const markdown = buildMarkdown(entries, backlog);

    await fs.writeFile(REPORT_JSON, JSON.stringify({ entries, backlog }, null, 2), 'utf8');
    await fs.writeFile(REPORT_MD, markdown, 'utf8');

    process.stdout.write(`Report written:\n- ${REPORT_MD}\n- ${REPORT_JSON}\n`);
    if (backlog.length) {
        process.stdout.write('\nTop backlog items:\n');
        backlog.forEach((b) => process.stdout.write(`- ${b.priority} ${b.topic}\n`));
    }
};

run().catch((error) => {
    process.stderr.write(`Visual analysis error: ${error.message}\n`);
    process.exit(1);
});
