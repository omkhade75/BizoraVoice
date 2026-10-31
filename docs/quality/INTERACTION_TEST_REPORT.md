# Interactive Element & User Interaction Test Report

**Project:** Bizora Voice (Vaani Voice)  
**Test Suite:** Playwright Automated Interaction & User Event Dispatch  
**Audit Date:** October 31, 2026

---

## 1. Interactive Form & Button Test Matrix

| Page / Component | Interactive Element | Event Type | Expected Behavior | Actual Behavior | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Navbar / Header** | Theme Toggle | Click | Toggle Ivory Light / Obsidian Dark | Applied `.light` / `.dark` classes smoothly | **PASS** |
| **Voice Hero (`/`)** | "Listening" Pill | Click | Shift 3D core to listening state | Orb expanded with amber listening ripple | **PASS** |
| **Voice Hero (`/`)** | "Speaking" Pill | Click | Shift 3D core to speaking state | Frequency waves modulated to voice pitch | **PASS** |
| **Assistants (`/agents`)** | "+ New Assistant" | Click | Open assistant configuration modal | Modal opened with auto-focused name input | **PASS** |
| **Assistants (`/agents`)** | Create Form Submit | Click | POST payload to `/api/agents` | Created assistant in Supabase and closed modal | **PASS** |
| **Assistants (`/agents`)** | Search Input | Change | Filter assistant cards by name/voice | Instantly filtered visible cards | **PASS** |
| **Assistants (`/agents`)** | "Flow Canvas" Pill | Click | Display stage inspector visualizer | Rendered Linear-style execution pipeline | **PASS** |
| **Squads (`/squads`)** | "+ Create Squad" | Click | Open multi-agent swarm composer | Modal opened with leader & member selectors | **PASS** |
| **Numbers (`/numbers`)** | "+ Connect Number" | Click | Open BYOT Twilio / GSM SIM modal | Displayed Twilio Account SID & Token inputs | **PASS** |
| **Campaigns (`/campaigns`)** | "New Outbound Campaign" | Click | Open CSV contact upload modal | Modal opened with sample CSV download link | **PASS** |
| **Tools (`/tools`)** | "Execute Sandbox" | Click | Send test JSON to sandbox runner | Returned mock HTTP 200 payload | **PASS** |
| **Evaluations (`/evaluations`)** | "Run Test Suite" | Click | Trigger automated LLM judge suite | Completed test run with score scorecard | **PASS** |
| **Developers (`/developers`)** | "Create Key" | Click | Generate scoped API key | Inserted key into Supabase and revealed token | **PASS** |
| **Developers (`/developers`)** | SDK Tab Switcher | Click | Switch code snippet between languages | Toggled between cURL, Python, Node, and WS | **PASS** |
| **Settings (`/settings`)** | "Save Gemini Key" | Click | Encrypt and store Gemini API key | Updated configuration without exposing secret | **PASS** |

---

## 2. Modal & Dialog Integrity

- **Escape Key Handling:** All modals (`NewAgentModal`, `CreateSquadModal`, `NewToolModal`) register window keydown listeners and close cleanly when pressing `Escape`.
- **Backdrop Dismissal:** Clicking outside the modal container on the blurred backdrop triggers safe dismissal without submitting uncommitted form values.
- **Form Validation:** Mandatory fields (e.g. Assistant Name, System Prompt, API Key Title) enforce HTML5 and client-side validation; submit buttons remain disabled or provide inline error warnings until required fields are populated.
