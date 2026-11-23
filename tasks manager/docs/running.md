# Running the project

Needs: .NET 9 SDK, Node 22+, MongoDB running on `localhost:27017` (the Windows service, or `docker compose up -d` in
`src/server`, which uses port 27018, then set `Mongo:ConnectionString`).

## Option A: everything in Docker (one command)

```
cd src/server
docker compose up -d --build
dotnet run --project tools/SprintManager.Seed -- --reset --mongo mongodb://localhost:27018
```

Then open http://localhost:8081 (client; nginx forwards `/api` to the server). The server is also on
http://localhost:5081 and MongoDB on 27018, so it does not clash with a local MongoDB on 27017.
Stop with `docker compose down` (add `-v` to also delete the database).

## Option B: run each part directly (development)

## 1. Server (port 5080)

```
cd src/server
dotnet run --project SprintManager.Api --urls http://localhost:5080
```

Development settings (including a development-only JWT signing key) are in `appsettings.Development.json`, loaded when
`ASPNETCORE_ENVIRONMENT=Development`. In any other environment the server refuses to start without `Jwt:SigningKey`.

## 2. Demo data (once, and again to reset)

```
cd src/server
dotnet run --project tools/SprintManager.Seed -- --reset
```

Logins (password `Demo1234!` for all): `noa@demo.sprintmanager.local` (manager), `avi@...`, `dana@...`, `eli@...`, `maya@...`
(members). Sprint 2 is active and contains two deliberate manual assignment mistakes, so the "Compare with manual
assignment" panel on the planning screen has something to find.

## 3. Client (port 5173)

```
cd src/client
npm install
npm run dev
```

Open http://localhost:5173. Vite forwards `/api` to `http://localhost:5263` (the port from `launchSettings.json`). If you
start the server on another port, such as 5080 above, set `API_URL` first, for example `API_URL=http://localhost:5080 npm run dev`.

Other client commands: `npm test` (Vitest), `npm run build` (type-check and production build), `npm run lint`,
`npm run api:types` (regenerate the TypeScript types from the running server's OpenAPI document).

## Tests

```
cd src/server
dotnet test            # core algorithms, services, plan storage (146 tests)
dotnet run -c Release --project tests/SprintManager.Benchmarks   # performance tables (see performance.md)
```

## Demo script for the exam (about 5 minutes)

1. Sign in as Noa (manager). Open the project, then **Sprint planning** for Sprint 2.
2. Press **Suggest plan**: the request returns at once, the calculation runs in the background (the async element).
   Point at the critical path, the assignment reasons, and the workload bars.
3. Press **Compare**: manual assignment vs Greedy vs Hungarian on the same cost function.
4. Open **Sprint board**, drag a card whose prerequisite is not done: it snaps back with the reason.
5. Open **Dashboard**: forecast, burndown, at-risk tasks. Then sign in as Avi to show the member's priority-ordered list.
