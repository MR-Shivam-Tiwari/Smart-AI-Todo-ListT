export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  priority_score: number;
  status: 'pending' | 'in_progress' | 'completed';
  deadline: string;
  created_at: string;
  updated_at: string;
  ai_suggestions?: string[];
}

export interface ContextEntry {
  id: string;
  content: string;
  source_type: 'whatsapp' | 'email' | 'notes';
  created_at: string;
  processed_insights?: string[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  usage_count: number;
}
