export type Project = {
  id: number;
  name: string;
  client: string;
  description: string;
  created_at: string;
  updated_at?: string;
  visits_count: number;
  reports_count: number;
  last_visit_date?: string | null;
};

export type Asset = {
  id: number;
  kind: 'pdf' | 'audio' | 'photo' | string;
  filename: string;
  url: string;
  public_id?: string | null;
  mime_type?: string | null;
  extracted_text: string;
  transcript: string;
  created_at: string;
};

export type Visit = {
  id: number;
  project_id: number;
  visit_date: string;
  text_notes: string;
  audio_transcription: string;
  created_at: string;
  assets: Asset[];
};

export type TemplateSection = {
  title: string;
  description: string;
  instructions: string;
  required: boolean;
};

export type ReportTemplate = {
  id: number;
  name: string;
  client: string;
  description: string;
  sections: TemplateSection[];
  ai_instructions: string;
  required_fields: string[];
  created_at: string;
  updated_at?: string;
};

export type Report = {
  id: number;
  project_id: number;
  template_id: number;
  title: string;
  html_content: string;
  source_payload: Record<string, unknown>;
  created_at: string;
  project_name?: string | null;
  template_name?: string | null;
};

export type DashboardData = {
  projects: number;
  visits: number;
  reports: number;
  templates: number;
  recent_projects: Project[];
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    is_active: boolean;
    created_at: string;
  };
};
