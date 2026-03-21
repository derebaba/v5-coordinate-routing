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

---

## Browser-First Route Cache Workflow

### What changed

- Day Planner route minutes now come from `routeCache` only.
- No active API connection is required while planning.
- You can import/export route cache in **Distance Cache Builder**.
- Distance calculation now uses `latitude` and `longitude` from the school file instead of school names or addresses.

### Route cache workflow (browser-first)

1. Open `index.html` in a browser.
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

Open `index.html` in a browser.
