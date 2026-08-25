import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

class TaskManager:
    """
    Thread-safe, asynchronous in-memory background task registry.
    Tracks live execution status, item progress, percentages, and errors.
    """
    def __init__(self):
        self._tasks: Dict[str, Dict[str, Any]] = {}

    def create_task(self, task_type: str, total_steps: int = 1, metadata: Optional[Dict[str, Any]] = None) -> str:
        task_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        self._tasks[task_id] = {
            "task_id": task_id,
            "task_type": task_type,
            "status": "queued",
            "progress": 0.0,
            "completed_steps": 0,
            "total_steps": max(1, total_steps),
            "current_item": None,
            "message": f"Task {task_type} initialized and queued.",
            "error": None,
            "created_at": now,
            "updated_at": now,
            "metadata": metadata or {},
            "result": None,
        }
        return task_id

    def update_progress(
        self,
        task_id: str,
        completed_steps: int,
        current_item: Optional[str] = None,
        message: Optional[str] = None,
    ) -> None:
        if task_id not in self._tasks:
            return
        task = self._tasks[task_id]
        task["status"] = "running"
        task["completed_steps"] = completed_steps
        total = max(1, task["total_steps"])
        task["progress"] = min(100.0, round((completed_steps / total) * 100, 1))
        if current_item is not None:
            task["current_item"] = current_item
        if message is not None:
            task["message"] = message
        task["updated_at"] = datetime.now(timezone.utc)

    def complete_task(self, task_id: str, result: Optional[Dict[str, Any]] = None) -> None:
        if task_id not in self._tasks:
            return
        task = self._tasks[task_id]
        task["status"] = "completed"
        task["progress"] = 100.0
        task["completed_steps"] = task["total_steps"]
        task["message"] = "Task completed successfully."
        task["result"] = result
        task["updated_at"] = datetime.now(timezone.utc)

    def fail_task(self, task_id: str, error: str) -> None:
        if task_id not in self._tasks:
            return
        task = self._tasks[task_id]
        task["status"] = "failed"
        task["error"] = str(error)
        task["message"] = f"Task failed: {error}"
        task["updated_at"] = datetime.now(timezone.utc)

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        return self._tasks.get(task_id)

    def list_tasks(self, limit: int = 20) -> List[Dict[str, Any]]:
        sorted_tasks = sorted(
            self._tasks.values(),
            key=lambda t: t["created_at"],
            reverse=True
        )
        return sorted_tasks[:limit]

task_manager = TaskManager()
