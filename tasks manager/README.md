# Sprint Manager

A sprint-planning and task-management web app for software teams. Managers create projects, sprints and work items; the
app then **suggests a sprint plan** — who should do which task — by combining a dependency graph (critical path) with an
optimal assignment algorithm (Hungarian), and shows the result on a board, a dashboard and a set of reports.

## Tech stack

| Layer | Technology |
|---|---|
| Client | React 19, TypeScript, Vite, MUI, TanStack Query, React Router, dnd-kit (drag and drop), motion |
| Server | C# / .NET 9, ASP.NET Core MVC controllers, JWT auth, background job runner |
| Database | MongoDB |
| Tests | xUnit (core algorithms, services, plan storage), benchmarks |

```
src/client   React app (one folder per page)
src/server   SprintManager.Core (algorithms, no framework) / .Data (MongoDB) / .Api (controllers, services)
docs/        running, architecture, decision log, performance
```

## Pages

Login, Projects, Overview, Work items, Sprint board, Backlog, Sprint planning, Dashboard, Reports, Team, Project
settings, Task detail, My tasks and Profile. Each one is described in the
[wiki](https://github.com/noamgdalyahu/taskManager/wiki).

## Algorithms

| Problem | Approach |
|---|---|
| Ordering and cycles in dependencies | Kahn topological sort; a cycle is returned as data so the UI can show it |
| Critical path and slack | CPM forward/backward pass |
| Who does what | Hungarian algorithm with capacity slots, compared against a Greedy baseline (Strategy pattern) |
| Member task priority | Score from due date, critical path and number of blocked tasks |
| Forecast | Velocity and burndown based completion estimate |

Why each choice was made: [docs/decision-log.md](docs/decision-log.md). Measured scaling:
[docs/performance.md](docs/performance.md).

## Running it

Needs .NET 9 SDK, Node 22+ and MongoDB.

```
# Everything in Docker
cd src/server
docker compose up -d --build
dotnet run --project tools/SprintManager.Seed -- --reset --mongo mongodb://localhost:27018
# open http://localhost:8081
```

Or run the parts directly (server on 5080, client on 5173) — full steps, demo logins and tests are in
[docs/running.md](docs/running.md).

## Documentation

- [docs/running.md](docs/running.md) — setup, demo data, tests, demo script
- [docs/server-architecture.md](docs/server-architecture.md) — solution layout and conventions
- [docs/server-map.md](docs/server-map.md) — server map
- [docs/decision-log.md](docs/decision-log.md) — design decisions
- [docs/performance.md](docs/performance.md) — benchmarks and load analysis
