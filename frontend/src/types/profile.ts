export interface ProfileSection { id: string; profile_id: string; section_type: string; title?: string; content: Record<string, any>; ai_score?: number; scored_at?: string; created_at: string; }
export interface UserProfile { id: string; raw_data: Record<string, any>; headline?: string; summary?: string; location?: string; linkedin_url?: string; updated_at: string; sections: ProfileSection[]; }
export interface LinkedInImportResponse { imported: boolean; sections_count: number; }
