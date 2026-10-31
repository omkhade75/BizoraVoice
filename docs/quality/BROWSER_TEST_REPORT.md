# Automated Browser Test Report

**Test Framework:** Playwright Automation via Antigravity MCP  
**Execution Environment:** Chromium (Headless & Interactive), Windows 11  
**Target Host:** `http://localhost:3000` (Next.js 16.3.6 App Router)  
**Backend:** `http://127.0.0.1:8000` (FastAPI / Uvicorn) connected to Supabase PostgreSQL  
**Audit Date:** October 31, 2026

---

## 1. Summary of Route Verifications

| Route Path | Page Title / Purpose | HTTP Status | Console Errors | Visual Integrity | Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | Landing & Interactive 3D Voice Hero | 200 OK | 0 | Sub-329ms telemetry, 3D WebGL Canvas | **PASS** |
| `/agents` | Voice AI Assistants Catalog | 200 OK | 0 | Grid of multilingual agents, search bar | **PASS** |
| `/squads` | Multi-Agent Orchestration & Swarms | 200 OK | 0 | Leader routing, handoff rules, transfer cues | **PASS** |
| `/numbers` | Phone Numbers & BYOT Twilio | 200 OK | 0 | 4G VoLTE SIM gateway, Twilio binding | **PASS** |
| `/campaigns` | Outbound Bulk Contact Dialer | 200 OK | 0 | Authentic empty state, CSV modal | **PASS** |
| `/tools` | Tools, Functions & Webhooks | 200 OK | 0 | JSON Schema editor, sandbox runner | **PASS** |
| `/knowledge` | Semantic Document Store (RAG) | 200 OK | 0 | Document upload, semantic search bar | **PASS** |
| `/voices` | Neural Voice Library Catalog | 200 OK | 0 | Indian regional voices, audio samples | **PASS** |
| `/analytics` | End-to-End Latency Waterfall | 200 OK | 0 | Sub-329ms waterfall, cost savings cards | **PASS** |
| `/evaluations` | LLM-as-a-Judge QA Scorecards | 200 OK | 0 | Live test suite runner, criteria results | **PASS** |
| `/developers` | API Keys & SDK Quickstart | 200 OK | 0 | Live key generator, copy snippets | **PASS** |
| `/settings` | Organization & Cloud Settings | 200 OK | 0 | Gemini key input, Supabase connection status | **PASS** |
| `/call` | Real-Time Voice Playground | 200 OK | 0 | 3D Voice Orb, WebRTC mic loop, audio stats | **PASS** |
| `/login` | Enterprise Authentication | 200 OK | 0 | Clean email/password form, CSRF token | **PASS** |
| `/signup` | User Onboarding & Registration | 200 OK | 0 | Multi-field validation, terms compliance | **PASS** |

---

## 2. Interactive Feature Validations

### 1. New Assistant Creation & Database Persistence
- **Action:** Opened "+ New Assistant" modal on `/agents`.
- **Payload:** Name: *"Mumbai Port Seafood Export Desk"*, Voice: `mr-IN-AarohiNeural`, System Prompt: *"You are Bizora Voice handling bulk cold-storage shrimp orders."*.
- **Result:** Successfully issued `POST /api/agents` returning HTTP 201 Created. The new card appeared immediately in the catalog and persisted across browser refreshes.

### 2. Evaluation Suite Execution
- **Action:** Navigated to `/evaluations` and clicked *"Run Test Suite"* on *"APMC Onion Pricing & Quantity Compliance"*.
- **Payload:** `POST /api/evaluations/eval-supplier-quote/run`.
- **Result:** Backend loaded the rubric from Supabase PostgreSQL, evaluated all 3 criteria, and returned HTTP 200 with `score_percentage: 100.0`. The UI rendered green badges with detailed criteria notes.

### 3. API Key Generation & Revocation
- **Action:** Entered key title *"Mumbai Logistics Core Key"* on `/developers` and clicked *"Create Key"*.
- **Result:** Backend issued `POST /api/api-keys`, generated `bv_live_53ce1a5...`, securely hashed the key via bcrypt, and returned the one-time raw secret. The UI displayed a prominent copy banner and added the key to the active keys list.

### 4. 3D WebGL Voice Core Telemetry
- **Action:** Tested all 4 conversational states (`idle`, `listening`, `processing`, `speaking`) on `/`.
- **Result:** WebGL shader adapted dynamically with smooth spring curves, updating particle intensity, glow radius, and soundwave frequency without dropping frames.
