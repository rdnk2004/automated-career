import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from main import app
from database import get_db

client = TestClient(app)

def test_get_trends_endpoint():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.get("/api/jobs/trends?title=AI+Engineer&days=30")
        assert response.status_code == 200
        data = response.json()
        assert data["target_role"] == "AI Engineer"
        assert data["days"] == 30
        assert "rising" in data
        assert "stable" in data
        assert "falling" in data
        assert len(data["rising"]) > 0
    finally:
        app.dependency_overrides.clear()

def test_get_keywords_endpoint():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.get("/api/jobs/keywords?title=AI+Engineer&is_technical=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    finally:
        app.dependency_overrides.clear()
