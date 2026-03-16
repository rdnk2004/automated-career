import os
import re
import base64
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv

load_dotenv()

GITHUB_PAT = os.environ.get("GITHUB_PAT", "")


def _get_headers() -> dict:
    """Returns GitHub API auth headers using PAT if available."""
    if GITHUB_PAT:
        return {"Authorization": f"token {GITHUB_PAT}"}
    return {}


# ── PORTED from CareerCompass AI reference ────────────────────────────────────

def parse_github_input(input_str: str) -> List[Dict[str, str]]:
    """Parse GitHub URLs or owner/repo strings into structured dicts."""
    raw_links = re.split(r"[\s,]+", input_str)
    repos = []
    for link in raw_links:
        clean = link.strip().rstrip("/")
        if not clean:
            continue
        match = re.search(
            r"(?:github\.com\/|^)([a-zA-Z0-9-]{1,39})\/([a-zA-Z0-9-_\.]+)", clean
        )
        if match:
            repos.append({
                "owner": match.group(1),
                "repo": match.group(2),
                "url": f"https://github.com/{match.group(1)}/{match.group(2)}",
            })
    # Deduplicate
    unique: Dict[str, dict] = {}
    for r in repos:
        unique[r["url"]] = r
    return list(unique.values())


def fetch_github_file_content(owner: str, repo: str, path: str) -> Optional[str]:
    """Fetch a single file's content from GitHub API (base64 decoded)."""
    try:
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
        res = requests.get(url, headers=_get_headers(), timeout=10)
        if res.status_code != 200:
            return None
        data = res.json()
        if data.get("content") and data.get("encoding") == "base64":
            return base64.b64decode(data["content"]).decode("utf-8", errors="ignore")
        return None
    except Exception as e:
        print(f"[GitHub] Error fetching {path} from {owner}/{repo}: {e}")
        return None


def fetch_github_repo_data(owner: str, repo: str) -> Optional[Dict[str, Any]]:
    """
    PORTED from CareerCompass AI reference.
    Fetch repo metadata, language breakdown, and key file contents.
    """
    try:
        headers = _get_headers()

        # Meta
        meta_res = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}", headers=headers, timeout=10
        )
        if meta_res.status_code != 200:
            return None
        meta = meta_res.json()

        # Languages
        lang_res = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}/languages",
            headers=headers, timeout=10
        )
        lang_summary = ""
        if lang_res.status_code == 200:
            langs = lang_res.json()
            total = sum(langs.values())
            if total > 0:
                top_langs = sorted(langs.items(), key=lambda x: x[1], reverse=True)[:5]
                lang_summary = ", ".join(
                    [f"{l} {round(b / total * 100)}%" for l, b in top_langs]
                )

        # Files
        contents_res = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}/contents",
            headers=headers, timeout=10
        )
        files_bundle = ""
        if contents_res.status_code == 200:
            contents = contents_res.json()
            if isinstance(contents, list):
                interesting_files = [
                    "README.md", "package.json", "requirements.txt",
                    "pyproject.toml", "main.py", "app.py", "server.js",
                    "index.js", "App.tsx", "index.html", "go.mod", "Cargo.toml",
                ]

                def sort_key(item):
                    name = item["name"]
                    if name.startswith("README"):
                        return 0
                    if "json" in name or "txt" in name:
                        return 1
                    return 2

                found = [
                    item for item in contents
                    if item["type"] == "file" and item["name"] in interesting_files
                ]
                found.sort(key=sort_key)
                for file_node in found[:4]:
                    content = fetch_github_file_content(owner, repo, file_node["path"])
                    if content:
                        truncated = (
                            content[:8000] + "\n...(truncated)..."
                            if len(content) > 8000
                            else content
                        )
                        files_bundle += f"FILE: {file_node['path']}\n{truncated}\n\n"

        return {
            "repo_name": meta.get("name"),
            "repo_url": meta.get("html_url"),
            "language_summary": lang_summary,
            "files_bundle": files_bundle,
            "description": meta.get("description", ""),
            "stars": meta.get("stargazers_count", 0),
            "forks": meta.get("forks_count", 0),
            "is_fork": meta.get("fork", False),
            "default_branch": meta.get("default_branch", "main"),
            "last_commit": meta.get("pushed_at", ""),
            "topics": meta.get("topics", []),
        }

    except Exception as e:
        print(f"[GitHub] Failed to fetch {owner}/{repo}: {e}")
        return None


# ── NEW: Full repo list via GitHub API ────────────────────────────────────────

def fetch_all_repos() -> List[Dict[str, Any]]:
    """
    Fetch ALL repos for the authenticated user via GitHub REST API.
    Returns full metadata list for classification.
    """
    headers = _get_headers()
    if not headers:
        print("[GitHub] No PAT set — falling back to unauthenticated (60 req/hr limit)")

    repos = []
    page = 1
    while True:
        try:
            res = requests.get(
                "https://api.github.com/user/repos",
                headers=headers,
                params={"per_page": 100, "page": page, "sort": "pushed"},
                timeout=15,
            )
            if res.status_code != 200:
                print(f"[GitHub] Repos fetch error: {res.status_code} {res.text[:200]}")
                break
            batch = res.json()
            if not batch:
                break
            repos.extend(batch)
            page += 1
        except Exception as e:
            print(f"[GitHub] fetch_all_repos error page {page}: {e}")
            break

    return repos


def classify_repo(repo: dict) -> str:
    """
    Classify a repo as: project / experiment / fork / learning-exercise.
    Uses repo metadata heuristics.
    """
    if repo.get("fork"):
        return "fork"

    name = (repo.get("name") or "").lower()
    desc = (repo.get("description") or "").lower()
    stars = repo.get("stargazers_count", 0)
    size = repo.get("size", 0)  # KB

    learning_keywords = [
        "practice", "tutorial", "learn", "exercise", "homework",
        "assignment", "course", "lecture", "study", "beginner",
    ]
    experiment_keywords = [
        "test", "experiment", "poc", "prototype", "draft",
        "sandbox", "try", "demo",
    ]

    combined = name + " " + desc

    if any(k in combined for k in learning_keywords):
        return "learning-exercise"

    if any(k in combined for k in experiment_keywords) or size < 50:
        return "experiment"

    # Default: treat as project if it has some substance
    return "project"


def is_stale(repo: dict) -> bool:
    """Returns True if last commit was 6+ months ago."""
    pushed_at = repo.get("pushed_at")
    if not pushed_at:
        return True
    try:
        last = datetime.strptime(pushed_at, "%Y-%m-%dT%H:%M:%SZ")
        return datetime.utcnow() - last > timedelta(days=180)
    except Exception:
        return False


def get_commit_activity(owner: str, repo: str) -> List[int]:
    """Returns weekly commit counts for the last 52 weeks."""
    try:
        res = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}/stats/participation",
            headers=_get_headers(),
            timeout=10,
        )
        if res.status_code == 200:
            data = res.json()
            return data.get("owner", [])
    except Exception as e:
        print(f"[GitHub] commit activity error for {owner}/{repo}: {e}")
    return []
