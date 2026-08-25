export interface RepoScan {
  id: string;
  repo_id: string;
  health_score?: number;
  resume_score?: number;
  portfolio_tier?: string;
  key_technologies?: string[];
  architecture_summary?: string;
  resume_bullets?: string[];
  recommendation_reason?: string;
  production_readiness?: {
    has_tests?: boolean;
    has_docker?: boolean;
    has_ci_cd?: boolean;
    code_quality_rating?: string;
  };
  has_gitignore?: boolean;
  has_env_file?: boolean;
  leaked_secrets?: any[];
  ai_issues?: any[];
  scanned_at: string;
}

export interface GithubRepo {
  id: string;
  github_id: number;
  name: string;
  full_name: string;
  description?: string;
  language?: string;
  topics?: string[];
  has_readme: boolean;
  readme_content?: string;
  is_private: boolean;
  stars: number;
  forks_count?: number;
  open_issues_count?: number;
  size_kb?: number;
  default_branch?: string;
  license_name?: string;
  html_url?: string;
  last_pushed_at?: string;
  synced_at: string;
  latest_scan?: RepoScan;
}

export interface ReadmeGenerateResponse {
  readme_markdown: string;
  suggestion_id: string;
}

export interface ReadmePushResponse {
  committed: boolean;
  sha: string;
}

export interface RemediateResponse {
  repo_full_name: string;
  remediated: boolean;
  action_taken: string;
  commit_sha?: string;
  message: string;
}
