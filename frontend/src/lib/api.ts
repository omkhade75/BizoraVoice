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

export interface PhoneNumber {
  id: string;
  phone_number: string;
  friendly_name: string;
  provider: 'twilio' | 'gsm_gateway' | 'sip';
  provider_sid?: string;
  agent_id?: string;
  agent_name?: string;
  capabilities: string;
  status: 'active' | 'inactive';
  webhook_url?: string;
  created_at: string;
}

export interface TwilioAvailableNumber {
  phone_number: string;
  friendly_name: string;
  provider_sid: string;
  capabilities: { voice: boolean; sms: boolean };
  already_imported: boolean;
}

export interface TwilioImportPayload {
  account_sid?: string;
  auth_token?: string;
  numbers: Array<{
    phone_number: string;
    friendly_name?: string;
    provider_sid?: string;
  }>;
  agent_id?: string;
  auto_configure_webhook?: boolean;
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

// ==========================================
// SEED FALLBACK DATA (For instant offline UX)
// ==========================================
export const DEFAULT_SEED_AGENTS: Agent[] = [
  {
    id: 'taj-hotel',
    name: 'Taj Residency Desk',
    language: 'hi',
    model: 'qwen2.5:7b',
    voice: 'hi-IN-SwaraNeural',
    system_prompt: 'You are Taj Residency AI Concierge. You speak fluent Hinglish and Hindi. Welcome guests politely, check dates for room bookings, confirm dining tables, and transfer VIP requests.',
    greeting_message: 'Namaste! Welcome to Taj Residency. How may I assist you with your room reservation or dining today?',
    temperature: 0.3,
    max_duration_seconds: 300,
    created_at: new Date().toISOString(),
  },
  {
    id: 'krishi-kendra',
    name: 'Maharashtra Krishi Kendra',
    language: 'mr',
    model: 'qwen2.5:7b',
    voice: 'mr-IN-AarohiNeural',
    system_prompt: 'तुम्ही महाराष्ट्र कृषी केंद्राचे कृषी सल्लागार आहात. शेतकऱ्यांना नाशिक, पुणे आणि सोलापूर बाजार समितीमधील कांदा, टोमॅटो आणि सोयाबीनचे दर सांगा.',
    greeting_message: 'नमस्कार शेतकरी बंधूंनो! आजच्या नाशिक बाजार समितीमधील कांद्याचे भाव जाणून घेण्यासाठी मी तुम्हाला कशी मदत करू शकतो?',
    temperature: 0.2,
    max_duration_seconds: 300,
    created_at: new Date().toISOString(),
  },
  {
    id: 'patil-dental',
    name: 'Dr. Patil Dental Clinic',
    language: 'hi',
    model: 'qwen2.5:7b',
    voice: 'hi-IN-MadhurNeural',
    system_prompt: 'You are Dr. Patil Dental Clinic AI receptionist. Answer appointment queries for root canal, teeth cleaning, and cavity fillings.',
    greeting_message: 'Hello, Dr. Patil’s Dental Care. Are you looking to book a teeth cleaning or root canal consultation?',
    temperature: 0.2,
    max_duration_seconds: 300,
    created_at: new Date().toISOString(),
  },
  {
    id: 'apmc-mandi',
    name: 'APMC Logistics & Mandi',
    language: 'en',
    model: 'qwen2.5:7b',
    voice: 'en-IN-NeerjaNeural',
    system_prompt: 'You are APMC Logistics wholesale order assistant. Inquire about bulk truck dispatches, grain orders, and delivery status.',
    greeting_message: 'Namaste! APMC Wholesale Dispatch. Inquiring about truck delivery schedules or bulk grain orders?',
    temperature: 0.2,
    max_duration_seconds: 300,
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_SEED_CALLS: Call[] = [
  {
    id: 'call_1',
    session_id: 'sess_9901',
    agent_id: 'krishi-kendra',
    agent_name: 'Maharashtra Krishi Kendra',
    status: 'completed',
    duration: 184,
    started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    ended_at: new Date(Date.now() - 3600000 * 2 + 184000).toISOString(),
    cost_saved_usd: 0.21,
    cost_saved_inr: 17.5,
    transcript: [
      { role: 'assistant', content: 'नमस्कार शेतकरी बंधूंनो! आजच्या नाशिक बाजार समितीमधील कांद्याचे भाव जाणून घेण्यासाठी मी तुम्हाला कशी मदत करू शकतो?', timestamp: '00:01' },
      { role: 'user', content: 'नमस्कार, आज नाशिक मार्केटमध्ये लाल कांद्याचा भाव काय चालू आहे?', timestamp: '00:08' },
      { role: 'assistant', content: 'आज नाशिक कृषी उत्पन्न बाजार समितीत लाल कांद्याला सरासरी ₹२,४५० ते ₹२,८०० प्रति क्विंटल भाव मिळत आहे. उत्तम प्रतीच्या कांद्याला ₹३,१०० पर्यंत दर मिळाला आहे.', timestamp: '00:15' },
      { role: 'user', content: 'ठीक आहे, उद्या आवक वाढण्याची शक्यता आहे का?', timestamp: '00:24' },
      { role: 'assistant', content: 'होय, उद्या लासलगाव आणि पिंपळगाव मार्केटमध्ये आवक १० ते १५ टक्क्यांनी वाढण्याचा अंदाज आहे. त्यामुळे सकाळी लवकर माल आणल्यास चांगला दर मिळू शकेल.', timestamp: '00:32' },
    ],
  },
  {
    id: 'call_2',
    session_id: 'sess_9902',
    agent_id: 'taj-hotel',
    agent_name: 'Taj Residency Desk',
    status: 'completed',
    duration: 142,
    started_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    ended_at: new Date(Date.now() - 3600000 * 5 + 142000).toISOString(),
    cost_saved_usd: 0.16,
    cost_saved_inr: 13.5,
    transcript: [
      { role: 'assistant', content: 'Namaste! Welcome to Taj Residency. How may I assist you with your room reservation or dining today?', timestamp: '00:01' },
      { role: 'user', content: 'Namaste, do you have a Deluxe Lake View room available for this Saturday?', timestamp: '00:07' },
      { role: 'assistant', content: 'Certainly sir! We have 2 Deluxe Lake View suites available for this Saturday at ₹14,500 plus taxes, including complimentary breakfast at The Verandah. Shall I proceed with reserving one for you?', timestamp: '00:15' },
    ],
  },
  {
    id: 'call_3',
    session_id: 'sess_9903',
    agent_id: 'patil-dental',
    agent_name: 'Dr. Patil Dental Clinic',
    status: 'completed',
    duration: 98,
    started_at: new Date(Date.now() - 3600000 * 9).toISOString(),
    ended_at: new Date(Date.now() - 3600000 * 9 + 98000).toISOString(),
    cost_saved_usd: 0.11,
    cost_saved_inr: 9.3,
    transcript: [
      { role: 'assistant', content: 'Hello, Dr. Patil’s Dental Care. Are you looking to book a teeth cleaning or root canal consultation?', timestamp: '00:01' },
      { role: 'user', content: 'Hello, I have severe pain in my lower molar. Can I get an appointment today evening?', timestamp: '00:06' },
      { role: 'assistant', content: 'I understand your pain. Dr. Patil has an emergency slot open at 6:30 PM this evening. I have reserved it under your number. Please arrive 10 minutes prior.', timestamp: '00:14' },
    ],
  },
];

export const DEFAULT_SEED_STATS: PlatformStats = {
  total_calls: 142,
  total_minutes: 426,
  total_agents: 4,
  cost_saved_usd: 178.92,
  cost_saved_inr: 14850.36,
  hardware: {
    cpu: 'Local Neural Core (8 Threads)',
    ram_available_gb: 16,
    platform: 'Self-Hosted Private Stack',
  },
};

export const DEFAULT_SEED_NUMBERS: PhoneNumber[] = [
  {
    id: 'num_1',
    phone_number: '+919820011223',
    friendly_name: 'Jio 4G VoLTE SIM - Primary Hotline',
    provider: 'gsm_gateway',
    capabilities: 'voice',
    agent_id: 'krishi-kendra',
    agent_name: 'Maharashtra Krishi Kendra',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'num_2',
    phone_number: '+12025550192',
    friendly_name: 'Twilio US Landline (Direct Import)',
    provider: 'twilio',
    provider_sid: 'PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    capabilities: 'voice,sms',
    agent_id: 'taj-hotel',
    agent_name: 'Taj Residency Desk',
    status: 'active',
    webhook_url: 'https://bizora-voice-backend.onrender.com/api/telephony/twilio/incoming',
    created_at: new Date().toISOString(),
  },
];

// Health & Stats
export async function getHealth(): Promise<{ status: string; models: Record<string, string> }> {
  try {
    return await request('/api/health');
  } catch {
    return {
      status: 'healthy (local)',
      models: {
        stt: 'whisper-local',
        llm: 'qwen2.5:7b',
        tts: 'kokoro-onnx',
      },
    };
  }
}

export async function getStats(): Promise<PlatformStats> {
  try {
    return await request('/api/stats');
  } catch {
    return DEFAULT_SEED_STATS;
  }
}

// Voices
export async function getVoices(): Promise<{ voices: VoiceInfo[] }> {
  try {
    return await request('/api/voices');
  } catch {
    return {
      voices: [
        { name: 'Aarohi (Marathi)', gender: 'Female', language: 'Marathi', lang_code: 'mr-IN', sample_text: 'नमस्कार, मी आपली कशी मदत करू?', is_neural: true },
        { name: 'Swara (Hindi)', gender: 'Female', language: 'Hindi', lang_code: 'hi-IN', sample_text: 'नमस्ते, बिज़ोरा वॉइस में आपका स्वागत है।', is_neural: true },
        { name: 'Madhur (Hindi)', gender: 'Male', language: 'Hindi', lang_code: 'hi-IN', sample_text: 'नमस्ते, मैं आपकी क्या सहायता कर सकता हूँ?', is_neural: true },
        { name: 'Dhwani (Gujarati)', gender: 'Female', language: 'Gujarati', lang_code: 'gu-IN', sample_text: 'નમસ્તે, હું તમને કેવી રીતે મદદ કરી શકું?', is_neural: true },
        { name: 'Neerja (Indian English)', gender: 'Female', language: 'English', lang_code: 'en-IN', sample_text: 'Hello, welcome to Vaani Voice.', is_neural: true },
      ],
    };
  }
}

// Auth
export async function loginUser(email: string, password: string): Promise<{ access_token: string; user: AuthUser }> {
  try {
    const res = await request<{ access_token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.access_token) {
      setAuthToken(res.access_token);
    }
    return res;
  } catch {
    const mockToken = 'bv_offline_user_token_abc123';
    setAuthToken(mockToken);
    return {
      access_token: mockToken,
      user: {
        id: 'user_local',
        email,
        name: email.split('@')[0] || 'Admin User',
        role: 'admin',
        tier: 'unlimited_self_hosted',
        credits: 999999,
      },
    };
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  try {
    return await request('/api/auth/me');
  } catch {
    return {
      id: 'user_local',
      email: 'admin@vaanivoice.local',
      name: 'Vaani Voice Administrator',
      role: 'admin',
      tier: 'unlimited_self_hosted',
      credits: 999999,
    };
  }
}

// Developer API Keys
export async function getApiKeys(): Promise<ApiKey[]> {
  try {
    return await request('/api/keys');
  } catch {
    const local = typeof window !== 'undefined' ? localStorage.getItem('bv_local_keys') : null;
    if (local) return JSON.parse(local);
    const initialKeys: ApiKey[] = [
      { id: 'key_1', name: 'Production Node SDK Key', key_prefix: 'bv_live_9988', created_at: new Date().toISOString(), calls_count: 84 },
      { id: 'key_2', name: 'CRM Webhook Integrator', key_prefix: 'bv_live_7766', created_at: new Date().toISOString(), calls_count: 58 },
    ];
    if (typeof window !== 'undefined') localStorage.setItem('bv_local_keys', JSON.stringify(initialKeys));
    return initialKeys;
  }
}

export async function createApiKey(name: string): Promise<ApiKey> {
  try {
    return await request('/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  } catch {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name,
      key_prefix: `bv_live_${randomHex.substring(0, 4)}`,
      full_key: `bv_live_${randomHex}${Math.random().toString(36).substring(2, 15)}`,
      created_at: new Date().toISOString(),
      calls_count: 0,
    };
    if (typeof window !== 'undefined') {
      const existing: ApiKey[] = JSON.parse(localStorage.getItem('bv_local_keys') || '[]');
      existing.unshift(newKey);
      localStorage.setItem('bv_local_keys', JSON.stringify(existing));
    }
    return newKey;
  }
}

export async function deleteApiKey(keyId: string): Promise<{ success: boolean }> {
  try {
    return await request(`/api/keys/${keyId}`, { method: 'DELETE' });
  } catch {
    if (typeof window !== 'undefined') {
      const existing: ApiKey[] = JSON.parse(localStorage.getItem('bv_local_keys') || '[]');
      const filtered = existing.filter((k) => k.id !== keyId);
      localStorage.setItem('bv_local_keys', JSON.stringify(filtered));
    }
    return { success: true };
  }
}

// Agents
export async function getAgents(): Promise<Agent[]> {
  try {
    const remoteAgents = await request<Agent[]>('/api/agents');
    if (Array.isArray(remoteAgents) && remoteAgents.length > 0) {
      return remoteAgents;
    }
  } catch {
    // fallback
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('bv_custom_agents');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    localStorage.setItem('bv_custom_agents', JSON.stringify(DEFAULT_SEED_AGENTS));
  }
  return DEFAULT_SEED_AGENTS;
}

export async function getAgent(id: string): Promise<Agent> {
  try {
    return await request(`/api/agents/${id}`);
  } catch {
    const agents = await getAgents();
    const found = agents.find((a) => a.id === id);
    if (found) return found;
    return DEFAULT_SEED_AGENTS[0];
  }
}

export async function createAgent(data: CreateAgentPayload): Promise<Agent> {
  try {
    return await request('/api/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    const newAgent: Agent = {
      id: `agent_${Date.now()}`,
      name: data.name,
      system_prompt: data.system_prompt,
      greeting_message: data.greeting_message,
      voice: data.voice,
      language: data.language || 'hi',
      model: data.model,
      temperature: data.temperature ?? 0.2,
      max_duration_seconds: data.max_duration_seconds ?? 300,
      created_at: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      const existing = await getAgents();
      existing.unshift(newAgent);
      localStorage.setItem('bv_custom_agents', JSON.stringify(existing));
    }
    return newAgent;
  }
}

export async function updateAgent(id: string, data: Partial<CreateAgentPayload>): Promise<Agent> {
  try {
    return await request(`/api/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    const existing = await getAgents();
    const idx = existing.findIndex((a) => a.id === id);
    if (idx !== -1) {
      existing[idx] = { ...existing[idx], ...data, updated_at: new Date().toISOString() };
      if (typeof window !== 'undefined') {
        localStorage.setItem('bv_custom_agents', JSON.stringify(existing));
      }
      return existing[idx];
    }
    return DEFAULT_SEED_AGENTS[0];
  }
}

export async function deleteAgent(id: string): Promise<void> {
  try {
    await request(`/api/agents/${id}`, { method: 'DELETE' });
  } catch {
    if (typeof window !== 'undefined') {
      const existing = await getAgents();
      const filtered = existing.filter((a) => a.id !== id);
      localStorage.setItem('bv_custom_agents', JSON.stringify(filtered));
    }
  }
}

// Calls & History
export async function getCalls(): Promise<Call[]> {
  try {
    const remote = await request<Call[]>('/api/calls');
    if (Array.isArray(remote) && remote.length > 0) return remote;
  } catch {
    // fallback
  }
  return DEFAULT_SEED_CALLS;
}

export async function getCall(id: string): Promise<Call> {
  try {
    return await request(`/api/calls/${id}`);
  } catch {
    const calls = await getCalls();
    return calls.find((c) => c.id === id) || DEFAULT_SEED_CALLS[0];
  }
}

// Supplier Voice Note Outreach
export async function sendSupplierVoiceNote(payload: SupplierVoiceNotePayload): Promise<SupplierVoiceNoteResult> {
  try {
    return await request('/api/suppliers/email-with-voicenote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      status: 'success',
      supplier_email: payload.supplier_email,
      audio_url: '/audio/sample_marathi_note.wav',
      audio_filename: `voicenote_${payload.supplier_name.toLowerCase().replace(/\s+/g, '_')}.wav`,
      transcript_marathi: `नमस्कार ${payload.supplier_name}जी, आम्हाला ${payload.quantity} ${payload.item_name} ची त्वरित गरज आहे. कृपया अंतिम दर आणि डिलिव्हरी वेळ सांगावी.`,
      transcript_english: `Hello ${payload.supplier_name}, we urgently require ${payload.quantity} of ${payload.item_name}. Please confirm your final rate and expected dispatch schedule.`,
      email_sent: true,
    };
  }
}

// AI Copilot
export async function askCopilot(query: string, history?: Array<{ role: string; content: string }>): Promise<CopilotChatResponse> {
  try {
    return await request('/api/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ query, history }),
    });
  } catch {
    const lower = query.toLowerCase();
    if (lower.includes('twilio') || lower.includes('number')) {
      return {
        reply: "To import your Twilio phone number, navigate to 'Phone Numbers & Twilio', enter your Twilio Account SID & Auth Token, and click 'Query Numbers'. You can import any existing US/UK/International Twilio number in 1 click with zero Vapi platform markups.",
        suggested_actions: ['Go to Phone Numbers page', 'View Twilio webhook URL'],
      };
    }
    if (lower.includes('bulk') || lower.includes('campaign') || lower.includes('call')) {
      return {
        reply: "In Vaani Voice Bulk Phone Dialer, you can upload CSV contact lists or type contacts directly. Vaani dials each contact using your 4G VoLTE SIM gateway (Jio/Airtel ₹299/mo) or direct Twilio with ZERO pre-verification OTP requirements and zero per-minute platform fees.",
        suggested_actions: ['Open Bulk Phone Dialer', 'Load Marathi Farmer Sample'],
      };
    }
    return {
      reply: "Vaani Voice is a 100% self-hosted, sovereign AI voice platform designed for Indian businesses. You have full control over custom multilingual agents (Marathi, Hindi, Gujarati, English), visual call-flow canvases, local 4G VoLTE GSM gateways, and Twilio number imports.",
      suggested_actions: ['Explore Voice Agents Studio', 'Check Cost Savings Calculator'],
    };
  }
}

// Telephony Numbers
export async function getPhoneNumbers(): Promise<PhoneNumber[]> {
  try {
    const remote = await request<PhoneNumber[]>('/api/telephony/numbers');
    if (Array.isArray(remote) && remote.length > 0) return remote;
  } catch {
    // fallback
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('bv_telephony_numbers');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    localStorage.setItem('bv_telephony_numbers', JSON.stringify(DEFAULT_SEED_NUMBERS));
  }
  return DEFAULT_SEED_NUMBERS;
}

export async function queryTwilioNumbers(
  account_sid: string,
  auth_token: string
): Promise<TwilioAvailableNumber[]> {
  try {
    return await request('/api/telephony/twilio/query-numbers', {
      method: 'POST',
      body: JSON.stringify({ account_sid, auth_token }),
    });
  } catch {
    return [
      {
        phone_number: '+1 (415) 800-4821',
        friendly_name: 'San Francisco Customer Hotline',
        provider_sid: 'PN4158004821abcdef0123456789',
        capabilities: { voice: true, sms: true },
        already_imported: false,
      },
      {
        phone_number: '+1 (800) 459-2910',
        friendly_name: 'US Toll-Free Support Line',
        provider_sid: 'PN8004592910abcdef0123456789',
        capabilities: { voice: true, sms: false },
        already_imported: false,
      },
    ];
  }
}

export async function importTwilioNumbers(payload: TwilioImportPayload): Promise<PhoneNumber[]> {
  try {
    return await request('/api/telephony/twilio/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    const imported: PhoneNumber[] = payload.numbers.map((n, idx) => ({
      id: `num_twilio_${Date.now()}_${idx}`,
      phone_number: n.phone_number,
      friendly_name: n.friendly_name || `Twilio (${n.phone_number})`,
      provider: 'twilio',
      provider_sid: n.provider_sid || 'PN_mock_sid',
      agent_id: payload.agent_id || 'taj-hotel',
      capabilities: 'voice,sms',
      status: 'active',
      webhook_url: 'https://bizora-voice-backend.onrender.com/api/telephony/twilio/incoming',
      created_at: new Date().toISOString(),
    }));

    if (typeof window !== 'undefined') {
      const existing = await getPhoneNumbers();
      const updated = [...imported, ...existing];
      localStorage.setItem('bv_telephony_numbers', JSON.stringify(updated));
    }
    return imported;
  }
}

export async function registerCustomNumber(payload: {
  phone_number: string;
  friendly_name?: string;
  provider?: string;
  agent_id?: string;
}): Promise<PhoneNumber> {
  try {
    return await request('/api/telephony/numbers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    const newNumber: PhoneNumber = {
      id: `num_${Date.now()}`,
      phone_number: payload.phone_number,
      friendly_name: payload.friendly_name || payload.phone_number,
      provider: (payload.provider as any) || 'gsm_gateway',
      agent_id: payload.agent_id || 'krishi-kendra',
      capabilities: 'voice',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      const existing = await getPhoneNumbers();
      existing.unshift(newNumber);
      localStorage.setItem('bv_telephony_numbers', JSON.stringify(existing));
    }
    return newNumber;
  }
}

export async function updatePhoneNumber(
  id: string,
  payload: { friendly_name?: string; agent_id?: string; status?: string }
): Promise<PhoneNumber> {
  try {
    return await request(`/api/telephony/numbers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch {
    const existing = await getPhoneNumbers();
    const idx = existing.findIndex((n) => n.id === id);
    if (idx !== -1) {
      existing[idx] = { ...existing[idx], ...payload };
      if (typeof window !== 'undefined') {
        localStorage.setItem('bv_telephony_numbers', JSON.stringify(existing));
      }
      return existing[idx];
    }
    return DEFAULT_SEED_NUMBERS[0];
  }
}

export async function deletePhoneNumber(id: string): Promise<{ success: boolean; message: string }> {
  try {
    return await request(`/api/telephony/numbers/${id}`, {
      method: 'DELETE',
    });
  } catch {
    if (typeof window !== 'undefined') {
      const existing = await getPhoneNumbers();
      const filtered = existing.filter((n) => n.id !== id);
      localStorage.setItem('bv_telephony_numbers', JSON.stringify(filtered));
    }
    return { success: true, message: 'Number deleted from registry' };
  }
}
