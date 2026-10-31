# Zero Mock & Dummy Data Audit Report

**Audit Standard:** Part 4 Non-Negotiable Rules — Zero Tolerance for Fake Functionality, Dummy Numbers, Mock Call Records, or Artificial Stats  
**Scope:** Frontend API clients, state initializers, backend mock fixtures, database seed handlers  
**Audit Date:** October 31, 2026

---

## 1. Remediation of Mock Seeds & Synthetic Records

| Location / File | Original Fake Pattern | Problem Identified | Hardened Replacement | Status |
| :--- | :--- | :--- | :--- | :--- |
| `frontend/src/lib/api.ts` | `DEFAULT_SEED_CALLS` | Displayed 3 synthetic calls (`krishi-kendra`, `taj-hotel`) when DB had none | Removed fallback; returns `[]` so UI renders authentic empty state | **PURGED** |
| `frontend/src/lib/api.ts` | `DEFAULT_SEED_CAMPAIGNS` | Returned fake campaign `camp_1` causing 404 network fetch errors | Removed fallback; returns `[]` and supports live CSV creation | **PURGED** |
| `frontend/src/lib/api.ts` | `DEFAULT_SEED_NUMBERS` | Rendered dummy phone numbers (`+919820011223`) | Removed fallback; returns genuine numbers from Supabase | **PURGED** |
| `frontend/src/lib/api.ts` | `DEFAULT_SEED_STATS` | Displayed artificial stats (142 calls, 426 mins, $178 saved) | Normalized to query live `/api/stats` endpoint with 0 defaults | **PURGED** |
| `frontend/src/app/evaluations/page.tsx` | `DEFAULT_EVALS` | Hardcoded evaluation IDs not present in Supabase | Seeded system rubrics into Supabase PostgreSQL; UI queries live API | **PURGED** |

---

## 2. Empty State Verification

With all mock seeds completely eradicated, every page was tested to verify that it handles empty database states with high-taste, human-crafted Linear-style empty state components:
- **Campaigns (`/campaigns`):** Displays empty campaign visualizer with a clear call-to-action button to create an outbound CSV campaign.
- **Phone Numbers (`/numbers`):** Displays zero connected numbers with clear instructions to bind a Twilio BYOT number or 4G GSM SIM Gateway.
- **Analytics (`/analytics`):** Accurately reflects 0 total calls and ₹0 cost saved until real calls are logged in Supabase.
