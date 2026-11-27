# Delivery Metrics Tool

A local web dashboard that turns a Jira CSV export into delivery metrics: throughput, lead time, cycle time and work in progress.

Status: in development. See [spec.md](spec.md), [plan.md](plan.md) and [tasks.md](tasks.md).

## Run locally

Requires Node.js 26 (see `.nvmrc`).

```
npm install
npm run dev
```

Then open the localhost URL that is printed.

## Checks

| Command                 | What it does                                             | Runs in CI |
| ----------------------- | -------------------------------------------------------- | ---------- |
| `npm run lint`          | ESLint and Prettier check                                | yes        |
| `npm run typecheck`     | TypeScript type check                                    | yes        |
| `npm run test:coverage` | Unit and component tests; 100% coverage of `src/domain/` | yes        |
| `npm run build`         | Production build                                         | yes        |
| `npm run test:smoke`    | Browser smoke test (Playwright)                          | yes        |
| `npm run test:perf`     | 5,000-issue performance check (Playwright)               | no (local) |

Before the first browser test on a new machine, run `npx playwright install chromium`.

## Protecting main

CI runs on every push (`.github/workflows/ci.yml`). The workflow cannot block merges by itself. A repository admin turns that on once:

1. On GitHub, open the repository, then **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.
2. Name it `main`, set **Enforcement status** to **Active**, and under **Target branches** choose **Include default branch**.
3. Tick **Require a pull request before merging**.
4. Tick **Require status checks to pass**, click **Add checks** and choose `ci`.
5. Tick **Block force pushes**, then click **Create**.

After that, a pull request into `main` can only be merged when the `ci` check is green.
