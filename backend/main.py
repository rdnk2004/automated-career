import os
import json
import hashlib
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

from database import (
    init_db, get_db,
    ProfileSnapshot, ProfileSource,
    HRContact, ContactStatus,
    JobListing, AnalysisHistory,
    CrossSuggestion, SuggestionStatus,
    Project, Skill,
)
from schemas import (
    # Resume
    ResumeAnalysisResponse, ResumeHistoryItem,
    ResumeBulletsRequest, ResumeBulletsResponse,
    # GitHub
    GithubFetchResponse, RepoClassification,
    GithubAnalysisResponse, GithubReadmeResponse, GithubProfileReadmeResponse,
    # LinkedIn
    LinkedInScrapeResponse, LinkedInAnalysisResult, LinkedInPostsResponse,
    # HR
    HRSearchRequest, HRProfileResult, HRMessageResult, HRStatusUpdate, HRDashboardStats,
    # Jobs
    JobListingResponse, JobTailoringResponse,
    # Sync
    CrossSuggestionResponse, SuggestionStatusUpdate,
    # Dashboard
    DashboardResponse, ProfileHealthScore, DashboardQuickStats,
    # Settings
    SettingsResponse, SettingsUpdate,
)
from services import gemini_service as gemini
from services import github_service as github
from services import resume_service as resume_svc
from services import linkedin_service as linkedin
from services import jobs_service as jobs


# ── App Lifecycle ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("[CareerLens] Database initialized.")
    yield


app = FastAPI(title="CareerLens API", version="1.0.0", lifespan=lifespan)

# ── CORS (ported from CareerCompass AI reference) ─────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error"
    return {"status": "ok", "db": db_status, "version": "1.0.0"}


# ─────────────────────────────────────────────────────────────────────────────
# RESUME ANALYZER
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/resume/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    jd_text: Optional[str] = Form(None),
    jd_name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """Upload a PDF resume → get highlights (green/yellow/red) + ATS score."""
    try:
        file_bytes = await file.read()
        mime_type = file.content_type or "application/pdf"
        if mime_type == "application/octet-stream":
            mime_type = "application/pdf"

        # Check analysis cache
        input_hash = hashlib.sha256(file_bytes + (jd_text or "").encode()).hexdigest()
        cached = db.query(AnalysisHistory).filter(
            AnalysisHistory.module == "resume",
            AnalysisHistory.input_hash == input_hash,
        ).first()
        if cached:
            return json.loads(cached.output_json)

        # Run analysis in parallel conceptually (sequential awaits)
        highlights = await gemini.analyze_resume_highlights(file_bytes, mime_type)
        ats = await gemini.calculate_ats_score(file_bytes, mime_type)

        if not highlights or not ats:
            raise HTTPException(status_code=500, detail="AI analysis failed. Check your Gemini API key.")

        result = {
            "highlights": highlights,
            "ats_score": ats,
        }

        # Save to history
        history = AnalysisHistory(
            module="resume",
            input_hash=input_hash,
            jd_name=jd_name or "Unnamed",
            output_json=json.dumps(result),
        )
        db.add(history)
        db.commit()
        db.refresh(history)

        result["history_id"] = history.id
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[/api/resume/analyze] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/resume/bullets")
async def generate_resume_bullets(req: ResumeBulletsRequest):
    """Generate ATS-optimized resume bullets for a project description."""
    try:
        result = await gemini.generate_resume_bullets(req.project_description, req.target_role or "Data Analyst / ML Engineer")
        if not result:
            raise HTTPException(status_code=500, detail="Bullet generation failed.")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/resume/history")
def get_resume_history(db: Session = Depends(get_db)):
    """Return past resume analysis runs."""
    records = (
        db.query(AnalysisHistory)
        .filter(AnalysisHistory.module == "resume")
        .order_by(AnalysisHistory.created_at.desc())
        .limit(20)
        .all()
    )
    results = []
    for r in records:
        try:
            output = json.loads(r.output_json)
            ats = output.get("ats_score", {})
            highlights = output.get("highlights", {})
            counts = highlights.get("summary_counts", {})
            results.append({
                "id": r.id,
                "jd_name": r.jd_name,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "ats_score": ats.get("score"),
                "green_count": counts.get("green", 0),
                "yellow_count": counts.get("yellow", 0),
                "red_count": counts.get("red", 0),
            })
        except Exception:
            continue
    return results


# ─────────────────────────────────────────────────────────────────────────────
# GITHUB ANALYZER
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/github/fetch")
def fetch_github_repos(db: Session = Depends(get_db)):
    """Fetch and classify all public repos for the authenticated GitHub user."""
    try:
        raw_repos = github.fetch_all_repos()
        classified = []
        for repo in raw_repos:
            classification = github.classify_repo(repo)
            stale = github.is_stale(repo)
            classified.append({
                "name": repo.get("name", ""),
                "description": repo.get("description", ""),
                "language": repo.get("language", ""),
                "stars": repo.get("stargazers_count", 0),
                "url": repo.get("html_url", ""),
                "last_commit": repo.get("pushed_at", ""),
                "classification": classification,
                "is_stale": stale,
            })
        return {"repos": classified, "total": len(classified)}
    except Exception as e:
        print(f"[/api/github/fetch] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/github/analyze/{repo_name}")
async def analyze_github_repo(repo_name: str, owner: Optional[str] = None):
    """Deep AI analysis for a single repository."""
    try:
        _owner = owner or os.environ.get("GITHUB_USERNAME", "")
        if not _owner:
            raise HTTPException(status_code=400, detail="GitHub owner/username not provided. Set GITHUB_USERNAME in .env or pass as query param.")

        repo_data = github.fetch_github_repo_data(_owner, repo_name)
        if not repo_data:
            raise HTTPException(status_code=404, detail=f"Repo '{repo_name}' not found.")

        analyses = await gemini.analyze_github_repos([repo_data])
        if not analyses:
            raise HTTPException(status_code=500, detail="Analysis failed.")

        return {"repo_name": repo_name, "analysis": analyses[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/github/readme/{repo_name}")
async def generate_repo_readme(repo_name: str, owner: Optional[str] = None):
    """Generate an optimized README.md for a repository."""
    try:
        _owner = owner or os.environ.get("GITHUB_USERNAME", "")
        if not _owner:
            raise HTTPException(status_code=400, detail="GitHub owner not provided.")

        repo_data = github.fetch_github_repo_data(_owner, repo_name)
        if not repo_data:
            raise HTTPException(status_code=404, detail="Repo not found.")

        readme = await gemini.generate_repo_readme(repo_data)
        return {"repo_name": repo_name, "readme_markdown": readme or ""}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/github/profile-readme")
async def generate_profile_readme(db: Session = Depends(get_db)):
    """Generate the GitHub profile README for the username/username special repo."""
    try:
        raw_repos = github.fetch_all_repos()
        skills_rows = db.query(Skill).order_by(Skill.last_seen.desc()).limit(20).all()
        skills = [s.name for s in skills_rows]

        repo_summaries = [
            {"name": r.get("name", ""), "description": r.get("description", "")}
            for r in raw_repos[:10]
        ]
        readme = await gemini.generate_profile_readme(repo_summaries, skills)
        return {"readme_markdown": readme or ""}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# LINKEDIN OPTIMIZER
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/linkedin/scrape")
def scrape_linkedin_profile(db: Session = Depends(get_db)):
    """Scrape own LinkedIn profile (24hr cache enforced)."""
    try:
        result = linkedin.get_own_profile(db=db)
        if not result:
            raise HTTPException(
                status_code=503,
                detail="LinkedIn scrape failed. Check LINKEDIN_USERNAME and LINKEDIN_PASSWORD in .env."
            )
        profile_data = result.get("data", {})
        from_cache = result.get("from_cache", False)
        scraped_at = datetime.utcnow().isoformat()
        return {"profile_data": profile_data, "scraped_at": scraped_at, "from_cache": from_cache}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/linkedin/analyze")
async def analyze_linkedin(
    jd_text: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """Analyze the cached LinkedIn profile against an optional JD."""
    try:
        from sqlalchemy import desc
        last_snapshot = (
            db.query(ProfileSnapshot)
            .filter(ProfileSnapshot.source == ProfileSource.linkedin)
            .order_by(desc(ProfileSnapshot.scraped_at))
            .first()
        )
        if not last_snapshot:
            raise HTTPException(status_code=404, detail="No LinkedIn profile scraped yet. Run /api/linkedin/scrape first.")

        profile_data = json.loads(last_snapshot.data_json)
        result = await gemini.analyze_linkedin_profile(profile_data, jd_text or "")
        if not result:
            raise HTTPException(status_code=500, detail="LinkedIn analysis failed.")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/linkedin/posts")
async def get_linkedin_posts(db: Session = Depends(get_db)):
    """Generate LinkedIn post ideas based on recent GitHub activity."""
    try:
        repos = github.fetch_all_repos()
        repo_summaries = [
            {"name": r.get("name", ""), "description": r.get("description", "")}
            for r in repos[:5]
        ]
        result = await gemini.generate_linkedin_posts(repo_summaries)
        return result or {"posts": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# HR PROSPECTOR
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/hr/search")
async def search_hr(req: HRSearchRequest, db: Session = Depends(get_db)):
    """Search LinkedIn for HR profiles and save top results to DB."""
    try:
        from agents.outreach_agent import run_outreach_agent
        profiles = await run_outreach_agent(
            company=req.company,
            role=req.role,
            location=req.location,
            db=db,
        )

        saved = []
        for p in profiles:
            hr = HRContact(
                name=p.get("name", ""),
                title=p.get("title", ""),
                company=req.company,
                profile_url=p.get("profile_url", ""),
                score=p.get("score", 0.0),
                score_reason=p.get("score_reason", ""),
                connection_message=p.get("connection_message", ""),
                follow_up_message=p.get("follow_up_message", ""),
            )
            db.add(hr)
            saved.append(hr)
        db.commit()

        return [
            {
                "id": hr.id,
                "name": hr.name,
                "title": hr.title,
                "company": hr.company,
                "profile_url": hr.profile_url,
                "score": hr.score,
                "score_reason": hr.score_reason,
                "contact_status": hr.contact_status,
            }
            for hr in saved
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/hr/{hr_id}/message")
async def generate_hr_message(hr_id: int, db: Session = Depends(get_db)):
    """Generate or regenerate connection + follow-up messages for an HR contact."""
    try:
        hr = db.query(HRContact).filter(HRContact.id == hr_id).first()
        if not hr:
            raise HTTPException(status_code=404, detail="HR contact not found.")

        profile_summary = "M.Sc. Computer Science (Data Analytics) student at Rajagiri College, Kochi. Skilled in Python, ML, and Data Analysis. Seeking Data Analyst / ML Engineer roles."
        result = await gemini.generate_hr_messages(
            {"name": hr.name, "title": hr.title, "company": hr.company},
            profile_summary,
        )
        if result:
            hr.connection_message = result.get("connection_request", "")
            hr.follow_up_message = result.get("follow_up_message", "")
            db.commit()

        return {
            "connection_request": hr.connection_message,
            "follow_up_message": hr.follow_up_message,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/hr/{hr_id}/status")
def update_hr_status(hr_id: int, update: HRStatusUpdate, db: Session = Depends(get_db)):
    """Update contact_status for an HR (not_contacted / messaged / replied)."""
    hr = db.query(HRContact).filter(HRContact.id == hr_id).first()
    if not hr:
        raise HTTPException(status_code=404, detail="HR contact not found.")
    hr.contact_status = ContactStatus(update.status)
    db.commit()
    return {"id": hr_id, "status": hr.contact_status}


@app.get("/api/hr/all")
def get_all_hr_contacts(db: Session = Depends(get_db)):
    """Return all saved HR contacts."""
    contacts = db.query(HRContact).order_by(HRContact.score.desc()).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "title": c.title,
            "company": c.company,
            "profile_url": c.profile_url,
            "score": c.score,
            "score_reason": c.score_reason,
            "contact_status": c.contact_status,
            "connection_message": c.connection_message,
            "follow_up_message": c.follow_up_message,
        }
        for c in contacts
    ]


# ─────────────────────────────────────────────────────────────────────────────
# JOB FEED
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/jobs")
def get_jobs(db: Session = Depends(get_db)):
    """Return cached job listings sorted by match score."""
    job_list = (
        db.query(JobListing)
        .order_by(JobListing.match_score.desc().nullslast())
        .limit(100)
        .all()
    )
    return [
        {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "job_url": j.job_url,
            "match_score": j.match_score,
            "missing_skills": j.missing_skills,
            "must_have_skills": j.must_have_skills,
            "source": j.source,
            "scraped_at": j.scraped_at.isoformat() if j.scraped_at else None,
        }
        for j in job_list
    ]


@app.post("/api/jobs/scrape")
async def trigger_job_scrape(db: Session = Depends(get_db)):
    """Trigger a fresh job scrape (max once per day)."""
    try:
        raw_jobs = jobs.scrape_jobs(db=db)
        if not raw_jobs:
            return {"message": "Already scraped today or no results. Check /api/jobs for cached listings.", "count": 0}

        # Optionally match against profile
        linkedin_snapshot = None
        last_linkedin = (
            db.query(ProfileSnapshot)
            .filter(ProfileSnapshot.source == ProfileSource.linkedin)
            .order_by(ProfileSnapshot.scraped_at.desc())
            .first()
        )
        profile_summary = ""
        if last_linkedin:
            profile_data = json.loads(last_linkedin.data_json)
            profile_summary = str(profile_data.get("headline", "")) + " " + str(profile_data.get("summary", ""))

        saved_count = 0
        for job_dict in raw_jobs:
            # Parse JD and match if profile available
            must_have = []
            nice_to_have = []
            match_score = None
            missing_skills = []

            if job_dict.get("jd_text") and profile_summary:
                try:
                    parsed = await gemini.parse_jd(job_dict["jd_text"])
                    if parsed:
                        must_have = parsed.get("must_have_skills", [])
                        nice_to_have = parsed.get("nice_to_have_skills", [])
                    match_result = await gemini.match_profile_to_job(profile_summary, job_dict["jd_text"])
                    if match_result:
                        match_score = match_result.get("match_score")
                        missing_skills = match_result.get("missing_skills", [])
                except Exception as e:
                    print(f"[Job Scrape] Match error: {e}")

            job_entry = JobListing(
                title=job_dict.get("title", ""),
                company=job_dict.get("company", ""),
                location=job_dict.get("location", ""),
                job_url=job_dict.get("job_url", ""),
                jd_text=job_dict.get("jd_text", "")[:10000],
                source=job_dict.get("source", ""),
                must_have_skills=must_have,
                nice_to_have_skills=nice_to_have,
                match_score=match_score,
                missing_skills=missing_skills,
            )
            db.add(job_entry)
            saved_count += 1

        db.commit()
        return {"message": f"Scraped and saved {saved_count} jobs.", "count": saved_count}

    except Exception as e:
        print(f"[/api/jobs/scrape] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/jobs/{job_id}/tailor")
async def tailor_job(job_id: int, db: Session = Depends(get_db)):
    """One-click tailoring: generate tailored resume + headline for a specific job."""
    try:
        job = db.query(JobListing).filter(JobListing.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found.")

        # Get profile context
        last_linkedin = (
            db.query(ProfileSnapshot)
            .filter(ProfileSnapshot.source == ProfileSource.linkedin)
            .order_by(ProfileSnapshot.scraped_at.desc())
            .first()
        )
        profile_summary = ""
        if last_linkedin:
            profile_data = json.loads(last_linkedin.data_json)
            profile_summary = str(profile_data.get("headline", "")) + ". " + str(profile_data.get("summary", ""))

        result = await gemini.match_profile_to_job(profile_summary, job.jd_text or "")
        if not result:
            raise HTTPException(status_code=500, detail="Tailoring failed.")

        # Find HR contacts at this company
        hr_at_company = (
            db.query(HRContact)
            .filter(HRContact.company.ilike(f"%{job.company}%"))
            .limit(3)
            .all()
        )
        suggested_hr = [
            {
                "id": hr.id,
                "name": hr.name,
                "title": hr.title,
                "company": hr.company,
                "profile_url": hr.profile_url,
                "score": hr.score,
                "score_reason": hr.score_reason,
                "contact_status": hr.contact_status,
            }
            for hr in hr_at_company
        ]

        return {
            "tailored_resume_bullets": result.get("tailored_resume_bullets", []),
            "tailored_headline": result.get("tailored_headline", ""),
            "tailored_summary": result.get("tailored_summary", ""),
            "suggested_hr_contacts": suggested_hr,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# CROSS-CHANNEL SYNC ENGINE
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/sync/suggestions")
def get_sync_suggestions(db: Session = Depends(get_db)):
    """Return all pending cross-channel sync suggestions."""
    suggestions = (
        db.query(CrossSuggestion)
        .filter(CrossSuggestion.status == SuggestionStatus.pending)
        .order_by(CrossSuggestion.created_at.desc())
        .all()
    )
    return [
        {
            "id": s.id,
            "suggestion_text": s.suggestion_text,
            "suggestion_type": s.suggestion_type,
            "draft_content": s.draft_content,
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in suggestions
    ]


@app.post("/api/sync/generate")
async def generate_sync_suggestions(db: Session = Depends(get_db)):
    """Analyze profile state and generate new cross-channel sync suggestions."""
    try:
        from sqlalchemy import desc

        linkedin_snap = db.query(ProfileSnapshot).filter(
            ProfileSnapshot.source == ProfileSource.linkedin
        ).order_by(desc(ProfileSnapshot.scraped_at)).first()

        resume_snap = db.query(ProfileSnapshot).filter(
            ProfileSnapshot.source == ProfileSource.resume
        ).order_by(desc(ProfileSnapshot.scraped_at)).first()

        li_data = json.loads(linkedin_snap.data_json) if linkedin_snap else {}
        res_data = json.loads(resume_snap.data_json) if resume_snap else {}
        repos = github.fetch_all_repos()

        suggestions_raw = await gemini.generate_cross_suggestions(li_data, res_data, repos)

        saved = []
        for s in suggestions_raw:
            entry = CrossSuggestion(
                suggestion_text=s.get("suggestion_text", ""),
                suggestion_type=s.get("suggestion_type", ""),
                draft_content=s.get("draft_content", ""),
            )
            db.add(entry)
            saved.append(entry)
        db.commit()

        return {"generated": len(saved)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/sync/{suggestion_id}")
def update_suggestion_status(
    suggestion_id: int, update: SuggestionStatusUpdate, db: Session = Depends(get_db)
):
    """Accept or dismiss a sync suggestion."""
    s = db.query(CrossSuggestion).filter(CrossSuggestion.id == suggestion_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Suggestion not found.")
    s.status = SuggestionStatus(update.status)
    db.commit()
    return {"id": suggestion_id, "status": s.status}


# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/dashboard")
async def get_dashboard(db: Session = Depends(get_db)):
    """Return Profile Health Score + pending suggestions + quick stats."""
    try:
        from sqlalchemy import func, desc

        # Health score inputs
        linkedin_snap = db.query(ProfileSnapshot).filter(
            ProfileSnapshot.source == ProfileSource.linkedin
        ).order_by(desc(ProfileSnapshot.scraped_at)).first()

        resume_snap = db.query(ProfileSnapshot).filter(
            ProfileSnapshot.source == ProfileSource.resume
        ).order_by(desc(ProfileSnapshot.scraped_at)).first()

        repos = github.fetch_all_repos()

        pending_count = db.query(CrossSuggestion).filter(
            CrossSuggestion.status == SuggestionStatus.pending
        ).count()

        health = await gemini.calculate_health_score(
            linkedin_snapshot=json.loads(linkedin_snap.data_json) if linkedin_snap else {},
            resume_snapshot=json.loads(resume_snap.data_json) if resume_snap else {},
            github_repos=repos,
            pending_suggestions=pending_count,
        )

        # Pending suggestions (top 5)
        pending_suggestions = (
            db.query(CrossSuggestion)
            .filter(CrossSuggestion.status == SuggestionStatus.pending)
            .order_by(desc(CrossSuggestion.created_at))
            .limit(5)
            .all()
        )

        # Quick stats
        last_resume = db.query(AnalysisHistory).filter(
            AnalysisHistory.module == "resume"
        ).order_by(desc(AnalysisHistory.created_at)).first()

        hr_count = db.query(func.count(HRContact.id)).scalar()
        jobs_count = db.query(func.count(JobListing.id)).scalar()
        repos_analyzed = db.query(AnalysisHistory).filter(
            AnalysisHistory.module == "github"
        ).count()

        return {
            "health_score": {
                **health,
                "last_updated": datetime.utcnow().isoformat(),
            },
            "pending_suggestions": [
                {
                    "id": s.id,
                    "suggestion_text": s.suggestion_text,
                    "suggestion_type": s.suggestion_type,
                    "draft_content": s.draft_content,
                    "status": s.status,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                }
                for s in pending_suggestions
            ],
            "quick_stats": {
                "total_repos": len(repos),
                "repos_analyzed": repos_analyzed,
                "hr_contacts": hr_count or 0,
                "jobs_fetched": jobs_count or 0,
                "pending_suggestions": pending_count,
                "last_resume_analysis": last_resume.created_at.isoformat() if last_resume and last_resume.created_at else None,
                "last_linkedin_scrape": linkedin_snap.scraped_at.isoformat() if linkedin_snap and linkedin_snap.scraped_at else None,
            },
        }
    except Exception as e:
        print(f"[/api/dashboard] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# SETTINGS
# ─────────────────────────────────────────────────────────────────────────────

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def mask(value: str) -> str:
    """Mask a secret value for display."""
    if not value or len(value) < 8:
        return "****"
    return value[:4] + "..." + value[-4:]


@app.get("/api/settings")
def get_settings():
    """Return current .env settings with sensitive fields masked."""
    return {
        "gemini_api_key": mask(os.environ.get("GEMINI_API_KEY", "")),
        "gemini_model": os.environ.get("GEMINI_MODEL", "gemini-2.0-flash"),
        "github_pat": mask(os.environ.get("GITHUB_PAT", "")),
        "linkedin_username": os.environ.get("LINKEDIN_USERNAME", ""),
        "linkedin_password": mask(os.environ.get("LINKEDIN_PASSWORD", "")),
    }


@app.post("/api/settings")
def update_settings(update: SettingsUpdate):
    """
    Write updated values to .env file and reload environment.
    Only fields provided (not None) are updated.
    """
    try:
        # Read existing .env lines
        env_lines: dict = {}
        if ENV_PATH.exists():
            for line in ENV_PATH.read_text().splitlines():
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    env_lines[k.strip()] = v.strip()

        update_map = {
            "GEMINI_API_KEY": update.gemini_api_key,
            "GEMINI_MODEL": update.gemini_model,
            "GITHUB_PAT": update.github_pat,
            "LINKEDIN_USERNAME": update.linkedin_username,
            "LINKEDIN_PASSWORD": update.linkedin_password,
        }
        for key, val in update_map.items():
            if val is not None:
                env_lines[key] = val
                os.environ[key] = val

        # Write back
        content = "\n".join(f"{k}={v}" for k, v in env_lines.items()) + "\n"
        ENV_PATH.write_text(content)

        return {"status": "ok", "updated": [k for k, v in update_map.items() if v is not None]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Dev entry point ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
