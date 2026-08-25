import io
import re
import logging
from typing import Dict, Any, Optional, List
from services.gemini_service import gemini_service

logger = logging.getLogger("career_os")

class ResumeParserService:
    def extract_text(self, file_bytes: bytes, filename: str) -> str:
        """
        Extract raw text content from uploaded PDF, TXT, or markdown binary stream.
        """
        lower_name = filename.lower()
        if lower_name.endswith(".pdf"):
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                extracted_pages = []
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        extracted_pages.append(text)
                return "\n".join(extracted_pages).strip()
            except Exception as e:
                logger.error(f"pypdf extraction failed for {filename}: {e}")
                # Fallback to byte decode attempt
                return file_bytes.decode("utf-8", errors="ignore").strip()
        else:
            try:
                return file_bytes.decode("utf-8").strip()
            except UnicodeDecodeError:
                return file_bytes.decode("latin-1", errors="ignore").strip()

    async def parse_resume(self, file_bytes: bytes, filename: str, target_role: Optional[str] = None) -> Dict[str, Any]:
        """
        Extracts raw text and utilizes Gemini 3.6 Flash structured extraction to return structured resume sections.
        """
        raw_text = self.extract_text(file_bytes, filename)
        if not raw_text:
            raise ValueError(f"Could not extract any readable text from {filename}")

        word_count = len(raw_text.split())

        # Attempt Gemini structured parsing
        prompt = f"""
You are an expert ATS resume parser. Extract structured information from the candidate resume text below.

RESUME TEXT:
{raw_text[:12000]}

TARGET ROLE: {target_role or "Software Engineer"}

TASK:
Return ONLY a valid JSON object matching this schema:
{{
  "name": "Full Name",
  "contact": {{
    "email": "email@example.com",
    "phone": "+1 ...",
    "location": "City, Country",
    "linkedin": "url or profile",
    "github": "url or username"
  }},
  "summary": "Professional executive summary or bio",
  "experience": [
    {{
      "title": "Role Title",
      "company": "Company Name",
      "location": "Location",
      "dates": "Start - End",
      "bullets": ["Achievement 1 with quantified metrics", "Achievement 2"]
    }}
  ],
  "skills": ["Skill 1", "Skill 2"],
  "education": [
    {{
      "degree": "Degree / Field",
      "institution": "University / College",
      "dates": "Years"
    }}
  ],
  "certifications": ["Certification 1"]
}}

Do not invent details. Only extract and structure what exists in the text.
"""
        try:
            response_text = await gemini_service.generate_async(prompt)
            parsed = gemini_service.parse_json_response(response_text)
            return {
                "name": parsed.get("name") or "Candidate",
                "contact": parsed.get("contact") or {},
                "summary": parsed.get("summary") or "",
                "experience": parsed.get("experience") or [],
                "skills": parsed.get("skills") or [],
                "education": parsed.get("education") or [],
                "certifications": parsed.get("certifications") or [],
                "raw_text": raw_text,
                "word_count": word_count,
            }
        except Exception as e:
            logger.warning(f"Gemini resume parsing failed ({e}), falling back to heuristic parser.")
            return self._heuristic_parse(raw_text, word_count)

    def _heuristic_parse(self, text: str, word_count: int) -> Dict[str, Any]:
        """
        Deterministic heuristic extraction fallback when Gemini is unavailable.
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        name = lines[0] if lines else "Candidate"
        
        # Email & Phone regex
        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        phone_match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
        linkedin_match = re.search(r"linkedin\.com/in/[\w-]+", text, re.IGNORECASE)
        github_match = re.search(r"github\.com/[\w-]+", text, re.IGNORECASE)

        contact = {
            "email": email_match.group(0) if email_match else "",
            "phone": phone_match.group(0) if phone_match else "",
            "linkedin": linkedin_match.group(0) if linkedin_match else "",
            "github": github_match.group(0) if github_match else "",
        }

        # Common tech keywords scanner for fallback skills list
        common_skills = [
            "Python", "TypeScript", "JavaScript", "React", "Node.js", "FastAPI",
            "Docker", "Kubernetes", "AWS", "PostgreSQL", "Redis", "SQL", "Git",
            "CI/CD", "REST APIs", "GraphQL", "PyTorch", "Tailwind"
        ]
        found_skills = [s for s in common_skills if re.search(r"\b" + re.escape(s) + r"\b", text, re.IGNORECASE)]

        return {
            "name": name,
            "contact": contact,
            "summary": "Extracted from uploaded resume.",
            "experience": [],
            "skills": found_skills,
            "education": [],
            "certifications": [],
            "raw_text": text,
            "word_count": word_count,
        }

resume_parser_service = ResumeParserService()
