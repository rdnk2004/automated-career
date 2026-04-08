import json
from services.gemini_service import gemini_service
from schemas.analysis import SuggestionSetResponse, SectionScore, KeywordGap, BulletRewrite

async def analyze(profile_data: dict, target_role: str, jd_keywords: list[str]) -> SuggestionSetResponse:
    prompt = f"""
You are a senior career coach specializing in AI and ML engineering roles.

PROFILE DATA:
{json.dumps(profile_data, indent=2)}

TARGET ROLE: {target_role}

TOP JD KEYWORDS (by frequency from {len(jd_keywords)} job listings):
{', '.join(jd_keywords[:30])}

TASK:
1. Score each profile section out of 100. Be strict. Explain deductions.
2. Identify the top 10 keywords missing from the profile that appear in JDs.
3. Rewrite the headline and about section to include high-frequency keywords naturally.
4. For each experience entry, suggest one stronger bullet point.

Return ONLY a JSON object exactly matching this schema:
{{
  "section_scores": [
    {{"section": "string", "score": 0, "reasoning": "string"}}
  ],
  "missing_keywords": [
    "string"
  ],
  "headline_rewrite": "string",
  "about_rewrite": "string",
  "experience_rewrites": [
    {{"original": "string", "suggested": "string"}}
  ]
}}
Do not add fictional experience. Only reframe what exists.
"""
    response_text = await gemini_service.generate_async(prompt)
    data = gemini_service.parse_json_response(response_text)
    
    section_scores = []
    for score in data.get("section_scores", []):
        if isinstance(score, dict):
            section_scores.append(SectionScore(
                section_type=score.get("section", ""),
                score=score.get("score", 0),
                reasoning=score.get("reasoning", "")
            ))
    
    keyword_gaps = [
        KeywordGap(keyword=kw, frequency=None) 
        for kw in data.get("missing_keywords", [])
    ]
    
    rewrites = []
    if "headline_rewrite" in data:
        rewrites.append(BulletRewrite(original=None, suggested=data["headline_rewrite"], evidence_refs=["Headline"]))
    if "about_rewrite" in data:
        rewrites.append(BulletRewrite(original=None, suggested=data["about_rewrite"], evidence_refs=["About"]))
        
    for xp in data.get("experience_rewrites", []):
        if isinstance(xp, dict):
            rewrites.append(BulletRewrite(
                original=xp.get("original", ""),
                suggested=xp.get("suggested", ""),
                evidence_refs=["Experience"]
            ))
        
    return SuggestionSetResponse(
        section_scores=section_scores,
        keyword_gaps=keyword_gaps,
        rewrites=rewrites
    )
