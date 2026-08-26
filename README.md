# Career OS 🚀

> **A personal, self-hosted AI career assistant designed for automated career maintenance, market intelligence, and production-grade engineering excellence.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.12%20%7C%203.11-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Gemini](https://img.shields.io/badge/Gemini-3.6%20Flash-4285F4.svg?logo=google&logoColor=white)](https://ai.google.dev)
[![Tests](https://img.shields.io/badge/Tests-27%20Passed-10B981.svg?logo=pytest&logoColor=white)](https://pytest.org)
[![License](https://img.shields.io/badge/License-Custom%20Non--Commercial-F59E0B.svg)](LICENSE)

---

## 🌟 Overview

**Career OS** connects LinkedIn profile data, GitHub portfolio repositories, and live job market postings through a unified AI layer powered by **Gemini 3.6 Flash**. It is engineered as **personal tooling for a single user (RDNK)** with $0-cost self-hosted deployment, zero telemetry leaks, and non-generic artisanal frontend craft.

---

## 💡 Key Features & Studio Workspaces

### 1. 📊 Executive Dashboard & Intelligence Engine
* **Historical Trajectory Telemetry**: Real PostgreSQL-backed time-series area charts (`1W`, `1M`, `3M`, `All`) powered by `/api/analysis/history` with benchmark readiness thresholds (85%).
* **Growth Velocity Metrics**: Real-time rolling 7-day progress indicator (`+6 pts this week`), best dimension detector, and interview benchmark gap analysis.
* **Animated Radial Meters**: Custom SVG radial score gauges with color-coded status badges (`Optimal`, `Good`, `Action Needed`).
* **Weekly Priority Router**: Persisted weekly high-impact action recommendations with 1-click studio deep links and completion celebration states.

### 2. 💼 LinkedIn Studio & 4-Pillar AI Intelligence
* **Hierarchical Domain Structure**: Reorganized into primary category sections (Headline & Location, Summary / About, Work Experience, Education, Certifications & Licenses, Technical Projects, Technical Skills, Volunteering, Awards, Languages).
* **Nested Unwrappable Sub-Sections**: Accordion unwrapping for individual Certifications, Projects, Work Experience roles, and Education entries (unwrapping reveals issuing authority, issue dates, project architecture descriptions, repo links, and direct inline editors).
* **Dynamic Empty Section Omission**: Automatic filtering of sections without data for a clean, uncluttered, full-width workspace.
* **4-Pillar Categorized AI Intelligence Studio**:
  1. *Profile Components*: 3–5 optimized headline alternatives, visual presence guidance, executive summary rewrite, and quantified experience bullets.
  2. *GitHub Project Injections*: Automatic AI matching of your top GitHub repos into LinkedIn featured projects with bullet formulations.
  3. *Strategic Insights*: 20–30 target industry keywords and phased 30/60/90 day growth roadmaps.
  4. *Content & Benchmarks*: Viral technical thought leadership post hooks and competitive positioning.
* **On-Demand Collapsible AI Workspace**: Full-width profile workspace by default, with side-by-side split toggle on demand.
* **Drag-and-Drop ZIP Importer**: Automated parser for LinkedIn data export archives (`.zip`) with extraction of positions, education, skills, certifications, projects, volunteer, awards, and languages.

### 3. 📄 Resume Vault & "The Resume Destroyer" AI
* **Multi-Resume Role Vault**: Store and manage multiple resumes tailored for different target roles (e.g. AI Engineer, Systems Architect, ML Ops), with 1-click **Primary** star designation.
* **The Resume Destroyer AI Engine**: 20+ year veteran hiring manager persona evaluating:
  * **BS Factor (1–10)**: Strict metric detecting fluff, buzzwords, and vague claims.
  * **Brutal Hiring Verdict**: Candid, unvarnished gatekeeper critique.
  * **PAR Rewrites**: Converts weak lines into Problem-Action-Result quantified bullets.
  * **GitHub Project Recommendations**: Pinpoints exactly which GitHub repositories to include as high-impact showcase projects.
* **Spatial PDF Ingestion Scraper**: High-precision layout-aware PDF text extraction (`pypdf` layout mode) + Gemini 3.6 Flash structured parsing + drag-and-drop upload modal.
* **ATS Compliant PDF Exporter**: Compiles a single-column, ATS-compliant PDF resume formatted with ReportLab typography (0.5-inch margins, Helvetica) ready for submission.

### 4. 🛡️ GitHub Portfolio & Security Suite
* **Portfolio Health Table**: Interactive data grid with column sorting (Name, Stars, Language, Last Pushed, Health Score), multi-dimensional search filters, and status pills.
* **Private vs. Collaborated Repos**: Strict exclusion of private repositories and automatic inclusion of collaborated public repositories.
* **Multi-Select Batch Audits**: Checkbox multi-selection with a sticky floating bottom batch action bar to trigger parallel security scans.
* **AI README Studio**: 3-Way mode switcher (Formatted Markdown Preview, Editable Markdown Source, Side-by-Side Diff) with 1-click push to GitHub via REST API, `.md` download, and copy actions.
* **Security Remediation Suite**: Automated `.gitignore` injection and `.env` secret file removal with commit hashes, leaked regex secret inspector, and AI code quality insights.
* **Async Task Telemetry**: Real-time background task tracking and polling via `/api/tasks/{task_id}`.

### 5. 🔍 Job Market & Keyword Intelligence
* **Market Search Radar**: Dual input queries for target role and location (`Remote`, hybrid), quick-role selector chips, and live scraped JD counters.
* **Top 50 JD Keyword Cloud**: Dynamic font scaling with frequency badges and category filtering (`All`, `Technical`, `Domain`).
* **Skill Gap Heatmap Matrix**: Correlates candidate profile skills, GitHub repos, work experience, and education against top 15 target market keywords with match rate indicators and hover evidence popovers.
* **Keyword Demand Trends**: Identifies rising, stable, and falling skills across your target industry.

### 6. ⚙️ System Settings & Diagnostic Command Center
* **API Service Connections**: Live credential status indicators for Google Gemini 3.6 Flash (`gemini-3.6-flash`), GitHub PAT (with scope checklist), and Indeed/ATS scrapers.
* **Target Roles Portfolio Manager**: Interactive role management chips with Enter key support and 1-click active default workspace role switching.
* **n8n Automation Engine**: Live workflow schedule monitor for `Nightly GitHub Sync`, `Weekly Market Analysis`, and `LinkedIn Trigger Sync` with direct console deep links.
* **Transactional Data Reset**: Accessible confirmation modal to safely purge cached snapshots, suggestion logs, or background tasks via ACID transactions.

### 7. 🎨 High-Craft Design System & Architecture
* **Typography & Palette**: JetBrains Mono & Outfit typography with dark glassmorphism tokens, custom mesh glow highlights, and zero layout shift skeletons.
* **Command Palette (`Cmd+K` / `Ctrl+K`)**: Universal fuzzy finder for workspace routing, target role switching, and rapid actions.
* **Code-Splitting & Chunking**: Route-level `React.lazy()` loading with graceful glass Suspense loader, styled 404 screen, error boundary, and optimized Rollup vendor chunks (`vendor-react`, `vendor-ui`, `vendor-charts`, `vendor-markdown-diff`, `vendor-query-state`).

---

## 🛠️ Tech Stack

| Layer | Technology | Version / Notes |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite 5 + TypeScript | Styled with Tailwind CSS + `shadcn/ui` primitives. State managed with Zustand + TanStack Query. |
| **Backend** | FastAPI + Python 3.12 / 3.11 | 100% asynchronous endpoints, ReportLab PDF generation, slowapi rate limiting, `pypdf` extraction. |
| **Database** | PostgreSQL 16 + Alembic | SQLAlchemy 2.0 async engine via `asyncpg` driver with transaction rollback hygiene. |
| **AI Layer** | Google Generative AI SDK | Powered by `gemini-3.6-flash` model with structured JSON response extraction. |
| **Orchestration** | n8n | Runs scheduled cron jobs and webhook triggers via self-hosted Docker container. |
| **Containers** | Docker + Docker Compose | Full-parity dev and prod multi-container orchestration. |

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
                                       │ (REST API & Async Task Tracker)
                                       ▼
                            ┌─────────────────────┐
                            │   React Frontend    │
                            │  (Port 5173 / Web)  │
                            └──────────┬──────────┘
```

---

## 📡 API Endpoints Catalog

### Profile (`/api/profile`)
* `GET /api/profile` — Fetch active user profile with consolidated sections.
* `PUT /api/profile` — Update specific profile section content.
* `POST /api/profile/apply-suggestion` — Atomically merge AI suggestions into profile sections.
* `GET /api/profile/scores` — Retrieve multi-metric section scoring breakdowns and deduction tags.
* `POST /api/profile/import` — Multipart upload for LinkedIn data export ZIP (auto-extracts all sections).

### Resumes & Multi-Role Vault (`/api/resumes`)
* `GET /api/resumes` — List all stored resumes with primary badge and match scores.
* `POST /api/resumes` — Create a new targeted resume entry.
* `GET /api/resumes/{id}` — Fetch specific targeted resume details.
* `PUT /api/resumes/{id}` — Update resume content or target role.
* `DELETE /api/resumes/{id}` — Delete a targeted resume.
* `POST /api/resumes/{id}/primary` — Set resume as primary active default.
* `POST /api/resumes/upload` — Direct PDF/TXT/MD multipart upload with spatial extraction.
* `POST /api/resumes/{id}/analyze` — Run "The Resume Destroyer" AI audit on specific resume.

### Analysis & AI (`/api/analysis`)
* `GET /api/analysis/history` — Query historical score snapshot time series (`?days=30&target_role=...`).
* `GET /api/analysis/metrics` — Calculate 7-day growth velocity delta, best dimension, and benchmark gap.
* `POST /api/analysis/synthesis` — Execute multi-source career score synthesis and top 3 weekly actions.
* `POST /api/analysis/linkedin` — Run 4-pillar categorized LinkedIn gap analysis and rewrite generation.
* `POST /api/analysis/resume` — Analyze resume text against target role and top JD keywords.
* `POST /api/analysis/resume/upload` — Ingest binary PDF/TXT resume and return structured section JSON.
* `POST /api/analysis/resume/export-pdf` — Compile single-column ATS-compliant PDF resume.

### GitHub Portfolio (`/api/github`)
* `GET /api/github/repos` — Fetch portfolio repositories with latest security scans (`?health=...`).
* `POST /api/github/sync` — Enqueue background sync of all public and collaborated repositories.
* `POST /api/github/scan` — Run immediate security and hardcoded secret audit on a single repo.
* `POST /api/github/scan/batch` — Enqueue background security scan on selected repositories.
* `POST /api/github/readme/generate` — Generate professional AI README based on source tree.
* `POST /api/github/readme/push` — Commit README.md directly to GitHub repository.
* `POST /api/github/remediate` — Automated `.gitignore` injection or committed `.env` deletion.
* `GET /api/github/tasks/{task_id}` — Poll background task progress.

### Job Market (`/api/jobs`)
* `GET /api/jobs/search` — Query live ATS listings with automatic database and keyword caching.
* `GET /api/jobs/keywords` — Fetch top market keywords ordered by frequency (`?is_technical=...`).
* `GET /api/jobs/trends` — Keyword demand velocity engine (`rising`, `stable`, `falling` skills).

### System & Settings (`/api/settings` & `/api/tasks`)
* `GET /api/settings` — Get system integration status and active target roles.
* `PUT /api/settings` — Update target career roles portfolio.
* `GET /api/settings/n8n-status` — Check live connectivity and schedules of n8n automation engine.
* `POST /api/settings/reset` — Transactionally purge cached score snapshots, suggestions, or task states.
* `GET /api/tasks/{task_id}` — Global background task status polling endpoint.

---

## 📂 Project Directory Structure

```
career-os/
├── docker-compose.yml           # Spins up postgres db, backend, frontend, n8n, and volumes
├── .env.example                 # Configuration blueprint for environment credentials
├── .gitignore
├── GEMINI.md                    # Core project specifications and rules
├── QUICKREF.md                  # Quick CLI commands reference
├── LICENSE                      # Custom Non-Commercial License
├── README.md                    # Project documentation
│
├── backend/                     # FastAPI ASGI Server
│   ├── main.py                  # Server initialization, rate limiters, CORS, global tasks route
│   ├── config.py                # Environment mapping through Pydantic Settings
│   ├── database.py              # Async DB engine & SessionLocal configurations
│   ├── models/                  # SQLAlchemy ORM models (profile, github, jobs, suggestions, settings, targeted_resumes)
│   ├── schemas/                 # Pydantic schemas (analysis, github, jobs, profile, settings, resumes)
│   ├── routers/                 # Route handlers (analysis, github, jobs, profile, settings, resumes)
│   ├── services/                # Business logic (ats, github, gemini, indeed, linkedin, pdf, resume_parser, task_manager)
│   ├── agents/                  # Prompt-heavy AI processing engines (linkedin, github, resume, synthesis)
│   ├── tests/                   # Pytest automated test suite (27 integration tests)
│   └── requirements.txt         # Backend Python dependencies
│
├── frontend/                    # Vite + React Client
│   ├── src/
│   │   ├── components/          # Domain components (dashboard, linkedin, github, resume, ui, layout)
│   │   │   ├── linkedin/        # ProfileEditor, LinkedInCategorizedStudio, SectionScore, modular sub-editors
│   │   │   ├── resume/          # ResumeVaultManager, ResumeDestroyerReview, JDKeywordCloud, GapHeatmap
│   │   │   └── github/          # RepoHealthTable, ReadmeGenerator, SecurityScanPanel
│   │   ├── hooks/               # TanStack query, mutation, hotkey, and toast hooks
│   │   ├── stores/              # Zustand domain stores (profileStore, githubStore, jobStore, settingsStore)
│   │   ├── services/            # Axios API wrappers (profileApi, githubApi, jobsApi, analysisApi, resumeApi)
│   │   ├── types/               # TypeScript type definitions
│   │   ├── pages/               # Workspace routes (Dashboard, LinkedIn, GitHub, Resume, Settings)
│   │   └── main.tsx             # Entry point (QueryClient + Router setup)
│   ├── vite.config.ts           # Optimized Rollup code-splitting & manual chunks
│   └── tailwind.config.ts       # Design tokens & glassmorphism theme
│
└── n8n/                         # Orchestrator Workflows
    └── workflows/               # Scheduled sync workflows (weekly_job_sync, github_nightly_sync)
```

---

## ⚡ Quick Start

### 1. Clone & Configure Environment
```bash
git clone https://github.com/RDNK/career-os.git
cd career-os
```

Create a copy of `.env.example` named `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Key environment variables:
```bash
APP_SECRET_KEY=generate-with-python-secrets-token-hex-32
DATABASE_URL=postgresql+asyncpg://career_os:password@localhost:5432/career_os_db
GITHUB_PAT=ghp_your_personal_access_token
GITHUB_USERNAME=your-github-username
GEMINI_API_KEY=AIza_your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=change_this_password
N8N_WEBHOOK_URL=http://localhost:5678
```

### 2. Launch with Docker Compose
```bash
docker compose up -d
```

### 3. Run Database Migrations
```bash
docker compose exec backend alembic upgrade head
```

### 4. Access the Workspaces
* 🌐 **React Frontend Client**: [http://localhost:5173](http://localhost:5173)
* 📖 **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* ⚡ **n8n Orchestration Console**: [http://localhost:5678](http://localhost:5678)

---

## 🧪 Testing & Quality Assurance

### Run Backend Unit & Integration Tests (27 Tests)
```bash
cd backend
.\.venv\Scripts\python -m pytest -v
```

### Verify Frontend TypeScript & Production Bundle
```bash
cd frontend
npx tsc --noEmit
npm run build
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
