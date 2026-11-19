using System.Diagnostics;
using SprintManager.Core.Assignment;
using SprintManager.Core.Domain;
using SprintManager.Core.Graph;
using SprintManager.Core.Planning;
using SprintManager.Core.Priority;

// Performance analysis of the core algorithms. Run:  dotnet run -c Release --project tests/SprintManager.Benchmarks
// Prints Markdown tables that are pasted into docs/performance.md (book chapter 13).

string[] skills = ["C#", "SQL", "React", "DevOps"];
var rng = new Random(2026);

Console.WriteLine($"Runtime: {Environment.Version}, cores: {Environment.ProcessorCount}, build: {(IsDebug() ? "DEBUG (numbers not representative)" : "Release")}\n");

GraphScaling();
AssignmentScaling();
PriorityScaling();
FullPlannerScaling();

// ------------------------------------------------------------------------------------------------

void GraphScaling()
{
    Console.WriteLine("## Graph: Kahn sort + critical path (random DAG, ~3 dependencies per task)\n");
    Console.WriteLine("| Tasks | Edges | Build ms | Kahn ms | CPM ms | Total ms |");
    Console.WriteLine("|---:|---:|---:|---:|---:|---:|");
    foreach (var n in new[] { 100, 1_000, 10_000, 50_000, 200_000 })
    {
        var tasks = RandomTasks(n, avgDeps: 3);
        DependencyGraph graph = null!;
        var build = Median(3, () => graph = DependencyGraph.Build(tasks));
        TopologicalSortResult sort = null!;
        var kahn = Median(3, () => sort = TopologicalSorter.Sort(graph));
        var cpm = Median(3, () => CriticalPathAnalyzer.Analyze(graph, sort.Order));
        Console.WriteLine($"| {n:N0} | {graph.EdgeCount:N0} | {build:0.00} | {kahn:0.00} | {cpm:0.00} | {build + kahn + cpm:0.00} |");
    }
    Console.WriteLine();
}

void AssignmentScaling()
{
    Console.WriteLine("## Assignment: Greedy vs Hungarian (5 members, random skills)\n");
    Console.WriteLine("| Tasks | Greedy ms | Hungarian ms | Hungarian / Greedy | Greedy objective | Hungarian objective | Improvement |");
    Console.WriteLine("|---:|---:|---:|---:|---:|---:|---:|");
    foreach (var n in new[] { 10, 25, 50, 100, 200, 300 })
    {
        var members = RandomMembers(5);
        var tasks = RandomTasks(n, avgDeps: 0, withSkills: true);
        var request = AssignmentRequest.Of(tasks, members);
        var greedy = new GreedyAssignmentStrategy();
        var hungarian = new HungarianAssignmentStrategy();

        AssignmentResult g = null!, h = null!;
        var gMs = Median(3, () => g = greedy.Assign(request));
        var hMs = Median(n >= 200 ? 1 : 3, () => h = hungarian.Assign(request));
        var go = Objective(g, request);
        var ho = Objective(h, request);
        Console.WriteLine($"| {n} | {gMs:0.00} | {hMs:0.00} | {hMs / Math.Max(gMs, 0.001):0.0}x | {go:0.0} | {ho:0.0} | {(go - ho) / go * 100:0.0}% |");
    }
    Console.WriteLine();
}

void PriorityScaling()
{
    Console.WriteLine("## Priority scoring for one member (transitive dependents are O(V·(V+E)))\n");
    Console.WriteLine("| Open tasks in sprint | ms |");
    Console.WriteLine("|---:|---:|");
    var me = MemberId.New();
    foreach (var n in new[] { 50, 200, 1_000, 3_000 })
    {
        var tasks = RandomTasks(n, avgDeps: 2).Select((t, i) => t with { AssigneeId = i % 5 == 0 ? me : null }).ToList();
        var ms = Median(3, () => PriorityScorer.Rank(new PriorityRequest(tasks, me, new DateOnly(2026, 11, 16))));
        Console.WriteLine($"| {n:N0} | {ms:0.00} |");
    }
    Console.WriteLine();
}

void FullPlannerScaling()
{
    Console.WriteLine("## Full SprintPlanner (graph + CPM + Hungarian + checks), 5 members\n");
    Console.WriteLine("| Tasks | ms |");
    Console.WriteLine("|---:|---:|");
    foreach (var n in new[] { 10, 25, 50, 100, 200 })
    {
        var request = new SprintPlanRequest(RandomTasks(n, avgDeps: 1, withSkills: true), RandomMembers(5), new DateOnly(2026, 11, 15), new DateOnly(2026, 11, 26));
        var ms = Median(n >= 200 ? 1 : 3, () => new SprintPlanner().Plan(request));
        Console.WriteLine($"| {n} | {ms:0.0} |");
    }
    Console.WriteLine();
}

// ------------------------------------------------------------------------------------------------

List<WorkItem> RandomTasks(int n, double avgDeps, bool withSkills = false)
{
    var ids = Enumerable.Range(0, n).Select(_ => TaskId.New()).ToArray();
    var tasks = new List<WorkItem>(n);
    for (var i = 0; i < n; i++)
    {
        var deps = new List<TaskId>();
        if (i > 0 && avgDeps > 0)
        {
            var count = (int)Math.Round(avgDeps * rng.NextDouble() * 2);
            for (var k = 0; k < count; k++)
                deps.Add(ids[Math.Max(0, i - 1 - rng.Next(0, Math.Min(i, 50)))]);   // recent tasks: realistic locality, keeps the DAG deep
        }
        var req = withSkills ? skills.Where(_ => rng.NextDouble() < 0.3).ToArray() : [];
        tasks.Add(new WorkItem(ids[i], $"T{i}", new Hours(rng.Next(1, 13)), deps.Distinct().ToList(), req));
    }
    return tasks;
}

List<Member> RandomMembers(int n) => Enumerable.Range(0, n).Select(i =>
    Member.Create(MemberId.New(), $"M{i}", new Hours(80),
        skills.Where(_ => rng.NextDouble() < 0.7).Select(s => (s, rng.Next(1, 6))).ToArray())).ToList();

double Objective(AssignmentResult r, AssignmentRequest req)
{
    var members = req.Members.ToDictionary(m => m.Id);
    var total = 0d;
    foreach (var a in r.Assignments)
        total += a.MemberId is { } id ? a.Cost + req.Weights.Balance * r.LoadPerMember[id].Value / members[id].Capacity.Value : HungarianSolver.Forbidden;
    return total;
}

static double Median(int runs, Action action)
{
    action();   // warm-up (JIT)
    var times = new List<double>();
    for (var i = 0; i < runs; i++)
    {
        var sw = Stopwatch.StartNew();
        action();
        times.Add(sw.Elapsed.TotalMilliseconds);
    }
    times.Sort();
    return times[times.Count / 2];
}

static bool IsDebug()
{
#if DEBUG
    return true;
#else
    return false;
#endif
}
