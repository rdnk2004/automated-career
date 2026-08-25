import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from main import app
from agents.github_agent import _heuristic_evaluate_project, evaluate_portfolio_project
from services.github_service import github_service

client = TestClient(app)

def test_heuristic_project_evaluation():
    repo_data = {
        "name": "career-compass",
        "full_name": "rdnk2004/career-compass",
        "description": "AI Career OS",
        "language": "Python",
        "stars": 12,
        "has_readme": True,
    }
    file_tree = "main.py\nDockerfile\nrequirements.txt\ntests/test_app.py\n.github/workflows/ci.yml"
    result = _heuristic_evaluate_project(repo_data, file_tree)

    assert "resume_score" in result
    assert result["resume_score"] >= 85
    assert result["portfolio_tier"] == "Tier 1: Flagship Showcase"
    assert len(result["resume_bullets"]) == 3
    assert "Docker" in result["key_technologies"]
    assert result["production_readiness"]["has_docker"] is True
    assert result["production_readiness"]["has_tests"] is True

def test_public_repo_fallback_headers():
    anon_headers = github_service.anon_headers
    assert "User-Agent" in anon_headers
    assert "Authorization" not in anon_headers

@pytest.mark.asyncio
async def test_evaluate_portfolio_agent_mock():
    with patch("services.gemini_service.gemini_service.generate_async", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = """
        {
          "resume_score": 92,
          "portfolio_tier": "Tier 1: Flagship Showcase",
          "key_technologies": ["Python", "FastAPI", "React"],
          "architecture_summary": "Full-stack career engine with async pipelines.",
          "resume_bullets": ["Built async backend.", "Optimized queries.", "Designed UI."],
          "recommendation_reason": "High architectural impact.",
          "production_readiness": {"has_tests": true, "has_docker": true}
        }
        """
        res = await evaluate_portfolio_project(
            repo_data={"name": "test-repo", "language": "Python"},
            file_tree="main.py\nrequirements.txt",
            sample_code="import fastapi"
        )
        assert res["resume_score"] == 92
        assert res["portfolio_tier"] == "Tier 1: Flagship Showcase"
        assert len(res["resume_bullets"]) == 3
