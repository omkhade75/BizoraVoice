# Bug Fix Register & Remediation Log

**Project:** Bizora Voice (Vaani Voice)  
**Date:** October 31, 2026  
**Status:** All Critical, High, and Medium Deficiencies Remediated

---

## 1. Summary of Resolved Issues

| Bug ID | Severity | Component | Issue Description | Root Cause | Fix Applied | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | CRITICAL | Backend DB | `asyncpg` connection timeouts on Windows | asyncpg statement cache issues with remote Supabase over IPv6 | Added `statement_cache_size=0`, `timeout=30.0`, connection pool | **RESOLVED** |
| **BUG-002** | HIGH | Backend DB | `ForeignKeyViolationError` for `taj-hotel` | Seed list lacked default concierge assistant | Seeded `taj-hotel` into Supabase PostgreSQL seed routine | **RESOLVED** |
| **BUG-003** | HIGH | Backend API | `publish_agent` 500 error | `AgentVersion` had no explicit UUID assignment | Explicitly assign `id=str(uuid.uuid4())` on creation | **RESOLVED** |
| **BUG-004** | HIGH | Backend API | `delete_agent` 500 error | Foreign key constraint on dependent `AgentVersion` and `SquadMember` | Implemented cascade deletion of dependent versions and squad links | **RESOLVED** |
| **BUG-005** | MEDIUM | Backend API | `POST /api/tools` returned 422 Unprocessable | `parameters_schema` strictly required string, rejected objects | Added Pydantic `@field_validator(..., mode="before")` to serialize dicts | **RESOLVED** |
| **BUG-006** | MEDIUM | Backend API | `POST /api/evaluations/{id}/run` 500 error | Rubric parser expected list of dicts, broke on dict format | Added polymorphic criteria parser handling dict, list, and string formats | **RESOLVED** |
| **BUG-007** | MEDIUM | Backend API | High latency on `/api/stats` and `/api/health` | Repeated WAN round-trips to Supabase and Ollama on every second | Implemented 5-second in-memory TTL caching | **RESOLVED** |
| **BUG-008** | HIGH | Frontend API | 404 error on `/campaigns` initial load | `DEFAULT_SEED_CAMPAIGNS` returned mocked IDs like `camp_1` not in DB | Removed `DEFAULT_SEED_*` mock data; returned clean empty arrays | **RESOLVED** |
| **BUG-009** | HIGH | Frontend UI | `TypeError: Cannot read properties of undefined (reading 'toLocaleString')` on `/analytics` | Backend returned `estimated_cost_saved_inr` while frontend accessed `cost_saved_inr` | Normalized stats interface in `api.ts` and added safe accessors in `page.tsx` | **RESOLVED** |
| **BUG-010** | MEDIUM | Frontend UI | 404 error on `/evaluations` when running test suite | `DEFAULT_EVALS` had hardcoded IDs not seeded in Supabase | Seeded real evaluations in Supabase and migrated frontend to `API_BASE` | **RESOLVED** |
| **BUG-011** | MEDIUM | Frontend Build | TypeScript lint errors in `numbers/page.tsx` | Missing optional properties on `PhoneNumber` interface | Added `provider_sid`, `capabilities`, `status` to interface definitions | **RESOLVED** |

---

## 2. In-Depth Root Cause & Remediation Analysis

### Bug BUG-001: Supabase PostgreSQL Connection Dropping on Windows
- **Symptom:** `asyncpg.exceptions.QueryCanceledError` or `[WinError 121] The semaphore timeout period has expired`.
- **Root Cause:** Default `create_async_engine` configuration for `asyncpg` uses client-side statement caching. On Windows networking stacks connecting across cloud WAN to Supabase IPv6 endpoints, stale cached statements trigger socket connection resets.
- **Remediation:** Configured `connect_args` in `bizvoice/backend/database/db.py`:
  ```python
  connect_args = {
      "ssl": "require",
      "statement_cache_size": 0,
      "timeout": 30.0,
      "command_timeout": 30.0
  }
  ```

### Bug BUG-008 & BUG-010: Artificial Fallback Seeds Causing Network 404s
- **Symptom:** Browsing `/campaigns` or `/evaluations` logged 404 network errors in the browser console.
- **Root Cause:** When the database returned empty results, `lib/api.ts` returned hardcoded mock arrays containing synthetic IDs (`camp_1`, `eval-inbound-greeting`). The UI subsequent detail fetches attempted to query `/api/campaigns/camp_1` or `/api/evaluations/eval-inbound-greeting/run`, which failed because the backend had no record of these mock IDs.
- **Remediation:** Removed mock seeds from `api.ts` so pages render authentic Linear-style empty states when no user data exists. Seeded system-standard evaluation templates directly into Supabase PostgreSQL so that evaluation runs execute against verified persistent records.

### Bug BUG-009: Undefined toLocaleString Crash on Analytics Page
- **Symptom:** White screen crash on `/analytics`: `TypeError: Cannot read properties of undefined (reading 'toLocaleString')`.
- **Root Cause:** The backend `/api/stats` endpoint returned `estimated_cost_saved_inr`, but the frontend `PlatformStats` interface declared `cost_saved_inr: number`. Since `cost_saved_inr` was undefined, invoking `.toLocaleString()` crashed the component.
- **Remediation:** Normalized properties in `getStats()` within `lib/api.ts` to populate both `cost_saved_inr` and `estimated_cost_saved_inr`, and added safe fallback operators (`?.toLocaleString()`) in `src/app/analytics/page.tsx`.
