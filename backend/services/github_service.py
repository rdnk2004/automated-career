import httpx
import asyncio
import re
import base64
import logging
from typing import List, Dict, Any, Optional
from config import settings
from models.github import GithubRepo, RepoScan

logger = logging.getLogger("career_os")

SECRET_PATTERNS = [
    (r'sk-[a-zA-Z0-9]{20,}', 'OpenAI API key'),
    (r'AIza[0-9A-Za-z-_]{35}', 'Google API key'),
    (r'ghp_[0-9a-zA-Z]{36}', 'GitHub PAT'),
    (r'AKIA[0-9A-Z]{16}', 'AWS Access Key'),
    (r'(?i)password\s*=\s*["\'][^"\']{4,}["\']', 'Hardcoded password'),
    (r'(?i)secret\s*=\s*["\'][^"\']{4,}["\']', 'Hardcoded secret'),
]

STANDARD_GITIGNORE = """# Environments & Secrets
.env
.env.local
.env.*.local
*.env
*.pem
*.key

# Dependencies
node_modules/
__pycache__/
*.py[cod]
*$py.class
.venv/
env/
venv/

# Build outputs
dist/
build/
.next/
out/
*.egg-info/

# Logs & OS
*.log
.DS_Store
Thumbs.db
.vscode/
.idea/
"""

class GitHubService:
    def __init__(self):
        self.base_url = "https://api.github.com"

    @property
    def headers(self):
        h = {
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Career-OS-Agent/1.0"
        }
        if settings.github_pat and settings.github_pat.strip() and not settings.github_pat.startswith("ghp_your"):
            h["Authorization"] = f"Bearer {settings.github_pat.strip()}"
        return h

    @property
    def anon_headers(self):
        return {
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Career-OS-Agent/1.0"
        }

    async def _get(self, client: httpx.AsyncClient, url: str, params: Optional[Dict] = None) -> httpx.Response:
        response = await client.get(url, params=params)
        response.raise_for_status()
        return response

    async def get_all_repos(self) -> List[Dict[str, Any]]:
        """
        Fetch all public repositories for the configured account, including collaborated repos.
        Explicitly excludes any private repositories.
        Tries authenticated /user/repos first; falls back gracefully to public /users/{username}/repos.
        """
        username = settings.github_username or "rdnk2004"
        raw_repos = []
        has_pat = bool(settings.github_pat and settings.github_pat.strip() and not settings.github_pat.startswith("ghp_your"))

        if has_pat:
            try:
                page = 1
                async with httpx.AsyncClient(base_url=self.base_url, headers=self.headers, timeout=10.0) as client:
                    while True:
                        response = await self._get(
                            client,
                            "/user/repos",
                            params={
                                "per_page": 100,
                                "page": page,
                                "sort": "pushed",
                                "direction": "desc",
                                "visibility": "public",
                                "affiliation": "owner,collaborator,organization_member"
                            }
                        )
                        data = response.json()
                        if not data or not isinstance(data, list):
                            break
                        raw_repos.extend(data)
                        page += 1
                        await asyncio.sleep(0.05)
                logger.info(f"Successfully fetched {len(raw_repos)} public/collaborated repos via GitHub PAT.")
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401:
                    logger.warning(f"GitHub PAT rejected (401 Unauthorized). Falling back to public repos for {username}...")
                else:
                    logger.warning(f"Authenticated repo fetch failed ({e}). Falling back to public repos for {username}...")
            except Exception as e:
                logger.warning(f"Authenticated repo fetch exception ({e}). Falling back to public repos for {username}...")

        # Fallback if no PAT or if authenticated fetch failed
        if not raw_repos:
            page = 1
            async with httpx.AsyncClient(base_url=self.base_url, headers=self.anon_headers, timeout=10.0) as client:
                while True:
                    try:
                        response = await self._get(
                            client,
                            f"/users/{username}/repos",
                            params={"per_page": 100, "page": page, "sort": "pushed", "direction": "desc", "type": "all"}
                        )
                        data = response.json()
                        if not data or not isinstance(data, list):
                            break
                        raw_repos.extend(data)
                        page += 1
                        await asyncio.sleep(0.05)
                    except httpx.HTTPStatusError as e:
                        if e.response.status_code == 404:
                            logger.error(f"GitHub user {username} not found.")
                        break
                    except Exception as e:
                        logger.error(f"Public repo fetch error: {e}")
                        break

        # Deduplicate and strictly exclude any private repositories
        seen_ids = set()
        public_repos = []
        for r in raw_repos:
            if not isinstance(r, dict):
                continue
            r_id = r.get("id")
            is_private = r.get("private", False)
            if r_id and r_id not in seen_ids and not is_private:
                seen_ids.add(r_id)
                public_repos.append(r)

        logger.info(f"Filtered to {len(public_repos)} clean public & collaborated repos for {username}.")
        return public_repos

    async def get_repo_file_tree(self, repo_full_name: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(base_url=self.base_url, headers=self.headers, timeout=10.0) as client:
            try:
                response = await self._get(client, f"/repos/{repo_full_name}/git/trees/HEAD", params={"recursive": "1"})
                return response.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code in (401, 403):
                    # Try anonymous request for public repos
                    async with httpx.AsyncClient(base_url=self.base_url, headers=self.anon_headers, timeout=10.0) as anon_client:
                        try:
                            res = await self._get(anon_client, f"/repos/{repo_full_name}/git/trees/HEAD", params={"recursive": "1"})
                            return res.json()
                        except Exception:
                            return {"tree": []}
                if e.response.status_code in (404, 409):
                    return {"tree": []}
                raise

    async def get_file_content(self, repo_full_name: str, path: str) -> Optional[str]:
        async with httpx.AsyncClient(base_url=self.base_url, headers=self.headers, timeout=10.0) as client:
            try:
                response = await self._get(client, f"/repos/{repo_full_name}/contents/{path}")
                data = response.json()
                if "content" in data and data["encoding"] == "base64":
                    return base64.b64decode(data["content"]).decode('utf-8')
                return None
            except httpx.HTTPStatusError as e:
                if e.response.status_code in (401, 403):
                    async with httpx.AsyncClient(base_url=self.base_url, headers=self.anon_headers, timeout=10.0) as anon_client:
                        try:
                            res = await self._get(anon_client, f"/repos/{repo_full_name}/contents/{path}")
                            data = res.json()
                            if "content" in data and data["encoding"] == "base64":
                                return base64.b64decode(data["content"]).decode('utf-8')
                        except Exception:
                            return None
                if e.response.status_code == 404:
                    return None
                raise

    async def get_readme(self, repo_full_name: str) -> Dict[str, Any]:
        """
        Fetch the README metadata and decoded content from GitHub for a given repository.
        Handles all standard README formats (README.md, README.txt, README.rst, etc.).
        """
        async with httpx.AsyncClient(base_url=self.base_url, headers=self.headers, timeout=10.0) as client:
            try:
                response = await self._get(client, f"/repos/{repo_full_name}/readme")
                data = response.json()
                content = None
                if "content" in data and data.get("encoding") == "base64":
                    content = base64.b64decode(data["content"]).decode('utf-8', errors='replace')
                return {
                    "has_readme": True,
                    "content": content,
                    "name": data.get("name", "README.md"),
                    "path": data.get("path", "README.md")
                }
            except httpx.HTTPStatusError as e:
                if e.response.status_code in (401, 403):
                    async with httpx.AsyncClient(base_url=self.base_url, headers=self.anon_headers, timeout=10.0) as anon_client:
                        try:
                            res = await self._get(anon_client, f"/repos/{repo_full_name}/readme")
                            data = res.json()
                            content = None
                            if "content" in data and data.get("encoding") == "base64":
                                content = base64.b64decode(data["content"]).decode('utf-8', errors='replace')
                            return {
                                "has_readme": True,
                                "content": content,
                                "name": data.get("name", "README.md"),
                                "path": data.get("path", "README.md")
                            }
                        except Exception:
                            return {"has_readme": False, "content": None, "name": None, "path": None}
                return {"has_readme": False, "content": None, "name": None, "path": None}
            except Exception as e:
                logger.debug(f"Failed to fetch README for {repo_full_name}: {e}")
                return {"has_readme": False, "content": None, "name": None, "path": None}

    async def inspect_repo_code(self, repo_full_name: str) -> Dict[str, Any]:
        """
        Deep code inspector: extracts file tree, identifies architecture manifests,
        and samples primary entrypoint source code.
        """
        tree_data = await self.get_repo_file_tree(repo_full_name)
        tree = tree_data.get("tree", [])
        
        file_paths = [item.get("path", "") for item in tree if item.get("type") == "blob"]
        tree_summary = "\n".join(file_paths[:60])
        if len(file_paths) > 60:
            tree_summary += f"\n... and {len(file_paths) - 60} more files"

        # Detect README presence from file tree
        has_readme = any(
            p.lower() in ("readme.md", "readme.txt", "readme", "readme.rst", ".github/readme.md")
            or p.lower().endswith("/readme.md")
            for p in file_paths
        )

        # Key architectural and manifest files to sample
        priority_files = [
            "package.json", "requirements.txt", "pyproject.toml", "Cargo.toml",
            "go.mod", "Dockerfile", "docker-compose.yml", "main.py", "index.ts",
            "src/App.tsx", "src/main.tsx", "server.js", "src/index.js"
        ]

        sample_code_pieces = []
        detected_manifests = []

        for p_file in priority_files:
            # Check direct match or subfolder match
            matching_paths = [p for p in file_paths if p.endswith(p_file) or p == p_file]
            if matching_paths:
                target_path = matching_paths[0]
                detected_manifests.append(target_path)
                if len(sample_code_pieces) < 4:
                    content = await self.get_file_content(repo_full_name, target_path)
                    if content:
                        trimmed = content[:2500]
                        sample_code_pieces.append(f"--- File: {target_path} ---\n{trimmed}")

        return {
            "file_tree": tree_summary or "Empty repository tree",
            "sample_code": "\n\n".join(sample_code_pieces) if sample_code_pieces else "No source code available",
            "detected_manifests": detected_manifests,
            "has_readme": has_readme,
            "total_files": len(file_paths)
        }

    async def push_file(self, repo_full_name: str, path: str, content: str, message: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(base_url=self.base_url, headers=self.headers, timeout=10.0) as client:
            sha = None
            try:
                get_response = await self._get(client, f"/repos/{repo_full_name}/contents/{path}")
                sha = get_response.json().get("sha")
            except httpx.HTTPStatusError as e:
                if e.response.status_code != 404:
                    raise
            
            body = {
                "message": message,
                "content": base64.b64encode(content.encode('utf-8')).decode('utf-8')
            }
            if sha:
                body["sha"] = sha

            response = await client.put(f"/repos/{repo_full_name}/contents/{path}", json=body)
            response.raise_for_status()
            return response.json()

    async def delete_file(self, repo_full_name: str, path: str, message: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(base_url=self.base_url, headers=self.headers, timeout=10.0) as client:
            try:
                get_response = await self._get(client, f"/repos/{repo_full_name}/contents/{path}")
                sha = get_response.json().get("sha")
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    return {"deleted": False, "message": f"{path} does not exist"}
                raise

            body = {
                "message": message,
                "sha": sha
            }
            response = await client.request("DELETE", f"/repos/{repo_full_name}/contents/{path}", json=body)
            response.raise_for_status()
            return response.json()

    async def remediate_repo(self, repo_full_name: str, action: str) -> Dict[str, Any]:
        if action in ("add_gitignore", "fix_all"):
            push_res = await self.push_file(
                repo_full_name=repo_full_name,
                path=".gitignore",
                content=STANDARD_GITIGNORE,
                message="fix(security): add standard .gitignore with secret exclusions"
            )
            commit_sha = push_res.get("commit", {}).get("sha")
            return {
                "remediated": True,
                "action_taken": "add_gitignore",
                "commit_sha": commit_sha,
                "message": "Successfully pushed standard .gitignore to repository."
            }
        elif action == "remove_env":
            del_res = await self.delete_file(
                repo_full_name=repo_full_name,
                path=".env",
                message="fix(security): remove committed .env secret file"
            )
            commit_sha = del_res.get("commit", {}).get("sha")
            return {
                "remediated": True,
                "action_taken": "remove_env",
                "commit_sha": commit_sha,
                "message": "Successfully removed .env file from repository."
            }
        return {
            "remediated": False,
            "action_taken": action,
            "commit_sha": None,
            "message": f"Action '{action}' not recognized."
        }

    async def scan_for_secrets(self, repo_full_name: str) -> Dict[str, Any]:
        tree_data = await self.get_repo_file_tree(repo_full_name)
        tree = tree_data.get("tree", [])
        
        has_gitignore = False
        has_env_file = False
        has_readme = False
        leaked_secrets = []
        
        extensions_to_scan = ('.py', '.js', '.ts', '.json', '.yml', '.yaml', '.txt', '.md')
        
        for item in tree:
            if item.get("type") != "blob":
                continue
                
            path = item.get("path", "")
            
            if '/' not in path and path.lower() in ('readme.md', 'readme.txt', 'readme'):
                has_readme = True
                
            if path == ".gitignore" or path.endswith("/.gitignore"):
                has_gitignore = True
            
            if path == ".env" or path.endswith("/.env"):
                has_env_file = True
                
            if path.endswith(extensions_to_scan) or "config" in path.lower() or "secret" in path.lower():
                content = await self.get_file_content(repo_full_name, path)
                if content:
                    lines = content.split('\n')
                    for line_num, line in enumerate(lines, 1):
                        for pattern, description in SECRET_PATTERNS:
                            if re.search(pattern, line):
                                leaked_secrets.append({
                                    "file": path,
                                    "line": line_num,
                                    "pattern": description
                                })
                await asyncio.sleep(0.05)
                
        return {
            "has_gitignore": has_gitignore,
            "has_env_file": has_env_file,
            "has_readme": has_readme,
            "leaked_secrets": leaked_secrets,
            "ai_issues": []
        }

    def calculate_health_score(self, repo: GithubRepo, scan: RepoScan) -> int:
        score = 100
        if not repo.has_readme:
            score -= 20
        if not scan.has_gitignore:
            score -= 10
        if scan.has_env_file:
            score -= 30
        if scan.leaked_secrets and len(scan.leaked_secrets) > 0:
            score -= (20 * len(scan.leaked_secrets))
        if scan.ai_issues and len(scan.ai_issues) > 0:
            score -= (5 * len(scan.ai_issues))
        return max(0, score)

github_service = GitHubService()
