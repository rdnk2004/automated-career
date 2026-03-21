"""
Outreach Agent

Handles HR search, scoring, and message generation.
Max 5 iterations to control free-tier token usage.
"""
from typing import List, Optional

from services import linkedin_service as linkedin
from services import gemini_service as gemini


class OutreachAgent:
    """
    Agent 2 — HR Outreach Agent.
    Handles: HR search → AI scoring → personalized message generation.
    Max 5 iterations.
    """

    MAX_ITERATIONS = 5

    def __init__(self, db=None):
        self.db = db

    async def run(
        self,
        company: str,
        role: str,
        location: str,
        user_profile_summary: str = "",
        limit: int = 10,
    ) -> List[dict]:
        """
        Run the outreach pipeline:
        1. Search LinkedIn for HR profiles
        2. Score each HR profile for relevance
        3. Generate personalized messages
        Returns list of enriched HR profiles.
        """
        iteration = 0
        result_profiles = []

        # Step 1: Search
        if iteration >= self.MAX_ITERATIONS:
            return result_profiles
        iteration += 1

        raw_profiles = linkedin.search_hr_profiles(company, role, location, limit=limit)
        if not raw_profiles:
            print(f"[OutreachAgent] No HR profiles found for {company} / {role} / {location}")
            return result_profiles

        # Step 2: Score each profile
        for hr_profile in raw_profiles:
            try:
                # Simple heuristic scoring (no extra Gemini call to conserve tokens)
                score = _heuristic_score(hr_profile, role)
                hr_profile["score"] = score
                hr_profile["score_reason"] = _score_reason(hr_profile, role, score)
                result_profiles.append(hr_profile)
            except Exception as e:
                print(f"[OutreachAgent] Scoring error for {hr_profile.get('name')}: {e}")

        # Sort by score descending
        result_profiles.sort(key=lambda x: x.get("score", 0), reverse=True)

        # Step 3: Generate messages for top 3
        if iteration < self.MAX_ITERATIONS and user_profile_summary:
            for hr in result_profiles[:3]:
                try:
                    messages = await gemini.generate_hr_messages(hr, user_profile_summary)
                    if messages:
                        hr["connection_message"] = messages.get("connection_request", "")
                        hr["follow_up_message"] = messages.get("follow_up_message", "")
                    iteration += 1
                    if iteration >= self.MAX_ITERATIONS:
                        break
                except Exception as e:
                    print(f"[OutreachAgent] Message gen error: {e}")

        return result_profiles


def _heuristic_score(hr_profile: dict, target_role: str) -> float:
    """Score an HR profile 0-100 based on title and company relevance."""
    title = (hr_profile.get("title") or "").lower()
    target = target_role.lower()

    score = 40.0  # base

    # HR/Talent keywords boost
    for kw in ["recruiter", "talent", "hiring", "hr", "human resource", "people"]:
        if kw in title:
            score += 20
            break

    # Target role alignment boost
    for kw in ["tech", "engineer", "data", "ml", "ai", "software", "analytics"]:
        if kw in title:
            score += 15
            break

    # Seniority boost
    for kw in ["senior", "lead", "head", "director", "manager"]:
        if kw in title:
            score += 10
            break

    return min(score, 100.0)


def _score_reason(hr_profile: dict, target_role: str, score: float) -> str:
    title = hr_profile.get("title", "")
    if score >= 80:
        return f"Strong match — '{title}' directly handles tech/data hiring."
    elif score >= 60:
        return f"Good match — '{title}' likely hires for {target_role} roles."
    else:
        return f"Moderate match — '{title}' may have general HR scope."


async def run_outreach_agent(
    company: str,
    role: str,
    location: str,
    user_profile_summary: str = "",
    limit: int = 10,
    db=None,
) -> List[dict]:
    """Convenience function to instantiate and run the outreach agent."""
    agent = OutreachAgent(db=db)
    return await agent.run(
        company=company,
        role=role,
        location=location,
        user_profile_summary=user_profile_summary,
        limit=limit,
    )
