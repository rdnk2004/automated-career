import pytest
from services.ats_service import ats_service
from services.gemini_service import gemini_service
from services.linkedin_parser import parse_csv_content

def test_ats_companies_registry_loaded():
    """Verify that ATS service successfully resolves and loads companies from backend/config/ats_companies.json."""
    companies = ats_service._load_companies()
    assert isinstance(companies, list)
    assert len(companies) > 0, "ATS registry should contain registered companies"
    first = companies[0]
    assert "name" in first
    assert "ats" in first
    assert "board_token" in first

def test_gemini_json_parser_robustness():
    """Verify GeminiService.parse_json_response handles code blocks and surrounding text cleanly."""
    # Test 1: Markdown code block
    text1 = "```json\n{\"headline\": \"AI Engineer\", \"score\": 95}\n```"
    parsed1 = gemini_service.parse_json_response(text1)
    assert parsed1["headline"] == "AI Engineer"
    assert parsed1["score"] == 95

    # Test 2: Text before and after JSON with nested braces
    text2 = "Here is the result: {\"user\": {\"role\": \"Software Engineer\", \"details\": \"{expert}\"}, \"status\": \"ok\"} Hope this helps!"
    parsed2 = gemini_service.parse_json_response(text2)
    assert parsed2["user"]["role"] == "Software Engineer"
    assert parsed2["status"] == "ok"

def test_linkedin_parser_encodings():
    """Verify parse_csv_content handles non-UTF8 encodings like latin-1 gracefully."""
    latin1_csv = "Name,Headline\nRéné,Senior Dev\n".encode("latin-1")
    parsed = parse_csv_content(latin1_csv)
    assert len(parsed) == 1
    assert parsed[0]["Headline"] == "Senior Dev"
