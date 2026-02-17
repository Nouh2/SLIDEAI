# Visual Regression (Front vs Export Capture)

This project includes a visual regression harness to compare:
- Front rendering (`ModernSlideRenderer`)
- Export capture rendering (`captureSlide`, same path used by Pixel Perfect export)

## Route

- `http://127.0.0.1:8080/qa/visual-regression`
- Full catalog is generated from the same layout/variant registry as `charts-demo` (all families/variations).
- Optional smoke mode: `http://127.0.0.1:8080/qa/visual-regression?max=10`

## Run

1. Start the app:
```bash
npm run dev
```

2. In another terminal:
```bash
npm run test:visual
```

3. Generate analysis report/backlog:
```bash
npm run test:visual:report
```

## Config

- `VR_BASE_URL` (default: `http://127.0.0.1:8080/qa/visual-regression`)
- `VR_MAX_DIFF_RATIO` (default: `0.015`, i.e. 1.5%)
- `VR_MAX_DIFF_RATIO_COVER` (default: `0.042`, i.e. 4.2% for cover slides)
- Family thresholds (optional):
  - `VR_MAX_DIFF_RATIO_CONTENT`
  - `VR_MAX_DIFF_RATIO_TEXT_COLUMNS`
  - `VR_MAX_DIFF_RATIO_STATS`
  - `VR_MAX_DIFF_RATIO_TABLE`
  - `VR_MAX_DIFF_RATIO_BENTO`
  - `VR_MAX_DIFF_RATIO_TIMELINE`
  - `VR_MAX_DIFF_RATIO_COMPARISON`
  - `VR_MAX_DIFF_RATIO_SHOWCASE` (default: `0.026`)
  - `VR_MAX_DIFF_RATIO_SECTION`
  - `VR_MAX_DIFF_RATIO_TOWS_DISTRIBUTION`
  - `VR_MAX_DIFF_RATIO_INFOGRAPHIC`

Example:
```bash
VR_MAX_DIFF_RATIO=0.01 npm run test:visual
```

## Artifacts

Generated under:

- `tests/visual-artifacts/front`
- `tests/visual-artifacts/export`
- `tests/visual-artifacts/diff`

If any slide exceeds the threshold, the script exits with code `1`.

## Report

`test:visual:report` writes:

- `tests/visual-artifacts/analysis-report.md`
- `tests/visual-artifacts/analysis-report.json`

The report includes:
- per-slide diff summary
- impacted regions (header/footer/content/background heuristics)
- prioritized backlog suggestions (P0/P1/P2)
