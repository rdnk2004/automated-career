import httpx
import asyncio
import json
import re
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional

# Path to the company registry — adjust if you move this file within backend/config/
_REGISTRY_PATH = Path(__file__).resolve().parent / "config" / "ats_companies.json"


def _strip_html(raw: str) -> str:
    """Greenhouse/Ashby descriptions come back as HTML. Basic tag strip — good enough
    for keyword extraction, not meant to preserve formatting."""
    if not raw:
        return ""
    text = re.sub(r"<[^>]+>", " ", raw)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


class ATSService:
    def __init__(self, registry_path: Optional[Path] = None):
        self.registry_path = registry_path or _REGISTRY_PATH

    def _load_companies(self) -> List[Dict[str, str]]:
        if not self.registry_path.exists():
            return []
        with open(self.registry_path, "r") as f:
            data = json.load(f)
        return data.get("companies", [])

    # ---- Per-ATS fetchers -------------------------------------------------

    async def _fetch_greenhouse(self, client: httpx.AsyncClient, company_name: str, board_token: str) -> List[Dict[str, Any]]:
        url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs"
        try:
            resp = await client.get(url, params={"content": "true"}, timeout=15)
            resp.raise_for_status()
        except httpx.HTTPError:
            return []  # bad token, board down, etc. — skip, don't kill the whole sync

        jobs = []
        for job in resp.json().get("jobs", []):
            jobs.append({
                "indeed_id": f"gh-{job.get('id')}",
                "title": job.get("title", ""),
                "company": company_name,
                "location": (job.get("location") or {}).get("name"),
                "description": _strip_html(job.get("content", "")),
                "salary_range": None,  # Greenhouse has no structured salary field on this endpoint
                "job_type": None,
                "source_url": job.get("absolute_url"),
            })
        return jobs

    async def _fetch_lever(self, client: httpx.AsyncClient, company_name: str, board_token: str) -> List[Dict[str, Any]]:
        url = f"https://api.lever.co/v0/postings/{board_token}"
        try:
            resp = await client.get(url, params={"mode": "json"}, timeout=15)
            resp.raise_for_status()
        except httpx.HTTPError:
            return []

        jobs = []
        for job in resp.json():
            categories = job.get("categories", {}) or {}
            desc = job.get("descriptionPlain") or _strip_html(job.get("description", ""))
            jobs.append({
                "indeed_id": f"lv-{job.get('id')}",
                "title": job.get("text", ""),
                "company": company_name,
                "location": categories.get("location"),
                "description": desc,
                "salary_range": None,
                "job_type": categories.get("commitment"),
                "source_url": job.get("hostedUrl"),
            })
        return jobs

    async def _fetch_ashby(self, client: httpx.AsyncClient, company_name: str, board_token: str) -> List[Dict[str, Any]]:
        url = f"https://api.ashbyhq.com/posting-api/job-board/{board_token}"
        try:
            resp = await client.get(url, timeout=15)
            resp.raise_for_status()
        except httpx.HTTPError:
            return []

        jobs = []
        for job in resp.json().get("jobs", []):
            jobs.append({
                "indeed_id": f"ab-{job.get('id', uuid.uuid4())}",
                "title": job.get("title", ""),
                "company": company_name,
                "location": job.get("location"),
                "description": job.get("descriptionPlain") or _strip_html(job.get("descriptionHtml", "")),
                "salary_range": None,
                "job_type": job.get("employmentType"),
                "source_url": job.get("jobUrl"),
            })
        return jobs

    # ---- Public interface ---------------------------------------------

    async def search_jobs(self, title: str, location: Optional[str] = None, limit: int = 30) -> List[Dict[str, Any]]:
        """Fetches live postings from every registered company's ATS board, then
        filters to those whose title matches the search term. This replaces the
        old mocked Indeed search — same call signature, real data underneath."""
        companies = self._load_companies()
        if not companies:
            return []

        fetchers = {
            "greenhouse": self._fetch_greenhouse,
            "lever": self._fetch_lever,
            "ashby": self._fetch_ashby,
        }

        all_jobs: List[Dict[str, Any]] = []
        async with httpx.AsyncClient(headers={"User-Agent": "career-os/1.0"}) as client:
            tasks = []
            for c in companies:
                fetch_fn = fetchers.get(c.get("ats"))
                if fetch_fn is None:
                    continue
                tasks.append(fetch_fn(client, c["name"], c["board_token"]))
                # be polite to each ATS between requests
                await asyncio.sleep(0.1)

            results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, list):
                    all_jobs.extend(r)

        # simple case-insensitive title + optional location filter
        title_lower = title.lower()
        filtered = [
            j for j in all_jobs
            if title_lower in j["title"].lower()
            and (not location or (j.get("location") and location.lower() in j["location"].lower()))
        ]
        return filtered[:limit]


ats_service = ATSService()