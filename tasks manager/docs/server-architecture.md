# Server architecture plan

## Solution layout (`src/server`)

| Project | Depends on | Responsibility |
|---|---|---|
| `SprintManager.Core` | nothing | White Box algorithms, domain types, and repository interfaces. No framework, no database. |
| `SprintManager.Data` | Core | MongoDB repositories (Repository pattern), document mappers. |
| `SprintManager.Api` | Core, Data | Controllers, DTOs, `Services/` (use cases, background job runner), auth, DI composition root. |
| `tests/SprintManager.Core.Tests` | Core | xUnit tests for every core algorithm. |

Dependency direction: Api -> Core and Api -> Data -> Core. Repository interfaces live in `Core/Abstractions` so Data can implement them without referencing Api (dependency inversion).

## Inside Core

```
Abstractions/ repository interfaces (ITaskRepository...)
Domain/      value objects (TaskId, MemberId, Hours...), WorkItem, Member
Graph/       DependencyGraph, topological sort, cycle detection, critical path (CPM), slack
Assignment/  IAssignmentStrategy (Strategy pattern): NaiveGreedy baseline, Hungarian adaptation
Priority/    priority scoring for a member's task list
Forecast/    velocity, burndown, completion estimate
```

## Inside Api: one folder per page

```
SprintManager.Api/
  Controllers/
    Shared/          ApiControllerBase, OperationResult, ProjectAccess (resource-based authorization)
    Auth/            Login / register page        AuthController, AuthService, contracts, mapping
    Profile/         Profile page                 ProfileController, ProfileService, contracts
    Projects/        Projects list + project page ProjectsController, ProjectService, contracts, mapping
    Team/            Team management page         TeamController, TeamService (invites, join, remove)
    SprintPlanning/
      Sprints/       Sprint create/edit/start/close
      Plans/         "Suggest plan" jobs, polling, accept   (PlanningService also runs the job)
    Board/           Kanban board                 BoardController, BoardService
    MyTasks/         My tasks (priority ranked)   MyTasksController, MyTasksService
    Tasks/           Backlog + task detail        TasksController, TaskService, TaskAccess
      Comments/      Comment thread
      TimeLogs/      Time logging
      Events/        Observer: TaskChanged, TaskChangePublisher, HistoryRecorder
    Dashboard/       Manager dashboard            DashboardController, DashboardService
    Reports/         Reports                      ReportsController, ReportsService
  Security/          Pbkdf2PasswordHasher, JwtTokenService, CurrentUser, Policies
  Jobs/              Channel queue and the PlanningWorker background service (async/parallel)
  Options/           Typed configuration
  Infrastructure/    SystemClock
  Program.cs         Composition root
```

Rule: a page folder contains its controller, its service (the logic), its request/response contracts and its mappers.
A page splits into sub-folders only when it has distinct parts (the tasks page: tasks, comments, time logs, events).
Pages may use another page's contracts and mappers (for example Board shows `TaskDto` from Tasks), but never another
page's controller.

## Conventions (from the C# standards skill)

- Value objects are `readonly record struct`, no implicit conversions.
- Expected failures use domain-specific result types (for example `PlanResult` with error codes), not exceptions.
- Explicit mapping methods between layers, no AutoMapper.
- Composition over inheritance, `CancellationToken` on all I/O.

## Build order

1. Core domain value objects.
2. `DependencyGraph`: Kahn topological sort with cycle detection, then critical path and slack. Unit tests.
3. Assignment: naive baseline, then the Hungarian adaptation with skill and capacity constraints. Compare the two.
4. Priority scoring and forecast.
5. Api page services and the async job runner (background scheduling, off the request path).
6. Data layer: MongoDB repositories.
7. Api: controllers, authentication (password hashing), role policies, validation.
8. Performance and load analysis.

## Tools

| Tool | Purpose |
|---|---|
| `tools/SprintManager.Seed` | Demo data for the oral exam. `dotnet run --project tools/SprintManager.Seed -- --reset` recreates a 5-person team, a closed Sprint 1 (velocity history) and an active Sprint 2 with a believable burndown. Accounts `noa|avi|dana|eli|maya@demo.sprintmanager.local`, password `Demo1234!`. |
| `tests/SprintManager.Benchmarks` | Algorithm scaling tables (`dotnet run -c Release --project tests/SprintManager.Benchmarks`). Results in `docs/performance.md`. |
