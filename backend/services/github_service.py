import httpx
import asyncio
import re
import base64
from typing import List, Dict, Any, Optional
from config import settings
from models.github import GithubRepo, RepoScan

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
        return {
            "Authorization": f"Bearer {settings.github_pat}",
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }

    async def _get(self, client: httpx.AsyncClient, url: str, params: Optional[Dict] = None) -> httpx.Response:
        response = await client.get(url, params=params)
        response.raise_for_status()
        return response

    async def get_all_repos(self) -> List[Dict[str, Any]]:
        # fetch all repos for GITHUB_USERNAME
        repos = []
        page = 1
        async with httpx.AsyncClient(base_url=self.base_url, headers=self.headers) as client:
            while True:
                response = await self._get(
                    client,
                    "/user/repos",
                    params={"per_page": 100, "page": page}
                )
                data = response.json()
                if not data:
                    break
                repos.extend(data)
                page += 1
                await asyncio.sleep(0.1) # Rate limit protection
        return repos

    async def get_repo_file_tree(self, repo_full_name: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(base_url=self.base_url, headers=self.headers) as client:
            try:
                # GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1
                response = await self._get(client, f"/repos/{repo_full_name}/git/trees/HEAD", params={"recursive": "1"})
                return response.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404 or e.response.status_code == 409:
                    return {"tree": []}
                raise

    async def get_file_content(self, repo_full_name: str, path: str) -> Optional[str]:
        async with httpx.AsyncClient(base_url=self.base_url, headers=self.headers) as client:
            try:
                response = await self._get(client, f"/repos/{repo_full_name}/contents/{path}")
                data = response.json()
                if "content" in data and data["encoding"] == "base64":
                    return base64.b64decode(data["content"]).decode('utf-8')
                return None
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    return None
                raise

    async def push_file(self, repo_full_name: str, path: str, content: str, message: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(base_url=self.base_url, headers=self.headers) as client:
            # Check if file exists to get SHA
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
        async with httpx.AsyncClient(base_url=self.base_url, headers=self.headers) as client:
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
        """
        Remediate security risks by adding .gitignore or deleting committed .env secrets.
        """
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
        # fetch Python/JS/config files, run SECRET_PATTERNS regex
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
                await asyncio.sleep(0.1) # Rate limit protection
                
        return {
            "has_gitignore": has_gitignore,
            "has_env_file": has_env_file,
            "has_readme": has_readme,
            "leaked_secrets": leaked_secrets,
            "ai_issues": [] # To be populated by AI agent if needed
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
            # Serious penalty for leaked secrets
            score -= (20 * len(scan.leaked_secrets))
            
        if scan.ai_issues and len(scan.ai_issues) > 0:
            score -= (5 * len(scan.ai_issues))
            
        return max(0, score)

github_service = GitHubService()
