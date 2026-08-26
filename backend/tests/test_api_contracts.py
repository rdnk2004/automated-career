import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_openapi_schema_generation():
    """
    Verify that FastAPI generates a valid OpenAPI 3.x schema without schema errors.
    """
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert schema["openapi"].startswith("3.")
    assert schema["info"]["title"] == "Career OS API"
    assert "paths" in schema

    # Verify all essential endpoints are present in the OpenAPI schema
    paths = schema["paths"]
    essential_routes = [
        "/health",
        "/api/tasks/{task_id}",
        "/api/analysis/history",
        "/api/analysis/metrics",
        "/api/analysis/linkedin",
        "/api/analysis/resume",
        "/api/analysis/resume/upload",
        "/api/analysis/resume/export-pdf",
        "/api/analysis/synthesis",
        "/api/jobs/search",
        "/api/jobs/keywords",
        "/api/jobs/trends",
        "/api/profile/",
        "/api/profile/apply-suggestion",
        "/api/profile/scores",
        "/api/profile/import",
        "/api/github/repos",
        "/api/github/sync",
        "/api/github/scan",
        "/api/github/scan/batch",
        "/api/github/tasks/{task_id}",
        "/api/github/remediate",
        "/api/settings/",
        "/api/settings/n8n-status",
        "/api/settings/reset",
        "/api/resumes",
        "/api/resumes/{resume_id}",
    ]

    for route in essential_routes:
        assert route in paths, f"Route {route} missing from FastAPI OpenAPI schema!"

def test_cors_headers_present():
    """
    Verify that CORS headers are returned properly for the Vite frontend origin.
    """
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
