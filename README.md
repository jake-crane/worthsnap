# WorthSnap

A personal net worth tracker. Periodically record a "snapshot" of your assets
and liabilities and see your net worth trend over time, plus how each item
changed since the last snapshot.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS (`frontend/`)
- **Backend**: Spring Boot 4 (Java 21, Maven) (`backend/`)
- **Database**: PostgreSQL, run locally via Docker Compose, schema managed by Flyway

## Running locally

### 1. Start Postgres

```
docker compose up -d
```

This starts Postgres on `localhost:5432` with database/user/password all set
to `worthsnap` (see `docker-compose.yml`).

### 2. Start the backend

```
cd backend
./mvnw spring-boot:run
```

Runs on `http://localhost:8081`. Flyway migrations in
`src/main/resources/db/migration` run automatically on startup.

### 3. Start the frontend

```
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. API calls to `/api/*` are proxied to the
backend (see `vite.config.ts`).

## Data model

- **Category** — user-defined, typed `ASSET` or `LIABILITY` (e.g. "Checking
  accounts", "Credit cards").
- **Item** — a specific asset/liability you track over time (e.g. "Chase
  Checking"), belonging to a category. Can be archived without deleting
  history.
- **Snapshot** — one dated entry session.
- **SnapshotEntry** — an item's value within a given snapshot.

Net worth for a snapshot = sum of asset values − sum of liability values.
Per-item and net-worth change/percent-change are computed against the
previous snapshot by date.

## Notes

- No authentication yet — single-user MVP by design.
- Designed to run locally for now; the backend has no AWS-specific code yet,
  but the container-friendly Postgres setup and stateless Spring Boot service
  are meant to translate cleanly to RDS + ECS/Fargate (or similar) later.
