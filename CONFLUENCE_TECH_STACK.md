# QA Platform — technology & tooling sheet

**Companion docs:** HLD & diagrams → `CONFLUENCE_README.md` · Roadmap & action items → `CONFLUENCE_ACTION_ITEMS.md`

Use this page in Confluence as a **single reference for languages, frameworks, libraries, and integrations** used by this repository.

---

## Core stack (summary)

| Layer | Technology | Version / notes |
|-------|------------|-----------------|
| **Backend language** | Java | **21** (toolchain in Gradle) |
| **Backend framework** | Spring Boot | **3.4.x** (`build.gradle.kts`) |
| **Build (backend)** | Gradle | **8.11** (see root `README.md`) |
| **Frontend language** | TypeScript | **~5.7** |
| **Frontend UI** | React | **19** |
| **Frontend build** | Vite | **6** |
| **Styling** | Tailwind CSS | **3.x** (+ PostCSS, Autoprefixer) |
| **Routing** | React Router | **7** |
| **Database (current)** | H2 | File-based (`./data/qa-platform.mv.db`), PostgreSQL-compatible mode |
| **Database (production target)** | PostgreSQL | Planned swap (see root `README.md`) |

---

## Backend — Spring Boot starters & libraries

Declared in `build.gradle.kts` (exact versions managed by Spring Boot BOM unless noted).

| Component | Purpose |
|-----------|---------|
| `spring-boot-starter-web` | REST APIs |
| `spring-boot-starter-data-jpa` | Persistence (Hibernate) |
| `spring-boot-starter-validation` | Request / DTO validation |
| `spring-boot-starter-websocket` | Real-time updates (e.g. run events) |
| `spring-boot-starter-security` | Security (dev: permit-all configurable) |
| `spring-boot-starter-actuator` | Health / ops (`/actuator`) |
| `spring-boot-starter-mail` | Email notifications (SMTP via env) |
| `spring-boot-devtools` | Dev-only hot reload |
| **H2** (`runtimeOnly`) | Embedded / file DB |
| **Apache POI** `poi-ooxml` **5.3.0** | Excel import/export (test cases, etc.) |
| `spring-boot-starter-test` | JUnit 5, Spring Test |
| `spring-security-test` | Security-aware tests |

**Packaging:** Spring Boot executable JAR (`automation-execution-hub.jar`).

---

## Backend — runtime & data

| Item | Detail |
|------|--------|
| **HTTP port** | **8090** (`application.yml`) |
| **Connection pool** | HikariCP (Spring Boot default) |
| **ORM** | Hibernate (via Spring Data JPA), `ddl-auto: update` (dev-oriented) |
| **H2 console (dev)** | Enabled at `/h2-console` |
| **CORS** | Allowed origins include `http://localhost:5174`, `http://localhost:5173` |

---

## Frontend — npm dependencies

| Package | Role |
|---------|------|
| `react`, `react-dom` | UI |
| `react-router-dom` | Client-side routing (`/`, `/qa`, `/dark-knight`, etc.) |
| `vite`, `@vitejs/plugin-react` | Dev server & production build |
| `typescript` | Static typing |
| `tailwindcss`, `postcss`, `autoprefixer` | Utility-first CSS pipeline |

**Dev server:** default port **5174** (see root `README.md`; Vite config).

**Proxy:** Dev server proxies `/api`, `/ws`, and `/dark-knight` to backend / DarkKnight as documented in `README.md`.

---

## Code organization (tech boundaries)

| Area | Package / path | Stack note |
|------|------------------|------------|
| Orchestration | `com.automationhub.*` | Spring services, REST, WebSocket, engines |
| QA Dashboard (backend) | `com.testmanagement.*` | Features, test cases, mail |
| Hub UI | `frontend/src/pages/` | React + Tailwind |
| QA Dashboard UI | `frontend/src/testmgmt/` | Isolated feature module |
| DarkKnight UI | `frontend/src/features/darkknight/` | Calls **DarkKnight Control API** (external Gatling runner) |
| Shared shell | `frontend/src/layout/` | App shell, sidebar, tabs |

---

## External systems & integrations

| System | Role | Protocol / notes |
|--------|------|------------------|
| **DarkKnight** | Performance test jobs (Gatling) | HTTP Control API (`/jobs`, health, etc.); spec in DarkKnight repo `openapi.yaml` |
| **SMTP mail server** | Notifications | `SPRING_MAIL_*`, `MAIL_FROM`, team email lists via `application.yml` / env |
| **Future CI / agents** | Real test execution | Orchestration engines placeholder; workspace root `AUTOMATION_WORKSPACE_ROOT` |

---

## Configuration & environment (high level)

| Topic | Mechanism |
|-------|-----------|
| **Backend config** | `application.yml`, profiles (e.g. `application-memory.yml`) |
| **Frontend env** | `frontend/.env.local` from `.env.example` (e.g. `VITE_DARKKNIGHT_API_BASE`, `VITE_DARKKNIGHT_API_KEY`) |
| **Security (dev)** | `app.security.dev-permit-all: true` — **OAuth2 / LDAP** called out for production in config comments |

---

## Planned / roadmap technology (from product docs)

Not necessarily implemented yet; listed for planning and Confluence alignment.

| Direction | Examples |
|-----------|----------|
| **Production database** | PostgreSQL |
| **AuthN / AuthZ** | OAuth2, RBAC (`dev-permit-all: false`) |
| **Secrets** | Vault, AWS Secrets Manager (HLD) |
| **Scheduling** | Quartz, RabbitMQ, AWS EventBridge, or similar (scheduler placeholder in code) |
| **API edge** | Dedicated API gateway (optional split from monolith) |

---

## Tooling versions (quick copy-paste)

```
Java:     21
Gradle:   8.11
Spring Boot: 3.4.x
Node:     (LTS recommended for frontend)
npm:      (ships with Node)
React:    19
Vite:     6
TypeScript: ~5.7
Tailwind: 3.x
```

---

*Update this sheet when you bump dependencies in `build.gradle.kts` or `frontend/package.json`.*
