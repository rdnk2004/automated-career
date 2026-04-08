import pytest
from fastapi.testclient import TestClient
from main import app

# Since we don't have a mocked DB setup for this simple test, we can check basic 
# things or we can just verify the health check endpoint as a baseline.
client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
