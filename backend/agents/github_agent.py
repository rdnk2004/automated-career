import json
import logging
from typing import Dict, Any, List, Optional
from services.gemini_service import gemini_service

logger = logging.getLogger("career_os")

async def evaluate_portfolio_project(
    repo_data: dict,
    file_tree: str,
    sample_code: str,
    target_role: Optional[str] = "Senior AI Engineer"
) -> Dict[str, Any]:
    """
    AI Portfolio Intelligence Engine:
    Inspects repository architecture, codebase depth, and manifests to assess
    resume worthiness and generate quantified resume accomplishment bullet points.
    """
    prompt = f"""
You are a Principal Staff Engineer & Technical Hiring Manager assessing candidate GitHub repositories for resume worthiness.

REPOSITORY METADATA:
- Name: {repo_data.get('name', '')}
- Full Name: {repo_data.get('full_name', '')}
- Description: {repo_data.get('description', 'None')}
- Primary Language: {repo_data.get('language', 'Unknown')}
- Stars: {repo_data.get('stars', 0)}
- Forks: {repo_data.get('forks_count', 0)}
- Target Career Role: {target_role or 'Software Engineer'}

FILE STRUCTURE (Directory Tree):
{file_tree[:3000]}

SAMPLE SOURCE CODE & MANIFESTS:
{sample_code[:6000]}

TASK:
1. Assess the technical depth, architectural sophistication, and production-readiness of this project.
2. Score its resume impact out of 100:
   - 85-100: Tier 1: Flagship Project (Complex architecture, clean modular structure, tests/docker, high business value)
   - 65-84: Tier 2: Strong Supporting Project (Solid utility, clean code, good domain implementation)
   - 0-64: Tier 3: Practice / Utility Script (Basic script, tutorial clone, or incomplete prototype)
3. Extract the exact technology stack, libraries, and frameworks detected in the code.
4. Synthesize a 2-3 sentence architectural summary explaining how the system works.
5. Write 3 quantified, high-impact resume bullet points using the Google XYZ formula:
   "Accomplished [X], as measured by [Y], by doing [Z]"
6. Explain why this project is recommended (or how to improve it) for a {target_role} role.

Return ONLY a valid JSON object matching this schema:
{{
  "resume_score": 88,
  "portfolio_tier": "Tier 1: Flagship Showcase",
  "key_technologies": ["FastAPI", "PostgreSQL", "Docker", "React", "TypeScript", "TailwindCSS"],
  "architecture_summary": "Modular async backend service with SQLAlchemy connection pooling, integrated with a Vite React client and automated background telemetry workers.",
  "resume_bullets": [
    "Architected fullstack career intelligence engine utilizing FastAPI and PostgreSQL, reducing latency by 45% with async connection pooling.",
    "Engineered automated Gemini 2.5 Pro extraction pipelines processing structured ATS job listings across 3 major platforms.",
    "Designed reactive UI with React 18 and TanStack Query, achieving sub-100ms client-side cache invalidation."
  ],
  "recommendation_reason": "High-signal fullstack architecture showcasing production-grade async Python and modern React, directly relevant to Senior engineering interviews.",
  "production_readiness": {{
    "has_tests": true,
    "has_docker": true,
    "has_ci_cd": false,
    "code_quality_rating": "Production-Ready"
  }}
}}
"""
    try:
        response_text = await gemini_service.generate_async(prompt)
        parsed = gemini_service.parse_json_response(response_text)
        
        return {
            "resume_score": int(parsed.get("resume_score", 75)),
            "portfolio_tier": str(parsed.get("portfolio_tier", "Tier 2: Strong Supporting")),
            "key_technologies": list(parsed.get("key_technologies", [repo_data.get("language") or "Python"])),
            "architecture_summary": str(parsed.get("architecture_summary", f"Full-featured {repo_data.get('language', 'software')} project.")),
            "resume_bullets": list(parsed.get("resume_bullets", [
                f"Designed and built {repo_data.get('name', 'project')} utilizing {repo_data.get('language', 'modern stack')}, implementing modular architecture.",
                f"Optimized performance and reliability across core repository components.",
                f"Documented codebase and structured reusable modules for maintainability."
            ])),
            "recommendation_reason": str(parsed.get("recommendation_reason", "Solid codebase demonstrating technical competence in key stack tools.")),
            "production_readiness": dict(parsed.get("production_readiness", {
                "has_tests": "test" in file_tree.lower(),
                "has_docker": "docker" in file_tree.lower(),
                "has_ci_cd": ".github" in file_tree.lower(),
                "code_quality_rating": "Solid"
            }))
        }
    except Exception as e:
        logger.warning(f"Gemini project evaluation failed ({e}), falling back to heuristic evaluator.")
        return _heuristic_evaluate_project(repo_data, file_tree)


def _heuristic_evaluate_project(repo_data: dict, file_tree: str) -> Dict[str, Any]:
    """Deterministic heuristic evaluator when Gemini is offline."""
    has_docker = "docker" in file_tree.lower()
    has_tests = "test" in file_tree.lower() or "tests" in file_tree.lower()
    has_ci_cd = ".github" in file_tree.lower() or "workflow" in file_tree.lower()
    has_readme = bool(repo_data.get("has_readme"))
    stars = repo_data.get("stars", 0)

    score = 60
    if has_docker: score += 12
    if has_tests: score += 12
    if has_ci_cd: score += 8
    if has_readme: score += 8
    if stars > 0: score += min(10, stars * 2)
    score = min(98, score)

    if score >= 85:
        tier = "Tier 1: Flagship Showcase"
    elif score >= 65:
        tier = "Tier 2: Strong Supporting"
    else:
        tier = "Tier 3: Utility / Practice Script"

    lang = repo_data.get("language") or "Python"
    tech_stack = [lang]
    if has_docker: tech_stack.append("Docker")
    if "requirements.txt" in file_tree: tech_stack.append("Python")
    if "package.json" in file_tree: tech_stack.append("TypeScript")
    if "fastapi" in file_tree.lower(): tech_stack.append("FastAPI")
    if "react" in file_tree.lower(): tech_stack.append("React")

    name = repo_data.get("name", "Application")
    bullets = [
        f"Developed {name} using {lang}, structuring modular architecture with automated build configurations.",
        f"Implemented core domain workflows, ensuring clean separation of concerns and maintainable code.",
        f"Integrated containerized environments and documented end-to-end setup for developer onboarding."
    ]

    return {
        "resume_score": score,
        "portfolio_tier": tier,
        "key_technologies": list(set(tech_stack)),
        "architecture_summary": f"Structured {lang} application with modular components and clean project layout.",
        "resume_bullets": bullets,
        "recommendation_reason": f"Showcases practical {lang} software engineering practices suitable for portfolio review.",
        "production_readiness": {
            "has_tests": has_tests,
            "has_docker": has_docker,
            "has_ci_cd": has_ci_cd,
            "code_quality_rating": "Production-Grade" if score >= 80 else "Modular"
        }
    }


async def generate_readme(repo_data: dict, file_tree: str, sample_code: str) -> str:
    prompt = f"""
Generate an elite, production-grade README.md for this GitHub repository.

REPO METADATA:
- Name: {repo_data.get('name', '')}
- Description: {repo_data.get('description', 'None provided')}
- Primary language: {repo_data.get('language', '')}
- Topics: {repo_data.get('topics', [])}

FILE TREE:
{file_tree}

SAMPLE CODE EXCERPT:
{sample_code[:3000]}

README REQUIREMENTS:
1. Top Header: Modern project title, one-line value proposition, technology badges (Shields.io style).
2. Architecture & Design: Include a clean Mermaid flowchart / sequence diagram visualizing the system architecture:
```mermaid
graph TD
  ...
```
3. Key Features: Bulleted highlights inferred from actual code.
4. Tech Stack Table: Categories (Frontend, Backend, Database, DevOps, AI) with notes.
5. Project Structure: Visual ASCII tree of top 2-3 directory levels.
6. Getting Started & Installation: Precise shell commands (e.g. docker compose, npm install, pip install).
7. API Reference or Usage Examples: Concrete code snippets showing how to execute the project.
8. Contributing & License.

Format: Valid Markdown only. No conversational wrapper or explanations outside the README content.
"""
    response_text = await gemini_service.generate_async(prompt)
    
    text = response_text.strip()
    if text.startswith("```markdown"):
        text = text[len("```markdown"):]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
        
    return text.strip()
