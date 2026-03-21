import os
import json
import time
import asyncio
import hashlib
import warnings
from datetime import datetime
from pathlib import Path
from typing import List, Optional

# Suppress the FutureWarning about google-generativeai deprecation
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# ── Client Init ───────────────────────────────────────────────────────────────
API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")


def _configure_genai():
    """Configure genai with the current API key (re-readable from .env)."""
    key = os.environ.get("GEMINI_API_KEY", API_KEY)
    if key:
        genai.configure(api_key=key)

_configure_genai()

# ── Prompt Loader ─────────────────────────────────────────────────────────────
PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent / "prompts"


def load_prompt(filename: str) -> str:
    """Load a prompt from the /prompts/ folder at runtime."""
    path = PROMPTS_DIR / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""


# ── Schema Helper (PORTED from CareerCompass AI reference, unchanged) ─────────
def get_clean_schema(pydantic_model):
    """Resolves Pydantic $defs/$ref for Gemini JSON mode compatibility."""
    schema = pydantic_model.model_json_schema()
    defs = schema.pop("$defs", {})

    def resolve_refs(node):
        if isinstance(node, dict):
            if "$ref" in node:
                ref_key = node["$ref"].split("/")[-1]
                if ref_key in defs:
                    resolved = defs[ref_key].copy()
                    return resolve_refs(resolved)
            if "anyOf" in node:
                for option in node["anyOf"]:
                    resolved_option = resolve_refs(option)
                    if resolved_option.get("type") != "null":
                        return resolved_option
                return resolve_refs(node["anyOf"][0])
            for key in ["default", "title", "additionalProperties"]:
                if key in node:
                    del node[key]
            return {k: resolve_refs(v) for k, v in node.items()}
        elif isinstance(node, list):
            return [resolve_refs(item) for item in node]
        return node

    return resolve_refs(schema)


# ── Retry Wrapper (PORTED from CareerCompass AI reference, model string corrected) ───
async def generate_with_retry(
    contents: list,
    schema,
    model_name: Optional[str] = None,
    retries: int = 4
):
    """Calls Gemini with structured JSON output and exponential backoff on 429."""
    _model_name = model_name or MODEL_NAME
    _configure_genai()  # Always use latest key from env
    model = genai.GenerativeModel(_model_name)
    clean_schema = get_clean_schema(schema)

    generation_config = genai.GenerationConfig(
        response_mime_type="application/json",
        response_schema=clean_schema,
    )

    for i in range(retries):
        try:
            response = model.generate_content(
                contents, generation_config=generation_config
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"[Gemini] Attempt {i + 1} failed: {e}")
            if "429" in str(e) or "quota" in str(e).lower() or "RESOURCE_EXHAUSTED" in str(e):
                await asyncio.sleep(2 ** (i + 1))
                continue
            raise e
    raise Exception("[Gemini] Max retries exceeded")


def hash_input(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


# ═════════════════════════════════════════════════════════════════════════════
# RESUME FUNCTIONS
# ═════════════════════════════════════════════════════════════════════════════

async def analyze_resume_highlights(
    file_bytes: bytes, mime_type: str
) -> Optional[dict]:
    """
    PORTED from CareerCompass AI reference (analyze_resume_highlights).
    Model corrected: gemini-2.0-flash.
    """
    from schemas import ResumeHighlightsResult

    try:
        file_part = {"mime_type": mime_type, "data": file_bytes}
        base_prompt = load_prompt("resume_analyzer.md")
        current_date = datetime.now().strftime("%B %d, %Y")

        prompt = f"""{base_prompt}

IMPORTANT: Today's date is {current_date}. Dates in 2025 and 2026 are NOT future dates.
Analyze the resume. Identify segments, rate each green/yellow/red, and give actionable feedback.
Return STRICT JSON matching the schema."""

        raw = await generate_with_retry(
            contents=[file_part, prompt],
            schema=ResumeHighlightsResult,
        )
        return raw
    except Exception as e:
        print(f"[Resume Highlights] Error: {e}")
        return None


async def calculate_ats_score(file_bytes: bytes, mime_type: str) -> Optional[dict]:
    """ATS compatibility score: standard headers, no tables/columns, keyword density."""
    from schemas import ATSScoreAI

    try:
        file_part = {"mime_type": mime_type, "data": file_bytes}
        prompt = """Evaluate this resume for ATS (Applicant Tracking System) compatibility.
Check for:
- Standard section headers (Summary, Experience, Education, Skills, Projects)
- No tables or multi-column layouts
- No graphics, headers/footers, text boxes
- Keyword density and relevance
- Contact info in plain text
- Date formats consistency

Return STRICT JSON matching the schema with score (0-100), passed_checks list, and issues list."""

        raw = await generate_with_retry(
            contents=[file_part, prompt],
            schema=ATSScoreAI,
        )
        return raw
    except Exception as e:
        print(f"[ATS Score] Error: {e}")
        return None


async def generate_resume_bullets(
    project_description: str, target_role: str = "Data Analyst / ML Engineer"
) -> Optional[dict]:
    """Generate resume bullets for a described project."""
    from schemas import ResumeBulletsAI

    try:
        prompt = f"""Generate strong, ATS-optimized resume bullet points for this project.

Project Description: {project_description}
Target Role: {target_role}

Requirements:
- Each bullet starts with a strong action verb
- Include measurable impact where possible (use realistic estimates)  
- Use keywords relevant to {target_role}
- Bullets should be 1-2 lines each
- Also suggest which resume section to insert them in

Return STRICT JSON matching the schema."""

        raw = await generate_with_retry(
            contents=[prompt],
            schema=ResumeBulletsAI,
        )
        return raw
    except Exception as e:
        print(f"[Resume Bullets] Error: {e}")
        return None


# ═════════════════════════════════════════════════════════════════════════════
# GITHUB FUNCTIONS
# ═════════════════════════════════════════════════════════════════════════════

async def analyze_github_repos(repos_data: list) -> List[dict]:
    """
    PORTED from CareerCompass AI reference (analyze_github_repos).
    Accepts pre-fetched repo data dicts. Model corrected to gemini-2.0-flash.
    """
    from schemas import GithubDeepAnalysisResult

    base_prompt = load_prompt("github_analyzer.md")
    results = []

    for data in repos_data:
        if not data:
            continue
        try:
            prompt = f"""{base_prompt}

Analyze the following GitHub repository:
Repo Name: {data.get('repo_name')}
Language Summary: {data.get('language_summary', 'N/A')}
Files Content:
{data.get('files_bundle', 'No files available')}

Return STRICT JSON matching the schema."""

            raw = await generate_with_retry(
                contents=[prompt],
                schema=GithubDeepAnalysisResult,
            )
            results.append(raw)
            await asyncio.sleep(1)  # rate-limit courtesy
        except Exception as e:
            print(f"[GitHub Analysis] Error on {data.get('repo_name')}: {e}")

    return results


async def generate_repo_readme(repo_data: dict) -> Optional[str]:
    """Generate an optimized README for a single repository."""
    from schemas import RepoREADMEResponse

    try:
        prompt = f"""Generate a professional, well-structured README.md for this GitHub project.

Repo: {repo_data.get('repo_name')}
Language: {repo_data.get('language_summary', 'N/A')}
Files:
{repo_data.get('files_bundle', '')}

Requirements:
- Add badges for language, license (MIT), and built-with
- Clear Description section
- Tech Stack table
- Prerequisites + How to Run section
- Features list
- Contributing section with placeholder
- Output raw Markdown only

Return STRICT JSON matching the schema."""

        raw = await generate_with_retry(
            contents=[prompt],
            schema=RepoREADMEResponse,
        )
        return raw.get("readme_markdown", "")
    except Exception as e:
        print(f"[README Gen] Error: {e}")
        return None


async def generate_profile_readme(repos: list, skills: list) -> Optional[str]:
    """Generate the GitHub profile README (username/username repo)."""
    from schemas import ProfileREADMEResponse

    try:
        repos_summary = "\n".join(
            [f"- {r.get('name', '')}: {r.get('description', '')}" for r in repos[:10]]
        )
        skills_list = ", ".join(skills[:20]) if skills else "Python, Machine Learning, Data Analysis"

        prompt = f"""Generate a professional GitHub Profile README (the username/username special repo).

Developer: Nikhil Krishna R D
Program: M.Sc. Computer Science (Data Analytics), Rajagiri College of Social Sciences, Kochi
Target Roles: Data Analyst, ML Engineer, AI Engineer

Top Projects:
{repos_summary}

Key Skills: {skills_list}

Requirements:
- Greeting banner with animated typing or emoji
- About Me section (2-3 sentences)
- Skills section with technology icons (use shields.io badges)
- Featured Projects section (top 3)
- GitHub Stats (use github-readme-stats placeholder links)
- Contact/Connect section with LinkedIn, GitHub links
- Output raw Markdown

Return STRICT JSON matching the schema."""

        raw = await generate_with_retry(
            contents=[prompt],
            schema=ProfileREADMEResponse,
        )
        return raw.get("readme_markdown", "")
    except Exception as e:
        print(f"[Profile README] Error: {e}")
        return None


# ═════════════════════════════════════════════════════════════════════════════
# LINKEDIN FUNCTIONS
# ═════════════════════════════════════════════════════════════════════════════

async def analyze_linkedin_profile(
    profile_data: dict, jd_text: str = ""
) -> Optional[dict]:
    """Analyze LinkedIn profile sections and generate rewrite suggestions."""
    from schemas import LinkedInRewriteAI

    try:
        base_prompt = load_prompt("linkedin_optimizer.md")
        prompt = f"""{base_prompt}

LinkedIn Profile Data:
{json.dumps(profile_data, indent=2)}

Target Job Description (if provided):
{jd_text or 'None — analyze for general Data Analyst / ML Engineer / AI Engineer positioning'}

Analyze each section (Headline, About, Experience bullets, Skills, Featured).
For each section: score it, identify missing recruiter-search keywords, and provide a rewritten version.
Overall score: 0-100 based on LinkedIn completeness and keyword optimization.

Return STRICT JSON matching the schema."""

        raw = await generate_with_retry(
            contents=[prompt],
            schema=LinkedInRewriteAI,
        )
        return raw
    except Exception as e:
        print(f"[LinkedIn Analysis] Error: {e}")
        return None


async def generate_linkedin_posts(
    github_repos: list, resume_summary: str = ""
) -> Optional[dict]:
    """Generate 2-3 LinkedIn post ideas based on recent GitHub activity."""
    from schemas import LinkedInPostsResponse

    try:
        recent_projects = "\n".join(
            [f"- {r.get('name', '')}: {r.get('description', '')}" for r in github_repos[:5]]
        )

        prompt = f"""Generate 2-3 LinkedIn post ideas for a Data Science / ML student (M.Sc. CS Data Analytics at Rajagiri College, Kochi) based on their recent GitHub activity.

Recent Projects:
{recent_projects}

Resume Summary Context:
{resume_summary or 'Data Analytics student with ML/AI project experience'}

Requirements for each post:
- A clear, catchy title
- A hook (first 2 lines that make people stop scrolling)
- Full draft post content (150-300 words)
- Must feel humanized and personal, NOT corporate/generic
- Relevant hashtags at the end

Return STRICT JSON matching the schema."""

        raw = await generate_with_retry(
            contents=[prompt],
            schema=LinkedInPostsResponse,
        )
        return raw
    except Exception as e:
        print(f"[LinkedIn Posts] Error: {e}")
        return None


# ═════════════════════════════════════════════════════════════════════════════
# HR OUTREACH FUNCTIONS
# ═════════════════════════════════════════════════════════════════════════════

async def generate_hr_messages(
    hr_profile: dict, user_profile_summary: str
) -> Optional[dict]:
    """Generate personalized connection request and follow-up message for an HR."""
    from schemas import HRMessageResult

    try:
        base_prompt = load_prompt("hr_outreach.md")
        prompt = f"""{base_prompt}

HR Profile:
Name: {hr_profile.get('name', '')}
Title: {hr_profile.get('title', '')}
Company: {hr_profile.get('company', '')}

My Profile Summary:
{user_profile_summary}

Generate:
1. A personalized LinkedIn connection request (≤300 characters, warm and specific)
2. A follow-up message to send after they accept (150-200 words, value-first, not salesy)

Return STRICT JSON matching the schema."""

        raw = await generate_with_retry(
            contents=[prompt],
            schema=HRMessageResult,
        )
        return raw
    except Exception as e:
        print(f"[HR Messages] Error: {e}")
        return None


# ═════════════════════════════════════════════════════════════════════════════
# JOB MATCHING FUNCTIONS
# ═════════════════════════════════════════════════════════════════════════════

async def parse_jd(jd_text: str) -> Optional[dict]:
    """Parse a job description into structured requirements."""
    from schemas import JDParsedRequirements

    try:
        prompt = f"""Parse this job description and extract structured requirements.

JD Text:
{jd_text[:3000]}

Return STRICT JSON matching the schema."""

        raw = await generate_with_retry(
            contents=[prompt],
            schema=JDParsedRequirements,
        )
        return raw
    except Exception as e:
        print(f"[JD Parse] Error: {e}")
        return None


async def match_profile_to_job(
    profile_summary: str, jd_text: str
) -> Optional[dict]:
    """Match user profile against a job description."""
    from schemas import JobMatchResult

    try:
        prompt = f"""You are a senior technical recruiter. Match this candidate's profile against the job description.

Candidate Profile Summary:
{profile_summary}

Job Description:
{jd_text[:3000]}

Provide:
- match_score: 0-100 (realistic, not inflated)
- missing_skills: skills in JD the candidate lacks
- matching_skills: skills the candidate has that match the JD
- tailored_resume_bullets: 3-5 resume bullets rewritten to target this specific JD
- tailored_headline: LinkedIn headline optimized for this role
- tailored_summary: 2-3 sentence LinkedIn summary for this JD

Return STRICT JSON matching the schema."""

        raw = await generate_with_retry(
            contents=[prompt],
            schema=JobMatchResult,
        )
        return raw
    except Exception as e:
        print(f"[Job Match] Error: {e}")
        return None


# ═════════════════════════════════════════════════════════════════════════════
# CROSS-CHANNEL SYNC ENGINE
# ═════════════════════════════════════════════════════════════════════════════

async def generate_cross_suggestions(
    linkedin_snapshot: dict,
    resume_snapshot: dict,
    github_repos: list,
) -> List[dict]:
    """Detect gaps across LinkedIn, Resume, and GitHub — generate suggestion cards."""
    from schemas import CrossSuggestionAI

    class CrossSuggestionsListAI(CrossSuggestionAI.__class__):
        pass

    # Build a simple wrapper list schema
    from pydantic import BaseModel

    class SuggestionList(BaseModel):
        suggestions: List[CrossSuggestionAI]

    try:
        github_names = [r.get("name", "") for r in github_repos]
        prompt = f"""You are analyzing a developer's professional profiles for inconsistencies and missing content.

LinkedIn sections available: {list(linkedin_snapshot.keys()) if linkedin_snapshot else 'Not scraped yet'}
Resume sections available: {list(resume_snapshot.keys()) if resume_snapshot else 'Not uploaded yet'}
GitHub repos: {github_names}

Detect gaps like:
- "Project X exists on GitHub but NOT on LinkedIn or Resume"
- "Skill Y appears in Resume but not in LinkedIn Skills section"
- "GitHub has active ML projects but LinkedIn headline doesn't mention ML"

For each gap, generate a suggestion with:
- suggestion_text: clear, actionable description of the gap
- suggestion_type: one of [add_to_linkedin, add_to_resume, update_linkedin, update_resume, add_project, sync_skills]
- draft_content: ready-to-use draft text the user can copy-paste

Return at least 3 suggestions. Return STRICT JSON matching the schema."""

        raw = await generate_with_retry(
            contents=[prompt],
            schema=SuggestionList,
        )
        return raw.get("suggestions", [])
    except Exception as e:
        print(f"[Cross Suggestions] Error: {e}")
        return []


async def calculate_health_score(
    linkedin_snapshot: dict,
    resume_snapshot: dict,
    github_repos: list,
    pending_suggestions: int,
) -> dict:
    """Calculate the Profile Health Score (0-100)."""
    from schemas import HealthScoreAI

    # Simple heuristic calculation (no Gemini call needed for basic scoring)
    linkedin_score = 60.0 if linkedin_snapshot else 0.0
    resume_score = 70.0 if resume_snapshot else 0.0
    github_score = min(100.0, len(github_repos) * 10) if github_repos else 0.0
    sync_score = max(0.0, 100.0 - (pending_suggestions * 10))
    overall = round((linkedin_score + resume_score + github_score + sync_score) / 4, 1)

    return {
        "overall": overall,
        "linkedin_score": linkedin_score,
        "resume_score": resume_score,
        "github_score": github_score,
        "sync_score": sync_score,
    }
