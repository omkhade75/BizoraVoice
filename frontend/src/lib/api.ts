const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  greeting_message?: string;
  voice: string;
  language: string;
  model: string;
  temperature?: number;
  max_duration_seconds?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAgentPayload {
  name: string;
  system_prompt: string;
  greeting_message?: string;
  voice: string;
  language?: string;
  model: string;
  temperature?: number;
  max_duration_seconds?: number;
}

export interface Call {
  id: string;
  session_id: string;
  agent_id: string;
  agent_name?: string;
  status: 'completed' | 'failed' | 'in_progress' | 'missed';
  duration: number;
  started_at: string;
  ended_at?: string;
  cost_saved_usd?: number;
  cost_saved_inr?: number;
  transcript?: TranscriptEntry[];
}

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PlatformStats {
  total_calls: number;
  total_minutes: number;
  total_agents: number;
  cost_saved_usd: number;
  cost_saved_inr: number;
  hardware: {
    cpu: string;
    ram_available_gb: number;
    platform: string;
  };
}

export interface VoiceInfo {
  name: string;
  gender: string;
  language: string;
  lang_code: string;
  sample_text: string;
  is_neural: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  full_key?: string; // only present upon immediate creation
  created_at: string;
  last_used_at?: string;
  calls_count: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tier: string;
  credits: number;
}

export interface SupplierVoiceNotePayload {
  supplier_name: string;
  supplier_email: string;
  item_name: string;
  quantity: string;
  target_price?: string;
  language: string; // 'mr' (Marathi), 'hi' (Hindi), 'en', 'gu'
  custom_message?: string;
}

export interface SupplierVoiceNoteResult {
  status: string;
  supplier_email: string;
  audio_url: string;
  audio_filename: string;
  transcript_marathi: string;
  transcript_english: string;
  email_sent: boolean;
}

export interface CopilotChatResponse {
  reply: string;
  suggested_actions?: string[];
  code_snippet?: string;
}

// Token helper
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bv_token') || 'bv_live_demo998877665544332211';
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bv_token', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bv_token');
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    let parsedMessage = errorBody;
    try {
      const parsed = JSON.parse(errorBody);
      parsedMessage = parsed.detail || parsed.message || errorBody;
    } catch {
      // keep raw errorBody
    }
    throw new Error(parsedMessage || `API Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// Health & Stats
export async function getHealth(): Promise<{ status: string; models: Record<string, string> }> {
  return request('/api/health');
}

export async function getStats(): Promise<PlatformStats> {
  return request('/api/stats');
}

// Voices
export async function getVoices(): Promise<{ voices: VoiceInfo[] }> {
  return request('/api/voices');
}

// Auth
export async function loginUser(email: string, password: string): Promise<{ access_token: string; user: AuthUser }> {
  const res = await request<{ access_token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.access_token) {
    setAuthToken(res.access_token);
  }
  return res;
}

export async function getCurrentUser(): Promise<AuthUser> {
  return request('/api/auth/me');
}

// Developer API Keys
export async function getApiKeys(): Promise<ApiKey[]> {
  return request('/api/keys');
}

export async function createApiKey(name: string): Promise<ApiKey> {
  return request('/api/keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deleteApiKey(keyId: string): Promise<{ success: boolean }> {
  return request(`/api/keys/${keyId}`, {
    method: 'DELETE',
  });
}

// Agents
export async function getAgents(): Promise<Agent[]> {
  return request('/api/agents');
}

export async function getAgent(id: string): Promise<Agent> {
  return request(`/api/agents/${id}`);
}

export async function createAgent(data: CreateAgentPayload): Promise<Agent> {
  return request('/api/agents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAgent(id: string, data: Partial<CreateAgentPayload>): Promise<Agent> {
  return request(`/api/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAgent(id: string): Promise<void> {
  await request(`/api/agents/${id}`, { method: 'DELETE' });
}

// Calls & History
export async function getCalls(): Promise<Call[]> {
  return request('/api/calls');
}

export async function getCall(id: string): Promise<Call> {
  return request(`/api/calls/${id}`);
}

// Supplier Voice Note Outreach
export async function sendSupplierVoiceNote(payload: SupplierVoiceNotePayload): Promise<SupplierVoiceNoteResult> {
  return request('/api/suppliers/email-with-voicenote', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Bizora AI Copilot
export async function askCopilot(message: string, context?: string): Promise<CopilotChatResponse> {
  return request('/api/copilot/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  });
}

export function getAudioFileUrl(filename: string): string {
  return `${API_BASE}/api/voicenotes/${filename}`;
}
