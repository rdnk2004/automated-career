import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

try:
    import jobspy
    JOBSPY_AVAILABLE = True
except ImportError:
    try:
        from jobspy import scrape_jobs as _scrape
        JOBSPY_AVAILABLE = True
    except ImportError:
        JOBSPY_AVAILABLE = False
        print("[Jobs] python-jobspy not installed.")

# Default search configuration matching PRD targets
DEFAULT_SEARCH_TERMS = ["Data Analyst", "ML Engineer", "AI Engineer"]
DEFAULT_LOCATIONS = ["Bangalore, India", "Kochi, India", "Remote, India"]


def scrape_jobs(
    search_terms: Optional[List[str]] = None,
    locations: Optional[List[str]] = None,
    results_per_term: int = 20,
    db=None,
) -> List[Dict[str, Any]]:
    """
    Scrape jobs from Indeed and LinkedIn using python-jobspy.
    Rate-limited: at most once per day (checks DB timestamp).
    Returns list of job dicts.
    """
    terms = search_terms or DEFAULT_SEARCH_TERMS
    locs = locations or DEFAULT_LOCATIONS

    # Check if we already scraped today
    if db is not None:
        from database import JobListing
        from sqlalchemy import func

        last_scrape = db.query(func.max(JobListing.scraped_at)).scalar()
        if last_scrape and (datetime.utcnow() - last_scrape) < timedelta(hours=24):
            print(f"[Jobs] Already scraped today ({last_scrape}). Returning cached results.")
            return []  # Caller should read from DB instead

    if not JOBSPY_AVAILABLE:
        print("[Jobs] python-jobspy not available. Returning empty list.")
        return []

    all_jobs: List[Dict[str, Any]] = []

    for term in terms:
        for location in locs:
            try:
                from jobspy import scrape_jobs as _scrape

                jobs_df = _scrape(
                    site_name=["indeed", "linkedin"],
                    search_term=term,
                    location=location,
                    results_wanted=results_per_term,
                    country_indeed="India",
                )

                if jobs_df is not None and not jobs_df.empty:
                    for _, row in jobs_df.iterrows():
                        job = {
                            "title": str(row.get("title", "")),
                            "company": str(row.get("company", "")),
                            "location": str(row.get("location", location)),
                            "job_url": str(row.get("job_url", "")),
                            "jd_text": str(row.get("description", "")),
                            "source": str(row.get("site", "unknown")),
                        }
                        all_jobs.append(job)

                print(f"[Jobs] {len(jobs_df) if jobs_df is not None else 0} jobs for '{term}' in '{location}'")

            except Exception as e:
                print(f"[Jobs] Scrape error for '{term}' in '{location}': {e}")

    return all_jobs


def format_job_for_db(job_dict: dict) -> dict:
    """Normalize a job dict for DB insertion."""
    return {
        "title": job_dict.get("title", ""),
        "company": job_dict.get("company", ""),
        "location": job_dict.get("location", ""),
        "job_url": job_dict.get("job_url", ""),
        "jd_text": job_dict.get("jd_text", "")[:10000],  # cap to avoid DB bloat
        "source": job_dict.get("source", ""),
        "must_have_skills": job_dict.get("must_have_skills", []),
        "nice_to_have_skills": job_dict.get("nice_to_have_skills", []),
    }
