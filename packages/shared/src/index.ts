// Types partagés entre le frontend (web) et le backend (api)

export type CommunicationStyle = "humoristique" | "inspirant" | "pédagogique" | "brut";
export type SocialNetwork = "tiktok" | "instagram" | "linkedin" | "youtube";
export type VideoStatus = "pending" | "processing" | "ready" | "published" | "error";
export type ScriptStatus = "draft" | "validated" | "archived";

export interface Profile {
  id: string;
  user_id: string;
  company_name: string;
  sector: string;
  target_audience: string;
  products_services: string;
  communication_style: CommunicationStyle;
  social_networks: SocialNetwork[];
  brand_colors: string[];
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoIdea {
  id: string;
  user_id: string;
  theme: string;
  title: string;
  hook: string;
  hashtags: string[];
  estimated_duration: number;
  network?: SocialNetwork;
  created_at: string;
}

export interface Script {
  id: string;
  idea_id?: string;
  user_id: string;
  content: string;
  network: SocialNetwork;
  status: ScriptStatus;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  script_id?: string;
  user_id: string;
  status: VideoStatus;
  file_url?: string;
  thumbnail_url?: string;
  network?: SocialNetwork;
  published_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Réponses API génériques
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
