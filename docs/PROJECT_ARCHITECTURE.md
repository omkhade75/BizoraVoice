# BizoraVoice System Architecture & Technology Stack

**Date:** 2026-10-31  
**Project:** BizoraVoice (BizVoice) Enterprise Voice AI Platform  
**Target Standard:** Vapi-Grade Autonomous Telephony & Conversational Voice Infrastructure  

---

## 1. System Overview

BizoraVoice is a full-duplex, low-latency Voice AI infrastructure platform designed to power voice agents for enterprise businesses, customer service, and outbound outreach. The platform provides independent, modular abstractions across:
- **Speech-to-Text (STT):** Deepgram Nova-2 / Streaming WebSocket, Local Whisper
- **Large Language Models (LLM):** Local Ollama (`qwen3.5:4b`, `llama3.2`) and Cloud Google Gemini (`gemini-2.0-flash`)
- **Text-to-Speech (TTS):** Edge-TTS (multilingual neural voices: Marathi, Hindi, Gujarati, Tamil, English) and Kokoro-82M
- **Telephony Transport:** Twilio Media Streams (Bidirectional 8kHz mu-law audio over WebSockets) and Browser WebRTC/PCM WebSockets
- **Persistence & Multi-Tenancy:** Supabase PostgreSQL 17.11 with SSL and row-level security

---

## 2. Technology Stack & Frameworks

### Frontend Architecture
- **Framework:** Next.js 16.3.6 (App Router)
- **Language / Runtime:** TypeScript 5.x, Node.js v20.x
- **UI Library & Styling:** Tailwind CSS 3.4, Radix UI primitives, Lucide React icons
- **State Management:** React 19 Hooks (`useState`, `useEffect`, `useCallback`, `useRef`)
- **Theme & Design System:** High-taste dark zinc palette (`#09090b` background, `#18181b` card surfaces, subtle `#27272a` borders, emerald `#10b981` accents)
- **Audio I/O:** Web Audio API (`AudioContext`, `MediaStreamAudioSourceNode`, `AudioWorkletNode`)

### Backend Architecture
- **Framework:** FastAPI 0.115+ (Python 3.13)
- **Server:** Uvicorn ASGI server with async event loop
- **Database ORM:** SQLAlchemy 2.0 with `asyncpg` async PostgreSQL driver + SQLite fallback
- **Authentication:** PBKDF2-HMAC-SHA256 password hashing (100,000 iterations), JWT access tokens (HS256), customer API keys (`bv_live_...` with SHA-256 indexed hash)
- **Telephony Client:** Twilio Python SDK (`twilio.rest.Client`), TwiML voice response generation
- **AI Integrations:** Google Generative AI Python SDK (`google-generativeai`), Ollama REST API (`httpx.AsyncClient`)
- **Voice Synthesis:** `edge-tts` async streaming engine, PyTorch / Kokoro neural inference

---

## 3. Database Schema (Supabase PostgreSQL 17.11)

### Tables & Relationships
1. **`users`**: User identity, role (`admin`, `developer`, `member`), tier (`free`, `pro`, `enterprise`), credit balance.
2. **`workspaces`**: Multi-tenant isolation boundary, workspace name, plan tier, settings.
3. **`workspace_members`**: Linking users to workspaces with RBAC permissions (`owner`, `admin`, `member`).
4. **`agents`**: Voice assistant configurations (name, prompt, voice, model, language, temperature, max duration, webhook).
5. **`agent_versions`**: Immutable snapshot versions of agents for staging vs. production deployment.
6. **`squads`**: Multi-agent orchestration groups with member assistants and handoff conditions.
7. **`tools`**: Reusable function definitions, HTTP webhook parameters, and input/output JSON schemas.
8. **`knowledge_bases`**: RAG knowledge collections linked to assistants.
9. **`knowledge_documents`**: Ingested files, chunk text, and vector embeddings.
10. **`phone_numbers`**: Imported Twilio phone numbers with per-tenant encrypted credentials (`account_sid`, `encrypted_auth_token`), webhook status, and assigned agent.
11. **`calls`**: Call records, duration, cost savings, status (`active`, `completed`, `failed`), client type (`web_dashboard`, `twilio_inbound`, `twilio_outbound`).
12. **`messages`**: Turn-by-turn conversation transcripts with speaker roles (`user`, `assistant`, `system`), timestamps, and latency telemetry.
13. **`evaluations`**: Evaluation test suites, rubric criteria, pass/fail grading results.
14. **`simulations`**: Persona-driven automated test conversations.
15. **`webhooks`**: Outbound event delivery subscriptions with HMAC signatures and retry logs.
16. **`api_keys`**: Customer API keys for programmatic SDK access (`bv_live_...`).

---

## 4. API Endpoints Map

### Authentication & Tenant Management
- `POST /api/auth/register` — Create new user account and personal workspace
- `POST /api/auth/login` — Authenticate credentials and return JWT bearer token
- `GET /api/auth/me` — Retrieve current authenticated user and workspace profile
- `GET /api/workspaces` — List workspaces accessible to user
- `POST /api/workspaces` — Create new workspace

### Voice Assistants (Agents)
- `GET /api/assistants` — List all assistants in workspace
- `POST /api/assistants` — Create new assistant
- `GET /api/assistants/{id}` — Get assistant configuration
- `PUT /api/assistants/{id}` — Update assistant configuration
- `DELETE /api/assistants/{id}` — Delete assistant
- `POST /api/assistants/{id}/duplicate` — Duplicate assistant
- `POST /api/assistants/{id}/publish` — Create immutable published version

### Model Providers & Discovery
- `GET /api/models/ollama` — Query live local Ollama instance for installed models
- `GET /api/models/gemini` — List supported Google Gemini cloud models
- `POST /api/settings/keys` — Store encrypted provider credentials (Gemini, ElevenLabs, Twilio)
- `GET /api/settings/keys` — Check configured status of provider credentials (redacted)

### Telephony & Twilio Integration
- `POST /api/telephony/verify-twilio` — Validate Twilio Account SID & Auth Token
- `POST /api/telephony/numbers/import` — Import and configure real Twilio number
- `GET /api/telephony/numbers` — List all configured phone numbers
- `DELETE /api/telephony/numbers/{id}` — Disconnect phone number
- `POST /api/telephony/inbound` — Twilio webhook endpoint returning TwiML `<Connect><Stream>`
- `POST /api/telephony/outbound` — Dispatch outbound phone call via tenant's Twilio account
- `GET /api/telephony/ws/media` — Twilio bidirectional media streaming WebSocket

### Real-Time Web Audio
- `GET /api/telephony/ws/client/{agent_id}` — Browser audio WebSocket for interactive playground

### Advanced Voice AI Modules
- `GET /api/squads` & `POST /api/squads` — Multi-agent squads CRUD
- `GET /api/tools` & `POST /api/tools` — Reusable tools & HTTP API functions
- `POST /api/tools/{id}/test` — Test real tool execution
- `GET /api/knowledge` & `POST /api/knowledge/upload` — Ingest documents & search knowledge base
- `GET /api/voices` & `POST /api/voices/preview` — Neural voice library & real audio preview
- `GET /api/analytics` — Dynamic call volume, duration, and latency metrics
- `GET /api/evaluations` & `POST /api/evaluations/run` — Automated evaluation test runner

---

## 5. Security & Boundary Rules
1. **No Mock Auth Fallbacks:** Failed authentications reject immediately with HTTP 401.
2. **Route Protection:** Frontend routes verify active token; redirect to `/login` when absent.
3. **Encrypted Credentials:** Tenant Twilio Auth Tokens and Gemini keys are encrypted at rest using server-side PBKDF2/AES.
4. **Tenant Isolation:** All database queries are filtered by `user_id` or `workspace_id`.
5. **No Secrets in Frontend:** API keys are never bundled into client-side JS.
