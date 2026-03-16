import os
import json
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

LINKEDIN_USERNAME = os.environ.get("LINKEDIN_USERNAME", "")
LINKEDIN_PASSWORD = os.environ.get("LINKEDIN_PASSWORD", "")

try:
    from linkedin_api import Linkedin
    LINKEDIN_AVAILABLE = True
except ImportError:
    LINKEDIN_AVAILABLE = False
    print("[LinkedIn] linkedin-api not installed.")


def _get_client() -> Optional[Any]:
    """Return an authenticated linkedin_api client, or None."""
    if not LINKEDIN_AVAILABLE:
        return None
    if not LINKEDIN_USERNAME or not LINKEDIN_PASSWORD:
        print("[LinkedIn] Credentials not set in .env")
        return None
    try:
        return Linkedin(LINKEDIN_USERNAME, LINKEDIN_PASSWORD)
    except Exception as e:
        print(f"[LinkedIn] Auth error: {e}")
        return None


def get_own_profile(db=None) -> Optional[Dict[str, Any]]:
    """
    Scrape the authenticated user's own LinkedIn profile.
    Rate-limited: returns DB cache if last scrape < 24 hours ago.
    """
    # Check cache in DB first
    if db is not None:
        from database import ProfileSnapshot, ProfileSource
        from sqlalchemy import desc

        last = (
            db.query(ProfileSnapshot)
            .filter(ProfileSnapshot.source == ProfileSource.linkedin)
            .order_by(desc(ProfileSnapshot.scraped_at))
            .first()
        )
        if last:
            age = datetime.utcnow() - last.scraped_at
            if age < timedelta(hours=24):
                print("[LinkedIn] Returning cached profile (< 24h old)")
                return {"data": json.loads(last.data_json), "from_cache": True}

    # Live scrape
    client = _get_client()
    if not client:
        return None

    try:
        profile = client.get_profile(LINKEDIN_USERNAME)
        skills = client.get_profile_skills(LINKEDIN_USERNAME)
        profile["skills_list"] = skills

        # Save snapshot to DB
        if db is not None:
            from database import ProfileSnapshot, ProfileSource

            snapshot = ProfileSnapshot(
                source=ProfileSource.linkedin,
                data_json=json.dumps(profile),
            )
            db.add(snapshot)
            db.commit()

        return {"data": profile, "from_cache": False}
    except Exception as e:
        print(f"[LinkedIn] Profile scrape error: {e}")
        return None


def search_hr_profiles(
    company: str, role: str, location: str, limit: int = 10
) -> list:
    """
    Search LinkedIn for HR profiles by company, role title, and location.
    Rate-limited: 3-5 second sleep between calls.
    """
    client = _get_client()
    if not client:
        return []

    results = []
    try:
        # Use linkedin-api people search
        search_results = client.search_people(
            keywords=f"{role} {company}",
            regions=[location] if location else [],
            limit=limit,
        )

        for person in search_results:
            urn = person.get("urn_id", "")
            time.sleep(3 + (hash(urn) % 3))  # 3-5 second delay

            try:
                profile = client.get_profile(urn)
                results.append({
                    "urn_id": urn,
                    "name": f"{profile.get('firstName', '')} {profile.get('lastName', '')}".strip(),
                    "title": profile.get("headline", ""),
                    "company": company,
                    "profile_url": f"https://www.linkedin.com/in/{profile.get('public_id', urn)}",
                    "location": location,
                })
            except Exception as e:
                print(f"[LinkedIn] Error fetching HR profile {urn}: {e}")
                continue

    except Exception as e:
        print(f"[LinkedIn] HR search error: {e}")

    return results
