import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from main import app
from database import get_db

client = TestClient(app)

def test_get_settings():
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.get("/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "target_roles" in data
        assert "sync_schedule" in data
        assert "n8n_status" in data
        assert len(data["target_roles"]) > 0
    finally:
        app.dependency_overrides.clear()

def test_reset_system_data():
    mock_db = AsyncMock()
    mock_del_res = MagicMock()
    mock_del_res.rowcount = 5
    mock_db.execute.return_value = mock_del_res

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post("/api/settings/reset", json={"target": "scores"})
        assert response.status_code == 200
        data = response.json()
        assert data["reset_target"] == "scores"
        assert "career_score_snapshots" in data["cleared_records"]
    finally:
        app.dependency_overrides.clear()

def test_get_n8n_status():
    response = client.get("/api/settings/n8n-status")
    assert response.status_code == 200
    data = response.json()
    assert "connected" in data
    assert "webhook_url" in data
    assert len(data["active_workflows"]) == 3
