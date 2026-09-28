# ScholarMatch

AI/ML-based scholarship recommendation system.

```
FinalYear-Project-Team15/
  frontend/     React 19 + TypeScript + Vite + TanStack Start/Router (unchanged)
  backend/      Node.js + Express + TypeScript API
  ml-service/   Existing ScholarMatch FastAPI ML service (put fastapi_integration/ here)
```

- **Frontend**: see `frontend/README.md`. Untouched — still runs with `npm run dev` on port 3000.
- **Backend**: see `backend/README.md` for architecture, API endpoints, and the
  ML service integration (§5) — run commands, env vars, and how to test it.
- **ML service**: see `ml-service/README.md` for exactly what to place there
  (your existing, unmodified `fastapi_integration/` folder).

Run all three side by side, in three terminals:

```bash
# terminal 1 — ML service (see ml-service/README.md to set it up first)
cd ml-service && uvicorn app:app --reload --port 8000

# terminal 2 — backend
cd backend && npm install && npm run dev

# terminal 3 — frontend
cd frontend && npm install && npm run dev
```
