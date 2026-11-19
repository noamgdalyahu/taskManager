# Server map: everything the server must contain

Derived from the project brief (pages, roles, core algorithms, rubric). Each item below maps to a project, a folder and, where relevant, a book chapter. Items marked **CORE** are White Box code graded at the exam.

## 1. Domain model (Core/Domain)

| Entity | Key fields | Notes |
|---|---|---|
| `User` | id, email, passwordHash, name, role (Manager/Member), skills[], weeklyCapacityHours | Skills: `(SkillName, Level 1-5)`. Capacity feeds assignment. |
| `Project` | id, name, description, ownerId, memberIds[], archived | Manager owns, members belong. |
| `Sprint` | id, projectId, name, startDate, endDate, status (Planned/Active/Closed), taskIds[] | Capacity derived from members × working days. |
| `WorkItem` (task) | id, projectId, sprintId?, title, description, estimateHours, deadline?, status (ToDo/InProgress/Blocked/Done), assigneeId?, requiredSkills[], dependsOn[] (task ids), priority? | `dependsOn` edges form the DAG. |
| `TimeLog` | id, taskId, userId, hours, date | Actual vs estimate, velocity input. |
| `Comment` | id, taskId, authorId, text, createdAt | Task detail page. |
| `HistoryEntry` | id, taskId, userId, field, oldValue, newValue, at | Audit trail; also Observer output. |
| `Invitation` | id, projectId, code, email?, expiresAt, used | Manager invites members by code or email. |
| `PlanJob` | id, sprintId, type (Schedule/Assign/Forecast), status (Queued/Running/Done/Failed), requestedBy, result?, error?, timings | Async job record. |

Value objects (`readonly record struct`): `UserId`, `ProjectId`, `SprintId`, `TaskId`, `JobId`, `Hours`, `SkillLevel`, `EmailAddress`, `DateRange`.

## 2. Core algorithms (Core) **CORE**

| Module | Input | Output | Algorithm |
|---|---|---|---|
| `Graph/DependencyGraph` | tasks + dependsOn edges | adjacency lists, in-degrees | Built once per planning run. |
| `Graph/TopologicalSorter` | graph | ordered task list **or** cycle (list of task ids forming it) | Kahn's algorithm; leftover nodes with in-degree > 0 reveal the cycle; DFS to extract the actual cycle path for the warning. |
| `Graph/CriticalPathAnalyzer` | DAG, estimates | earliest start/finish, latest start/finish, slack per task, critical path, project length | CPM forward/backward pass over the topological order. |
| `Assignment/IAssignmentStrategy` | tasks, members (skills, capacity), constraints | task→member map, per-task reason, total cost, over-capacity warnings | Strategy pattern. |
| `Assignment/GreedyAssignmentStrategy` | same | same | Baseline: for each task in priority order pick the cheapest eligible member. Used for the "improvement" comparison. |
| `Assignment/HungarianAssignmentStrategy` | same | same | Hungarian algorithm adapted: expand each member into capacity slots, cost = f(skill gap, workload, critical-path position), infinite cost for missing skills. |
| `Assignment/CostMatrixBuilder` | tasks, members, weights | cost matrix | Keeps the cost function separate so it can be explained and tuned. |
| `Planning/SprintPlanner` | sprint, backlog selection, members | `PlanResult`: ordered tasks, assignment, warnings (cycle, over-capacity, missed deadline), critical path | Orchestrates graph → CPM → assignment. |
| `Priority/PriorityScorer` | member's tasks, CPM data | ranked tasks with reason strings | Weighted score: deadline proximity, slack, number of dependents blocked. |
| `Forecast/VelocityCalculator` | closed sprints, time logs | hours/day velocity | Moving average over last N sprints. |
| `Forecast/BurndownForecaster` | sprint, remaining hours, velocity | forecast finish date, on-time flag, burndown series | Linear projection; marks at-risk. |
| `Metrics/PlanComparer` | greedy result, Hungarian result | improvement % (cost, balance std-dev) | Evidence for the book. |

Each module: XML docs, complexity note, unit tests (empty, single, cycle, ties, infeasible, large random).

## 3. Abstractions (Core/Abstractions)

Repository interfaces, implemented in Data:
`IUserRepository`, `IProjectRepository`, `ISprintRepository`, `IWorkItemRepository`, `ITimeLogRepository`, `ICommentRepository`, `IHistoryRepository`, `IInvitationRepository`, `IPlanJobRepository`.

Also: `IClock` (testable time), `IPasswordHasher` (interface in Core, implementation in Api).

## 4. Data layer (Data)

- `MongoContext`: client, database, typed `IMongoCollection<T>` accessors, registered as singleton.
- One repository class per interface; explicit document ↔ domain mappers (`Mappers/`).
- `Documents/`: Mongo document classes (string ids, BSON attributes) kept separate from domain records.
- Indexes defined in code at startup: `users.email` unique, `workItems.sprintId`, `workItems.projectId`, `timeLogs.taskId`, `invitations.code` unique, `planJobs.status`.
- JSON-schema validators per collection (book: replaces ERD/nullability table).
- Options: `MongoOptions { ConnectionString, DatabaseName }` bound from config.

## 5. API layer (Api)

### 5.1 Controllers and endpoints

| Controller | Endpoints | Roles |
|---|---|---|
| `AuthController` | POST register, POST login, POST logout, POST refresh, GET me | anonymous / any |
| `ProfileController` | GET/PUT profile, PUT skills, PUT capacity, PUT password | any |
| `ProjectsController` | CRUD, PATCH archive, GET team, POST invite, POST join (by code), DELETE member | Manager (join: any) |
| `SprintsController` | CRUD per project, POST start, POST close, GET capacity | Manager (GET: any member) |
| `TasksController` | CRUD, PATCH status, PUT assignee, PUT dependencies, GET detail, GET history | Manager edits; Member status only |
| `BoardController` | GET board (by sprint, optional member filter), GET blockers for task | any project member |
| `PlanningController` | POST suggest-plan (enqueue job), POST suggest-assignment, GET job/{id}, POST accept plan, POST override assignment, GET compare | Manager |
| `MyTasksController` | GET my tasks (priority-ranked with reasons) | Member |
| `TimeLogsController` | POST log, GET by task, GET mine | any |
| `CommentsController` | POST, GET by task, DELETE own | any |
| `DashboardController` | GET sprint summary, GET burndown, GET workload, GET at-risk | Manager |
| `ReportsController` | GET sprint history, GET member history, GET velocity trend, GET estimate-vs-actual | Manager |

### 5.2 Services (Api/Services)

One service per bounded area, orchestrating repositories and Core:
`AuthService`, `ProfileService`, `ProjectService`, `SprintService`, `TaskService` (enforces status rules: cannot start while dependencies unfinished), `PlanningService` (builds Core inputs, enqueues jobs, applies accepted plans), `PriorityService`, `DashboardService`, `ReportService`, `InvitationService`.

### 5.3 Async job runner (mandatory async/parallel)

- `IJobQueue` backed by `System.Threading.Channels.Channel<PlanJob>`.
- `PlanningWorker : BackgroundService` with N parallel consumers (configurable degree of parallelism).
- Jobs persisted in `planJobs` so the client can poll `GET job/{id}`; status transitions Queued → Running → Done/Failed.
- `Parallel.ForEach` inside the Hungarian cost-matrix build for large inputs (parallel element, measurable in performance chapter).
- Cancellation on shutdown; timeout per job.

### 5.4 Security (book chapter 10)

- Password hashing: PBKDF2 via `Rfc2898DeriveBytes` or `Microsoft.AspNetCore.Identity.PasswordHasher` (salted, iterated). Never plaintext.
- JWT bearer auth (access token + refresh token); role claim; policies `RequireManager`, `RequireProjectMember` (resource-based authorization handler checking project membership).
- Input validation: Data Annotations on request DTOs + `[ApiController]` automatic 400; extra business validation in services returning result types.
- CORS restricted to client origin; HTTPS redirection; rate limiting on login (`AddRateLimiter`).
- Threat analysis in book: transport (TLS), auth (token theft, brute force), authz (IDOR across projects), injection (Mongo operator injection via typed filters), DoS on planning endpoint (job queue bounds).

### 5.5 Cross-cutting (AOP awareness)

- Global exception handler middleware → ProblemDetails.
- Request logging + correlation id middleware.
- Action filter for audit/history writes on task mutations (Observer: `ITaskEventPublisher` → `HistoryRecorder`, future: real-time notifications).
- Serilog or built-in `ILogger`; timing of planning jobs logged for the performance chapter.
- Health check endpoint (`/health`) including Mongo ping.
- OpenAPI/Swagger in development.

### 5.6 Configuration

`appsettings.json` sections: `Mongo`, `Jwt { Issuer, Audience, Key, AccessMinutes, RefreshDays }`, `Planning { WorkerCount, JobTimeoutSeconds, Weights {...} }`, `Cors { Origins }`. Secrets via user-secrets in dev.

## 6. Tests

| Project | Covers |
|---|---|
| `tests/SprintManager.Core.Tests` | every Core module; property-style random DAG tests; Hungarian vs greedy comparison |
| `tests/SprintManager.Api.Tests` (later) | services with in-memory repository fakes; auth and authz; job runner |
| `tests/SprintManager.Data.Tests` (optional) | repositories against a local Mongo |

## 7. Performance and load (book chapter 13)

- Benchmark harness (console or test) measuring planner runtime vs task count (10, 100, 1 000, 5 000) and member count.
- Load test of planning endpoint with concurrent users (k6 or simple parallel HttpClient) showing jobs queued, not blocking requests.
- Record results in `docs/performance.md`.

## 8. Folder layout target

```
SprintManager.Core/
  Abstractions/   Domain/   Graph/   Assignment/   Planning/   Priority/   Forecast/   Metrics/
SprintManager.Data/
  MongoContext.cs   Documents/   Mappers/   Repositories/   Indexes/
SprintManager.Api/
  Controllers/   Contracts/ (request/response DTOs)   Services/   Jobs/   Auth/   Middleware/   Mapping/   Program.cs
tests/
  SprintManager.Core.Tests/   SprintManager.Api.Tests/
```
