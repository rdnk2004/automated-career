import io
import re
import logging
from typing import Dict, Any, Optional, List
from services.gemini_service import gemini_service

logger = logging.getLogger("career_os")

class ResumeParserService:
    def clean_extracted_text(self, text: str) -> str:
        """
        Normalize and clean extracted PDF text:
        - Fix hyphenated line breaks (e.g., 'archi-\ntecture' -> 'architecture')
        - Standardize irregular unicode bullets and spaces
        - Normalize excessive blank lines while preserving section structure
        """
        if not text:
            return ""

        # Replace non-breaking spaces and zero-width characters
        text = text.replace("\u00a0", " ").replace("\u200b", "").replace("\ufeff", "")

        # Standardize various bullet point characters to standard bullet '•'
        bullet_patterns = [r"[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB\u25A0\u25A1]", r"^\s*[-*]\s+"]
        for pat in bullet_patterns:
            text = re.sub(pat, "• ", text, flags=re.MULTILINE)

        # Fix hyphenated words broken across lines
        text = re.sub(r'(\w+)-\n\s*(\w+)', r'\1\2', text)

        # Clean carriage returns and fix excessive consecutive spaces
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"[ \t]+", " ", text)

        # Normalize multiple newlines (keep max 2 newlines for paragraph breaks)
        text = re.sub(r"\n{3,}", "\n\n", text)

        # Ensure bullet points start on their own lines cleanly
        text = re.sub(r"(?<=[^\n])\s*•\s*", "\n• ", text)

        return text.strip()

    def extract_text(self, file_bytes: bytes, filename: str) -> str:
        """
        Extract raw text content from uploaded PDF, TXT, or markdown binary stream
        with layout-aware spatial reconstruction and fallbacks.
        """
        lower_name = filename.lower()
        if lower_name.endswith(".pdf"):
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                extracted_pages = []
                for idx, page in enumerate(reader.pages):
                    page_text = ""
                    # 1. First attempt: Spatial layout-aware mode
                    try:
                        page_text = page.extract_text(extraction_mode="layout")
                    except Exception as layout_err:
                        logger.debug(f"pypdf layout extraction mode failed on page {idx}: {layout_err}")
                        page_text = page.extract_text() or ""

                    # 2. Fallback to standard extraction if layout produced empty output
                    if not page_text or not page_text.strip():
                        page_text = page.extract_text() or ""

                    if page_text and page_text.strip():
                        extracted_pages.append(page_text.strip())

                raw = "\n\n".join(extracted_pages).strip()
                cleaned = self.clean_extracted_text(raw)
                return cleaned if cleaned else raw
            except Exception as e:
                logger.error(f"pypdf extraction failed for {filename}: {e}")
                # Fallback to byte decode attempt
                decoded = file_bytes.decode("utf-8", errors="ignore").strip()
                return self.clean_extracted_text(decoded)
        else:
            try:
                text = file_bytes.decode("utf-8").strip()
            except UnicodeDecodeError:
                text = file_bytes.decode("latin-1", errors="ignore").strip()
            return self.clean_extracted_text(text)

    async def parse_resume(self, file_bytes: bytes, filename: str, target_role: Optional[str] = None) -> Dict[str, Any]:
        """
        Extracts raw text using layout-aware parser and utilizes Gemini 3.6 Flash structured extraction
        to return structured resume sections with clean formatting.
        """
        raw_text = self.extract_text(file_bytes, filename)
        if not raw_text:
            raise ValueError(f"Could not extract any readable text from {filename}. Please ensure the PDF is not an image scan.")

        word_count = len(raw_text.split())

        prompt = f"""
<Role>
You are an expert Technical Resume Parser and ATS Specialist. Extract structured information from the candidate resume text below with precision.
</Role>

<Resume_Text>
{raw_text[:14000]}
</Resume_Text>

<Target_Role_Context>
{target_role or "Software Engineer"}
</Target_Role_Context>

<Task>
Extract and return ONLY a valid JSON object matching this schema:
{{
  "name": "Full Name of Candidate",
  "detected_role": "Primary Job Title / Role identified in the resume",
  "contact": {{
    "email": "candidate@example.com",
    "phone": "+1 ...",
    "location": "City, State / Country",
    "linkedin": "url or handle",
    "github": "url or handle"
  }},
  "summary": "Professional executive summary or bio",
  "experience": [
    {{
      "title": "Role Title",
      "company": "Company Name",
      "location": "Location",
      "dates": "Start - End Date",
      "bullets": ["Metric-driven accomplishment bullet 1", "Accomplishment 2"]
    }}
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "education": [
    {{
      "degree": "Degree and Field of Study",
      "institution": "University or College Name",
      "dates": "Years Attended or Graduation Year"
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "description": "Short description of project",
      "technologies": ["Tech 1", "Tech 2"]
    }}
  ],
  "certifications": ["Certification 1"]
}}

Do not invent details. Only extract and faithfully structure what exists in the text.
</Task>
"""
        try:
            response_text = await gemini_service.generate_async(prompt)
            parsed = gemini_service.parse_json_response(response_text)
            return {
                "name": parsed.get("name") or "Candidate",
                "detected_role": parsed.get("detected_role") or target_role or "Software Engineer",
                "contact": parsed.get("contact") or {},
                "summary": parsed.get("summary") or "",
                "experience": parsed.get("experience") or [],
                "skills": parsed.get("skills") or [],
                "education": parsed.get("education") or [],
                "projects": parsed.get("projects") or [],
                "certifications": parsed.get("certifications") or [],
                "raw_text": raw_text,
                "word_count": word_count,
            }
        except Exception as e:
            logger.warning(f"Gemini resume parsing notice ({e}), using heuristic structure.")
            return self._heuristic_parse(raw_text, word_count, target_role)

    def _heuristic_parse(self, text: str, word_count: int, target_role: Optional[str] = None) -> Dict[str, Any]:
        """
        Deterministic heuristic extraction fallback when Gemini is unavailable.
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        name = lines[0] if lines else "Candidate"
        
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

        common_skills = [
            "Python", "TypeScript", "JavaScript", "React", "Node.js", "FastAPI",
            "Docker", "Kubernetes", "AWS", "PostgreSQL", "Redis", "SQL", "Git",
            "CI/CD", "REST APIs", "GraphQL", "PyTorch", "Tailwind", "LangChain"
        ]
        found_skills = [s for s in common_skills if re.search(r"\b" + re.escape(s) + r"\b", text, re.IGNORECASE)]

        return {
            "name": name,
            "detected_role": target_role or "Software Engineer",
            "contact": contact,
            "summary": "Extracted from uploaded resume document.",
            "experience": [],
            "skills": found_skills,
            "education": [],
            "projects": [],
            "certifications": [],
            "raw_text": text,
            "word_count": word_count,
        }

resume_parser_service = ResumeParserService()
