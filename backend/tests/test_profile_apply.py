import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from main import app
from database import get_db
from models.profile import UserProfile, ProfileSection

client = TestClient(app)

def test_apply_suggestion_headline():
    mock_db = AsyncMock()
    
    # Profile exists
    fake_profile = UserProfile(id=uuid4(), raw_data={}, headline="Old Headline")
    fake_section = ProfileSection(
        id=uuid4(),
        profile_id=fake_profile.id,
        section_type="headline",
        title="Headline",
        content={"headline": "Old Headline"},
        created_at=datetime.now(timezone.utc),
    )
    
    # Mock queries
    mock_res_profile = MagicMock()
    mock_res_profile.scalars.return_value.first.return_value = fake_profile

    mock_res_sec = MagicMock()
    mock_res_sec.scalars.return_value.first.return_value = fake_section

    mock_db.execute.side_effect = [mock_res_profile, mock_res_sec]

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/api/profile/apply-suggestion",
            json={
                "section_type": "headline",
                "suggested_content": "Senior Staff AI Systems Engineer | FastAPI & LLM Architecture",
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["applied"] is True
        assert data["section_type"] == "headline"
        assert fake_profile.headline == "Senior Staff AI Systems Engineer | FastAPI & LLM Architecture"
    finally:
        app.dependency_overrides.clear()

def test_get_profile_scores():
    mock_db = AsyncMock()
    fake_profile = UserProfile(id=uuid4(), raw_data={})
    fake_sec = ProfileSection(
        id=uuid4(),
        profile_id=fake_profile.id,
        section_type="about",
        title="About",
        content={"summary": "Experienced engineer"},
        ai_score=85,
        created_at=datetime.now(timezone.utc),
    )
    fake_profile.sections = [fake_sec]

    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = fake_profile
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.get("/api/profile/scores")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["section_type"] == "about"
        assert data[0]["overall_score"] == 85
        assert "impact_score" in data[0]
        assert "keyword_score" in data[0]
    finally:
        app.dependency_overrides.clear()
