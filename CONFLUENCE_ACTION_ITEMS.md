# Automation Execution Hub — Plan sheet (action items)

**Companion docs:** Design, diagrams, and HLD → `CONFLUENCE_README.md` · Technologies & stack → `CONFLUENCE_TECH_STACK.md`.

**How to use:** Update the **Status** and **Notes** columns as work completes. Status values: **Done** | **In progress** | **Planned** | **Not started**.

| # | Area | Action item | Status | Notes |
|---|------|-------------|--------|-------|
| 1 | System | Single hub for multi-POD, multi-type runs (orchestration concept) | Done | `OrchestrationService`, REST triggers, domain model in repo |
| 2 | UI | Insights-style dashboard (metrics, trends, overview) | Done | `InsightsDashboard`, shared shell |
| 3 | UI | Unified Trigger Wizard (4 steps: scope, POD, layer, env) | Done | `TriggerWizard.tsx` |
| 4 | UI | Execution topology heatmap (POD × test type grid, colors) | Done | `HeatmapPage.tsx`, `/api/heatmap` |
| 5 | UI | Multi-filter / catalog (PODs, profiles, layers) | In progress | Core flows exist; expand filtering as needed |
| 6 | API | REST APIs for runs, catalog, dashboard summary, features | Done | See root `README.md` endpoint table |
| 7 | Real-time | WebSocket / live run updates | In progress | `WebSocketConfig`, `RunEventPublisher` — verify end-to-end UX |
| 8 | Orchestration | Tag expression parsing & validation | In progress | `TagExpressionParser`, wired via trigger payload |
| 9 | Orchestration | Full aggregator for complex cross-POD/tag combos | In progress | `SuiteCatalogService` + validation; extend for scale |
| 10 | Orchestration | Parameter resolver (secrets, POD env, dynamic data) | Planned | Extend beyond current parameter JSON |
| 11 | Engines | API / Web / Mobile / Performance execution engines | In progress | Registry + `AbstractStubExecutionEngine` — replace stubs with real runners |
| 12 | Scheduler | CRON / distributed queue → orchestration | Planned | `JobSchedulerService` is placeholder; wire to `OrchestrationService.trigger` |
| 13 | Reporting | Persistent metrics & history for dashboards | In progress | Runs stored; tune reporting DB for prod |
| 14 | Gateway | Dedicated API Gateway (routing, rate limit, WS termination) | Not started | Today: monolithic Spring Boot; split when needed |
| 15 | Security | RBAC (Dev vs Staging/Prod triggers) | Planned | `app.security.dev-permit-all` + OAuth2 path in README |
| 16 | Security | Vault / AWS Secrets Manager for parameters | Not started | No Vault integration in codebase yet |
| 17 | UX | Execution Profiles as first-class saved cards ("Hotfix Sanity") | In progress | Profiles in model/API; polish dashboard cards |
| 18 | UX | Tag bar with rich boolean UX (@regression AND …) | In progress | `tagExpression` field in wizard; enhance editor |
| 19 | UX | Cross-POD dependency matrix (node graph + prompts) | Not started | Ideation only |
| 20 | Data | PostgreSQL (or equivalent) for production | Planned | H2 file DB default; swap per `README` |
| 21 | Integration | CI/CD webhooks → hub | Planned | Tie to scheduler/orchestration |
| 22 | Integration | DarkKnight / Gatling performance path from UI | In progress | `/dark-knight` feature module; see `frontend/README.md` |

## Summary counts (manual refresh)

| Status | Count (approx.) |
|--------|-----------------|
| Done | 5 |
| In progress | 9 |
| Planned | 5 |
| Not started | 3 |

*Adjust counts after each sprint when you update the table.*

---

*Last updated: aligned with QA_Dashboard repository layout and README.*
