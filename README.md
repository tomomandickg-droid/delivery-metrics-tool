# Delivery Metrics Tool

**Live app: https://tomomandickg-droid.github.io/delivery-metrics-tool/**. Open it and click **Load sample data** to try it.

A web dashboard that turns a Jira CSV export into delivery metrics: throughput, lead time, cycle time and work in progress. It runs entirely in your browser. An uploaded CSV is never sent anywhere.

Background: [spec.md](spec.md) (requirements and delivery notes), [plan.md](plan.md) (technical plan) and [tasks.md](tasks.md) (build steps).

## What you get

- **Throughput**: issues resolved per week, as a 12-week chart and the average per week.
- **Lead time**: Created → Resolved. The card shows the median and 85th percentile, and a chart shows the distribution.
- **Cycle time**: Started → Resolved. The card shows the median and 85th percentile.
- **Work in progress**: issues that have started but are not resolved, grouped by status.
- **Issue Type filter**: choose one or more types. Every card and chart updates.
- **Data notes**: rows that were skipped and why, and issues whose cycle time was adjusted.

## Your CSV

Export issues from Jira as CSV. These columns are required (upper/lower case and extra spaces don't matter):

| Column     | Notes                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Issue key  |                                                                                                                                                        |
| Issue Type | Used by the filter                                                                                                                                     |
| Status     | Used to group work in progress                                                                                                                         |
| Created    |                                                                                                                                                        |
| Resolved   | Empty while the issue is open                                                                                                                          |
| Started    | When work started. Not a standard Jira field: a Jira automation rule usually writes it. Jira exports it as `Custom field (Started)`, which also works. |

Other columns are ignored. If a required column is missing, the app names it and shows no metrics.

**Date formats.** A time of day may follow the date and is ignored:

- Jira's default export format: `27/Nov/26 10:15 AM`
- ISO: `2026-11-27`
- Day.month.year: `27.11.2026` or `27.11.2026.`

## How the numbers are calculated

- **Reporting window**: the last 12 completed weeks, Monday to Sunday. The current week isn't finished yet, so it is left out. Throughput, lead time and cycle time count only issues **resolved** in the window.
- **Days are calendar days, counted inclusively**: an issue created and resolved on the same day takes 1 day; created 1 Nov and resolved 6 Nov takes 6 days.
- **Done** means the issue has a Resolved date. **Work in progress** means it has a Started date and no Resolved date. Issues with neither date are backlog and are not counted.
- **Throughput average** = issues resolved in the window ÷ 12. Weeks with nothing resolved count as 0.
- **Median and 85th percentile** are calculated the same way as Excel `PERCENTILE.INC`, so you can check them in a spreadsheet.
- **Cycle time** leaves out resolved issues that have no Started date; the card says how many. If Started is **before** Created, cycle time is counted from Created, which makes it equal to the lead time. These issues are listed on the dashboard.
- **Skipped rows** (listed with key and reason):
  - a date that isn't valid
  - Resolved before Created
  - Started after Resolved
  - a repeated issue key (the first row is kept)

[tests/fixtures/manual-small.expected.md](tests/fixtures/manual-small.expected.md) works through every rule by hand on a small file.

### Sample data

[public/sample-data/jira-sample.csv](public/sample-data/jira-sample.csv) has 300 made-up issues plus 5 deliberately invalid rows. It was generated for an export date of Fri 27 Nov 2026 by `npm run generate:sample`, which produces the same file every time.

So that the sample always has data in the current 12-week window, **Load sample data** moves all of its dates forward by whole weeks. Weekdays, durations and weekly counts don't change, so the numbers are always the same. A file you upload always keeps its real dates.

## Run locally

Requires Node.js 26 (see `.nvmrc`).

```
npm install
npm run dev
```

Then open http://localhost:5173/ in a browser. Stop the server with Ctrl+C.

## Checks

| Command                 | What it does                                                            | Runs in CI |
| ----------------------- | ----------------------------------------------------------------------- | ---------- |
| `npm run lint`          | ESLint and Prettier check                                               | yes        |
| `npm run typecheck`     | TypeScript type check                                                   | yes        |
| `npm run test:coverage` | Unit and component tests; 100% coverage of `src/domain/` (calculations) | yes        |
| `npm run build`         | Production build                                                        | yes        |
| `npm run test:smoke`    | Browser smoke test: load the sample, check the four metric cards        | yes        |
| `npm run test:perf`     | 5,000 issues must show all four cards within 2 seconds                  | no (local) |

Before the first browser test on a new machine, run `npx playwright install chromium`.

## CI, protecting main, and deploying

- **CI** (`.github/workflows/ci.yml`) runs the checks marked "yes" above on every push and pull request.
- **Main is protected**: a pull request can only be merged when the `ci` check is green. To set this up on a new copy of the repository: **Settings → Rules → Rulesets → New branch ruleset**, target the default branch, then tick **Require a pull request before merging** and **Require status checks to pass** with `ci`.
- **Deploy** (`.github/workflows/pages.yml`): every push to `main` runs the tests, builds the app and publishes it to GitHub Pages at the link above. In **Settings → Pages**, the source is **GitHub Actions**.

## Project layout

```
src/domain/   calculations (dates, window, CSV, metrics, percentiles, sample shift): pure TypeScript, 100% covered
src/ui/       React components and styles
scripts/      sample data generator
tests/        unit and component tests, and the hand-calculated fixture
e2e/          Playwright smoke test (CI) and performance check (local)
```
