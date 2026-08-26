import pytest
from unittest.mock import AsyncMock, patch
from schemas.analysis import ResumeDestroyerResponse
from agents.resume_agent import analyze as analyze_resume_agent

@pytest.mark.asyncio
async def test_resume_destroyer_agent_parsing():
    """
    Verify that analyze_resume_agent properly calls Gemini and parses the structured
    Resume Destroyer response including BS Factor and recommended projects.
    """
    mock_gemini_json = """{
      "match_score": 88,
      "overall_bs_factor": 4.2,
      "section_bs_factors": [
        {"section_name": "Summary", "bs_factor": 4.0, "critique": "Solid technical orientation."},
        {"section_name": "Experience", "bs_factor": 4.5, "critique": "Needs more quantified latency metrics."}
      ],
      "critical_flaws": [
        "Vague accomplishment metrics in 2nd bullet."
      ],
      "ats_red_flags": [
        "Missing target role keyword: Vector DB"
      ],
      "recommended_projects": [
        {
          "repo_full_name": "rdnk2004/NyayaSetu-Multi-Agent",
          "name": "NyayaSetu-Multi-Agent",
          "match_rationale": "Directly proves multi-agent LLM systems engineering.",
          "key_technologies": ["Python", "FastAPI", "LangChain"],
          "suggested_bullets": [
            "Architected multi-agent legal reasoning system reducing research latency by 45%."
          ],
          "stars": 3
        }
      ],
      "bullet_rewrites": [
        {
          "original": "Worked on AI systems.",
          "suggested": "Architected async multi-agent workflows handling 5k queries/day.",
          "evidence_refs": ["rdnk2004/NyayaSetu-Multi-Agent"]
        }
      ],
      "competitive_analysis": {
        "realistic_level": "Senior AI Systems Engineer",
        "critical_differentiators": ["Production multi-agent implementation."],
        "development_priorities": ["Add distributed caching with Redis."],
        "market_benchmark_summary": "Top 10% candidate once PAR metrics are highlighted."
      },
      "gap_keywords": ["Vector DB", "Redis", "Distributed Systems"]
    }"""

    with patch("services.gemini_service.gemini_service.generate_async", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_gemini_json

        res = await analyze_resume_agent(
            resume_text="AI Engineer with experience building systems.",
            target_role="AI Engineer",
            jd_keywords=["Python", "FastAPI", "Vector DB"],
            github_repos=[{"name": "NyayaSetu-Multi-Agent", "full_name": "rdnk2004/NyayaSetu-Multi-Agent", "stars": 3}]
        )

        assert isinstance(res, ResumeDestroyerResponse)
        assert res.match_score == 88
        assert res.overall_bs_factor == 4.2
        assert len(res.section_bs_factors) == 2
        assert len(res.recommended_projects) == 1
        assert res.recommended_projects[0].name == "NyayaSetu-Multi-Agent"
        assert res.recommended_projects[0].repo_full_name == "rdnk2004/NyayaSetu-Multi-Agent"
        assert len(res.bullet_rewrites) == 1
        assert res.competitive_analysis.realistic_level == "Senior AI Systems Engineer"
        assert "Vector DB" in [k.keyword for k in res.gap_keywords]
