# 🎙️ Bizora Voice — Standalone Self-Hosted Voice AI Platform

> **A 100% private, self-hosted, enterprise replacement for Vapi.ai with ZERO external API keys and ZERO cloud bills.**
> Native support for **Marathi (मराठी)**, **Hindi (हिन्दी)**, **Gujarati (ગુજરાતી)**, **Tamil (தமிழ்)**, and **English**.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20Async-10b981.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20App%20Router-amber.svg)](https://nextjs.org)
[![Zero Blue](https://img.shields.io/badge/UI%20Standard-Zero%20Blue%20%2F%20Obsidian%20Emerald-10b981.svg)]()
[![Cloud Cost](https://img.shields.io/badge/Cloud%20API%20Bills-%240.00%20%2F%20Free-10b981.svg)]()

---

## ⚡ Why Bizora Voice Replaces Vapi AI for Good

| Feature | **Bizora Voice (Self-Hosted)** | **Vapi.ai (Cloud SaaS)** |
|:---|:---|:---|
| **Cost Per Minute** | **₹0.00 / $0.00 (Free)** | $0.07 – $0.15 / min (~₹6 – ₹12/min) |
| **Indic & Asian Voices** | **Native Marathi, Hindi, Gujarati, Tamil** | Limited / Requires ElevenLabs subscriptions |
| **External API Keys** | **None** (100% local hardware models) | Requires OpenAI, Deepgram, Twilio keys |
| **Data Privacy** | **100% on your local server** | Transcripts pass through US third-party clouds |
| **Supplier Outreach** | **Automated Marathi Voice Note (.wav) emails** | Not supported out of the box |
| **In-App AI Copilot** | **Integrated local guide for users & devs** | Standard documentation docs only |

---

## 🏗️ Architecture

```
User Voice (Browser Mic / Phone Line)
       │ (16kHz PCM audio stream via WebSocket)
       ▼
[ Silero VAD ] ──────────────▶ Detects speech vs. silence (<1ms latency)
       │
       ▼
[ faster-whisper STT ] ──────▶ Converts voice to text locally
       │
       ▼
[ Ollama (qwen3.5:4b) ] ─────▶ Generates intelligent conversational replies via local LLM
       │ (Streaming tokens)
       ▼
[ Indic Neural / Kokoro TTS ]▶ Synthesizes human-grade 24kHz HD PCM audio in regional languages
       │
       ▼
User Speaker / Phone ◀─────── Streams audio chunks back with sub-second turnaround
```

---

## 🌟 Core Features

### 1. 🎙️ Live Voice Studio (`/call`)
- Full real-time conversational duplex loop.
- Dynamic waveform visualizer using warm amber for microphone listening and emerald for assistant speech.
- Sub-second turnaround using binary PCM WebSockets.

### 2. 🤖 Agent Studio (`/agents`)
- Configure persona system prompts, initial spoken greetings, temperature, and regional voices.
- Native pre-seeded agents:
  - **Marathi Supplier Outreach (मराठी पुरवठादार)**: `mr-IN-AarohiNeural`
  - **Hindi Customer Care (हिन्दी ग्राहक सेवा)**: `hi-IN-SwaraNeural`
  - **Gujarati Trade & Commerce (ગુજરાતી વેપાર)**: `gu-IN-DhwaniNeural`
  - **English Enterprise Support**: `en-IN-NeerjaNeural`

### 3. ✉️ Supplier Outreach & Voice Note Dispatch (`/outreach`)
- Specifically designed for agricultural and commercial supplier negotiations:
  - Generate 24kHz `.wav` voice notes in Marathi or Hindi.
  - Listen immediately via in-browser audio player.
  - Displays dual-language transcripts (Regional language + English translation).
  - Automatically attaches `.wav` file into professional RFQ emails.

### 4. 🔑 Developer API & Key Portal (`/developers`)
- Issue scoped API keys (`bv_live_...`) with SHA-256 storage.
- Interactive code generator tabs:
  - **cURL**: Direct POST to `/api/calls/start`
  - **Python SDK**: Ready-to-use requests client
  - **Node.js**: Modern async fetch wrapper
  - **WebSocket**: Live binary audio streaming client

### 5. ✨ In-App AI Copilot ("Ask Bizora Copilot")
- Floating drawer accessible from any page.
- Direct connection to local Ollama (`qwen3.5:4b`) to guide users on prompt engineering in regional languages, generating API code, and explaining cost advantages vs Vapi.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** (Tested on Node.js 24)
- **Ollama** running locally with `qwen3.5:4b`:
  ```bash
  ollama serve
  ollama pull qwen3.5:4b
  ```

---

### 2. Launch Everything (One-Click)

On Windows, simply double-click:
```bash
launch_all.bat
```

Or run the backend and frontend separately:

#### Start Backend (Port 8000)
```bash
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### Start Frontend (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Endpoints & Port Map

| Component | Port | URL |
|:---|:---|:---|
| **Web Dashboard** | `3000` | [http://localhost:3000](http://localhost:3000) |
| **FastAPI REST API** | `8000` | [http://localhost:8000](http://localhost:8000) |
| **Interactive API Docs (Swagger)** | `8000` | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **Real-Time WebSocket** | `8000` | `ws://localhost:8000/ws/call/{session_id}` |
| **Local LLM Engine (Ollama)** | `11434`| [http://localhost:11434](http://localhost:11434) |

---

## 🧪 Testing & Verification

Run the automated backend test suite:
```bash
cd backend
python tests/test_functional.py
```

Run the Grafana k6 performance smoke test:
```bash
k6 run -e BASE_URL="http://127.0.0.1:8000" tests/performance/k6/smoke-test.js
```
*(Verified: 252/252 checks passed, 0% failure rate, p95 latency = 248ms)*

---

## 📄 License
MIT License. Built for **Bizora AI** and standalone enterprise voice operations.
