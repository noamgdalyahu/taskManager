# Sprint Manager: project briefing for presentations

This file is written so it can be given to Claude (or any assistant) at the start of a chat. It explains what the
project is, how it is built, what is interesting about it, and what to be careful not to overclaim. Source repository:
https://github.com/noamgdalyahu/taskManager (wiki: one page per website page).

## 1. What it is, in one paragraph

Sprint Manager is a sprint-planning and task-management web app for small software teams, similar in spirit to Azure
Boards or Jira, but with one distinctive feature: it **suggests who should do which task**. It builds the dependency
graph of the sprint's tasks, finds the critical path, and assigns tasks to people with the Hungarian algorithm, taking
skills, capacity and workload balance into account. A manager can compare that plan with their own manual assignment
and with a naive greedy baseline, then accept it. Around that core are a Kanban board, a manager dashboard with a
forecast, reports, a per-member priority list, time logging and a task activity history.

It is a student final project (the docs mention a project book, a supervisor and an oral exam). The language
requirement is met by C#; the stated academic angle is "algorithms with a measurable improvement over the existing
solution", where "existing" means the manager's hand assignment.

## 2. The problem it solves

- Managers assign tasks by feel. That ignores dependencies (a task cannot start before its prerequisite), skills and
  how loaded each person already is, so sprints end with overloaded people and blocked work.
- Teams do not see early that a sprint will miss its end date.
- Members do not know what to work on first.

The app answers each: an optimised plan with a reason for every assignment, a forecast and at-risk list, and a
priority-ranked "My tasks" list.

## 3. The pages (what to show on slides)

| Page | URL | What it does |
|---|---|---|
| Login / Register | `/login` | JWT sign-in, PBKDF2 password hashes |
| Projects | `/projects` | Cards for your projects; create one or join with an invite code |
| Overview | `/p/:id` | Sprints with progress, backlog at a glance |
| Work items | `/p/:id/work-items` | All tasks: create, edit, delete, types, estimates, skills, dependencies |
| Sprint board | `/p/:id/board` | Kanban with drag and drop, swim lanes, WIP limits, filters in the URL. A move whose prerequisite is not done snaps back and shows why |
| Backlog | `/p/:id/backlog` | Stories and their tasks as a tree, sprint targets |
| Sprint planning | `/p/:id/planning` | The core page: Suggest plan (background job), critical path, reasons, workload after assignment, warnings, Compare, Accept |
| Dashboard | `/p/:id/dashboard` | KPIs, completion forecast, burndown, status pie, work by type, workload vs capacity, at-risk tasks |
| Reports | `/p/:id/reports` | Burndown, velocity, cumulative flow, capacity utilization, estimate accuracy, sprint history; CSV export |
| Team | `/p/:id/team` | Members, roles, invite codes, removal |
| Project settings | `/p/:id/settings` | General, sprints, types, team, danger zone (managers edit, members read) |
| Task detail | `/p/:id/tasks/:taskId` | Summary, comments, time logs, activity log of every change |
| My tasks | `/me/tasks` | A member's tasks ranked by due date, critical path and how many tasks they block; log time |
| Profile | `/profile` | Name, password, skills and weekly hours (the planner reads these) |

UI notes: dark and light mode, mobile layout, reduced-motion support, sidebar modelled on Azure DevOps, board modelled
on Azure Boards. Live updates: a change made in one window appears in other open windows without a reload.

## 4. Architecture

```
Browser (React 19 + TypeScript + MUI, TanStack Query, dnd-kit)
   |  HTTPS /api  (+ WebSocket /hubs/changes for live updates)
ASP.NET Core 9 API  (controllers, services, JWT auth, background job worker, SignalR hub)
   |
Core (pure C#, no framework): graph, assignment, priority, forecast, planner
Data (MongoDB repositories and mappers)
   |
MongoDB
```

- **Three server projects:** `SprintManager.Core` (algorithms and domain, no framework and no database, so it is unit
  testable), `SprintManager.Data` (MongoDB), `SprintManager.Api` (controllers, services, auth). Dependency direction:
  Api -> Core, Api -> Data -> Core. Repository interfaces live in Core (dependency inversion).
- **One folder per page**, on the server and on the client. Each page folder holds its controller, service, contracts
  and mappers.
- **Design patterns used on purpose:** Strategy (assignment strategies: Greedy and Hungarian share one interface),
  Repository, Observer (task changes are published once; the history recorder is an observer), Result types instead of
  exceptions for expected failures.
- **Async and parallel:** "Suggest plan" returns HTTP 202 immediately; a bounded in-memory queue and N background
  workers compute the plan; the client polls the job. On restart, queued jobs are re-queued and running ones are marked
  failed.
- **Security:** JWT bearer auth, PBKDF2 hashing, login rate limiting, and one authorization gate (`ProjectAccess`).
  Someone outside a project always gets 404, never 403, so ids cannot be probed.
- **Typed contract:** TypeScript types are generated from the server's OpenAPI document.
- **Live updates (added later):** after any successful write the server sends a content-free "changed" message over
  SignalR; open windows refetch what they show. If the connection is down the page polls every 10 seconds.

## 5. The algorithms (the part to explain well)

1. **Dependency graph and topological sort (Kahn).** In-degree queue. If tasks remain after the queue empties, they form
   a cycle; the cycle is returned as data so the UI can show the exact cycle instead of crashing. O(V + E).
2. **Critical path (CPM).** Forward and backward pass gives earliest and latest start, slack, and the critical path,
   ignoring people. It is a lower bound on sprint length. O(V + E).
3. **Assignment (Hungarian algorithm with capacity slots).** Each member is expanded into several "slots"; each slot is
   priced by the load before it plus the task's estimate, so the optimiser prefers spreading work. Missing skill is a
   forbidden (very large) cost. Because the final load depends on the solution, prices are recomputed over up to 4
   rounds and the best round by true objective is kept. Overload is priced and warned about, never silently dropped.
4. **Greedy baseline.** Critical tasks first, longest first, cheapest member at that moment. It mimics how a manager
   assigns by hand and is the comparison point.
5. **Priority score (My tasks).** Weighted sum of four 0..1 components: deadline urgency, criticality (normalised
   slack), share of tasks transitively blocked by this one, and an in-progress bonus. The reason text is generated from
   the same components, so the UI can explain the rank.
6. **Forecast.** Velocity is the moving average of the last 3 sprints; completion is a linear burndown extrapolation,
   preferring the pace inside the current sprint, capped at +30 working days. Working calendar: Friday and Saturday off,
   8 hours a day, configurable.

Planner pipeline: graph -> Kahn -> CPM -> assignment -> feasibility checks. A cycle stops the pipeline early with the
concrete cycle; other problems are advisory warnings so the manager can still accept and adjust.

## 6. Numbers you can quote (from `docs/performance.md`, measured on a dev machine)

- **Graph layer (Kahn + CPM):** linear. 1,000 tasks about 1 ms; 50,000 tasks about 43 ms; 200,000 tasks about 208 ms.
- **Hungarian vs Greedy, 5 members:** 50 tasks 2.75 ms vs 0.13 ms; 100 tasks 16.8 ms vs 0.32 ms; 300 tasks 397 ms vs
  1.07 ms. Hungarian time grows roughly cubically.
- **Full planner:** 10 tasks 0.1 ms, 50 tasks 2 ms, 100 tasks 10 ms, 200 tasks 82 ms.
- **Load test:** 40 concurrent "Suggest plan" requests were all accepted (202) in under about 100 ms while plans took
  1 to 3 seconds to compute. Time to finish all 40: 1 worker 2,975 ms; 2 workers 1,841 ms; 8 workers 971 ms (speed-up
  1.6x and 3.1x, sub-linear because of database contention). No failures.
- **Tests:** the docs report 146 server tests (core algorithms, services with in-memory fakes, plan storage), plus
  client tests added later. Treat the exact count as "check before quoting".

## 7. Honest claims (important for slides)

- The measured improvement of Hungarian over Greedy on **random** data is **modest: 0.2% to 2.5% of the objective**.
  Over 300 random sprints it won 90, lost 22 and tied 188. It is much larger on constructed skill-conflict cases, and
  on the demo sprint where two deliberate manual mistakes are planted. Do not claim large average gains.
- Hungarian is much slower than Greedy and grows cubically, but at realistic sprint sizes (up to about 100 tasks) it
  finishes in under 20 ms.
- The comparison reports a **tie** as a tie, not a win. A bug where a tie was shown as a win was found and fixed.
- Not built: reordering cards inside a column, a Doing/Done column split, a card style-rule editor, notifications,
  CSV import.

## 8. Engineering story (good slide material)

- Bugs found by testing and fixed: unstable MongoDB `$in` ordering made the same input give different plans (fixed by
  restoring requested order, guarded by a determinism test); `Hours` value objects serialised as 0 in stored plans
  (explicit JSON converters); restart orphaned queued jobs (recovery service); a tie reported as a win.
- Test strategy: in-memory fakes of every repository and a prebuilt "world" instead of a mocking library. Mutation
  spot-checks (breaking the membership check failed 4 tests, breaking the dependency rule failed 2) showed the tests can
  fail.
- Decision log: `docs/decision-log.md` records each choice with the alternatives considered (C# over Java, MongoDB
  over PostgreSQL, Kahn over DFS, Hungarian over min-cost flow and simulated annealing, MVC controllers over minimal
  APIs, and others).
- Tooling: GitHub Actions CI (server tests; client lint, tests and build), Docker Compose for the whole stack, a seed
  tool for demo data.

## 9. Tech stack

React 19, TypeScript 5.9, Vite, MUI, TanStack Query, React Router, dnd-kit, motion, axios, SignalR client.
C# / .NET 9, ASP.NET Core MVC, JWT, MongoDB, xUnit, SignalR. Docker and nginx for deployment.

## 10. Running it and a 5-minute demo

Run: `docker compose up -d --build` in `src/server`, then seed with
`dotnet run --project tools/SprintManager.Seed -- --reset --mongo mongodb://localhost:27018`, then open
http://localhost:8081. Without Docker: server on port 5263 (`launchSettings.json`), client with `npm run dev` on 5173.
Full steps in `docs/running.md`.

Demo logins (password `Demo1234!`): `noa@demo.sprintmanager.local` (manager); `avi@`, `dana@`, `eli@`, `maya@` at the
same domain are members.

Demo script:
1. Sign in as Noa (manager), open the project, then Sprint planning for Sprint 2 (it has two planted manual mistakes).
2. Press Suggest plan. The request returns at once and the calculation runs in the background. Point at the critical
   path, the reason for each assignment and the workload bars.
3. Press Compare: manual vs Greedy vs Hungarian on the same cost function.
4. Open the Sprint board and drag a card whose prerequisite is not done; it snaps back with the reason.
5. Open the Dashboard: forecast, burndown, at-risk tasks. Then sign in as Avi to show the member's ranked list.
6. Optional: open two windows and change a card in one to show live updates.

## 11. Facts that may have changed

- Ports: the server uses 5263 by default (`launchSettings.json`); `docs/running.md` also uses 5080 for a manual start.
- Branch `dev` has the latest work; `main` may be behind.
- Read the code or `docs/` before quoting exact numbers, test counts or version numbers.

## 12. Suggested slide outline (adjust to the audience)

1. Title and one-sentence pitch
2. The problem: assigning work by feel
3. Solution overview and a screenshot of Sprint planning
4. How a plan is built (graph, critical path, assignment)
5. Why Hungarian, and why it is compared with Greedy (with the honest numbers)
6. Architecture diagram
7. Async planning and load-test results
8. The rest of the product: board, dashboard, reports, My tasks
9. Quality: tests, bugs found, CI
10. Live demo
11. Limits and future work
12. Q and A
