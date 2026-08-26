import json
import logging
from typing import List, Dict, Any, Optional
from services.gemini_service import gemini_service
from schemas.analysis import (
    SuggestionSetResponse,
    SectionScore,
    KeywordGap,
    BulletRewrite,
    HeadlineAlternative,
    VisualPresenceGuidance,
    ExperienceRewrite,
    SkillsOptimization,
    LinkedInProjectRecommendation,
    GrowthRoadmapPhase,
    ContentStrategyIdea,
)

logger = logging.getLogger("career_os")

async def analyze(
    profile_data: dict,
    target_role: str,
    jd_keywords: list[str],
    github_repos: Optional[list[dict]] = None
) -> SuggestionSetResponse:
    """
    Comprehensive, categorized LinkedIn profile enhancement engine powered by Gemini 3.6 Flash.
    """
    github_repos = github_repos or []
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
            entry += f" | Arch: {arch[:100]}..."
        repos_formatted.append(entry)

    repos_context_str = "\n".join(repos_formatted) if repos_formatted else "No public repositories available."

    prompt = f"""
<Role>
You are an elite LinkedIn Executive Brand Strategist and Technical Career Architect who has optimized profiles for thousands of top-earning AI Engineers, Senior Tech Leaders, and Staff Software Engineers. You specialize in turning standard technical profiles into high-inbound recruiter magnets and industry authority hubs.
</Role>

<Context>
LinkedIn algorithms heavily weight recruiter keyword indexing, featured proof assets, headline clarity, and narrative authority. Generic advice fails; candidates need concrete, data-backed rewrites, specific skill reordering, project integration from real GitHub repositories, and a phased growth roadmap.
</Context>

<Input_Data>
TARGET INDUSTRY ROLE: {target_role}

LINKEDIN PROFILE DATA:
{json.dumps(profile_data, indent=2)}

TOP 30 HIGH-FREQUENCY JOB DESCRIPTION KEYWORDS:
{', '.join(jd_keywords[:30]) if jd_keywords else 'Python, FastAPI, System Architecture, PostgreSQL, Docker, AWS, LangChain, CI/CD'}

CANDIDATE'S ACTUAL GITHUB REPOSITORIES (Public & Collaborated):
{repos_context_str}
</Input_Data>

<Instructions>
Provide a comprehensive, categorized LinkedIn optimization analysis across four core pillars:

1. PROFILE COMPONENTS REVIEW:
   - HEADLINE: Provide 3 to 5 distinct, high-converting headline alternatives (e.g., Recruiter Search-Optimized, Technical Authority / Systems Builder, Metric & Product Impact, etc.).
   - VISUAL PRESENCE: Provide strategic assessment and guidance for Profile Photo and Banner/Cover image to convey senior engineering credibility.
   - ABOUT SECTION: Write a full, compelling, first-person narrative About section (hook, engineering philosophy, core competencies, highlighted technical scale, and direct call-to-action).
   - EXPERIENCE SECTION: Rewrite top 2 to 3 roles with high-impact, metric-driven accomplishment bullets.
   - SKILLS: Give specific recommendations on which 5-8 high-demand skills to ADD, outdated/vague skills to REMOVE, and which Top 3 skills to PIN to the top.
   - FEATURED & RECOMMENDATIONS: Concrete instructions on what assets to pin in the Featured section and who to request recommendations from.

2. GITHUB PROJECT INJECTIONS:
   - Evaluate the candidate's GitHub repositories. Identify 2 to 4 high-impact repositories that should be prominently added to the candidate's LinkedIn (e.g. Featured Section, Experience sub-projects, or Projects section).
   - For each project, specify:
     * exact repository name & full_name
     * suggested LinkedIn placement (Featured Link, Experience Project, or Independent Project)
     * why to add it (recruiter value proposition)
     * optimized title for LinkedIn
     * 2-3 sentence description snippet highlighting technologies and architecture
     * skills tags to associate.

3. STRATEGIC INSIGHTS & 30/60/90 ROADMAP:
   - Provide 20 to 30 relevant high-impact industry keywords categorized by relevance.
   - Competitive analysis vs competing candidates in the {target_role} market.
   - Top 3 Quick Wins (actionable in 24-48 hours) vs Long-Term Authority Improvements.
   - 30/60/90 Day LinkedIn Growth & Inbound Strategy (30 Days: SEO & Profile Polish, 60 Days: Project Proof & Community Engagement, 90 Days: Inbound Thought Leadership).

4. DATA-DRIVEN INTELLIGENCE & CONTENT ENGINE:
   - Industry benchmarks and hiring trends for {target_role}.
   - Profile completion gaps currently hurting recruiter discovery.
   - 3 to 4 specific technical content ideas / post topics with hooks, angles, and target audience.

Return ONLY a valid JSON object matching the JSON schema below.
</Instructions>

<JSON_Output_Schema>
{{
  "profile_score": 82,
  "headline_alternatives": [
    {{
      "headline": "AI Systems Engineer | Building Scalable Multi-Agent Frameworks & Distributed APIs | Python, FastAPI, PyTorch",
      "target_focus": "Recruiter Search & Keyword Maximizer",
      "char_count": 118
    }},
    {{
      "headline": "Full-Stack AI Engineer @ Autonomous Solutions | Architecting Real-Time LLM Pipelines & Vector Search",
      "target_focus": "Role & Company Proof Focus",
      "char_count": 105
    }},
    {{
      "headline": "Engineering Scalable AI Infrastructure | Creator of Open Source Multi-Agent Copilots | Python • PostgreSQL • Docker",
      "target_focus": "Open Source & Systems Builder",
      "char_count": 120
    }}
  ],
  "visual_presence": {{
    "photo_recommendation": "High-contrast professional portrait with clear neutral or soft dark background; direct eye contact to project confident senior engineering presence.",
    "banner_strategy": "Custom banner featuring modern code architecture diagram, personal tech stack badges (Python, FastAPI, Docker, PyTorch), and a bold 1-line mission statement."
  }},
  "about_rewrite": "I engineer high-throughput AI systems and full-stack software that turn complex machine learning architectures into reliable production services.\\n\\nOver the past few years, I have architected distributed backend pipelines, multi-agent LLM reasoning workflows, and responsive web platforms handling tens of thousands of daily interactions. My focus bridges core algorithmic depth with robust cloud infrastructure.\\n\\nCore Technical Strengths:\\n• AI & Agents: Multi-Agent Orchestration (LangChain, Gemini API), PyTorch, Vector Search\\n• Backend & Cloud: Python, FastAPI, PostgreSQL, Docker, Redis, RESTful Microservices\\n• Frontend: TypeScript, React, Svelte, Tailwind CSS\\n\\nLet's connect or discuss high-scale engineering opportunities: candidate@example.com",
  "experience_rewrites": [
    {{
      "role_title": "Lead AI Systems Engineer",
      "company": "Autonomous Solutions",
      "original_snippet": "Developed AI systems and backend services.",
      "suggested_bullets": [
        "Architected async multi-agent orchestration pipelines using FastAPI and LangChain, accelerating legal research document workflows by 45%.",
        "Engineered high-throughput PostgreSQL vector search services processing 50k+ semantic embeddings daily with sub-200ms latency.",
        "Containerized core microservices with Docker and automated CI/CD deployment pipelines."
      ],
      "impact_metrics": ["45% latency reduction", "50k daily embeddings", "sub-200ms response"]
    }}
  ],
  "skills_optimization": {{
    "skills_to_add": ["Multi-Agent Systems", "FastAPI", "Vector Embeddings", "System Architecture", "PostgreSQL", "Docker"],
    "skills_to_remove": ["Microsoft Office", "General Coding", "Teamwork"],
    "top_pinned_skills": ["Artificial Intelligence (AI)", "Python (Programming Language)", "FastAPI"]
  }},
  "recommended_projects_to_add": [
    {{
      "repo_full_name": "owner/repo-name",
      "name": "NyayaSetu Multi-Agent Legal Copilot",
      "linkedin_placement": "Featured Section (Media Link & Project)",
      "why_add": "Provides undeniable visual proof of your ability to build multi-agent AI applications with real-world document intelligence.",
      "title_for_linkedin": "NyayaSetu — Multi-Agent AI Legal Intelligence Framework",
      "description_snippet": "Architected an autonomous multi-agent reasoning framework in Python and FastAPI that indexes and cross-examines legal statutes with semantic vector search.",
      "skills_tags": ["Artificial Intelligence", "FastAPI", "LangChain", "Python"]
    }}
  ],
  "featured_section_advice": "Pin your top GitHub repository demo (NyayaSetu), your ATS Resume PDF, and a technical article/post demonstrating architectural decisions.",
  "recommendations_advice": "Request 2 recommendations: one from a tech lead on your system design rigor, and one from a collaborative engineer on code quality and speed.",
  "industry_keywords": [
    "Large Language Models (LLM)", "Multi-Agent Orchestration", "FastAPI", "Python",
    "Vector Databases", "System Design", "PostgreSQL", "Docker", "REST APIs",
    "PyTorch", "LangChain", "Cloud Architecture", "CI/CD Pipelines", "Semantic Search",
    "Microservices", "Data Pipelines", "Performance Optimization", "Full-Stack Development",
    "TypeScript", "Redis"
  ],
  "competitive_analysis": {{
    "candidate_percentile": "Top 18%",
    "competitive_edge": "Strong hands-on repository footprint and active full-stack architecture implementation.",
    "vulnerabilities": "Profile currently lacks high-authority metrics in job descriptions and featured visual proof assets."
  }},
  "quick_wins": [
    "Update headline immediately to the Recruiter Keyword Maximizer alternative.",
    "Pin the Top 3 verified skills: Artificial Intelligence, Python, FastAPI.",
    "Add GitHub repository links into the Featured section."
  ],
  "long_term_improvements": [
    "Publish bi-weekly technical breakdown posts analyzing AI architecture trade-offs.",
    "Secure 2 senior peer recommendations mentioning technical ownership.",
    "Build a custom visual banner highlighting your engineering stack."
  ],
  "growth_roadmap": [
    {{
      "phase": "30 Days: Foundation & Keyword SEO",
      "key_actions": [
        "Deploy optimized headline and rewritten About narrative with 25+ target keywords.",
        "Restructure Experience bullets using metric-driven PAR statements.",
        "Reorder Skills section and pin top 3 technical proficiencies."
      ]
    }},
    {{
      "phase": "60 Days: Project Proof & Social Authority",
      "key_actions": [
        "Feature top 2 GitHub repositories with screenshots in the Featured section.",
        "Engage daily with 5 senior engineering leaders' posts in your target domain.",
        "Publish 2 in-depth case study posts breaking down multi-agent pipeline designs."
      ]
    }},
    {{
      "phase": "90 Days: Inbound Dominance & Network Expansion",
      "key_actions": [
        "Attain 1,000+ targeted 1st-degree connections with tech recruiters and engineering managers.",
        "Secure 2+ detailed recommendations from colleagues highlighting delivery speed.",
        "Achieve top 5% SSI (Social Selling Index) in software engineering category."
      ]
    }}
  ],
  "content_ideas": [
    {{
      "topic": "Why Multi-Agent LLM Orchestration Outperforms Single-Prompt Pipelines",
      "post_angle": "Technical architecture breakdown with diagrams comparing latency vs reasoning depth.",
      "target_audience": "AI Engineers, Tech Leads, Engineering Directors",
      "suggested_hook": "Most teams trying to build production AI apps get stuck on single-prompt fragility. Here is how we structured a 3-agent async pipeline instead:"
    }},
    {{
      "topic": "5 PostgreSQL Performance Mistakes I Fixed in High-Throughput APIs",
      "post_angle": "Practical backend engineering lessons with code snippets and query timing benchmarks.",
      "target_audience": "Backend Developers, System Architects",
      "suggested_hook": "When your API hits 50,000 requests/minute, bad database queries will bring down your servers. Here are 5 indexing fixes that saved our latency:"
    }}
  ],
  "industry_benchmarks": "In the current AI Engineering market, profiles featuring verifiable open-source codebases, clear quantified metrics in bullet points, and specific agentic framework keywords receive 4.2x more recruiter outreach than standard resumes.",
  "profile_completion_gaps": [
    "Missing custom banner image (defaults to generic grey).",
    "Featured section is currently unutilized or lacking external project links.",
    "Skills section contains unverified general terms instead of indexed technical frameworks."
  ],
  "section_scores": [
    {{"section": "Headline", "score": 75, "reasoning": "Clear role title but missing secondary keyword density."}},
    {{"section": "About", "score": 80, "reasoning": "Strong summary that benefits from structured technical pillars."}},
    {{"section": "Experience", "score": 72, "reasoning": "Needs stronger quantified impact and metrics."}},
    {{"section": "Skills", "score": 85, "reasoning": "Good foundation; needs reorganization and pruning."}}
  ]
}}
</JSON_Output_Schema>
"""

    try:
        response_text = await gemini_service.generate_async(prompt)
        data = gemini_service.parse_json_response(response_text)
    except Exception as e:
        logger.error(f"LinkedIn Agent generation failed: {e}")
        data = {}

    # Extract Headlines
    headline_alternatives = [
        HeadlineAlternative(
            headline=h.get("headline", ""),
            target_focus=h.get("target_focus", "Optimized Focus"),
            char_count=len(h.get("headline", ""))
        )
        for h in data.get("headline_alternatives", [])
    ]

    # Visual Presence
    vis_data = data.get("visual_presence", {})
    visual_presence = VisualPresenceGuidance(
        photo_recommendation=vis_data.get("photo_recommendation", "High-contrast professional portrait with clear background."),
        banner_strategy=vis_data.get("banner_strategy", "Custom banner featuring tech stack badges and engineering mission statement.")
    )

    # Experience Rewrites
    experience_rewrites = [
        ExperienceRewrite(
            role_title=x.get("role_title", "Role"),
            company=x.get("company"),
            original_snippet=x.get("original_snippet"),
            suggested_bullets=x.get("suggested_bullets", []),
            impact_metrics=x.get("impact_metrics", [])
        )
        for x in data.get("experience_rewrites", [])
    ]

    # Skills Optimization
    skills_data = data.get("skills_optimization", {})
    skills_optimization = SkillsOptimization(
        skills_to_add=skills_data.get("skills_to_add", []),
        skills_to_remove=skills_data.get("skills_to_remove", []),
        top_pinned_skills=skills_data.get("top_pinned_skills", [])
    )

    # Recommended Projects
    recommended_projects = [
        LinkedInProjectRecommendation(
            repo_full_name=p.get("repo_full_name", ""),
            name=p.get("name", ""),
            linkedin_placement=p.get("linkedin_placement", "Featured Section"),
            why_add=p.get("why_add", "Strong proof of technical execution."),
            title_for_linkedin=p.get("title_for_linkedin", p.get("name", "")),
            description_snippet=p.get("description_snippet", ""),
            skills_tags=p.get("skills_tags", [])
        )
        for p in data.get("recommended_projects_to_add", [])
    ]

    # Growth Roadmap
    growth_roadmap = [
        GrowthRoadmapPhase(
            phase=g.get("phase", ""),
            key_actions=g.get("key_actions", [])
        )
        for g in data.get("growth_roadmap", [])
    ]

    # Content Ideas
    content_ideas = [
        ContentStrategyIdea(
            topic=c.get("topic", ""),
            post_angle=c.get("post_angle", ""),
            target_audience=c.get("target_audience", ""),
            suggested_hook=c.get("suggested_hook", "")
        )
        for c in data.get("content_ideas", [])
    ]

    # Backward-compatible Section Scores & Bullet Rewrites
    section_scores = [
        SectionScore(
            section_type=s.get("section", ""),
            score=int(s.get("score", 75)),
            reasoning=s.get("reasoning", "")
        )
        for s in data.get("section_scores", [])
    ]

    keyword_gaps = [
        KeywordGap(keyword=kw, frequency=None)
        for kw in data.get("industry_keywords", [])[:15]
    ]

    rewrites = []
    if data.get("about_rewrite"):
        rewrites.append(BulletRewrite(original=None, suggested=data["about_rewrite"], evidence_refs=["About Section"]))
    for exp in experience_rewrites:
        for b in exp.suggested_bullets:
            rewrites.append(BulletRewrite(original=exp.original_snippet, suggested=b, evidence_refs=[exp.role_title]))

    return SuggestionSetResponse(
        profile_score=int(data.get("profile_score", 80)),
        headline_alternatives=headline_alternatives,
        visual_presence=visual_presence,
        about_rewrite=data.get("about_rewrite"),
        experience_rewrites=experience_rewrites,
        skills_optimization=skills_optimization,
        recommended_projects_to_add=recommended_projects,
        featured_section_advice=data.get("featured_section_advice"),
        recommendations_advice=data.get("recommendations_advice"),
        industry_keywords=data.get("industry_keywords", []),
        competitive_analysis=data.get("competitive_analysis"),
        quick_wins=data.get("quick_wins", []),
        long_term_improvements=data.get("long_term_improvements", []),
        growth_roadmap=growth_roadmap,
        content_ideas=content_ideas,
        industry_benchmarks=data.get("industry_benchmarks"),
        profile_completion_gaps=data.get("profile_completion_gaps", []),
        section_scores=section_scores,
        keyword_gaps=keyword_gaps,
        rewrites=rewrites
    )
