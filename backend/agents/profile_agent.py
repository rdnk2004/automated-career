"""
Profile Intelligence Agent

Wraps the multi-module analysis flow (LinkedIn + Resume + GitHub) into a
coordinated agent loop with a maximum of 5 iterations to control token usage.

This is a lightweight agent using function-calling style coordination —
no LangChain needed (per PRD spec).
"""
import json
from typing import Optional

from services import gemini_service as gemini
from services import github_service as github
from services import resume_service as resume
from services import linkedin_service as linkedin


class ProfileIntelligenceAgent:
    """
    Agent 1 — Profile Intelligence Agent.
    Handles multi-step analysis across LinkedIn + Resume + GitHub.
    Max 5 iterations to control free-tier token usage.
    """

    MAX_ITERATIONS = 5

    def __init__(self, db=None):
        self.db = db
        self.context = {
            "linkedin_profile": None,
            "resume_text": None,
            "github_repos": [],
            "github_analyses": [],
            "jd_text": "",
        }

    async def run(
        self,
        jd_text: str = "",
        resume_bytes: Optional[bytes] = None,
        resume_mime: str = "application/pdf",
    ) -> dict:
        """
        Execute the profile intelligence loop.
        Returns a consolidated analysis result.
        """
        self.context["jd_text"] = jd_text
        iteration = 0
        results = {}

        steps = ["fetch_linkedin", "parse_resume", "fetch_github", "analyze", "summarize"]

        for step in steps:
            if iteration >= self.MAX_ITERATIONS:
                break
            iteration += 1

            try:
                if step == "fetch_linkedin":
                    profile_result = linkedin.get_own_profile(db=self.db)
                    if profile_result:
                        self.context["linkedin_profile"] = profile_result.get("data", {})
                    results["linkedin_fetched"] = bool(self.context["linkedin_profile"])

                elif step == "parse_resume":
                    if resume_bytes:
                        self.context["resume_text"] = resume.parse_pdf(resume_bytes)
                    results["resume_parsed"] = bool(self.context["resume_text"])

                elif step == "fetch_github":
                    repos = github.fetch_all_repos()
                    self.context["github_repos"] = repos
                    results["github_repos_count"] = len(repos)

                elif step == "analyze":
                    # Analyze top project repos
                    project_repos = [
                        r for r in self.context["github_repos"]
                        if github.classify_repo(r) == "project"
                    ][:5]

                    repo_data_list = []
                    for repo in project_repos:
                        owner = repo.get("owner", {}).get("login", "") or repo.get("full_name", "").split("/")[0]
                        repo_name = repo.get("name", "")
                        if owner and repo_name:
                            data = github.fetch_github_repo_data(owner, repo_name)
                            if data:
                                repo_data_list.append(data)

                    self.context["github_analyses"] = await gemini.analyze_github_repos(repo_data_list)
                    results["repos_analyzed"] = len(self.context["github_analyses"])

                elif step == "summarize":
                    # LinkedIn analysis
                    if self.context["linkedin_profile"]:
                        li_analysis = await gemini.analyze_linkedin_profile(
                            self.context["linkedin_profile"], jd_text
                        )
                        results["linkedin_analysis"] = li_analysis

                    # Resume highlights
                    if resume_bytes:
                        resume_highlights = await gemini.analyze_resume_highlights(
                            resume_bytes, resume_mime
                        )
                        results["resume_highlights"] = resume_highlights

                    results["github_analyses"] = self.context["github_analyses"]

            except Exception as e:
                print(f"[ProfileAgent] Step '{step}' error: {e}")
                results[f"{step}_error"] = str(e)

        return results


async def run_profile_agent(
    db=None,
    jd_text: str = "",
    resume_bytes: Optional[bytes] = None,
    resume_mime: str = "application/pdf",
) -> dict:
    """Convenience function to instantiate and run the agent."""
    agent = ProfileIntelligenceAgent(db=db)
    return await agent.run(jd_text=jd_text, resume_bytes=resume_bytes, resume_mime=resume_mime)
