# Career OS 🚀

> A personal, self-hosted AI career assistant designed for automated career maintenance. 

Career OS connects LinkedIn profile data, GitHub repositories, and Indeed job listings through a unified AI layer powered by Gemini 2.5 Pro. It is built as **personal tooling for a single user (RDNK)** rather than a multi-tenant SaaS product.

---

## 💡 The Three Core Problems It Solves

1. **LinkedIn Profile Maintenance**  
   Analyzes your profile data against target Job Descriptions (JDs), identifies keyword gaps, and suggests tailored headline and section rewrites using a strict AI scoring engine.
2. **GitHub Repository Health & Documentation**  
   Performs nightly security/quality scans (detects hardcoded secrets, missing `.gitignore` files) and auto-generates professional `README.md` files based on actual project source code, with the ability to push updates directly to GitHub.
3. **Resume Alignment & Job Market Signal Analysis**  
   Performs gap analysis mapping your skills directly to live Indeed JDs, generating interactive skill match heatmaps, key terms word clouds, and copying AI-rewritten resume bullets with evidence references.

---

## 🛠️ Tech Stack

| Layer | Technology | Key Version / Notes |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite 5 + TypeScript | Styled using Tailwind CSS + `shadcn/ui` primitives. State managed with Zustand. |
| **Backend** | FastAPI + Python 3.12 | 100% asynchronous endpoints and services. |
| **Database** | PostgreSQL 16 + Alembic | Accessed using SQLAlchemy 2.0 via `asyncpg` driver. |
| **AI Layer** | Google Generative AI SDK | Powered by `gemini-2.5-pro-preview-05-06` model. |
| **Orchestration** | n8n | Runs scheduled jobs and triggers via Docker container. |
| **Containers** | Docker + Docker Compose | Local-parity dev/prod multi-container environment. |

---

## 📐 Architecture & Data Flow

```
   [ Indeed Jobs API ]           [ GitHub API ]          [ LinkedIn ZIP Export ]
            │                          │                            │
      (Weekly Sync)              (Nightly Sync)             (On-Demand Upload)
            │                          │                            │
            ▼                          ▼                            ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                            n8n Orchestration                           │
   └───────┬───────────────────────────┬────────────────────────────┬───────┘
           │                           │                            │
           ▼                           ▼                            ▼
┌─────────────────────┐     ┌─────────────────────┐      ┌─────────────────────┐
│   Indeed Service    │     │   GitHub Service    │      │   LinkedIn Parser   │
└──────────┬──────────┘     └──────────┬──────────┘      └──────────┬──────────┘
           │                           │                            │
           ▼                           ▼                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL Database (DB)                         │
└──────────┬───────────────────────────┬────────────────────────────┬───────┘
           │                           │                            │
           ▼                           ▼                            ▼
┌─────────────────────┐     ┌─────────────────────┐      ┌─────────────────────┐
│    Resume Agent     │     │    GitHub Agent     │      │   LinkedIn Agent    │
└──────────┬──────────┘     └──────────┬──────────┘      └──────────┬──────────┘
           │                           │                            │
           └───────────────────────────┼────────────────────────────┘
                                       ▼
                            ┌─────────────────────┐
                            │   Synthesis Agent   │
                            └──────────┬──────────┘
                                       │ (Career Score & Weekly Actions)
                                       ▼
                            ┌─────────────────────┐
                            │    FastAPI Backend  │
                            └──────────┬──────────┘
                                       │ (REST API)
                                       ▼
                            ┌─────────────────────┐
                            │   React Frontend    │
                            │  (Port 5173 / Web)  │
                            └─────────────────────┘
```

---

## 📂 Project Directory Structure

```
career-os/
├── docker-compose.yml           # Spins up postgres db, backend, frontend, n8n, and volumes
├── .env.example                 # Configuration blueprint for environment credentials
├── .gitignore
├── GEMINI.md                    # Core project specifications and rules (ignored by git)
├── QUICKREF.md                  # Quick CLI commands reference (ignored by git)
│
├── backend/                     # FastAPI ASGI Server
│   ├── main.py                  # Server initialization, rate limiters, CORS, routes routing
│   ├── config.py                # Environment mapping through Pydantic Settings
│   ├── database.py              # Async DB engine & SessionLocal configurations
│   ├── models/                  # SQLAlchemy ORM models (user_profile, github_repos, etc.)
│   ├── schemas/                 # Pydantic serialization schemas for input/output contracts
│   ├── routers/                 # Thin route-handlers layer
│   ├── services/                # Business logic integrations (GitHub, Indeed, Gemini clients)
│   ├── agents/                  # Prompt-heavy AI processing engines (LinkedIn, Synthesis, etc.)
│   └── migrations/              # Database migration configurations and version files (Alembic)
│
├── frontend/                    # Vite + React Client
│   ├── src/
│   │   ├── components/          # Domain layouts (dashboard, linkedin, github, resume)
│   │   ├── hooks/               # TanStack query & mutation hooks
│   │   ├── stores/              # Zustand hooks for client state (Zustand)
│   │   ├── services/            # Axios API wrappers (profileApi, jobsApi, etc.)
│   │   ├── pages/               # Main layout views (Dashboard, Resume, Settings)
│   │   └── main.tsx             # Application entrypoint (React Query Client + Router)
│   └── tailwind.config.ts       # Styles configuration
│
└── n8n/                         # Orchestrator Workflows
    └── workflows/               # JSON files representing scheduled sync actions
```

---

## ⚡ Quick Start

### 1. Clone & Configure Environment
First, clone the repository and navigate into the root directory:
```bash
git clone https://github.com/RDNK/career-os.git
cd career-os
```

Create a copy of `.env.example` named `.env` and fill in all the configuration keys:
```bash
cp .env.example .env
```
Ensure you provide:
- `APP_SECRET_KEY`: Generate a secure key (e.g., `openssl rand -hex 32`)
- `GITHUB_PAT` & `GITHUB_USERNAME`: Your personal access details for GitHub interaction
- `GEMINI_API_KEY`: Key to execute Google Gemini requests
- `N8N_BASIC_AUTH_USER` & `N8N_BASIC_AUTH_PASSWORD`: Local credentials for n8n UI access

### 2. Launch Services with Docker Compose
Run the application services in the background:
```bash
docker compose up -d
```

### 3. Run Database Migrations
Run migrations on the PostgreSQL instance using Alembic inside the backend container:
```bash
docker compose exec backend alembic upgrade head
```

### 4. Access the Applications
Once all containers show as healthy, you can access the tools at:
*   **React Frontend**: [http://localhost:5173](http://localhost:5173)
*   **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
*   **n8n Orchestrator Console**: [http://localhost:5678](http://localhost:5678)

---

## 🔄 Scheduled n8n Workflows

Orchestration is managed inside n8n. To activate schedules, import the JSON files found under `n8n/workflows/` directly into your n8n workspace UI:

1.  **`weekly_job_sync.json`** (Runs Mondays at 07:00)  
    Reads settings -> fetches 30 Job Descriptions per target role from Indeed -> aggregates technical keywords -> triggers synthesis.
2.  **`github_nightly_sync.json`** (Runs daily at 02:00)  
    Triggers backend GitHub repository sync -> runs security/quality scans on flagged repositories.
3.  **`linkedin_analysis_trigger.json`** (Webhook-driven)  
    Listens for profile export ZIP uploads, triggers immediate profile parser parsing and scoring.

---

## 📐 Coding Conventions

*   **Thin Routers, Fat Services**: Keep routers strictly responsible for network requests and responses. Business logic belongs in `/services` and prompt engineering belongs in `/agents`.
*   **Early Returns**: Prefer guard clauses and early returns to avoid deeply nested blocks in both Python and TypeScript code.
*   **No Synchronous Endpoints**: Always define endpoint and database methods asynchronously (`async def`, `await`).
*   **React State Management**: React Query (TanStack Query) handles all server-side state. Standard components use Zustand stores to manage UI-only state; do not abuse `useState` for API synchronization.
*   **Compact Components**: Keep UI component files under 200 lines. Split logical structures into reusable files when boundaries are exceeded.

---

## 🔒 Security Policy

This tool runs as a self-hosted personal service. Do **NOT** publish this application directly to a public server without additional security layers. An basic key `api_auth_key` can be specified inside `.env` to validate calls from frontend to backend. Always verify that your database credentials, API keys, and GitHub PATs are safe inside your `.env` file, which is ignored by `.gitignore`.
