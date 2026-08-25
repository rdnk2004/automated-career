import pytest
from io import BytesIO
from fastapi.testclient import TestClient
from main import app
from services.resume_parser_service import resume_parser_service

client = TestClient(app)

def test_resume_parser_text_extraction():
    sample_text = """John Doe
Email: john.doe@example.com
Phone: (555) 123-4567
LinkedIn: linkedin.com/in/johndoe
GitHub: github.com/johndoe

SUMMARY:
Senior Software Engineer with experience in Python, FastAPI, React, Docker, and AWS.

EXPERIENCE:
Staff Software Engineer at Tech Corp
- Designed and built microservices in Python and FastAPI
- Managed Kubernetes clusters on AWS
"""
    raw = resume_parser_service.extract_text(sample_text.encode("utf-8"), "resume.txt")
    assert "John Doe" in raw
    assert "john.doe@example.com" in raw

    heuristic = resume_parser_service._heuristic_parse(raw, word_count=len(raw.split()))
    assert heuristic["name"] == "John Doe"
    assert heuristic["contact"]["email"] == "john.doe@example.com"
    assert "Python" in heuristic["skills"]
    assert "FastAPI" in heuristic["skills"]

def test_upload_resume_endpoint_txt():
    sample_content = b"Jane Smith\nEmail: jane@example.com\nSkills: Python, TypeScript, Docker"
    response = client.post(
        "/api/analysis/resume/upload",
        files={"file": ("resume.txt", BytesIO(sample_content), "text/plain")},
        data={"target_role": "AI Engineer"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert data["name"] == "Jane Smith"
    assert "contact" in data
    assert data["contact"]["email"] == "jane@example.com"
    assert "raw_text" in data

def test_upload_resume_invalid_format():
    response = client.post(
        "/api/analysis/resume/upload",
        files={"file": ("resume.exe", BytesIO(b"binary"), "application/octet-stream")},
    )
    assert response.status_code == 400
    assert "Only .pdf and .txt" in response.json()["detail"]
