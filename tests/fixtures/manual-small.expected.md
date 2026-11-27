# manual-small.csv — hand calculation

This is the hand calculation for `manual-small.csv`: 19 issue rows, of which 13 are kept and 6 are skipped. `tests/unit/manualFixture.test.ts` checks that the code produces exactly these numbers.

How to check it yourself: open the CSV in Excel or Google Sheets and recalculate each step below. For the medians and 85th percentiles, use `MEDIAN(...)` and `PERCENTILE.INC(..., 0.85)` on the values listed.

## 1. Rules used

- **Today = Friday 27 Nov 2026.**
- **Days are counted inclusively**: days = (end − start) + 1. An issue created and resolved on the same day has 1 day.
- **Reporting window**: weeks run Monday to Sunday. The current week (Mon 23 – Sun 29 Nov) is not finished, so it is excluded. The window is the 12 weeks before it: **Mon 31 Aug – Sun 22 Nov 2026**.
- **Lead time** = Created → Resolved. **Cycle time** = Started → Resolved. Both use only issues whose **Resolved date is in the window**.
- **WIP** = has a Started date and no Resolved date. The window is not used for WIP.
- **Percentiles** use the Excel `PERCENTILE.INC` method: sort the values x₀ … xₙ₋₁, set h = (n − 1) × p, then the result is x⌊h⌋ + (h − ⌊h⌋) × (x⌈h⌉ − x⌊h⌋).

The 12 weeks:

| Week | Monday | Sunday |
| ---- | ------ | ------ |
| W1   | 31 Aug | 6 Sep  |
| W2   | 7 Sep  | 13 Sep |
| W3   | 14 Sep | 20 Sep |
| W4   | 21 Sep | 27 Sep |
| W5   | 28 Sep | 4 Oct  |
| W6   | 5 Oct  | 11 Oct |
| W7   | 12 Oct | 18 Oct |
| W8   | 19 Oct | 25 Oct |
| W9   | 26 Oct | 1 Nov  |
| W10  | 2 Nov  | 8 Nov  |
| W11  | 9 Nov  | 15 Nov |
| W12  | 16 Nov | 22 Nov |

## 2. Skipped rows (6)

The spreadsheet row number counts the header as row 1.

| Row | Key   | Why it is skipped                                                  |
| --- | ----- | ------------------------------------------------------------------ |
| 15  | MS-14 | Created `31.02.2026` is not a real date (February has no 31st)     |
| 16  | MS-15 | Resolved 1 Nov is earlier than Created 3 Nov                       |
| 17  | MS-16 | Started 20 Oct is later than Resolved 15 Oct                       |
| 18  | MS-1  | Duplicate key: the first MS-1 (row 2) is kept; this one is skipped |
| 19  | MS-17 | Resolved `2026-13-01` is not a real date (month 13)                |
| 20  | MS-18 | Started `tbd` is not a date                                        |

## 3. Kept issues (13)

The dates are written in the three supported formats. Here they are converted to plain dates.

| Key   | Type  | Status      | Created | Started | Resolved | Resolved in window?  |
| ----- | ----- | ----------- | ------- | ------- | -------- | -------------------- |
| MS-1  | Story | Done        | 1 Nov   | 2 Nov   | 6 Nov    | yes, W10             |
| MS-2  | Bug   | Done        | 10 Nov  | 10 Nov  | 10 Nov   | yes, W11             |
| MS-3  | Story | Done        | 15 Sep  | 21 Sep  | 2 Oct    | yes, W5              |
| MS-4  | Task  | Done        | 20 Aug  | 28 Aug  | 31 Aug   | yes, W1 (first day)  |
| MS-5  | Bug   | Closed      | 18 Nov  | —       | 22 Nov   | yes, W12 (last day)  |
| MS-6  | Story | Done        | 1 Oct   | 12 Oct  | 20 Oct   | yes, W8              |
| MS-7  | Story | Done        | 28 Sep  | 25 Sep  | 2 Oct    | yes, W5              |
| MS-8  | Story | Done        | 3 Aug   | 10 Aug  | 30 Aug   | no: Sunday before W1 |
| MS-9  | Bug   | Done        | 19 Nov  | 20 Nov  | 24 Nov   | no: current week     |
| MS-10 | Story | In Progress | 2 Nov   | 9 Nov   | —        | open                 |
| MS-11 | Bug   | In Review   | 12 Nov  | 13 Nov  | —        | open                 |
| MS-12 | Story | In Progress | 1 Jul   | 15 Jul  | —        | open                 |
| MS-13 | Task  | To Do       | 20 Nov  | —       | —        | open (backlog)       |

Note on MS-7: it was started on 25 Sep, three days before it was created on 28 Sep. That is allowed, because work can start before the ticket is logged.

## 4. Per-issue lead time and cycle time (issues resolved in the window)

| Key  | Lead time: Created → Resolved    | Cycle time: Started → Resolved  |
| ---- | -------------------------------- | ------------------------------- |
| MS-1 | 1 Nov → 6 Nov: 5 + 1 = **6**     | 2 Nov → 6 Nov: 4 + 1 = **5**    |
| MS-2 | 10 Nov → 10 Nov: 0 + 1 = **1**   | 10 Nov → 10 Nov: 0 + 1 = **1**  |
| MS-3 | 15 Sep → 2 Oct: 17 + 1 = **18**  | 21 Sep → 2 Oct: 11 + 1 = **12** |
| MS-4 | 20 Aug → 31 Aug: 11 + 1 = **12** | 28 Aug → 31 Aug: 3 + 1 = **4**  |
| MS-5 | 18 Nov → 22 Nov: 4 + 1 = **5**   | no Started date, so left out    |
| MS-6 | 1 Oct → 20 Oct: 19 + 1 = **20**  | 12 Oct → 20 Oct: 8 + 1 = **9**  |
| MS-7 | 28 Sep → 2 Oct: 4 + 1 = **5**    | 25 Sep → 2 Oct: 7 + 1 = **8**   |

How the day differences are counted:

- 15 Sep → 2 Oct: 15 days to 30 Sep, plus 2 = 17.
- 21 Sep → 2 Oct: 9 + 2 = 11.
- 20 Aug → 31 Aug: 11.
- 1 Oct → 20 Oct: 19.
- 28 Sep → 2 Oct: 2 + 2 = 4.
- 25 Sep → 2 Oct: 5 + 2 = 7.

## 5. Results for all issue types

### Throughput

| W1  | W2  | W3  | W4  | W5  | W6  | W7  | W8  | W9  | W10 | W11 | W12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1   | 0   | 0   | 0   | 2   | 0   | 0   | 1   | 0   | 1   | 1   | 1   |

- W1 has MS-4; W5 has MS-3 and MS-7; W8 has MS-6; W10 has MS-1; W11 has MS-2; W12 has MS-5.
- Total = **7**. Average per week = 7 ÷ 12 = 0.583…, shown as **0.6**.
- Left out: MS-8 (resolved before the window) and MS-9 (resolved in the current week).

### Lead time

Sorted values: 1, 5, 5, 6, 12, 18, 20 (n = **7**).

- Median: h = 6 × 0.5 = 3, so x₃ = **6**.
- 85th percentile: h = 6 × 0.85 = 5.1, so x₅ + 0.1 × (x₆ − x₅) = 18 + 0.1 × 2 = **18.2**.

### Cycle time

Sorted values: 1, 4, 5, 8, 9, 12 (n = **6**).

- Median: h = 5 × 0.5 = 2.5, so x₂ + 0.5 × (x₃ − x₂) = 5 + 0.5 × 3 = **6.5**.
- 85th percentile: h = 5 × 0.85 = 4.25, so x₄ + 0.25 × (x₅ − x₄) = 9 + 0.25 × 3 = 9.75, shown as **9.8**.
- Resolved in the window without a Started date: **1** (MS-5).

### Work in progress

Total **3**:

- In Progress: **2** (MS-10, MS-12)
- In Review: **1** (MS-11)

MS-13 is backlog (no Started date), so it is not counted. MS-12 started in July, long before the window, but it still counts because WIP does not use the window.

### Latest Resolved date in the file

**24 Nov 2026** (MS-9).

## 6. Results with the Issue Type filter

### Bug only

Kept bugs are MS-2, MS-5, MS-9 and MS-11. Of these, MS-2 and MS-5 were resolved in the window.

- **Throughput**: W11 = 1, W12 = 1, total 2. Average 2 ÷ 12 = 0.166…, shown as **0.2**.
- **Lead time**: values 1, 5 (n = 2).
  - Median: h = 0.5, so 1 + 0.5 × 4 = **3**.
  - 85th percentile: h = 0.85, so 1 + 0.85 × 4 = **4.4**.
- **Cycle time**: values 1 (n = 1, MS-2). Median **1**, 85th percentile **1**. Without a Started date: **1** (MS-5).
- **WIP**: In Review **1** (MS-11).

### Story and Task together

In the window: MS-1, MS-3, MS-4, MS-6 and MS-7.

- **Throughput**: W1 = 1, W5 = 2, W8 = 1, W10 = 1, total **5**. Average 5 ÷ 12 = 0.416…, shown as **0.4**.
- **Lead time**: sorted values 5, 6, 12, 18, 20 (n = 5).
  - Median: h = 2, so **12**.
  - 85th percentile: h = 4 × 0.85 = 3.4, so 18 + 0.4 × 2 = **18.8**.
- **Cycle time**: sorted values 4, 5, 8, 9, 12 (n = 5).
  - Median: **8**.
  - 85th percentile: h = 3.4, so 9 + 0.4 × 3 = **10.2**.
  - Without a Started date: **0**.
- **WIP**: In Progress **2** (MS-10, MS-12). MS-13 is a Task but backlog, so it is not counted.

### No type selected

There are no issues. Throughput is 0 and the average is 0. Lead time and cycle time have n = 0 and no median. WIP is 0.
