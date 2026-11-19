using SprintManager.Core.Domain;
using SprintManager.Core.Graph;

namespace SprintManager.Core.Priority;

/// <summary>
/// Ranks a member's open tasks: what to do first and why.
/// </summary>
/// <remarks>
/// score = Deadline × urgency + Critical × criticality + Blocking × blockingShare + InProgress × [started]
/// <list type="bullet">
/// <item><b>Urgency</b>: linear from 1 (due today or overdue) to 0 at <see cref="PriorityWeights.DeadlineHorizonDays"/> working days away.</item>
/// <item><b>Criticality</b>: CPM slack over the <i>open</i> tasks, normalised so the tightest task scores 1.</item>
/// <item><b>Blocking share</b>: how many open tasks transitively wait on this one, divided by the number of other open tasks.
/// Transitive (not just direct) because unblocking a chain of five matters more than unblocking one.</item>
/// </list>
/// Every component is 0..1 before weighting, so weights are comparable and the manager can tune them.
/// Done tasks are excluded from the graph first: a finished prerequisite blocks nobody and has no slack of its own.
/// <para>Time: O(V + E) for sort and CPM, plus O(V × (V + E)) for transitive dependents; fine for sprint sizes.</para>
/// </remarks>
public static class PriorityScorer
{
    /// <summary>Ranks the member's open tasks, highest priority first.</summary>
    public static IReadOnlyList<PrioritizedTask> Rank(PriorityRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        var weights = request.Weights ?? PriorityWeights.Default;
        var calendar = request.Calendar ?? WorkCalendar.Default;

        var open = request.SprintTasks.Where(t => !t.IsDone).ToList();
        if (open.Count == 0)
            return [];

        var graph = DependencyGraph.Build(open);
        var sort = TopologicalSorter.Sort(graph);
        var slack = sort.IsAcyclic ? SlackPerTask(graph, sort.Order) : new double[open.Count]; // cycle: treat all as critical
        var maxSlack = slack.Length == 0 ? 0 : slack.Max();
        var dependents = TransitiveDependentCounts(graph);

        var mine = new List<PrioritizedTask>();
        for (var i = 0; i < open.Count; i++)
        {
            var task = open[i];
            if (task.AssigneeId != request.MemberId)
                continue;

            var components = new PriorityComponents(
                DeadlineUrgency: Urgency(task.Deadline, request.Today, calendar, weights.DeadlineHorizonDays),
                Criticality: maxSlack <= CriticalPathAnalyzer.Epsilon ? 1 : 1 - slack[i] / maxSlack,
                BlockingShare: open.Count > 1 ? dependents[i] / (double)(open.Count - 1) : 0,
                IsInProgress: task.Status is WorkItemStatus.InProgress);

            var score =
                weights.Deadline * components.DeadlineUrgency +
                weights.Critical * components.Criticality +
                weights.Blocking * components.BlockingShare +
                (components.IsInProgress ? weights.InProgress : 0);

            mine.Add(new PrioritizedTask(task, 0, score, components, dependents[i], Reason(task, components, dependents[i], request.Today, calendar)));
        }

        return mine
            .OrderByDescending(p => p.Score)
            .ThenBy(p => p.Task.Deadline ?? DateOnly.MaxValue)
            .ThenBy(p => p.Task.Title, StringComparer.Ordinal)
            .Select((p, index) => p with { Rank = index + 1 })
            .ToList();
    }

    private static double[] SlackPerTask(DependencyGraph graph, IReadOnlyList<int> order)
    {
        var cpm = CriticalPathAnalyzer.Analyze(graph, order);
        var slack = new double[graph.Count];
        for (var i = 0; i < graph.Count; i++)
            slack[i] = cpm.Timings[i].Slack.Value;
        return slack;
    }

    /// <summary>For each task, how many distinct tasks are reachable through "depends on me" edges.</summary>
    private static int[] TransitiveDependentCounts(DependencyGraph graph)
    {
        var counts = new int[graph.Count];
        var seen = new bool[graph.Count];
        var stack = new Stack<int>();

        for (var start = 0; start < graph.Count; start++)
        {
            Array.Clear(seen);
            stack.Push(start);
            seen[start] = true;
            var reached = 0;

            while (stack.Count > 0)
            {
                var current = stack.Pop();
                foreach (var next in graph.SuccessorsOf(current))
                {
                    if (seen[next])
                        continue;
                    seen[next] = true;
                    reached++;
                    stack.Push(next);
                }
            }
            counts[start] = reached;
        }
        return counts;
    }

    private static double Urgency(DateOnly? deadline, DateOnly today, WorkCalendar calendar, int horizonDays)
    {
        if (deadline is not { } due)
            return 0;
        if (due <= today)
            return 1;

        var daysLeft = calendar.WorkingDaysBetween(today.AddDays(1), due);
        return Math.Clamp(1 - daysLeft / (double)horizonDays, 0, 1);
    }

    private static string Reason(WorkItem task, PriorityComponents c, int blocked, DateOnly today, WorkCalendar calendar)
    {
        var parts = new List<string>(4);
        if (task.Deadline is { } due)
        {
            parts.Add(due <= today
                ? (due == today ? "due today" : "overdue")
                : $"due in {calendar.WorkingDaysBetween(today.AddDays(1), due)} working days");
        }
        if (c.Criticality >= 0.999)
            parts.Add("on the critical path");
        else if (c.Criticality >= 0.5)
            parts.Add("little slack");
        if (blocked > 0)
            parts.Add(blocked == 1 ? "blocks 1 task" : $"blocks {blocked} tasks");
        if (c.IsInProgress)
            parts.Add("already started");

        return parts.Count == 0 ? "no pressure" : string.Join(", ", parts);
    }
}
