# Delivery Metrics Tool — Specification

## Problem

Delivery managers track throughput, lead time and cycle time by hand in spreadsheets, or not at all. Jira shows the raw data but not the delivery picture a client or leadership asks for.

## Users

- Delivery Manager / Project Manager running one or more agile teams
- Stakeholders who receive a weekly delivery report

## Scope (v1)

Input: a Jira CSV export of issues.
Output: a local web dashboard with delivery metrics.

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

The "Load sample data" button moves the sample's dates forward by whole weeks so that the sample always falls inside the reporting window. A file uploaded by hand always uses its real dates.

## Reporting window

Throughput, lead time and cycle time use a **12-week window**. Weeks run Monday to Sunday. The window ends with the last completed week. The current week is not finished yet, so it is excluded.

## Metrics

**Done** means the issue has a Resolved date.

1. **Throughput**: number of issues resolved per week in the window. The card shows the average per week over the 12 weeks.
2. **Lead time**: days from Created to Resolved, per issue, for issues resolved in the window. Show the median and the 85th percentile.
3. **Cycle time**: days from Started to Resolved, for issues resolved in the window. Show the median and the 85th percentile.
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

## Acceptance criteria

- [ ] Uploading a valid CSV shows all four metrics within 2 seconds for up to 5,000 issues (checked locally, not in CI)
- [ ] Uploading a CSV with a missing column shows an error naming that column
- [ ] Lead time and cycle time values match a manual calculation on the sample data
- [ ] Filtering by one or more Issue Types updates all metrics and charts
- [ ] Rows with invalid dates are skipped, and the dashboard shows their count and issue keys
- [ ] Sample data file is included so anyone can try the tool

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
- Where the AI got it wrong, and why
  - Two expected values I calculated by hand for the tests were wrong. The code was right, and the failing tests caught the mistakes:
    - the window start for 13 Jan 2027 (12 Oct instead of 19 Oct)
    - PERCENTILE.INC of [1, 1, 1, 9] at 85% (6.6 instead of 5.4)

    Hand calculations need checking too, which is why the manual fixture in task 14 needs review.

  - The invalid-CSV error message gave a row number one too high, because Papa Parse counts rows from 0 including the header. A test caught it before commit.
  - The tool that writes files turned the text escape for the byte-order mark into the invisible character itself. ESLint flagged it. My first clean-up script used PowerShell's `StartsWith`, which ignores that character, so it removed the first character of 33 files. Nothing damaged was committed: the files were restored from git, and the fix was redone with an exact character check.
- What had to be changed in this spec after the first build
- Time spent per step
