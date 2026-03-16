import os
import io
from typing import Optional, Dict
from dotenv import load_dotenv

load_dotenv()

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False
    print("[Resume] pdfplumber not installed. PDF parsing will be unavailable.")


def parse_pdf(file_bytes: bytes) -> str:
    """
    Extract full text from a PDF using pdfplumber.
    Returns empty string on failure.
    """
    if not PDFPLUMBER_AVAILABLE:
        return ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            return "\n\n".join(pages_text)
    except Exception as e:
        print(f"[Resume] PDF parse error: {e}")
        return ""


def segment_resume(text: str) -> Dict[str, str]:
    """
    Segment resume text into sections by detecting common header patterns.
    Returns a dict like {"Summary": "...", "Experience": "...", "Skills": "..."}.
    """
    import re

    section_headers = [
        "summary", "objective", "profile",
        "experience", "work experience", "employment", "professional experience",
        "education", "academic background",
        "skills", "technical skills", "core competencies",
        "projects", "personal projects", "academic projects",
        "certifications", "certificates",
        "achievements", "awards",
        "publications",
        "languages",
        "interests", "hobbies",
    ]

    # Build regex to detect headers (case-insensitive, must be on their own line)
    header_pattern = re.compile(
        r"^(" + "|".join(re.escape(h) for h in section_headers) + r")\s*[:\-]?\s*$",
        re.IGNORECASE | re.MULTILINE,
    )

    lines = text.split("\n")
    sections: Dict[str, list] = {}
    current_section = "Header"
    sections[current_section] = []

    for line in lines:
        stripped = line.strip()
        if header_pattern.match(stripped):
            current_section = stripped.title()
            sections[current_section] = []
        else:
            sections[current_section].append(line)

    # Join each section's lines into a single string
    return {k: "\n".join(v).strip() for k, v in sections.items() if v and "\n".join(v).strip()}
