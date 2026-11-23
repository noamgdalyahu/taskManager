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

Everyone in a project sees every page; only the editing controls are reserved for managers. Every page is its own
lazily loaded chunk.

### Login / Register — `/login`
Sign in or create an account. Sessions use JWT tokens; passwords are hashed with PBKDF2.

### Projects — `/projects`
Every project you belong to, as cards. Create a new project, or join an existing one with an invite code.

### Overview — `/p/:projectId`
The project's home page: the list of **sprints** with their progress and the product **backlog** at a glance.

### Work items — `/p/:projectId/work-items`
The full list of tasks in the project. Create, edit, delete and filter work items (stories, tasks, bugs and any other
types defined in the project settings), including their estimates, required skills and dependencies.

### Sprint board — `/p/:projectId/board/:sprintId?`
A Kanban board for a sprint.
- Cards can be grouped (for example by story) into swim lanes with roll-up progress.
- Drag a card to change its status. If a prerequisite is not done, the card **snaps back and explains why**.
- Work-in-progress limits per column, assignee picker, move menu, and a side panel with filters, team capacity and a
  preview of the next sprint.

### Backlog — `/p/:projectId/backlog`
The sprint backlog as a tree of stories and their child tasks, with the sprint's targets.

### Sprint planning — `/p/:projectId/planning/:sprintId?`
The heart of the project.
- **Suggest plan** returns immediately; the calculation runs in a background worker and the page polls for the result.
- The plan shows the **critical path**, a reason for every assignment, and **workload after assignment** per member.
- **Compare** puts the manual assignment, a naive **Greedy** baseline and the **Hungarian** optimum side by side on the
  same cost function.
- Warnings (overloaded members, missing skills, dependency cycles), dependency chains, sprint capacity, and a backlog
  picker to choose what goes into the sprint.
- Accept the plan to apply the assignments.

### Dashboard — `/p/:projectId/dashboard/:sprintId?`
The manager's overview of a sprint: KPI row, completion **forecast**, burndown, status pie, work by type, member
workload, and an **at-risk tasks** list.

### Reports — `/p/:projectId/reports`
Pick a report and a sprint range, then export it as CSV: **Burndown**, **Velocity**, **Cumulative flow**,
**Capacity utilization**, member estimate accuracy and sprint history.

### Team — `/p/:projectId/team`
Members and roles, an invite panel (invite codes) and removing members.

### Project settings — `/p/:projectId/settings`
General details, sprint defaults, task types, team settings and a danger zone (delete the project). Members can read
the settings; only managers can change them.

### Task detail — `/p/:projectId/tasks/:taskId`
One task in full: summary, comment thread, time log list, and an activity log of every change (recorded through an
observer on task-change events).

### My tasks — `/me/tasks`
For members: their tasks **sorted by priority** (due date, critical path, and how many tasks each one blocks), a panel
for the current sprint, and a form to log time.

### Profile — `/profile`
Name, password and **skills**. Skills and weekly hours are what the planner uses to decide which tasks a member can get.

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
