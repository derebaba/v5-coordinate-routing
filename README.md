# Fieldwork Scheduler V5 (Coordinate-Based Route Cache)

This version keeps day planning fully manual and uses **offline drive-time lookups based on explicit school coordinates**.

---

## Share Service — Local Development Stack

The share service lets you publish scheduler sessions to a hosted API so others can view them via a shared link. The local stack runs entirely in Docker.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)

### Quick Start

```bash
# 1. Create your local env file (one-time)
cp .env.example .env
# Edit .env — fill in Auth__JwtSecret with any strong secret string

# 2. Start the stack
docker compose up --build

# 3. Verify the API is running
curl http://localhost:5000/health
# → {"status":"ok"}
```

The API is available at **http://localhost:5000** from your host machine.

### Windows one-command start

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

What it does:
- Creates `.env` from `.env.example` if missing
- Generates `Auth__JwtSecret` automatically if blank
- Ensures local `Cors__AllowedOrigins` includes `localhost:5000`
- Runs `docker compose up --build -d`
- Waits for `http://localhost:5000/health` to report healthy
- Serves the frontend from the API at `http://localhost:5000/index.html`

### Common Commands

| Command | Description |
|---------|-------------|
| `docker compose up --build` | Start (or rebuild) the full stack |
| `docker compose up -d --build` | Start in detached (background) mode |
| `docker compose logs -f api` | Stream API logs |
| `docker compose logs -f mongo` | Stream MongoDB logs |
| `docker compose down` | Stop containers — **preserves data** |
| `docker compose down -v` | Stop containers and **delete all data** |

### Data Persistence

MongoDB data is stored in a Docker named volume called `mongo_data`.

- **`docker compose down`** stops containers but keeps the `mongo_data` volume. Your data survives restarts.
- **`docker compose down -v`** stops containers **and removes all volumes**, including `mongo_data`. Use this for a full reset.

#### Prove data survives a restart

```bash
# Start the stack
docker compose up -d --build

# Insert a test document
docker exec $(docker compose ps -q mongo) mongosh --quiet --eval "db.getSiblingDB('coordinate-routing').phase1.insertOne({probe:'ok'})"

# Stop (data preserved)
docker compose down

# Restart
docker compose up -d

# Verify the document is still there
docker exec $(docker compose ps -q mongo) mongosh --quiet --eval "db.getSiblingDB('coordinate-routing').phase1.findOne({probe:'ok'})"
# → { _id: ObjectId('...'), probe: 'ok' }

# Clean up
docker compose down
```

### Architecture Notes

- **MongoDB is internal-only** in Phase 1 — it is not exposed to the host network. The API container connects to it via the Docker service name `mongo`.
- The API container listens on port **8080** internally; Docker maps host port **5000** → container port **8080**.
- Environment variables are loaded from the root `.env` file. See `.env.example` for the full list.

## Fly.io Deployment (Phase 4)

This runbook is the production path for deploying the API to Fly.io with MongoDB Atlas.

### 1) Install and authenticate Fly CLI

```bash
fly auth login
```

### 2) Bootstrap Fly app and manifest

From repo root (where `fly.toml` exists):

```bash
fly launch --no-deploy
```

When prompted, use your app name and keep region as `fra` (or keep the existing `primary_region = "fra"` in `fly.toml`).

### 3) Prepare production secrets

Generate a strong JWT secret locally:

```powershell
# PowerShell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

```bash
# bash
openssl rand -base64 32
```

Set all required runtime values using Fly secrets (**must use `__` key names**):

```bash
fly secrets set \
  Mongo__ConnectionString="mongodb+srv://<username>:<password>@<cluster-url>/<db>?retryWrites=true&w=majority" \
  Mongo__DatabaseName="coordinate-routing" \
  Auth__JwtSecret="<paste-generated-secret>" \
  Cors__AllowedOrigins="https://<app>.fly.dev"
```

Required key names:
- `Mongo__ConnectionString` (Atlas URI, must be `mongodb+srv://...`)
- `Mongo__DatabaseName`
- `Auth__JwtSecret`
- `Cors__AllowedOrigins` (production value pattern: `https://<app>.fly.dev`)

### 4) Atlas network access (v1 guidance)

For initial v1 deployment, allow Atlas network access from anywhere:
- Atlas Dashboard → **Network Access** → add `0.0.0.0/0`

Security tradeoff: `0.0.0.0/0` is broader than ideal. It is accepted for v1 simplicity, but should be hardened later by restricting access (for example, to known Fly egress ranges/other tighter controls) once operational constraints are clear.

### 5) Deploy

```bash
fly deploy
```

### 6) Verify deployment

Basic health check:

```bash
curl -fsS https://<app>.fly.dev/health
```

PowerShell smoke test (health + authenticated upload):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-deploy.ps1 `
  -AppUrl "https://<app>.fly.dev" `
  -BearerToken "<Auth__JwtSecret>"
```

### Troubleshooting

- **Secret key mismatch (`:` vs `__`)**
  - Symptom: app fails on startup with missing required config.
  - Fix: re-run `fly secrets set` with exact keys:
    `Mongo__ConnectionString`, `Mongo__DatabaseName`, `Auth__JwtSecret`, `Cors__AllowedOrigins`.

- **CORS mismatch**
  - Symptom: browser requests fail, while direct CLI calls may still work.
  - Fix: ensure `Cors__AllowedOrigins` exactly matches deployed frontend origin (for v1 API-only flow use `https://<app>.fly.dev`).

- **Atlas auth/network failure**
  - Symptom: `/health` fails or Fly reports unhealthy machine.
  - Fixes:
    - verify `Mongo__ConnectionString` is a valid `mongodb+srv://...` URI with correct credentials
    - verify Atlas user has database access
    - verify Atlas Network Access includes `0.0.0.0/0` for v1
    - inspect logs: `fly logs`

---

## Browser-First Route Cache Workflow

### What changed

- Day Planner route minutes now come from `routeCache` only.
- No active API connection is required while planning.
- You can import/export route cache in **Distance Cache Builder**.
- Distance calculation now uses `latitude` and `longitude` from the school file instead of school names or addresses.

### Route cache workflow (browser-first)

1. Open `http://localhost:5000/index.html` in a browser.
2. In **Setup > Distance Cache Builder**:
   - import the school file with `latitude` and `longitude` columns
   - paste Google API key
   - click `Calculate Distances`
   - click `Export Cache CSV` or `Export Cache JSON`
3. Keep using the generated route cache in the same session, or import it later into another session.

### Optional batch script (advanced)

If you prefer command line for large files:

```bash
node scripts/build-route-cache.mjs \
  --input /path/to/fieldwork_scheduler_v3_YYYY-MM-DD.json \
  --api-key YOUR_GOOGLE_MAPS_API_KEY \
  --output /path/to/route-cache.csv \
  --json /path/to/route-cache.json
```

### Batch script input/output

#### Input

- JSON:
  - scheduler export containing `schools[]`, or
  - raw array of school objects.
- CSV/XLSX school files should include `latitude` and `longitude` per school for route building.

#### Output

- CSV columns:
  - `fromSchoolId,fromSchoolName,fromDistrict,toSchoolId,toSchoolName,toDistrict,durationMinutes,distanceKm,status,fetchedAt,provider`
- JSON object containing `routeCache[]` with same fields.

### Notes

- Route cache import resolves schools by `id` first, then by `name + district`.
- If a route row cannot be matched to current schools, it is skipped and reported.
- Planner keeps working even when some pairs are missing; those segments show as unavailable.
- Route calculation itself will not start if any school is missing coordinates.

## Run app

Open `http://localhost:5000/index.html` in a browser.
