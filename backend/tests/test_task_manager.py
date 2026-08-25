import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from main import app
from services.task_manager import task_manager

client = TestClient(app)

def test_task_manager_lifecycle():
    task_id = task_manager.create_task("test_task", total_steps=5)
    task = task_manager.get_task(task_id)
    assert task is not None
    assert task["status"] == "queued"
    assert task["progress"] == 0.0

    task_manager.update_progress(task_id, completed_steps=2, current_item="repo-1")
    updated = task_manager.get_task(task_id)
    assert updated["status"] == "running"
    assert updated["progress"] == 40.0
    assert updated["current_item"] == "repo-1"

    task_manager.complete_task(task_id, result={"done": True})
    completed = task_manager.get_task(task_id)
    assert completed["status"] == "completed"
    assert completed["progress"] == 100.0

def test_get_task_status_endpoint():
    task_id = task_manager.create_task("api_test", total_steps=10)
    task_manager.update_progress(task_id, completed_steps=5, message="Halfway there")

    response = client.get(f"/api/tasks/{task_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["task_id"] == task_id
    assert data["status"] == "running"
    assert data["progress"] == 50.0

def test_remediate_repo_endpoint():
    with patch("services.github_service.github_service.remediate_repo", new_callable=AsyncMock) as mock_remediate:
        mock_remediate.return_value = {
            "remediated": True,
            "action_taken": "add_gitignore",
            "commit_sha": "abc123456",
            "message": "Pushed .gitignore"
        }
        response = client.post(
            "/api/github/remediate",
            json={"repo_full_name": "rdnk2004/test-repo", "action": "add_gitignore"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["remediated"] is True
        assert data["commit_sha"] == "abc123456"
