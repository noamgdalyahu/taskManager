# Performance and load analysis

Source data for book chapter 13 (testing and evaluation). All numbers measured on the development machine
(Windows 11, 20 logical cores, .NET 9.0.6, MongoDB 8.3 local, Release build). Re-run to reproduce:

```
dotnet run -c Release --project tests/SprintManager.Benchmarks     # algorithm scaling
python load script (see "Load test" below)                          # concurrent users
```

## 1. Algorithm scaling (single thread, median of 3 runs after warm-up)

### Graph: dependency graph + Kahn + critical path

| Tasks | Edges | Build ms | Kahn ms | CPM ms | Total ms |
|---:|---:|---:|---:|---:|---:|
| 100 | 265 | 0.04 | 0.01 | 0.04 | 0.10 |
| 1,000 | 2,953 | 0.45 | 0.15 | 0.42 | 1.01 |
| 10,000 | 28,911 | 6.76 | 0.47 | 2.50 | 9.73 |
| 50,000 | 145,678 | 27.50 | 2.03 | 13.27 | 42.80 |
| 200,000 | 581,539 | 125.38 | 9.87 | 72.50 | 207.75 |

Growth is linear in V + E, as the analysis predicts (O(V + E)): 2000x more tasks costs ~2000x more time.
Real sprints (tens of tasks) cost microseconds; the graph layer will never be the bottleneck.

### Assignment: Greedy baseline vs Hungarian (5 members)

| Tasks | Greedy ms | Hungarian ms | Hungarian / Greedy | Objective: Greedy | Objective: Hungarian | Improvement |
|---:|---:|---:|---:|---:|---:|---:|
| 10 | 0.02 | 0.17 | 7x | 1000000007.0 | 1000000006.8 | 0.0% |
| 25 | 0.07 | 0.69 | 10x | 16.0 | 15.9 | 0.8% |
| 50 | 0.13 | 2.75 | 22x | 53.8 | 52.4 | 2.5% |
| 100 | 0.32 | 16.81 | 53x | 205.6 | 203.8 | 0.9% |
| 200 | 0.53 | 122.12 | 231x | 708.3 | 705.2 | 0.4% |
| 300 | 1.07 | 397.09 | 370x | 1572.0 | 1568.8 | 0.2% |

(The 10-task row contains one task nobody can do, priced at the 1e9 "forbidden" sentinel in both columns.)

**Findings, stated honestly:**
- Hungarian time grows roughly cubically (100 → 200 tasks: 7.3x; 200 → 300: 3.3x), matching O(T² · M·T) because each
  member is expanded into T slots. At realistic sprint sizes (up to ~100 tasks) it still finishes in under 20 ms.
- The measured improvement over Greedy is **modest on random data (0.2 - 2.5% of the objective)**. It is larger on
  constructed skill-conflict cases (test `GreedyIsMyopic_HungarianIsNot`: perfectly balanced vs. one member overloaded) and
  it wins far more often than it loses (300 random sprints: 90 wins, 22 losses, 188 ties), but the book should not claim
  large average gains.
- Known limit and future work: a cap on slots per member (derived from capacity) would cut the cubic term; it was
  removed in favour of correctness (overload must be reported, never silently dropped).

### Priority scoring (one member, sprint with N open tasks)

| Open tasks | ms |
|---:|---:|
| 50 | 0.08 |
| 200 | 0.34 |
| 1,000 | 6.03 |
| 3,000 | 51.43 |

Quadratic (transitive dependents are counted per task, O(V·(V+E))), irrelevant at sprint sizes.

### Full planner (graph + CPM + Hungarian + feasibility checks, 5 members)

| Tasks | ms |
|---:|---:|
| 10 | 0.1 |
| 25 | 0.5 |
| 50 | 2.0 |
| 100 | 10.4 |
| 200 | 82.0 |

## 2. Load test: concurrent "Suggest plan" requests

Setup: 5-person team, 150-task sprint with dependencies, **40 concurrent POST /api/sprints/{id}/plan** requests,
queue capacity 200. Metrics from the server's own job records (`queueMilliseconds`, `runMilliseconds`).

| Background workers | Requests accepted (202) | Request latency median / max | Job run ms median | Queue wait ms median / max | All 40 plans finished |
|---:|---:|---:|---:|---:|---:|
| 1 | 40 / 40 | 44 / 102 ms | 45 | 1383 / 2783 | 2975 ms |
| 2 | 40 / 40 | 86 / 95 ms | 52 | 797 / 1585 | 1841 ms |
| 8 | 40 / 40 | 83 / 96 ms | 102 | 326 / 721 | 971 ms |

**Findings:**
- The request path stays fast regardless of how much planning work is queued: every request returned 202 in under
  ~100 ms while plans were still computing for 1-3 seconds. This is the purpose of the asynchronous design.
- No request failed and the server logged no errors; excess work waits in the bounded queue (back-pressure, with a 503
  if the queue is full) instead of piling up threads.
- Parallel speed-up is real but sub-linear: 2 workers 1.6x, 8 workers 3.1x versus 1 worker. Per-job run time grows
  (45 → 102 ms) because workers contend for MongoDB and CPU. More workers than the database can serve gives diminishing
  returns; the default of 2 is a safe choice, tunable through `Planning:WorkerCount`.
- The "request latency" figure includes 40 simultaneous requests competing for the same database connection pool.

## 3. Correctness under repetition

Identical planning input must give an identical plan. A probe that planned the same sprint four times first showed
**different assignments between runs** (MongoDB returns `$in` results in unstable order and the algorithms break ties by
member order). Fixed by restoring the requested order in the repository; the same probe now returns the same plan every
time and a test (`Run_IsDeterministic_ForIdenticalInput`) guards it.
