# Delivery Metrics Tool — Specification

## Problem

Delivery managers track throughput, lead time and cycle time by hand in spreadsheets, or not at all. Jira shows the raw data but not the delivery picture a client or leadership asks for.

## Users

- Delivery Manager / Project Manager running one or more agile teams
- Stakeholders who receive a weekly delivery report

## Scope (v1)

Input: a Jira CSV export of issues.
Output: a web dashboard with delivery metrics. It runs entirely in the browser, locally or from the public link on GitHub Pages (https://tomomandickg-droid.github.io/delivery-metrics-tool/). Uploaded data never leaves the browser.

Out of scope for v1: live Jira API connection, user accounts, multiple projects at once.

## Input data

Required CSV columns:

- Issue key
- Issue Type
- Status
- Created
- Resolved
- Started — date the issue first moved to "In Progress". Not a standard Jira field: in practice a Jira automation rule writes it when work starts. The sample data includes it.

If a required column is missing, the tool shows a clear error naming the column.

Supported date formats (in Created, Resolved and Started):

- Jira's default export format, e.g. `27/Nov/26 10:15 AM`
- ISO, e.g. `2026-11-27`
- Day.month.year, e.g. `27.11.2026`

Rows with an invalid date are skipped. Impossible date order also counts as invalid: Resolved before Created, or Started after Resolved. A row that repeats an earlier issue key is skipped too. The dashboard shows how many rows were skipped and lists their issue keys.

Started before Created is not skipped. The issue is kept and its cycle time is counted from Created, so it equals the lead time. The dashboard lists these issues the same way as skipped rows, e.g. "Started before Created: 1 issue, cycle time adjusted (MS-7)".

The "Load sample data" button moves the sample's dates forward by whole weeks so that the sample always falls inside the reporting window. A file uploaded by hand always uses its real dates.

## Reporting window

Throughput, lead time and cycle time use a **12-week window**. Weeks run Monday to Sunday. The window ends with the last completed week. The current week is not finished yet, so it is excluded.

## Metrics

**Done** means the issue has a Resolved date.

1. **Throughput**: number of issues resolved per week in the window. The card shows the average per week over the 12 weeks.
2. **Lead time**: days from Created to Resolved, per issue, for issues resolved in the window. Show the median and the 85th percentile.
3. **Cycle time**: days from Started to Resolved, for issues resolved in the window. Show the median and the 85th percentile. If Started is before Created, count from Created instead.
4. **Work in progress**: issues with a Started date and no Resolved date, grouped by status. Backlog items (no Started date, no Resolved date) are not work in progress.

Issues without a Resolved date are excluded from throughput, lead time and cycle time.
Issues without a Started date are excluded from cycle time and from work in progress.

Percentiles (including the median) are calculated the same way as Excel `PERCENTILE.INC`.

All durations are in **calendar days**, counted inclusively: both the start day and the end day count. An issue created and resolved on the same day has a lead time of 1 day; created 1 Nov and resolved 6 Nov is 6 days.

## Dashboard

- Upload area for the CSV
- Four metric cards (one per metric above)
- Chart: throughput per week (the 12-week window)
- Chart: lead time distribution
- Filter by Issue Type; several types can be selected at once
- List of skipped rows (count and issue keys)
- List of issues with Started before Created (count and issue keys; cycle time adjusted)

## Acceptance criteria

- [x] Uploading a valid CSV shows all four metrics within 2 seconds for up to 5,000 issues (checked locally, not in CI)
  - Evidence: `e2e/performance.local.spec.ts` (`npm run test:perf`). Three runs on the build machine on 27 Nov 2026 took 581, 505 and 480 ms from upload until all four cards were visible.
- [x] Uploading a CSV with a missing column shows an error naming that column
  - Evidence: `tests/unit/parseCsv.test.ts` and `tests/component/ErrorsAndNotes.test.tsx` cover each of the 6 columns on its own and several at once. The error banner names the column, e.g. `Missing required column: "Started"`.
- [x] Lead time and cycle time values match a manual calculation on the sample data
  - Evidence:
    - The hand calculation in `tests/fixtures/manual-small.expected.md`, reviewed by the owner, checked by `manualFixture.test.ts`.
    - Five sample issues checked by hand in `sample.test.ts`.
    - The same values on screen, in `MetricCards.test.tsx` and `Charts.test.tsx`.
    - The owner tried the sample and manual-small.csv in the app, and the values matched.
- [x] Filtering by one or more Issue Types updates all metrics and charts
  - Evidence: `tests/component/TypeFilter.test.tsx` covers Bug only, Story + Task, Clear and Select all, and checks all four cards and both charts against the hand calculation. The owner also tried it in the app.
- [x] Rows with invalid dates are skipped, and the dashboard shows their count and issue keys
  - Evidence: `tests/unit/toIssues.test.ts` (one test per skip reason) and `tests/component/ErrorsAndNotes.test.tsx`. The dashboard shows, for example, "6 rows skipped: MS-14, MS-15, …" with a reason for each row.
- [x] Sample data file is included so anyone can try the tool
  - Evidence:
    - `public/sample-data/jira-sample.csv` and the **Load sample data** button, locally and on GitHub Pages.
    - `sample.test.ts` checks that the file regenerates identically.
    - `e2e/smoke.spec.ts` loads it in a real browser in CI.

## Quality gates

- Automated tests for every metric calculation; 100% test coverage of the calculation code
- On every push, GitHub Actions runs: lint, type checks, unit tests, the build, and one smoke browser test (load the sample file and check that the four metric cards appear)
- A failing check blocks merge to main
- The 5,000-issue performance check runs locally only, not in CI

## Delivery notes (to be filled in while building)

- Spec v1 assumed "Status category changed" gives the start of work. It holds the date of the last category change, so for done issues it equals the resolution date. Replaced with a "Started" column.
- Spec v1 did not say calendar or working days. Decided: calendar days. Counted inclusively, so the minimum is 1 day (no 0-day items).
- Plan review, 27 Nov 2026. Decisions on the open questions:
  - Window: the 12 weeks end with the last completed week. The current partial week is excluded.
  - Weeks run Monday to Sunday.
  - Throughput card: average issues resolved per week over the 12-week window.
  - Percentiles: Excel `PERCENTILE.INC` method, so a manual check in a spreadsheet gives the same numbers.
  - Done = has a Resolved date (replaces "not Done" by status name). WIP = has a Started date and no Resolved date. Backlog items are not WIP.
  - Lead time and cycle time use only issues resolved in the same 12-week window (spec v1 did not limit them).
  - Rows with invalid dates are skipped. The dashboard shows the count and their issue keys.
  - The Issue Type filter allows several types at once (v1 did not say).
  - Date formats supported: Jira default (`27/Nov/26 10:15 AM`), ISO (`2026-11-27`) and `27.11.2026`.
- Plan approved, 27 Nov 2026:
  - Because the window ties to today's date, the fixed sample would show no data after about three months. Decided: "Load sample data" shifts all dates forward by whole weeks, which keeps weekdays, durations and the hand-checked numbers unchanged.
  - Impossible date order (Resolved before Created, Started after Resolved) counts as an invalid date, so the row is skipped. Rows that repeat an earlier issue key are also skipped and listed.
- Setup, 27 Nov 2026: Git, Node.js and GitHub CLI were not installed on the build machine and were installed with winget. The current Node LTS is 26, not 22 as planned, so the project uses Node 26.
- Scope change, 27 Nov 2026: CI runs lint, type checks, unit tests, build and one smoke browser test. The 5,000-issue performance check moved out of CI and runs locally only. 100% test coverage of the calculation code is kept.
- Phase 1 (project setup), 27 Nov 2026:
  - The newest TypeScript is 7.0, but the ESLint TypeScript plugin (typescript-eslint 8.74) supports only TypeScript below 6.1. TypeScript is pinned to 6.0.3. Revisit when typescript-eslint supports 7.
  - React stays on 18.3.1 as planned, although React 19 is current.
  - Running Prettier over the repository reformatted the Markdown docs: table alignment, and `*text*` became `_text_`. The wording did not change.
  - `.gitattributes` forces LF line endings, so files are identical on Windows and in CI. The sample-data check (task 15) compares the generated file byte for byte, so this matters there.
  - The coverage limit is in place, but it can't fail yet because `src/domain/` is still empty. It starts to apply from task 5.
  - First CI run on GitHub passed in 35 s (lint, type check, tests, build, smoke test).
  - Blocking merges to main has to be set in the GitHub repository settings by the owner. The steps are in the README.
- Task 4 check, 27 Nov 2026: PR #1 contained a deliberately failing test. GitHub marked it BLOCKED (required check `ci` failed), and it was closed without merging. Note: the protection does not include administrators, so the repository owner can still bypass it.
- Phase 2 (calculation code), 27 Nov 2026:
  - Because main is protected, each phase from now on goes through its own pull request.
  - Added `src/domain/`: dates, reporting window, CSV and column checks, rows to issues, percentiles, the four metrics, filter and `computeDashboard`. 203 tests pass, with 100% line, branch, function and statement coverage of `src/domain/`.
  - Duplicate keys, clarified: a row is a duplicate only if an earlier row with that key was kept. If the earlier row was skipped for a bad date, the later row is kept.
  - The missing-column cases are tested with CSV text inside the tests, instead of separate `missing-*.csv` files as plan.md §3 listed.
  - The lead-time histogram grouping (plan.md §6.6) is calculation code but belongs to the chart. It will be added as a tested domain function with task 20.
  - A PR branch runs CI twice, once for the push and once for the pull request. This is harmless. Limiting push runs to main would halve it.
- Task 14 (manual fixture), 27 Nov 2026: `tests/fixtures/manual-small.csv` has 19 rows: 13 kept issues and one row for each of the 6 skip reasons. It uses all three date formats, a quoted summary with a comma, and the columns in a different order from Jira's. `manual-small.expected.md` shows the hand calculation for today = 27 Nov 2026, and `manualFixture.test.ts` checks the code against it (31 checks, all passing on the first run). The fixture has 19 rows instead of the planned ~15, so that every rule is covered. Waiting for the owner's review of the hand calculation before tasks 15–16.
- Rule change after the task 14 review, 27 Nov 2026: Started before Created now counts cycle time from Created, so cycle time equals lead time. Before, Started was used as is, which made cycle time longer than lead time. These issues are kept, not skipped, and the dashboard lists them like skipped rows: "Started before Created: 1 issue, cycle time adjusted (MS-7)". The CSV value is kept as is; only the cycle time calculation changes. In the fixture, MS-7's cycle time goes from 8 to 5. The cycle-time median goes from 6.5 to 5 for all types, and from 8 to 5 for Story + Task. The 85th percentiles did not change. Open issues with Started before Created are listed too, since their cycle time will be adjusted once they are resolved.
- Task 15 (sample generator), 27 Nov 2026:
  - `scripts/sampleGenerator.ts` produces `public/sample-data/jira-sample.csv`: 300 issues plus 5 deliberately invalid rows, one per skip reason. 81% of issues are resolved (planned ~75%), 7 are WIP and 50 are backlog. 3 have Started before Created, 8 are resolved without Started, and 13 are same-day items. All three date formats are used.
  - Columns follow Jira's export layout: two `Sprint` columns, and `Custom field (Started)`. Rows are newest first.
  - Output is identical byte for byte on every run: there is a fixed seed and no clock. The generator uses only integer random numbers and weighted tables, with no `Math.log`, `Math.exp` or `Math.cos`. Their last digits can differ between platforms or Node versions, which would break the byte-for-byte check in CI.
  - First run: the copy of a duplicate key landed above the original, because rows are newest first. The copy was kept and the real row skipped. The copy is now always placed after the original, and a test checks it.
  - `--count 5000` makes the file for the local performance check.
  - Five sample issues are checked by hand in `sample.test.ts` (DMT-200, DMT-150, DMT-238, DMT-83, DMT-297).
- Task 16 (sample date shift), 27 Nov 2026: `shiftSample.ts` moves every date by (Monday of today's week − Monday of the export week). That is always whole weeks, so weekdays, durations and weekly counts stay the same. A test loads the sample at five dates up to 2028 and gets the same counts, lead time, cycle time and WIP every time. It also shows that without the shift the sample would be empty by March 2027. The export date constant now lives in `src/domain/shiftSample.ts`, so the generator and the shift share it.
- Phase 4 (UI), 27 Nov 2026:
  - Upload (drag-and-drop or file picker) and "Load sample data". The sample is shifted by whole weeks, and the toolbar says so when the shift is not zero.
  - An error banner names every missing column. Skipped rows and Started-before-Created issues are listed with keys and reasons.
  - Four metric cards, the reporting window shown in words, and empty states: no file yet, nothing resolved in the window (with the latest Resolved date), and no type selected.
  - A 12-week throughput chart and a lead time histogram with median and 85th-percentile lines.
  - A multi-select Issue Type filter with Select all and Clear.
  - Checked by 38 component tests, which compare the cards, the chart data and the filter results with the hand calculation in `manual-small.expected.md`, plus unit tests for the UI helpers and a manual check in a real browser. 344 tests in total.
  - Each chart has a hidden data table for screen readers. The component tests read these tables, because charts have no size in the test environment.
  - The plan's `SkippedRows.tsx` became `DataNotes.tsx`, because it now also lists adjusted issues.
  - The lead-time histogram grouping is in `src/domain/histogram.ts`, at 100% coverage: 1-day bars up to 30 days, then 2, 5 or 7 days per bar, at most 30 bars.
  - The production JavaScript bundle is 597 kB (177 kB compressed), mostly the chart library. Vite warns about the size. For a tool run locally this is acceptable; the charts could be loaded on demand later.
  - A type error in the chart code was caught by the commit check, which now runs lint, type check and tests before every commit, so nothing broken was committed.
- Where the AI got it wrong, and why
  - Two expected values I calculated by hand for the tests were wrong. The code was right, and the failing tests caught the mistakes:
    - the window start for 13 Jan 2027 (12 Oct instead of 19 Oct)
    - PERCENTILE.INC of [1, 1, 1, 9] at 85% (6.6 instead of 5.4)

    Hand calculations need checking too, which is why the manual fixture in task 14 needs review.

  - The invalid-CSV error message gave a row number one too high, because Papa Parse counts rows from 0 including the header. A test caught it before commit.
  - The tool that writes files turned the text escape for the byte-order mark into the invisible character itself. ESLint flagged it. My first clean-up script used PowerShell's `StartsWith`, which ignores that character, so it removed the first character of 33 files. Nothing damaged was committed: the files were restored from git, and the fix was redone with an exact character check.
- Phase 5 (browser checks and handover), 27 Nov 2026:
  - The smoke test fixes the browser clock to 27 Nov 2026, loads the sample and checks the four cards and both charts.
  - The local performance check uploads 5,000 generated issues; all four cards were visible in 480–581 ms over three runs.
  - Scope change from the owner: publish on GitHub Pages so anyone can open the app from a link, with "Load sample data" working there. This became task 23, and README/acceptance moved to task 24. Vite builds with relative paths (`base: './'`), so one build works locally and under `/delivery-metrics-tool/`. Before merging, this was checked by serving the build under that path and loading the sample in a browser. A workflow deploys every push to main. Pages was turned on with GitHub Actions as the source. The link goes live after the first deploy from main.
- What had to be changed in this spec after the first build
  - **Started before Created** (after the task 14 review): no longer used as is. Cycle time counts from Created, and these issues are listed on the dashboard.
  - **Output**: "a local web dashboard" became a dashboard that also has a public link on GitHub Pages. It still runs only in the browser.
  - **Acceptance criteria**: evidence added for each criterion.

  The earlier changes (Started column, reporting window, Done = Resolved, WIP definition, date formats, skip rules, multi-select filter, sample date shift, performance check out of CI) were decided at the plan reviews, before any code was written. They are listed above.

- Time spent per step: approximate wall-clock time from commit times on 27 Nov 2026. It includes the AI's work and short waits; the owner's review time falls between phases.
  - Spec review, plan and task list: before the first commit. Not measured by git; three plan revisions.
  - Tool setup (Git, Node.js and GitHub CLI installed, GitHub sign-in): about 10 minutes before the first commit.
  - Phase 1, project setup and CI: 19:49–19:55, about 6 minutes.
  - Phase 2, calculation code (tasks 5–13), including the branch-protection check: 19:55–20:11, about 16 minutes. Merged 20:16.
  - Phase 3, data (tasks 14–16), including the owner's fixture review and the rule change: 20:16–20:41, about 25 minutes. Merged 20:51.
  - Phase 4, UI (tasks 17–21), including a check in the browser: 20:51–21:04, about 13 minutes. Merged 21:09.
  - Phase 5, browser tests, GitHub Pages, README and acceptance review: 21:09 – about 21:25, about 16 minutes.
  - In total, about 1 h 35 min from the first commit to the handover pull request.
