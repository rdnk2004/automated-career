from services.gemini_service import gemini_service
from schemas.analysis import ResumeSuggestionResponse, KeywordGap, BulletRewrite

async def analyze(resume_text: str, target_role: str, jd_keywords: list[str], github_projects: list[str]) -> ResumeSuggestionResponse:
    prompt = f"""
You are an expert technical resume reviewer.

TARGET ROLE: {target_role}

RESUME TEXT:
{resume_text}

TOP JD KEYWORDS:
{', '.join(jd_keywords[:30])}

GITHUB PROJECTS (use these as evidence):
{', '.join(github_projects) if github_projects else 'None available'}

TASK:
1. Provide a match score (0-100) based on how well the resume matches the target role and keywords.
2. Identify up to 10 important keyword gaps missing from the resume.
3. Suggest 3-5 rewritten bullet points for the resume. 
   - Make them more impactful using action verbs and metrics.
   - You MUST reference actual project names from the GITHUB PROJECTS list as evidence in your rewrites where applicable.

Return JSON with keys: match_score (int), gap_keywords (list of strings), bullet_rewrites (list of objects with 'original', 'suggested', and 'evidence_refs' (list of strings)).
"""
    response_text = await gemini_service.generate_async(prompt)
    data = gemini_service.parse_json_response(response_text)
    
    gap_keywords = [KeywordGap(keyword=kw, frequency=None) for kw in data.get("gap_keywords", [])]
    
    bullet_rewrites = [
        BulletRewrite(
            original=b.get("original"),
            suggested=b.get("suggested", ""),
            evidence_refs=b.get("evidence_refs", [])
        ) for b in data.get("bullet_rewrites", [])
    ]
    
    return ResumeSuggestionResponse(
        match_score=data.get("match_score", 0),
        gap_keywords=gap_keywords,
        bullet_rewrites=bullet_rewrites,
        evidence_refs=github_projects
    )
