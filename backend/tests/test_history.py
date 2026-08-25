import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from main import app
from database import get_db
from schemas.analysis import CareerScoreHistoryResponse, CareerMetricsResponse

client = TestClient(app)

def test_get_metrics_empty_db():
    # Mock AsyncSession to return empty list
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.get("/api/analysis/metrics?target_role=AI+Engineer")
        assert response.status_code == 200
        data = response.json()
        assert "current_overall" in data
        assert "delta_7d" in data
        assert data["current_overall"] == 0
        assert data["market_benchmark_gap"] == 85
    finally:
        app.dependency_overrides.clear()

def test_get_history_empty_db():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.get("/api/analysis/history?days=30")
        assert response.status_code == 200
        data = response.json()
        assert data["timeframe_days"] == 30
        assert data["total_snapshots"] == 0
        assert data["snapshots"] == []
    finally:
        app.dependency_overrides.clear()
