using SprintManager.Core.Domain;

namespace SprintManager.Core.Graph;

/// <summary>
/// Critical Path Method (CPM) over a task dependency DAG.
/// Computes, for every task, the earliest and latest times it can run without delaying the plan,
/// the slack between them, and the chain of zero-slack tasks that determines the total duration.
/// </summary>
/// <remarks>
/// Two linear passes over a topological order:
/// <list type="number">
/// <item><b>Forward pass</b> (in order): earliestStart[t] = max(earliestFinish of prerequisites); earliestFinish = earliestStart + estimate.</item>
/// <item><b>Backward pass</b> (reverse order): latestFinish[t] = min(latestStart of successors), or the total duration for tasks with no successors; latestStart = latestFinish − estimate.</item>
/// </list>
/// Slack = latestStart − earliestStart. Tasks with zero slack are critical.
/// The topological order guarantees every prerequisite is final before it is read.
/// <para>Time: O(V + E). Space: O(V).</para>
/// <para>Unit of time is hours of effort. Capacity (how many people) is deliberately ignored here:
/// CPM gives the lower bound; the assignment step adds the people constraint.</para>
/// </remarks>
public static class CriticalPathAnalyzer
{
    /// <summary>Tolerance for floating point comparison of slack.</summary>
    public const double Epsilon = 1e-9;

    /// <summary>Runs CPM over the graph using an already computed topological order.</summary>
    /// <param name="graph">The dependency graph.</param>
    /// <param name="topologicalOrder">A valid order from <see cref="TopologicalSorter"/>.</param>
    /// <exception cref="ArgumentException">The order does not cover the whole graph.</exception>
    public static CriticalPathResult Analyze(DependencyGraph graph, IReadOnlyList<int> topologicalOrder)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(topologicalOrder);
        if (topologicalOrder.Count != graph.Count)
            throw new ArgumentException("Topological order must contain every task exactly once.", nameof(topologicalOrder));

        var n = graph.Count;
        var estimate = new double[n];
        for (var i = 0; i < n; i++)
            estimate[i] = graph.Tasks[i].Estimate.Value;

        var earliestStart = ForwardPass(graph, topologicalOrder, estimate);

        var totalDuration = 0d;
        for (var i = 0; i < n; i++)
            totalDuration = Math.Max(totalDuration, earliestStart[i] + estimate[i]);

        var latestFinish = BackwardPass(graph, topologicalOrder, estimate, totalDuration);

        var timings = new TaskTiming[n];
        for (var i = 0; i < n; i++)
        {
            var latestStart = latestFinish[i] - estimate[i];
            timings[i] = new TaskTiming(
                graph.Tasks[i].Id,
                EarliestStart: new Hours(earliestStart[i]),
                EarliestFinish: new Hours(earliestStart[i] + estimate[i]),
                LatestStart: new Hours(latestStart),
                LatestFinish: new Hours(latestFinish[i]),
                Slack: new Hours(Math.Max(0, latestStart - earliestStart[i])));
        }

        return new CriticalPathResult(timings, ExtractCriticalPath(graph, timings, estimate), new Hours(totalDuration));
    }

    /// <summary>Earliest start of each task: a task can start once its slowest prerequisite finishes.</summary>
    private static double[] ForwardPass(DependencyGraph graph, IReadOnlyList<int> order, double[] estimate)
    {
        var earliestStart = new double[graph.Count];
        foreach (var current in order)
        {
            var finish = earliestStart[current] + estimate[current];
            foreach (var next in graph.SuccessorsOf(current))
                earliestStart[next] = Math.Max(earliestStart[next], finish);
        }
        return earliestStart;
    }

    /// <summary>Latest finish of each task: it must end before its most urgent successor has to start.</summary>
    private static double[] BackwardPass(DependencyGraph graph, IReadOnlyList<int> order, double[] estimate, double totalDuration)
    {
        var latestFinish = new double[graph.Count];
        Array.Fill(latestFinish, totalDuration);

        for (var k = order.Count - 1; k >= 0; k--)
        {
            var current = order[k];
            foreach (var next in graph.SuccessorsOf(current))
                latestFinish[current] = Math.Min(latestFinish[current], latestFinish[next] - estimate[next]);
        }
        return latestFinish;
    }

    /// <summary>
    /// Walks one critical chain from a critical task with no critical prerequisites,
    /// always stepping to a critical successor whose earliest start equals our earliest finish
    /// (that is the edge that actually carries the delay).
    /// </summary>
    private static IReadOnlyList<TaskId> ExtractCriticalPath(DependencyGraph graph, TaskTiming[] timings, double[] estimate)
    {
        var start = -1;
        for (var i = 0; i < graph.Count; i++)
        {
            if (timings[i].IsCritical && timings[i].EarliestStart.Value <= Epsilon)
            {
                start = i;
                break;
            }
        }
        if (start < 0)
            return [];

        var path = new List<TaskId>();
        var current = start;
        while (current >= 0)
        {
            path.Add(graph.Tasks[current].Id);
            current = NextOnCriticalPath(graph, timings, estimate, current);
        }
        return path;
    }

    private static int NextOnCriticalPath(DependencyGraph graph, TaskTiming[] timings, double[] estimate, int current)
    {
        var finish = timings[current].EarliestStart.Value + estimate[current];
        foreach (var next in graph.SuccessorsOf(current))
        {
            if (timings[next].IsCritical && Math.Abs(timings[next].EarliestStart.Value - finish) <= Epsilon)
                return next;
        }
        return -1;
    }
}
