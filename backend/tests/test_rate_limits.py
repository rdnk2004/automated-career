import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_rate_limit_health_check():
    # Keep hitting the health check endpoint to trigger the default limit (100/min)
    # Actually, default limits might be tied to IP. The TestClient uses "testclient" as IP.
    # We will send 101 requests. The 101st should fail.
    
    # We'll just reset limiter temporarily to make it faster to test
    app.state.limiter.reset()

    # To avoid looping 101 times and slowing down tests, we could test a lower limit
    # but since it's 100/min, 101 requests is very fast for a local TestClient.
    
    success_count = 0
    rate_limited = False
    
    for _ in range(105):
        response = client.get("/health")
        if response.status_code == 200:
            success_count += 1
        elif response.status_code == 429:
            rate_limited = True
            break
            
    assert success_count <= 100
    assert rate_limited == True
