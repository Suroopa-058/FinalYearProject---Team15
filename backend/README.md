# ScholarMatch Backend

Node.js + Express + TypeScript API for ScholarMatch. Recommendation
scoring is real: this backend proxies to the existing **ScholarMatch
FastAPI ML service**, which loads your already-trained XGBoost /
RandomForest / LightGBM / CatBoost ensemble + SBERT model and computes
actual predictions. **No score is ever computed, approximated, or
faked inside Node.**

---

## 1. Install & run (Windows-friendly)

Requires Node.js 18.18+ (Node 20/22 recommended) and Python 3.10+ for
the ML service. Three processes run side by side: the ML service, this
backend, and the frontend.

```bash
cd backend
npm install
copy .env.example .env        # Windows (cmd)
# or: cp .env.example .env    # macOS/Linux/PowerShell with cp alias

npm run dev
```

Other scripts:

```bash
npm run build       # compile TypeScript -> dist/
npm start            # run the compiled build (after npm run build)
npm run typecheck    # type-check without emitting files
```

The backend runs on **http://localhost:4000** by default (`PORT` in `.env`).
See §5 below for running the ML service it depends on.

---

## 2. Why a separate `backend/` instead of `src/server.ts`?

The frontend's `src/server.ts` and `src/start.ts` are **TanStack Start's
SSR request handler** — they render your React routes on the server and
wire up TanStack's own server functions/middleware. They are not a
general-purpose REST API server, and repurposing them would mean fighting
the framework's routing to bolt Express-style endpoints on top of it.

Keeping a dedicated `backend/` Express app is cleaner because:
- It can run, restart, and scale independently from the frontend's SSR process.
- It sits between the frontend and the Python ML service, which has an
  entirely different runtime/deployment story than an SSR frontend.
- The frontend keeps using its own `src/server.ts` for SSR exactly as before —
  nothing there needed to change.

All three talk to each other purely over HTTP:

```
ScholarMatch frontend (:3000)
        |  fetch()
        v
Node/Express backend (:4000)   <- you are here
        |  fetch()
        v
FastAPI ML service (:8000)     <- existing, unmodified
        |  in-process calls
        v
Trained ScholarMatch artifacts (XGBoost, RandomForest, LightGBM, CatBoost, SBERT)
```

---

## 3. Backend architecture

```
backend/
  src/
    app/
      app.ts                 # Express app: middleware + route mounting
    config/
      env.ts                 # env var loading & validation (zod)
      cors.ts                # CORS config, driven by CORS_ORIGIN
    routes/                  # one file per resource, mounted under /api
    controllers/             # thin HTTP layer — parse req, call service, send res
    services/                # business logic, orchestrates repositories + ml
    ml/
      wire-types.ts          # TS types mirroring the FastAPI service's schemas.py
      fastapi-client.ts       # thin HTTP proxy to the FastAPI service — NO ML logic
      profile-mapper.ts        # StudentProfile -> the ML service's exact request shape
      stable-id.ts              # string profile id -> int student_id (ID only, not a feature)
      ml-errors.ts               # MlServiceUnreachableError / MlServiceHttpError
    data/
      json-store.ts           # generic JSON-file-backed store (temporary DB)
      seed/                    # seed data (Node's OWN scholarship catalog, see §6)
      repositories/            # repository interfaces + JSON-file implementations
      db/                      # runtime *.runtime.json files (git-ignored)
    models/                  # shared TypeScript types/interfaces
    validators/              # zod schemas for request validation
    middleware/              # validation, error handling, 404, request logging
    utils/                   # logger, api response envelope, async handler, etc.
    server.ts                # entrypoint: checks ML service reachability, starts HTTP server
  .env.example
  package.json
  tsconfig.json

ml-service/                  # <- put the existing fastapi_integration/ folder here (see §5)
```

**Data flow for `POST /api/recommendations`:**

```
route (validates { profileId } with zod)
  -> controller (thin)
    -> recommendation.service.ts
      -> data/repositories (fetch the student profile)
      -> ml/profile-mapper (profile -> FastAPI's exact StudentProfile wire shape)
      -> ml/fastapi-client -> HTTP POST http://localhost:8000/api/recommend
           -> (Python, unmodified) preprocessing.build_feature_vector
           -> (Python, unmodified) 4 trained models' predict_proba
           -> (Python, unmodified) ensemble.py 25/25/25/25 soft vote
           -> (Python, unmodified) ranked Top-5 of the ML service's 10 scholarships
      <- RecommendationResult (mapped from the FastAPI response, 1:1)
  <- JSON response
```

Nothing under `ml/` in this backend loads a model, builds a feature
vector, or computes a score — it only serializes/deserializes HTTP
calls to the Python service.

### Why a JSON-file data store instead of a real database?

Scholarships/profiles/applications/saved-scholarships are stored as
JSON files under `src/data/db/` — but every read/write goes through a
**repository interface** (`ScholarshipRepository`, `ProfileRepository`,
etc. in `src/data/repositories/`). Swapping in Postgres/MongoDB/etc.
later means writing one new class per interface; controllers and
services never touch the file system directly.

---

## 4. API endpoints

All responses are wrapped as `{ success: true, data, meta? }` or
`{ success: false, error: { message, code, details? } }`.

| Method | Path                        | Purpose                                                          |
|--------|-----------------------------|-------------------------------------------------------------------|
| GET    | `/api/health`               | Service health + whether the FastAPI ML service is reachable      |
| GET    | `/api/scholarships`         | List Node's own scholarship catalog (see §6 re: two catalogs)      |
| GET    | `/api/scholarships/:id`     | Get one scholarship from that catalog                              |
| POST   | `/api/profile`              | Create a student profile (optionally incl. `mlAcademicInput`)       |
| GET    | `/api/profile/:id`          | Get a student profile                                              |
| PATCH  | `/api/profile/:id`          | Update a student profile *(bonus, beyond original spec)*             |
| POST   | `/api/recommendations`      | `{ profileId }` -> **real** ranked recommendations from the trained ensemble |
| POST   | `/api/explain`              | `{ profileId, scholarshipId }` -> SHAP explanation *(bonus — reuses explain.py)* |
| POST   | `/api/eligibility`          | `{ profileId, scholarshipId }` -> rule-based check against Node's own catalog |
| POST   | `/api/applications`         | `{ userId, scholarshipId, ... }` -> create an application            |
| GET    | `/api/applications/:userId` | List a user's applications                                          |
| POST   | `/api/saved`                | `{ userId, scholarshipId }` -> save a scholarship                    |
| GET    | `/api/saved/:userId`        | List a user's saved scholarships                                     |

---

## 5. ML service integration (ScholarMatch FastAPI)

### 5.1 Files changed / created for this integration

**Changed:**
- `src/config/env.ts`, `.env.example`, `.gitignore` — removed the old
  `MODEL_ARTIFACT_PATH`/`MODEL_VERSION` (no longer relevant), added
  `ML_SERVICE_URL` / `ML_SERVICE_TIMEOUT_MS`.
- `src/models/student-profile.model.ts` — added optional
  `mlAcademicInput` (the extra fields the trained model needs:
  `semester`, `extracurricularPoint`, `totalCredits`, `hasFailedCourse`,
  `classCode`, optional `externalStudentId`).
- `src/validators/student-profile.schema.ts` — added the matching
  Zod schema for `mlAcademicInput`.
- `src/models/recommendation.model.ts` — rewritten to match the
  ML service's real response shape (`matchPercentage`, `eligible`,
  `semanticSimilarity`, `majorMatch`, `academicFit`, etc.) instead of
  the earlier generic placeholder.
- `src/services/recommendation.service.ts` — rewritten to call the
  FastAPI service instead of a local (never-built) model.
- `src/controllers/health.controller.ts`, `src/routes/health.routes.ts`,
  `src/server.ts` — now check the real FastAPI `/api/health` instead of
  a local model file.
- `src/routes/index.ts` — mounts the new explain route.

**Created:**
- `src/ml/wire-types.ts` — TS types mirroring `fastapi_integration/schemas.py`.
- `src/ml/fastapi-client.ts` — HTTP client for the 3 FastAPI endpoints.
- `src/ml/ml-errors.ts` — `MlServiceUnreachableError`, `MlServiceHttpError`.
- `src/ml/stable-id.ts` — deterministic string→int id mapping (identifier only).
- `src/ml/profile-mapper.ts` — shared `StudentProfile -> ML wire request` mapper.
- `src/services/explain.service.ts`, `src/controllers/explain.controller.ts`,
  `src/routes/explain.routes.ts` — the new `/api/explain` endpoint.

**Removed** (superseded, would otherwise duplicate Python logic in TS):
- `src/ml/model-loader.ts`, `src/ml/predictor.ts`,
  `src/ml/feature-preprocessor.ts`, `src/ml/artifacts/` — these were a
  placeholder Node-loadable-model contract from before you provided the
  real artifacts. The real thing is a Python service, so these are gone.

**Not changed:** `fastapi_integration/*.py` — zero lines of the Python
package were modified. `eligibility.service.ts` and Node's own
scholarship catalog — untouched, see §6 for why.

### 5.2 Where the ML service lives

Put your existing `fastapi_integration/` folder's contents at:

```
FinalYear-Project-Team15/ml-service/
```

(See `ml-service/README.md` in this delivery for the exact steps —
nothing inside that folder needs to change.)

### 5.3 Run the FastAPI ML service

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS/Linux

pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

You should see uvicorn start on `http://127.0.0.1:8000`. The first
request may take a few seconds while SBERT loads from
`local_models/all-MiniLM-L6-v2/` (bundled, no network access needed).

### 5.4 Run the Node backend

```bash
cd backend
npm install
copy .env.example .env      # Windows; or `cp` on macOS/Linux
npm run dev
```

### 5.5 Run the frontend

```bash
cd frontend
npm install
npm run dev
```

### 5.6 Required `.env` variables (backend)

```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

DATA_DRIVER=json-file
DATA_DIR=./src/data/db

ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_TIMEOUT_MS=15000

LOG_LEVEL=dev
```

`ML_SERVICE_URL` must point at wherever uvicorn is actually running.
The FastAPI service itself needs no `.env` — it has no external config.

### 5.7 How to test the ML recommendation API end-to-end

**Step 1 — confirm the ML service is up directly:**

```bash
curl http://localhost:8000/api/health
```

```json
{"status":"ok","models_loaded":true,"sbert_loaded":true,"num_scholarships":10}
```

**Step 2 — confirm the Node backend can see it:**

```bash
curl http://localhost:4000/api/health
```

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "mlService": {
      "url": "http://localhost:8000",
      "reachable": true,
      "modelsLoaded": true,
      "sbertLoaded": true,
      "numScholarships": 10
    }
  }
}
```

**Step 3 — create a profile with the ML-specific fields:**

```bash
curl -X POST http://localhost:4000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Asha Rao",
    "email": "asha@example.com",
    "degree": "B.Tech Computer Science",
    "institution": "Delhi University",
    "yearOfStudy": 4,
    "gpa": 8.5,
    "mlAcademicInput": {
      "semester": 1,
      "extracurricularPoint": 70,
      "totalCredits": 18,
      "hasFailedCourse": false,
      "classCode": "CS2021"
    }
  }'
```

Copy the returned `data.id` for the next step.

**Step 4 — request real recommendations:**

```bash
curl -X POST http://localhost:4000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"profileId":"<id from step 3>"}'
```

```json
{
  "success": true,
  "data": {
    "mlServiceReachable": true,
    "studentId": 3820481264,
    "modelVersion": "4-model soft-voting ensemble (XGBoost + RandomForest + LightGBM + CatBoost, 25/25/25/25) with SBERT semantic similarity, served by the existing ScholarMatch FastAPI service.",
    "generatedAt": "2026-08-31T...",
    "recommendations": [
      {
        "rank": 1,
        "scholarshipId": "SCH007",
        "name": "STEM Excellence Scholarship",
        "description": "Supports students studying science, technology, engineering, mathematics, computing, and related technical disciplines who demonstrate strong academic achievement.",
        "score": 0.9142,
        "matchPercentage": 91,
        "eligible": true,
        "semanticSimilarity": 0.5813,
        "majorMatch": true,
        "academicFit": 0.68
      }
      // ... up to 5
    ]
  }
}
```

**Step 5 — explanation for one scholarship (bonus endpoint):**

```bash
curl -X POST http://localhost:4000/api/explain \
  -H "Content-Type: application/json" \
  -d '{"profileId":"<id from step 3>","scholarshipId":"SCH007"}'
```

**Step 6 — run the FastAPI service's own test suite (optional, but the
strongest independent confirmation the artifacts are wired correctly):**

```bash
cd ml-service
pip install pytest
pytest tests/ -v
```

### 5.8 Confirmation: scores come from the trained artifacts, not hardcoded

- `recommendation.service.ts` contains **no scoring math** — it builds
  a request object from the profile's fields and calls
  `requestRecommendations()` in `fastapi-client.ts`, which does nothing
  but `fetch()` the FastAPI service and return its JSON response.
  Grep the Node codebase: there is no `Math.random`, no fixed
  score table, and no arithmetic that produces `recommendation_score`
  anywhere in `backend/src/`.
- Every recommendation's `score`/`matchPercentage` is
  `recommendation_score` from the FastAPI response, which
  `ensemble.py` computes as a strict weighted average of
  `xgb.predict_proba`, `rf.predict_proba`, `lgbm.predict_proba`, and
  `catboost.predict_proba` — the four objects loaded directly from
  `models/xgb_model/xgb_model.json`, `rf_model/rf_model.joblib`,
  `lgbm_model/lgbm_model.joblib`, `catboost_model/catboost_model.cbm`
  by `model_loader.py`. Different profile inputs (different `gpa`,
  `classCode`, `extracurricularPoint`, etc.) will produce different
  scores, since they change the feature vector the trained models
  actually see — you can verify this yourself by calling
  `/api/recommendations` twice with two different `mlAcademicInput`
  payloads and observing different `matchPercentage` values, or by
  running `ml-service/tests/test_recommendation.py` directly against
  the artifacts (no Node involved at all).
- `GET /api/health`'s `mlService.modelsLoaded` reflects whether the
  FastAPI process actually loaded all four model files at startup —
  it will read `false` if the artifacts fail to load, rather than
  silently reporting success.

---

## 6. Important: two separate scholarship catalogs

This backend now has **two distinct scholarship datasets**, and they
are intentionally not merged:

1. **Node's own catalog** (`src/data/seed/scholarships.seed.ts`) — the
   8 scholarships originally mocked in the frontend (National Merit
   Excellence Award, Women in Technology Grant, etc.), used by
   `GET /api/scholarships` and the rule-based `POST /api/eligibility`.
2. **The ML service's own catalog** (`ml-service/scholarships.json` /
   `model_config.json`) — a fixed set of **10 scholarships,
   `SCH001`–`SCH010`** (Academic Excellence Scholarship, STEM Excellence
   Scholarship, etc.), which is what the trained models were fit
   against and the only scholarships `POST /api/recommendations` can
   ever return.

**These do not correspond to each other.** The trained ensemble has no
knowledge of "National Merit Excellence Award" — it only knows
`SCH001`–`SCH010`. I have not invented a mapping between the two, since
that would misrepresent which scholarship a given score is actually
about.

**What this means for the frontend's "AI Scholarship Match" section:**
the 96%/91%/88%-style match percentages you described can now come
from real data (`matchPercentage` in the `/api/recommendations`
response), but the scholarship names/descriptions shown alongside them
need to be the ML service's own 10 (`name`/`description` are already
included in each recommendation object, straight from
`scholarships.json`) — not the original 8 mock scholarships. Swapping
the frontend's data source to point at this endpoint is a real (if
small) frontend change, since the specific scholarships displayed will
differ from what's mocked today. I've held off making that change
without your sign-off, per "do not redesign the frontend" — let me
know if you'd like me to wire it up now that the two catalogs' mismatch
is clear, and whether you'd rather (a) show the ML service's 10
scholarships as the "AI Match" set, or (b) keep both catalogs visible
as separate sections.

---

## 7. `mlAcademicInput` — why a profile needs it

The trained model's feature pipeline (`preprocessing.py`,
`config/feature_columns.json`) requires fields a general scholarship
profile doesn't otherwise capture: `semester` (1 or 2), extracurricular
points (0–100), total credits, whether a course was ever failed, and a
`classCode` like `"CS2021"` (2-letter major prefix + 4-digit admission
year — must be one the trained `class_encoder` has actually seen; an
unrecognized code is rejected by the ML service with a clear 400, not
guessed). `gpa` and `yearOfStudy` are reused directly from the existing
profile fields since their scales already match.

If `mlAcademicInput` is missing, `POST /api/recommendations` responds
with `mlServiceReachable: false` and a message naming exactly which
fields to add via `PATCH /api/profile/:id` — never a fabricated score.
