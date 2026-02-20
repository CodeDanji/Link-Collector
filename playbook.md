# Local E2E Testing Playbook: Link-Collector V2

As a CTO, you must verify the full Next.js -> FastAPI -> Redis -> Arq pipeline and trigger the Paywall UI.

## Phase 1: Force the Paywall Error in Backend
To instantly trigger the `402 Payment Required` logic, we need to artificially simulate a quota exhaustion.
1. Open `apps/api/core/auth.py`.
2. Find line 53: `current_usage = 5 # Mock current usage`
3. Change it to: `current_usage = 50 # Artificially exceeding the limit`
4. *(This explicitly forces the `check_usage_quota` dependency to reject the frontend).*

## Phase 2: Start the Production Stack
You must spin up 4 distinct processes in separate terminal instances.

**Terminal 1: Redis Broker**
Since you are on Windows, if you have Docker Desktop installed, spin up a lightweight Redis instance:
```bash
docker run -p 6379:6379 -d redis:alpine
```
*(If you do not have Docker, you can install Memurai or Redis for Windows natively).*

**Terminal 2: Arq Background Worker**
Navigate to `apps/api` and start the Arq polling consumer:
```bash
cd apps/api
arq worker.WorkerSettings
```

**Terminal 3: FastAPI Web Server**
Navigate to `apps/api` and start the main dependency/router server:
```bash
cd apps/api
uvicorn main:app --reload --port 8000
```

**Terminal 4: Next.js Frontend**
Navigate to `apps/web` and start the React client:
```bash
cd apps/web
npm run dev --webpack
```

## Phase 3: Execute the E2E Test
1. Refresh the Chrome Extension in `chrome://extensions`.
2. Navigate to an article (e.g., a Wikipedia page).
3. Click the Extension Icon.
4. **Expected Result:** The `/save` route should rapidly load, communicate with FastAPI (`localhost:8000`), receive the explicit `402 Error` from the backend middleware, and **instantly render the "💎 Upgrade to Pro" Paywall UI** instead of attempting an extraction.
