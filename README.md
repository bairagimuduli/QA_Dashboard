# QA Platform (Automation Execution Hub + QA Dashboard)

Single deployable: **orchestration** (`com.automationhub`) and **QA Dashboard** feature workflow (`com.testmanagement`) share one Spring Boot app and one database. The React UI uses a shared **Insights-style shell** (sidebar, top bar, tabs) inspired by analytics dashboards.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Java **21**, Spring Boot **3.4**, Gradle **8.11** |
| Frontend | React **19**, TypeScript, Vite **6**, Tailwind **3** |
| Data | H2 file DB (`./data/qa-platform.mv.db`) — swap to PostgreSQL for production |

## Repository layout (reuse-friendly)

| Area | Path | Responsibility |
|------|------|----------------|
| Orchestration | `com.automationhub.*` | Runs, engines, heatmap, STOMP |
| QA Dashboard (backend) | `com.testmanagement.*` | Features, test cases, mail notifications |
| Hub UI pages | `frontend/src/pages/` | Wizard, heatmap, history, insights |
| Performance (DarkKnight) | `frontend/src/features/darkknight/` | Control API client + dark-theme performance console (`/dark-knight`) |
| QA Dashboard UI | `frontend/src/testmgmt/` | API client + feature list/detail (isolated import path) |
| Shared chrome | `frontend/src/layout/` | `AppShell`, sidebar, top bar, tabs |
| Dashboard widgets | `frontend/src/components/dashboard/` | Metric cards, donut, sparklines |

## Run locally

**Backend** (port **8090**):

```powershell
cd automation-execution-hub
.\gradlew.bat bootRun
```

**Frontend** (port **5174**, proxies `/api`, `/ws`, and `/dark-knight` → DarkKnight on **8080**):

```powershell
cd frontend
npm install
npm run dev
```

- Insights home: `http://localhost:5174/` (aggregated metrics + donut + tables)
- **QA Dashboard** (features & test cases): `http://localhost:5174/qa-dashboard/features`
- **QA Ops** (shortcuts to wizard, heatmap, etc.): `http://localhost:5174/qa`
- **DarkKnight Performance Dashboard** (Gatling Control API): `http://localhost:5174/dark-knight` — see [DarkKnight](https://gitlab-ee.mpokket.org/quality-assurance/Performance_Testing/DarkKnight.git) repo `openapi.yaml` and README section **QA Dashboard integration handoff**. Optional env: `VITE_DARKKNIGHT_API_BASE`, `VITE_DARKKNIGHT_API_KEY` (documented in `frontend/.env.example`).
- H2 console (dev): `http://localhost:8090/h2-console` (JDBC URL matches `spring.datasource.url` in `application.yml`)

## Key REST endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/dashboard/summary` | Run + heatmap + feature pipeline counts for the Insights dashboard |
| `POST` | `/api/runs` | Queue execution |
| `GET` | `/api/runs`, `/api/runs/{id}` | History / detail |
| `GET` | `/api/catalog/*`, `/api/heatmap` | Catalog + heatmap |
| `GET`/`POST`/… | `/api/features` | QA Dashboard: features & test cases |

Mail: configure `SPRING_MAIL_HOST` (see `application.yml`). Without it, notifications are logged only.

## Extending

1. **Engines** — `com.automationhub.engine` (Gradle/Jenkins/agents).
2. **Scheduler** — `JobSchedulerService` → `OrchestrationService.trigger`.
3. **RBAC** — `app.security.dev-permit-all: false` + OAuth2.

Delete `./data` to reset the embedded database.
