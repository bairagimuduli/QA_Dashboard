# QA Dashboard frontend (Vite + React)

## DarkKnight Performance Dashboard

Route: `/dark-knight` (sidebar: **Performance Test**).

- **API**: DarkKnight Control API only — `GET /health`, `POST /jobs`, `GET /jobs/{jobId}`. Spec: [DarkKnight repo](https://gitlab-ee.mpokket.org/quality-assurance/Performance_Testing/DarkKnight.git) — `openapi.yaml` at repo root, README section **QA Dashboard integration handoff**.

### Environment

Copy `.env.example` to `.env.local` and set as needed:

| Variable | Purpose |
|----------|---------|
| `VITE_DARKKNIGHT_API_BASE` | e.g. `http://localhost:8080`. Omit in dev to use the Vite proxy path `/dark-knight` → `http://localhost:8080`. |
| `VITE_DARKKNIGHT_API_KEY` | Sent as `X-API-Key` when set (required if DarkKnight runs with `API_KEY`). |

**CORS**: If the browser calls DarkKnight directly, allow this app’s origin. This project’s dev server defaults to port **5174** (`vite.config.ts`); DarkKnight’s default includes `http://localhost:5173` — add **5174** to `CORS_ORIGINS` if you use `VITE_DARKKNIGHT_API_BASE`, or rely on the dev proxy and omit the env var.

### Code

- `src/features/darkknight/apiClient.ts` — URLs, headers, error envelope parsing; optional `GET /simulations` for dropdown.
- `src/features/darkknight/simulationCatalog.ts` — bundled list of Gatling classes (by service) from DarkKnight `simulations/apis`; update when new simulations ship.
- `src/features/darkknight/runOptions.ts` — injection profile dropdown; users and duration as text → `-Dinjection_profile`, `-Dusers`, `-Dduration_seconds`.
- `src/features/darkknight/PerformanceDashboard.tsx` — UI.

```bash
npm install
npm run dev
```
