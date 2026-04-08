export interface JobListing { id: string; indeed_id: string; title: string; company?: string; location?: string; description: string; salary_range?: string; job_type?: string; target_role: string; fetched_at: string; }
export interface JDKeyword { id: string; target_role: string; keyword: string; frequency: number; is_technical: boolean; last_seen_at: string; }
