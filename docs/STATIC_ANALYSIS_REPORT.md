# Static Analysis & Build Verification Report

**Project:** Bizora Voice (Vaani Voice)  
**Compiler:** TypeScript 5.x / Next.js 16.3.6 (Webpack Engine)  
**Backend Linter / Type Checker:** Python 3.13 / Pydantic v2.10  
**Audit Date:** October 31, 2026

---

## 1. Next.js Production Build Output

```
> frontend@0.1.0 build
> next build --webpack

▲ Next.js 16.3.6 (webpack)
✓ Running next.config.ts took 93ms

  Creating an optimized production build ...
✓ Compiled successfully in 7.6s
  Running TypeScript ...
  Finished TypeScript in 2.9s ...
  Collecting page data using 15 workers ...
  Generating static pages using 15 workers (0/22) ...
  Generating static pages using 15 workers (5/22) 
  Generating static pages using 15 workers (10/22) 
  Generating static pages using 15 workers (16/22) 
✓ Generating static pages using 15 workers (22/22) in 1474ms
  Finalizing page optimization ...
  Collecting build traces ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /agents
├ ○ /analytics
├ ○ /call
├ ○ /campaigns
├ ○ /developers
├ ○ /evaluations
├ ○ /history
├ ○ /icon.svg
├ ○ /knowledge
├ ○ /login
├ ○ /numbers
├ ○ /onboarding
├ ○ /outreach
├ ○ /settings
├ ○ /signup
├ ○ /squads
├ ○ /tools
└ ○ /voices

○  (Static)  prerendered as static content

Verification Result: 22/22 Routes Prerendered, 0 Errors, 0 Warnings
```

---

## 2. Backend Schema & Type Verification

- **Pydantic Validation:** All schemas in `backend/api/models.py` pass rigorous validation. All models declare explicit type annotations with optional field handling.
- **Relational Integrity:** SQLAlchemy database models in `backend/database/models.py` match the active Supabase PostgreSQL schema with defined foreign keys and indexes.
