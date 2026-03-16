# CareerLens — Product Requirements Document
**Owner:** Nikhil Krishna R D  
**Version:** v1.0 | March 2026  
**IDE:** Antigravity (Claude Sonnet 4.6 / Opus 4.6 Agents)  
**Status:** Pre-Development

---

## 1. Application Name & Purpose

**Name:** CareerLens

**Purpose:**  
CareerLens is a locally-run, AI-powered career intelligence platform that automates the monitoring, analysis, and optimization of Nikhil's LinkedIn profile, GitHub profile, and Resume — treating all three as one unified professional identity.

The problem it solves: Nikhil currently does this manually — copy-pasting his LinkedIn profile, resume, and GitHub links into Claude or Gemini separately, running analysis, and making updates one by one. This is slow, inconsistent, and siloed. CareerLens replaces that fragmented workflow with a single desktop app running on localhost.

**Core Philosophy:**  
LinkedIn + GitHub + Resume are three faces of one professional identity. CareerLens keeps them synchronized, analyzes them jointly against real job descriptions, and generates actionable updates to maximize job-landing chances during placement season.

**Deployment:** Local only (localhost). No cloud hosting. No paid services. Zero rupee budget.

---

## 2. All Features

### Feature 1: LinkedIn Profile Optimizer
- Scrape the authenticated user's own LinkedIn profile (headline, about, experience, skills, education, featured sections)
- Run AI analysis using a custom prompt (stored in `/prompts/linkedin_optimizer.md`) to identify what's outdated, what keywords are missing, and what sections need rewriting
- Compare LinkedIn profile against a job description — score each section, flag missing recruiter-search keywords
- Generate rewritten versions of headline, about section, and top 3 experience bullets (show old vs new diff)
- Generate 2-3 LinkedIn post ideas based on recent GitHub activity or resume updates, with full draft content
- Save scraped profile snapshot to database with timestamp

### Feature 2: HR Prospector
- Search LinkedIn for HR profiles by company name, role title, and location (user inputs these)
- AI scores each HR profile 0-100 for relevance (based on whether they hire for target roles, activity level, etc.)
- Store HR profiles in database with contact status tracking (not_contacted / messaged / replied)
- Generate personalized, humanized connection request message and follow-up message for each HR
- Display message alongside LinkedIn profile URL — user copies and manually sends (no automation)
- Dashboard showing: X contacted, Y replied, Z pending

### Feature 3: Resume Analyzer
- Upload resume as PDF — parse it and segment by section (Summary, Experience, Skills, Education, Projects)
- Rate each segment green / yellow / red with label and comment (reuse CareerCompass AI pattern)
- Score resume against a pasted or auto-pulled job description — return match %, missing keywords, section verdicts
- Accept a project description input and generate resume bullets for that project, suggest where to insert them
- Generate ATS compatibility score — check for standard headers, no tables/columns, keyword density
- Save each analysis run with JD name and timestamp for version history comparison

### Feature 4: GitHub Analyzer
- Fetch all public repositories for authenticated GitHub user via PyGithub (Personal Access Token auth)
- Classify each repo: project / experiment / fork / learning-exercise
- Deep analysis per project repo: infer purpose, tech stack, complexity rating, resume bullets, improvement suggestions
- Generate optimized README for each project repo (badges, description, tech stack, how to run) — output raw Markdown ready to commit
- Generate optimized GitHub Profile README (the username/username special repo) with stats, skills, recent projects, contact section
- Show commit activity chart, flag repos with no commits in 6+ months as stale

### Feature 5: Unified Profile Database
- SQLite database storing the current state of LinkedIn + Resume + GitHub as a synchronized profile
- Tables: profile_snapshot, skills, projects, hr_contacts, job_listings, analysis_history, cross_suggestions
- Every analysis run saved with input state + output recommendations
- Skills table normalized with source (linkedin / resume / github) and last_seen date
- Projects table covers GitHub repos + resume projects together

### Feature 6: Cross-Channel Sync Engine
- After any module update, compare all three channels — detect gaps like "CareerLens exists on GitHub but not on LinkedIn and not in Resume"
- Generate actionable suggestion cards: "Add CareerLens to LinkedIn Featured. Here's a draft post." / "Add this GitHub project to Resume. Here are the bullets."
- Suggestion queue with status: pending / accepted / dismissed
- Profile Health Score (0-100) based on LinkedIn completeness, resume-GitHub consistency, and skills alignment with target roles

### Feature 7: Job Feed
- Scrape Indeed and LinkedIn Jobs using python-jobspy (free, no API key needed)
- Search terms auto-generated from target roles: Data Analyst, ML Engineer, AI Engineer
- Target locations: Bangalore, Kochi, Remote India
- Parse each job description with AI: extract must-have skills, nice-to-have, seniority, company type
- Match each job against current profile — show match score, sort by match %
- One-click job tailoring: user clicks a job → system generates tailored resume suggestions + tailored LinkedIn headline + suggested HR contacts at that company from HR DB

### Feature 8: Settings
- Input fields for: Gemini API key, GitHub Personal Access Token, LinkedIn username, LinkedIn password
- All credentials stored in local `.env` file — never committed to git
- Model selector (stored as GEMINI_MODEL in .env — default: gemini-2.0-flash)
- Scrape schedule toggle (manual only vs scheduled)
- Token usage counter — estimated daily Gemini usage with warning at 800k tokens

---

## 3. Technical Requirements

### Tech Stack

**Backend:**
- Language: Python 3.11
- Framework: FastAPI (async/await)
- Database ORM: SQLAlchemy with SQLite
- AI: Google Generative AI SDK (`google-generativeai`) — model: `gemini-2.0-flash`
- PDF Parsing: pdfplumber
- LinkedIn Scraping: linkedin-api (unofficial Python library)
- GitHub API: PyGithub (PAT-authenticated)
- Job Scraping: python-jobspy
- Retry logic: custom `generate_with_retry()` with exponential backoff for 429/quota errors

**Frontend:**
- Framework: React 19 + TypeScript
- Build tool: Vite
- Styling: Tailwind CSS
- Routing: React Router v6
- State management: Zustand
- Charts: Recharts (radar, area, bar, pie)
- Icons: Lucide React

### APIs & External Services
- Google Gemini API — `gemini-2.0-flash` model (free tier via Google AI Pro)
- GitHub REST API — authenticated with Personal Access Token (5000 req/hr)
- linkedin-api — unofficial LinkedIn API wrapper (credentials via .env)
- python-jobspy — open source scraper (Indeed + LinkedIn Jobs, no API key)

### Database
- SQLite (file at `/data/careerlens.db`)
- Managed via SQLAlchemy ORM
- No migrations tool needed — `Base.metadata.create_all()` on startup

### Key Schema Tables
```
profile_snapshot   — scraped LinkedIn/Resume/GitHub JSON with timestamps
skills             — normalized skills with source and last_seen
projects           — all projects from GitHub + resume combined
hr_contacts        — HR prospects with score and contact_status
job_listings       — scraped JDs with parsed requirements
analysis_history   — every AI analysis run (input hash + output)
cross_suggestions  — pending sync suggestions with status
```

### Python Dependencies (requirements.txt)
```
fastapi
uvicorn
sqlalchemy
pdfplumber
google-generativeai
linkedin-api
PyGithub
python-jobspy
python-dotenv
beautifulsoup4
requests
pydantic
```

### Node Dependencies (package.json)
```
react, react-dom, react-router-dom
typescript, vite
tailwindcss
zustand
recharts
lucide-react
```

---

## 4. User Stories & Use Cases

**US-01:** As Nikhil, I want to scrape my LinkedIn profile with one click so that I get an AI analysis of what's outdated without manually copying anything.

**US-02:** As Nikhil, I want to see which sections of my LinkedIn profile are weak (with specific rewrites) so I know exactly what to change.

**US-03:** As Nikhil, I want to search for HR profiles at target companies so I have a list of real people to contact rather than applying blindly.

**US-04:** As Nikhil, I want a personalized, humanized connection request message generated for each HR so I don't send generic templates.

**US-05:** As Nikhil, I want to upload my resume PDF and get a section-by-section rating (green/yellow/red) so I know what to fix before applying.

**US-06:** As Nikhil, I want to paste a job description and get my resume's match score against it so I know whether to apply or tailor first.

**US-07:** As Nikhil, I want to describe a project (like CareerLens) and get resume bullet points for it so I can add it to my resume quickly.

**US-08:** As Nikhil, I want to see all my GitHub repos classified and analyzed so I know which ones to highlight and which to archive or improve.

**US-09:** As Nikhil, I want an AI-generated README for each project repo so my GitHub looks professional without writing docs manually.

**US-10:** As Nikhil, I want the app to detect that a project exists on GitHub but not on LinkedIn or Resume and suggest I add it — with draft content ready.

**US-11:** As Nikhil, I want to see today's top job listings matched against my profile so I know which jobs I'm most likely to get.

**US-12:** As Nikhil, I want to click a job listing and immediately get a tailored resume + LinkedIn headline for that specific JD.

**US-13:** As Nikhil, I want a Profile Health Score on the dashboard so I know at a glance how ready I am for placement season.

**US-14:** As Nikhil, I want all my credentials stored locally in a .env file and never sent anywhere except the relevant APIs.

---

## 5. System Architecture

### Overview
Two-layer local application: FastAPI backend on port 8000, React frontend on port 5173. All data stored in SQLite. No external servers.

```
[React Frontend :5173]
        |
        | HTTP (localhost only)
        v
[FastAPI Backend :8000]
        |
   ┌────┴─────────────────────────────────┐
   |                                      |
[SQLite DB]              [External API Calls]
/data/careerlens.db        |
                           ├── Gemini API (AI analysis)
                           ├── GitHub API (repo data)
                           ├── linkedin-api (profile scraping)
                           └── python-jobspy (job scraping)
```

### Agent Architecture
Two agents built using Gemini Function Calling (no LangChain needed):

**Agent 1 — Profile Intelligence Agent**  
Handles multi-step analysis across LinkedIn + Resume + GitHub.  
Tools: `scrape_linkedin()`, `read_resume()`, `get_github_repos()`, `read_profile_db()`, `compare_to_jd()`  
Max iterations: 5 (to control free tier token usage)

**Agent 2 — Outreach Agent**  
Handles HR search, scoring, and message generation.  
Tools: `search_hr_profiles()`, `score_hr_match()`, `read_profile_db()`, `generate_message()`  
Max iterations: 5

### Backend Service Layer
```
backend/
├── main.py                  — FastAPI app, all route definitions
├── database.py              — SQLAlchemy engine, Base, session
├── schemas.py               — Pydantic models for all API I/O
├── agents/
│   ├── profile_agent.py     — Profile Intelligence Agent
│   └── outreach_agent.py    — HR Outreach Agent
└── services/
    ├── gemini_service.py    — Gemini calls, get_clean_schema(), generate_with_retry()
    ├── github_service.py    — PyGithub wrapper, repo fetching and analysis
    ├── linkedin_service.py  — linkedin-api wrapper, profile + people search
    ├── resume_service.py    — pdfplumber parser, section segmentation
    └── jobs_service.py      — python-jobspy scraper, JD parsing
```

### Key Patterns (Reused from CareerCompass AI)
- `get_clean_schema()` — inlines Pydantic $refs for Gemini JSON mode compatibility
- `generate_with_retry()` — 3-4 retries with exponential backoff for 429/quota errors
- `GithubDeepAnalysisResult` schema — project_name, tech_stack, complexity_rating, recommended_resume_bullets
- `ResumeHighlightsResult` schema — segments with green/yellow/red ratings

### Caching Strategy
- LinkedIn: never re-scrape if last scrape < 24 hours ago (check DB timestamp)
- Gemini: hash input, check analysis_history before calling API (serve cached result if same input)
- GitHub: re-fetch repo list on user trigger only, not automatically
- Jobs: re-scrape max once per day

---

## 6. UI/UX Requirements

### Layout
- Sidebar navigation (fixed left) with links to all pages
- Main content area (right, scrollable)
- Dark mode support (toggle in header)
- Responsive to full desktop width — no mobile optimization needed (local tool)

### Pages & Routes

| Route | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Profile Health Score + pending sync suggestions + quick stats |
| `/linkedin` | LinkedIn Optimizer | Scrape trigger + analysis results + rewrite suggestions + post ideas |
| `/hr` | HR Prospector | Search form + HR results table + message generator + contact tracker |
| `/resume` | Resume Analyzer | Upload PDF + segment highlights + ATS score + rewrite output + history |
| `/github` | GitHub Analyzer | Repo list + classification + per-repo analysis + README generator |
| `/jobs` | Job Feed | Job cards sorted by match % + one-click tailoring |
| `/sync` | Sync Engine | Suggestion queue cards with accept/dismiss |
| `/settings` | Settings | API keys, model selector, scrape controls |

### UX Patterns
- Loading states on all async operations (scraping, analysis) — show progress text not just spinner
- Green/yellow/red segment highlighting on resume page (inline, highlighted text)
- Before/after diff view for LinkedIn rewrite suggestions
- Copy-to-clipboard button on all generated text (messages, bullets, README, post drafts)
- Toast notifications on save/accept actions
- HR contact status updated with single click (dropdown: not contacted / messaged / replied)
- Job cards show: company, role, match %, top 3 missing skills — click to expand

### Design Reference
- Glassmorphism card style (same as CareerCompass AI — `bg-white/40 backdrop-blur-xl`)
- Tailwind CSS only — no external component libraries
- Lucide React for all icons
- Recharts for all data visualizations

---

## 7. API Integrations

### Gemini API
- SDK: `google-generativeai` Python package
- Model: `gemini-2.0-flash` (set via GEMINI_MODEL in .env)
- Mode: Structured JSON output using `response_mime_type: "application/json"` + `response_schema`
- Auth: GEMINI_API_KEY in .env
- All prompts stored as `.md` files in `/prompts/` folder — loaded at runtime

### GitHub API
- Library: PyGithub (`pip install PyGithub`)
- Auth: Personal Access Token (GITHUB_PAT in .env) — gives 5000 req/hr vs 60/hr unauthenticated
- Operations: list repos, get repo metadata, get file contents (README, package.json, requirements.txt), get languages, get commit activity

### LinkedIn (unofficial)
- Library: linkedin-api (`pip install linkedin-api`)
- Auth: LINKEDIN_USERNAME + LINKEDIN_PASSWORD in .env
- Operations: get own profile, people search by company + title + location
- Rate limit guardrail: max 1 profile scrape per 24 hours, cached in DB
- Delay: 3-5 second sleep between consecutive people search calls

### Job Scraping
- Library: python-jobspy (`pip install python-jobspy`)
- No API key required
- Sources: Indeed, LinkedIn Jobs
- Search: Data Analyst / ML Engineer / AI Engineer — Bangalore, Kochi, Remote India
- Run: max once per day, results stored in job_listings table

---

## 8. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Security | All credentials in .env only. .env and /data/ in .gitignore. No credentials in code or logs. |
| Performance | LinkedIn scrape < 10s. GitHub full fetch < 30s. Resume analysis < 15s. Job fetch < 60s. |
| Reliability | All API calls in try/except. UI shows friendly error, never crashes. Scrape failure logs to console and continues. |
| Privacy | No data leaves the machine except Gemini API calls and scraping calls. No telemetry, no analytics, no remote logging. |
| Portability | Runs on Windows 11. Python 3.11, Node 18+. No Docker required. |
| Maintainability | Prompts in /prompts/*.md — change prompt without touching code. Model name in .env — swap model without code change. |
| Free Tier Compliance | All services free tier only. No paid APIs. No Apify. No cloud hosting. Budget: ₹0. |
| Token Budget | Gemini usage tracked. Warning shown in Settings if estimated daily usage > 800k tokens. |
| Caching | LinkedIn and Gemini responses cached in DB. Never re-call if valid cached result exists. |
| Git Safety | .gitignore includes: .env, /data/, __pycache__, node_modules, .venv |

---

## 9. Other Important Details

### What to Reuse from CareerCompass AI (Friend's Project)
The following code is proven and should be ported directly into CareerLens backend, not rewritten:
- `get_clean_schema()` function — fixes Pydantic schema for Gemini JSON mode
- `generate_with_retry()` function — retry logic with exponential backoff
- `github_service.py` — `parse_github_input()`, `fetch_github_repo_data()`, `fetch_github_file_content()`
- Pydantic schemas: `GithubDeepAnalysisResult`, `ResumeHighlightsResult`, `ResumeHighlightSegment`, `GithubProject`
- `analyze_github_repos()` function in gemini_service.py

**Critical fix when porting:** Replace all instances of `gemini-3-flash-preview` and `gemini-3-pro-preview` with `gemini-2.0-flash`. Those model strings do not exist and cause silent failures.

### Build Order (do not skip phases)
1. Phase 0 — Project scaffold, .env setup, port CareerCompass code, fix model strings
2. Phase 1 — Resume Analyzer (safest module, validates full stack end-to-end)
3. Phase 2 — GitHub Analyzer (reliable API, immediate usable output)
4. Phase 3 — LinkedIn Optimizer (scraping, needs credential setup)
5. Phase 4 — HR Prospector (builds on LinkedIn module)
6. Phase 5 — Cross-Channel Sync + Job Feed + Dashboard health score
7. Phase 6 — Agent refactor (optional, wraps existing modules into agent loops)

### Folder Structure
```
careerlens/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── schemas.py
│   ├── agents/
│   │   ├── profile_agent.py
│   │   └── outreach_agent.py
│   └── services/
│       ├── gemini_service.py
│       ├── github_service.py
│       ├── linkedin_service.py
│       ├── resume_service.py
│       └── jobs_service.py
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── LinkedIn.tsx
│       │   ├── HRProspector.tsx
│       │   ├── Resume.tsx
│       │   ├── GitHub.tsx
│       │   ├── Jobs.tsx
│       │   ├── Sync.tsx
│       │   └── Settings.tsx
│       ├── components/
│       ├── store/
│       └── services/
├── prompts/
│   ├── linkedin_optimizer.md
│   ├── resume_analyzer.md
│   └── hr_outreach.md
├── data/
│   └── careerlens.db
├── .env                    ← NEVER commit
└── .gitignore
```

### Environment Variables (.env template)
```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
GITHUB_PAT=your_pat_here
LINKEDIN_USERNAME=your_email_here
LINKEDIN_PASSWORD=your_password_here
```

### Target Roles (for job matching and HR search)
- Primary: Data Analyst
- Secondary: ML Engineer, AI Engineer
- Locations: Bangalore, Kochi, Remote India
- Type: Campus placements + Bangalore off-campus

### Developer Context
- Developer: Nikhil Krishna R D
- Program: M.Sc. Computer Science (Data Analytics), Rajagiri College of Social Sciences, Kochi
- Timeline: Placement season approaching — tool must be functional before campus recruitment begins
- Python version: 3.11 (most compatible across all ML, AI, and agent libraries)
- IDE: Antigravity with Claude Sonnet 4.6 / Opus 4.6 agents
