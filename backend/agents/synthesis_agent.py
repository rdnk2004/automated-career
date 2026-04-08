import json
from services.gemini_service import gemini_service
from schemas.analysis import CareerScoreResponse

async def synthesize(profile: dict, repos: list[dict], jd_keywords: list[str], target_role: str) -> CareerScoreResponse:
    prompt = f"""
You are a Career Intelligence Engine analyzing a candidate across multiple platforms.

TARGET ROLE: {target_role}

LINKEDIN PROFILE SUMMARY:
{json.dumps(profile.get('summary', ''), indent=2)[:1000]}...

GITHUB REPOS (Top 5 by stars/recent):
{json.dumps([{'name': r.get('name'), 'stars': r.get('stars')} for r in repos[:5]], indent=2)}

TOP JD KEYWORDS:
{', '.join(jd_keywords[:20])}

TASK:
1. Calculate a linkedin_score (0-100)
2. Calculate a github_score (0-100)
3. Calculate a resume_match_score (0-100) based on alignment with JD keywords
4. Calculate an overall_score (0-100)
5. Provide a list of exactly 3 actionable 'weekly_actions' to improve the candidate's career readiness.

Return JSON with keys: linkedin, github, resume, overall, weekly_actions.
"""
    response_text = await gemini_service.generate_async(prompt)
    data = gemini_service.parse_json_response(response_text)
    
    return CareerScoreResponse(
        linkedin=data.get("linkedin", 0),
        github=data.get("github", 0),
        resume=data.get("resume", 0),
        overall=data.get("overall", 0),
        weekly_actions=data.get("weekly_actions", [])
    )
