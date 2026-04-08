export interface RepoScan { id: string; repo_id: string; health_score?: number; has_gitignore?: boolean; has_env_file?: boolean; leaked_secrets?: any[]; ai_issues?: any[]; scanned_at: string; }
export interface GithubRepo { id: string; github_id: number; name: string; full_name: string; description?: string; language?: string; topics?: string[]; has_readme: boolean; readme_content?: string; is_private: boolean; stars: number; last_pushed_at?: string; synced_at: string; latest_scan?: RepoScan; }

export interface ReadmeGenerateResponse { readme_markdown: string; suggestion_id: string; }
export interface ReadmePushResponse { committed: boolean; sha: string; }
