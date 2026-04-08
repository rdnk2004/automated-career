from services.gemini_service import gemini_service

async def generate_readme(repo_data: dict, file_tree: str, sample_code: str) -> str:
    prompt = f"""
Generate a professional README.md for this GitHub repository.

REPO METADATA:
- Name: {repo_data.get('name', '')}
- Description: {repo_data.get('description', 'None provided')}
- Primary language: {repo_data.get('language', '')}
- Topics: {repo_data.get('topics', [])}

FILE TREE:
{file_tree}

SAMPLE CODE EXCERPT:
{sample_code[:2000]}

README REQUIREMENTS:
- Badges: build status placeholder, Python/JS version, license
- One-line description
- Features section (infer from code)
- Tech stack table
- Installation steps (detect from requirements.txt or package.json)
- Usage with code examples
- Project structure (top 2 levels of file tree)
- Contributing section (brief)
- License (MIT unless detected otherwise)

Format: Valid Markdown only. No explanations outside the README content.
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
