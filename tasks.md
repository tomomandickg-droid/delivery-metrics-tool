# Delivery Metrics Tool — Tasks

Work through these in order. Section numbers (§) refer to `plan.md`.
A task that adds calculation code is done only when its tests pass and `src/domain/` is still at 100% coverage.

## Phase 1 — Project setup

1. **Set up git and the project.** Run `git init`. Create a Vite + React + TypeScript (strict) project with `.nvmrc` (Node 26), `.gitignore` and a README stub.
   *Done when:* `npm run dev` shows a blank page and the first commit is made.
2. **Add tooling and scripts.** Set up ESLint, Prettier, Vitest (jsdom, v8 coverage, 100% threshold on `src/domain/`), Testing Library and Playwright. Add the scripts `lint`, `typecheck`, `test`, `test:coverage`, `test:smoke`, `test:perf` and `generate:sample`. Configure Playwright so `*.local.spec.ts` runs only with `test:perf`.
   *Done when:* every script runs and passes on a placeholder test.
3. **Add the CI workflow.** Create `.github/workflows/ci.yml` with lint, typecheck, coverage, build and the smoke test (§11), and push to GitHub.
   *Done when:* the `ci` check is green on GitHub.
4. **Protect main (repository owner).** Require a pull request and the `ci` status check for `main`.
   *Done when:* a test PR with a deliberately failing test cannot be merged.

## Phase 2 — Calculation code (pure, with unit tests)

5. **Dates.** Add the types in `types.ts`. In `dates.ts`, write `parseDate` for the three formats with an optional time of day (§4.1), plus `inclusiveDays`. Test every case in §4.1, including dates that don't exist.
6. **Reporting window.** In `window.ts`, write `reportingWindow(today)`: 12 Monday–Sunday weeks ending with the last completed week (§5). Test the 27 Nov 2026 example, today on a Monday and on a Sunday, and a year boundary.
7. **CSV and columns.** Write `parseCsv.ts` and `columns.ts`: header matching (case, spaces, BOM, `Custom field (Started)`, repeated headers), every missing column named in one error, and the empty-file and header-only errors.
   *Done when:* there is one test per required column, a test with several missing, and the file-error tests.
8. **Rows to issues.** In `toIssues.ts`, convert rows to issues and record each skipped row with its key and reason (§4.3). Write one test per skip reason, plus tests for the cases that are not skipped.
9. **Percentiles.** In `stats.ts`, write `percentile` (PERCENTILE.INC) and `median` (§6.4). Test the worked example, odd and even n, n = 0 and 1, and Excel reference values.
10. **Throughput.** In `metrics/throughput.ts`, write the weekly counts for the window and the average over 12 weeks, with 0 weeks counted (§6.1). Test the window edges.
11. **Lead time and cycle time.** In `metrics/leadTime.ts` and `metrics/cycleTime.ts`, calculate these for issues resolved in the window. Report n and the number of resolved issues without a Started date (§6.2, §6.3).
12. **Work in progress.** In `metrics/wip.ts`, WIP = Started and not Resolved, grouped by status, with backlog excluded (§6.5).
13. **Filter and dashboard.** Write `filter.ts` (a set of types) and `computeDashboard(issues, selectedTypes, today)`. Test one type, two types and none.

## Phase 3 — Data

14. **Manual fixture.** Write `tests/fixtures/manual-small.csv` (about 15 issues, §8.3), the hand calculation in `manual-small.expected.md` for today = 27 Nov 2026, and a test that `computeDashboard` matches it exactly.
   *Done when:* you have checked the hand calculation.
15. **Sample generator.** Write `scripts/generate-sample.ts` (§8.1) and commit `public/sample-data/jira-sample.csv`. Add a test that the output does not change between runs, and check 5 sample issues by hand.
16. **Sample date shift.** In `shiftSample.ts`, move the dates forward by whole weeks for the "Load sample data" button (§8.2), with tests. Approved on 27 Nov 2026.

## Phase 4 — UI

17. **Upload.** Write `UploadArea.tsx` (drag-and-drop, file picker, "Load sample data") and connect it in `App.tsx` with today's date.
18. **Errors and skipped rows.** Write `ErrorBanner.tsx` (the missing columns, named) and `SkippedRows.tsx` (the count, plus keys and reasons). Add component tests.
19. **Metric cards.** Write `MetricCard.tsx` and the four cards, with the "No data" and "nothing resolved in the window" states (§5). Add component tests.
20. **Charts.** Write `ThroughputChart.tsx` (12 weekly bars) and `LeadTimeChart.tsx` (histogram with median and 85th-percentile lines).
21. **Issue Type filter.** Write `TypeFilter.tsx`: checkboxes with "Select all" and "Clear". Add a component test that selecting types updates every card and both charts.

## Phase 5 — Browser checks and handover

22. **Browser tests.** Write `e2e/smoke.spec.ts`, which runs in CI: with the clock fixed at 27 Nov 2026, load the sample and check that the four metric cards appear. Also write `e2e/performance.local.spec.ts`, which runs locally only: 5,000 issues, all four cards within 2 s (§9).
   *Done when:* the smoke test is green in CI and the local performance run passes.
23. **README and acceptance review.** In the README, cover how to run the tool, the CSV format and date formats, the metric rules, CI and the main-branch gate, and `npm run test:perf`. Then record evidence for each acceptance criterion in `spec.md` and fill in the remaining delivery notes.
