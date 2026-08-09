# Career OS 🚀

> A personal, self-hosted AI career assistant designed for automated career maintenance & production-grade engineering excellence.

Career OS connects LinkedIn profile data, GitHub repositories, and live job market listings (Greenhouse, Lever, Ashby) through a unified AI layer powered by Gemini 2.5 Pro. It is built as **personal tooling for a single user (RDNK)** with $0-cost self-hosted deployment.

---

## 💡 Key Capabilities & Core Problems Solved

1. **LinkedIn Profile Optimization**  
   Analyzes your profile data against target Job Descriptions (JDs), identifies keyword gaps, and suggests tailored headline and section rewrites using a strict AI scoring engine.
2. **GitHub Repository Health & Security**  
   Performs security/quality scans (detects hardcoded secrets, missing `.gitignore` files) and auto-generates professional `README.md` files based on actual project source code, with the ability to push updates directly to GitHub.
3. **One-Click ATS Resume PDF Exporter**  
   Generates a single-page, ATS-compliant PDF resume (`Candidate_ATS_Resume.pdf`) formatted using ReportLab with clean typography (Helvetica), 0.5-inch margins, and structured section layout, ready for instant job submission.
4. **Interactive Skill Gap Heatmap Matrix**  
   Correlates target job market demands against 4 distinct data sources (**Profile Skills**, **GitHub Repositories**, **Work Experience**, and **Education**). Includes interactive evidence hover tooltips, match rate metrics, and 1-click copy badges for missing high-demand skills.
5. **Live ATS Job Search Integration**  
   Fetches live job listings directly from registered **Greenhouse**, **Lever**, and **Ashby** job boards with fallback aggregation.

---

## 🛠️ Tech Stack

| Layer | Technology | Key Version / Notes |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite 5 + TypeScript | Styled using Tailwind CSS + `shadcn/ui` primitives. State managed with Zustand + TanStack Query. |
| **Backend** | FastAPI + Python 3.12 | 100% asynchronous endpoints, ReportLab PDF generation, slowapi rate limiting. |
| **Database** | PostgreSQL 16 + Alembic | Accessed using SQLAlchemy 2.0 via `asyncpg` driver with transaction rollback hygiene. |
| **AI Layer** | Google Generative AI SDK | Powered by `gemini-2.5-pro-preview-05-06` model with state-aware JSON response extraction. |
| **Orchestration** | n8n | Runs scheduled jobs and triggers via Docker container. |
| **Containers** | Docker + Docker Compose | Local-parity dev/prod multi-container environment. |

---

## 📐 Architecture & Data Flow

```
   [ Greenhouse / Lever / Ashby ATS ]     [ GitHub API ]          [ LinkedIn ZIP Export ]
                 │                             │                            │
           (Weekly Sync)                 (Nightly Sync)             (On-Demand Upload)
                 │                             │                            │
                 ▼                             ▼                            ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                            n8n Orchestration                           │
   └───────┬───────────────────────────┬────────────────────────────┬───────┘
           │                           │                            │
           ▼                           ▼                            ▼
┌─────────────────────┐     ┌─────────────────────┐      ┌─────────────────────┐
│     ATS Service     │     │   GitHub Service    │      │   LinkedIn Parser   │
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
                            │ (PDF / REST Engine) │
                            └──────────┬──────────┘
                                       │ (REST API)
                                       ▼
                            ┌─────────────────────┐
                            │   React Frontend    │
                            │  (Port 5173 / Web)  │
                            └──────────┬──────────┘
```

---

## 📂 Project Directory Structure

```
career-os/
├── docker-compose.yml           # Spins up postgres db, backend, frontend, n8n, and volumes
├── .env.example                 # Configuration blueprint for environment credentials
├── .gitignore
├── GEMINI.md                    # Core project specifications and rules
├── QUICKREF.md                  # Quick CLI commands reference
├── LICENSE                      # MIT License file
│
├── backend/                     # FastAPI ASGI Server
│   ├── main.py                  # Server initialization, rate limiters, CORS, routes routing
│   ├── config.py                # Environment mapping through Pydantic Settings
│   ├── database.py              # Async DB engine & SessionLocal configurations
│   ├── models/                  # SQLAlchemy ORM models (user_profile, github_repos, etc.)
│   ├── schemas/                 # Pydantic serialization schemas for input/output contracts
│   ├── routers/                 # Thin route-handlers layer (analysis, github, jobs, profile)
│   ├── services/                # Business logic (ats_service, pdf_service, github_service, etc.)
│   ├── agents/                  # Prompt-heavy AI processing engines (LinkedIn, Synthesis, etc.)
│   ├── tests/                   # Pytest automated unit testing suite
│   └── migrations/              # Database migration configurations and version files (Alembic)
│
├── frontend/                    # Vite + React Client
│   ├── src/
│   │   ├── components/          # Domain layouts (dashboard, linkedin, github, resume)
│   │   ├── hooks/               # TanStack query & mutation hooks
│   │   ├── stores/              # Zustand hooks for client state
│   │   ├── services/            # Axios API wrappers (profileApi, jobsApi, analysisApi)
│   │   ├── pages/               # Main layout views (Dashboard, Resume, GitHub, Settings)
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

## 🧪 Testing & Quality Assurance

Run the automated backend test suite using Pytest inside the backend environment:
```bash
.venv\Scripts\python -m pytest
```

Check frontend TypeScript compilation:
```bash
npx tsc --noEmit
```

---

## 📄 License

This project is licensed under a **[Custom Non-Commercial & Source-Available License](LICENSE)**.

```
Custom Non-Commercial & Source-Available License

Copyright (c) 2026 RDNK. All rights reserved.

PERMITTED USES:
Permission is hereby granted to any person obtaining a copy of this software and associated 
documentation files (the "Software"), to inspect, run, modify, and use the Software for 
PERSONAL AND NON-COMMERCIAL PURPOSES ONLY.

PROHIBITED USES:
1. COMMERCIAL SALE & RESALE: You may NOT sell, lease, sublicense, monetize, or commercialize 
   the Software, its source code, derivative works, or ideas in any form (including as a SaaS product, 
   enterprise service, or paid application).
2. UNAUTHORIZED PUBLICATION & PAPERWORK: You may NOT publish, present, or claim the project, 
   its underlying research, architecture, or design as your own original paperwork, publication, 
   or product without express written consent from the copyright owner (RDNK).
```
