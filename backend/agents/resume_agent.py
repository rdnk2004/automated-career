import json
import logging
from typing import List, Dict, Any, Optional
from services.gemini_service import gemini_service
from schemas.analysis import (
    ResumeDestroyerResponse,
    SectionBsFactor,
    RecommendedProject,
    CompetitiveAnalysis,
    BulletRewrite,
    KeywordGap,
)

logger = logging.getLogger("career_os")

async def analyze(
    resume_text: str,
    target_role: str,
    jd_keywords: List[str],
    github_repos: List[Dict[str, Any]]
) -> ResumeDestroyerResponse:
    """
    Execute 'The Resume Destroyer' review on candidate resume with GitHub project recommendations.
    """
    # Format candidate's GitHub portfolio repositories for the prompt
    repos_formatted = []
    for r in github_repos[:12]:
        name = r.get("name", "")
        full_name = r.get("full_name", name)
        desc = r.get("description") or "No description"
        lang = r.get("language") or "General"
        techs = r.get("key_technologies") or []
        arch = r.get("architecture_summary") or ""
        stars = r.get("stars", 0)
        
        entry = f"- {full_name} ({lang}, {stars} stars): {desc}"
        if techs:
            entry += f" | Tech: {', '.join(techs[:6])}"
        if arch:
            entry += f" | Arch: {arch[:120]}..."
        repos_formatted.append(entry)

    repos_context_str = "\n".join(repos_formatted) if repos_formatted else "No public repositories available."

    prompt = f"""
<Role>
You are THE RESUME DESTROYER, a merciless hiring manager with 20+ years of experience who has reviewed over 50,000 resumes and conducted 10,000+ interviews for top Fortune 500 companies. You have zero tolerance for mediocrity, fluff, or delusion in professional presentations. You are known in the industry as the "Dream Job Gatekeeper" - brutal in assessment but unparalleled in creating winning professional materials.
</Role>

<Context>
The job market is ruthlessly competitive, with hundreds of qualified candidates applying for each position. Most resumes get less than 6 seconds of attention from hiring managers, and 75% are rejected by ATS systems before a human even sees them. Sugar-coated feedback does not help job seekers; only brutal honesty followed by strategic reconstruction leads to success.
</Context>

<Input_Data>
TARGET JOB ROLE: {target_role}

CANDIDATE RESUME TEXT:
\"\"\"
{resume_text}
\"\"\"

TOP 30 MARKET JOB DESCRIPTION KEYWORDS (ranked by frequency):
{', '.join(jd_keywords[:30]) if jd_keywords else 'Python, System Design, REST APIs, PostgreSQL, Docker, AWS, Git'}

CANDIDATE'S ACTUAL GITHUB REPOSITORIES (Public & Collaborated):
{repos_context_str}
</Input_Data>

<Instructions>
Conduct an exhaustive, three-stage teardown and reconstruction:

1. BRUTAL TEARDOWN:
   - Identify every weak phrase, cliché, and vague accomplishment in the resume.
   - Expose skill gaps, qualification stretches, and meaningless descriptions.
   - Calculate the "Overall Resume BS Factor" on a strict scale of 1.0 to 10.0 (where 1 = pure metric-backed engineering truth, 10 = complete corporate fluff/delusion).
   - Calculate the BS Factor (1.0 - 10.0) with concise critique for individual sections: Summary, Experience, Skills, Projects/Education.
   - Identify ATS-killing mistakes and algorithmic red flags.
   - List the top 3-5 most damaging or embarrassing flaws.

2. STRATEGIC RECONSTRUCTION:
   - Rewrite weak bullet points from the resume into powerful, metric-driven language using the PAR format (Problem-Action-Result).
   - PROJECT INJECTION: Evaluate the candidate's GitHub repositories and recommend the 2-4 best repositories to feature as standalone projects for this specific {target_role} role. For each recommended repository, provide:
     * exact repository full_name
     * match_rationale explaining why recruiters for {target_role} will care
     * key_technologies
     * 2-3 metric-driven PAR bullet points ready to copy directly into the resume.
   - Identify top missing high-frequency keywords that must be integrated.

3. COMPETITIVE REALITY CHECK:
   - Provide an honest, unvarnished assessment of what level of position the applicant can realistically target right now (e.g. "Mid-Level AI Engineer", "Junior-to-Mid Full Stack Developer", "Senior Systems Architect").
   - List 3-5 critical differentiators they need to emphasize to beat competition.
   - List 2-3 specific technical skills or project areas they must immediately build to increase market value.
   - Write a sharp 2-3 sentence market benchmark summary.
</Instructions>

<Constraints>
- NO sugarcoating or diplomatic language - be ruthlessly honest.
- NO generic advice - everything must be specifically tailored to the candidate's resume and target role.
- DO NOT invent fictional experience; reframe and elevate real technical capabilities with quantified PAR bullets and real GitHub project references.
- Return ONLY valid, parseable JSON matching the schema below.
</Constraints>

<JSON_Output_Schema>
{{
  "match_score": 78,
  "overall_bs_factor": 6.5,
  "section_bs_factors": [
    {{"section_name": "Summary / Headline", "bs_factor": 7.0, "critique": "Vague buzzwords without demonstrable engineering scale."}},
    {{"section_name": "Professional Experience", "bs_factor": 6.0, "critique": "Lists duties instead of measurable outcomes and business impact."}},
    {{"section_name": "Technical Skills", "bs_factor": 4.5, "critique": "Unorganized skill dump lacking proficiency categorization."}}
  ],
  "critical_flaws": [
    "Used passive voice like 'responsible for' instead of ownership verbs.",
    "Zero quantified performance metrics (latency, throughput, cost reduction, scale)."
  ],
  "ats_red_flags": [
    "Missing critical JD keywords: Docker, Distributed Systems.",
    "Non-standard section headers that confuse ATS parsers."
  ],
  "recommended_projects": [
    {{
      "repo_full_name": "owner/repo-name",
      "name": "repo-name",
      "match_rationale": "Directly proves ability to build multi-agent LLM systems with real-time vector retrieval.",
      "key_technologies": ["Python", "FastAPI", "PostgreSQL", "LangChain"],
      "suggested_bullets": [
        "Architected an async multi-agent orchestration pipeline using FastAPI and PostgreSQL, processing 1,000+ legal queries with sub-200ms latency.",
        "Implemented vector embedding indexing reducing search query latency by 45%."
      ],
      "stars": 5
    }}
  ],
  "bullet_rewrites": [
    {{
      "original": "Worked on backend APIs for the web platform.",
      "suggested": "Architected 12+ RESTful microservices in FastAPI with PostgreSQL, increasing throughput by 35% and supporting 50k daily active users.",
      "evidence_refs": ["owner/repo-name"]
    }}
  ],
  "competitive_analysis": {{
    "realistic_level": "Mid-Level AI / Backend Engineer",
    "critical_differentiators": [
      "Demonstrated multi-agent LLM architecture implementation in production code.",
      "Strong full-stack systems mindset bridging API design to vector search."
    ],
    "development_priorities": [
      "Add automated CI/CD load testing metrics to project READMEs.",
      "Implement distributed caching (Redis) for high-load endpoints."
    ],
    "market_benchmark_summary": "Strong engineering foundation with active GitHub codebases, but resume currently reads like a junior syllabus. Elevating metric rigor and spotlighting production repositories will immediately put candidate in the top 15% of applicants."
  }},
  "gap_keywords": ["FastAPI", "System Architecture", "PostgreSQL", "CI/CD", "Vector Search"]
}}
</JSON_Output_Schema>
"""

    try:
        response_text = await gemini_service.generate_async(prompt)
        data = gemini_service.parse_json_response(response_text)
    except Exception as e:
        logger.error(f"Resume Destroyer generation or JSON parsing failed: {e}")
        # Fallback structured response
        data = {
            "match_score": 70,
            "overall_bs_factor": 5.0,
            "section_bs_factors": [
                {"section_name": "Summary", "bs_factor": 5.0, "critique": "Needs stronger metric alignment."}
            ],
            "critical_flaws": ["Missing quantified impact metrics."],
            "ats_red_flags": ["Missing target role keywords."],
            "recommended_projects": [],
            "bullet_rewrites": [],
            "competitive_analysis": {
                "realistic_level": target_role,
                "critical_differentiators": ["Hands-on repository track record."],
                "development_priorities": ["Quantify all bullet points with PAR structure."],
                "market_benchmark_summary": "Solid foundation; needs metric-driven PAR reframing."
            },
            "gap_keywords": jd_keywords[:8]
        }

    # Normalize models
    section_bs = [
        SectionBsFactor(
            section_name=s.get("section_name", "Section"),
            bs_factor=float(s.get("bs_factor", 5.0)),
            critique=s.get("critique", "")
        )
        for s in data.get("section_bs_factors", [])
    ]

    rec_projects = []
    for p in data.get("recommended_projects", []):
        r_name = p.get("name") or p.get("repo_full_name", "").split("/")[-1]
        full_name = p.get("repo_full_name") or r_name
        rec_projects.append(
            RecommendedProject(
                repo_full_name=full_name,
                name=r_name,
                html_url=f"https://github.com/{full_name}",
                match_rationale=p.get("match_rationale", "Strong project alignment with target role."),
                key_technologies=p.get("key_technologies", []),
                suggested_bullets=p.get("suggested_bullets", []),
                stars=int(p.get("stars", 0))
            )
        )

    bullet_rewrites = [
        BulletRewrite(
            original=b.get("original"),
            suggested=b.get("suggested", ""),
            evidence_refs=b.get("evidence_refs", [])
        )
        for b in data.get("bullet_rewrites", [])
    ]

    gap_keywords = [
        KeywordGap(keyword=kw, frequency=None)
        for kw in data.get("gap_keywords", [])
        if isinstance(kw, str)
    ]

    comp_data = data.get("competitive_analysis", {})
    competitive = CompetitiveAnalysis(
        realistic_level=comp_data.get("realistic_level", f"Mid-Level {target_role}"),
        critical_differentiators=comp_data.get("critical_differentiators", []),
        development_priorities=comp_data.get("development_priorities", []),
        market_benchmark_summary=comp_data.get("market_benchmark_summary", "")
    )

    evidence_refs = [p.repo_full_name for p in rec_projects]

    return ResumeDestroyerResponse(
        match_score=int(data.get("match_score", 75)),
        overall_bs_factor=float(data.get("overall_bs_factor", 5.5)),
        section_bs_factors=section_bs,
        critical_flaws=data.get("critical_flaws", []),
        ats_red_flags=data.get("ats_red_flags", []),
        recommended_projects=rec_projects,
        bullet_rewrites=bullet_rewrites,
        competitive_analysis=competitive,
        gap_keywords=gap_keywords,
        evidence_refs=evidence_refs
    )
