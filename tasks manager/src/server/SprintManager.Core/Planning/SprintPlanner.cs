using SprintManager.Core.Assignment;
using SprintManager.Core.Domain;
using SprintManager.Core.Graph;

namespace SprintManager.Core.Planning;

/// <summary>
/// The "Suggest plan" button. Runs the core pipeline in order and turns the results into one plan
/// with warnings the manager can act on.
/// </summary>
/// <remarks>
/// Pipeline:
/// <list type="number">
/// <item>Build the dependency graph.</item>
/// <item>Topological sort. A cycle stops here: no order exists, so nothing else is meaningful.</item>
/// <item>Critical path (CPM) on the order: timings, slack, critical chain.</item>
/// <item>Assignment with the injected strategy, telling it which tasks are critical.</item>
/// <item>Feasibility checks: critical path vs sprint length, total estimate vs team capacity, per-task deadlines.</item>
/// </list>
/// The strategy is injected (Strategy pattern) so the same planner can run with Greedy for comparison.
/// </remarks>
public sealed class SprintPlanner(IAssignmentStrategy strategy)
{
    /// <summary>Planner with the default (Hungarian) strategy.</summary>
    public SprintPlanner() : this(new HungarianAssignmentStrategy()) { }

    /// <summary>Produces a plan for the request.</summary>
    public SprintPlan Plan(SprintPlanRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var graph = DependencyGraph.Build(request.Tasks);
        var sort = TopologicalSorter.Sort(graph);
        if (!sort.IsAcyclic)
            return CycleOnly(sort.Cycle, graph);

        var cpm = CriticalPathAnalyzer.Analyze(graph, sort.Order);
        var critical = cpm.CriticalPath.ToHashSet();
        var assignment = strategy.Assign(new AssignmentRequest(request.Tasks, request.Members, critical, request.EffectiveWeights));

        var calendar = request.EffectiveCalendar;
        var planned = BuildPlannedTasks(graph, sort.Order, cpm, assignment, request.SprintStart, calendar);
        var totalEstimate = new Hours(request.Tasks.Sum(t => t.Estimate.Value));
        var teamCapacity = new Hours(request.Members.Sum(m => m.Capacity.Value));

        var warnings = new List<PlanWarning>();
        AddFeasibilityWarnings(warnings, request, cpm.TotalDuration, totalEstimate, teamCapacity, calendar);
        AddDeadlineWarnings(warnings, planned);
        AddAssignmentWarnings(warnings, assignment, graph);

        return new SprintPlan
        {
            Tasks = planned,
            CriticalPath = cpm.CriticalPath,
            CriticalPathLength = cpm.TotalDuration,
            TotalEstimate = totalEstimate,
            TeamCapacity = teamCapacity,
            Assignment = assignment,
            Warnings = warnings,
        };
    }

    private static SprintPlan CycleOnly(IReadOnlyList<TaskId> cycle, DependencyGraph graph)
    {
        var names = string.Join(" → ", cycle.Select(id => graph.Tasks[graph.IndexOf(id)].Title));
        return new SprintPlan
        {
            Warnings = [new PlanWarning(PlanWarningKind.DependencyCycle, $"Dependency cycle: {names} → {graph.Tasks[graph.IndexOf(cycle[0])].Title}.", cycle)],
        };
    }

    private static List<PlannedTask> BuildPlannedTasks(
        DependencyGraph graph, IReadOnlyList<int> order, CriticalPathResult cpm, AssignmentResult assignment, DateOnly start, WorkCalendar calendar)
    {
        var planned = new List<PlannedTask>(order.Count);
        for (var position = 0; position < order.Count; position++)
        {
            var index = order[position];
            var timing = cpm.Timings[index];
            planned.Add(new PlannedTask(
                graph.Tasks[index],
                position,
                timing,
                calendar.AddWorkingHours(start, timing.EarliestFinish),
                assignment.Assignments[index]));
        }
        return planned;
    }

    private static void AddFeasibilityWarnings(
        List<PlanWarning> warnings, SprintPlanRequest request, Hours criticalLength, Hours totalEstimate, Hours teamCapacity, WorkCalendar calendar)
    {
        var sprintHours = calendar.WorkingHoursBetween(request.SprintStart, request.SprintEnd);
        if (criticalLength > sprintHours)
        {
            warnings.Add(new PlanWarning(PlanWarningKind.ExceedsSprintLength,
                $"The dependency chain needs {criticalLength} of sequential work but the sprint has {sprintHours} per person. It cannot finish on time even with more people.", []));
        }

        if (totalEstimate > teamCapacity)
        {
            warnings.Add(new PlanWarning(PlanWarningKind.ExceedsTeamCapacity,
                $"Selected tasks total {totalEstimate} but the team has {teamCapacity}. Remove tasks or add capacity.", []));
        }
    }

    private static void AddDeadlineWarnings(List<PlanWarning> warnings, List<PlannedTask> planned)
    {
        foreach (var p in planned)
        {
            if (p.Task.Deadline is { } deadline && p.EarliestFinishDate > deadline)
            {
                warnings.Add(new PlanWarning(PlanWarningKind.DeadlineAtRisk,
                    $"'{p.Task.Title}' cannot finish before {p.EarliestFinishDate:yyyy-MM-dd} because of its dependencies, but its deadline is {deadline:yyyy-MM-dd}.",
                    [p.Task.Id]));
            }
        }
    }

    private static void AddAssignmentWarnings(List<PlanWarning> warnings, AssignmentResult assignment, DependencyGraph graph)
    {
        foreach (var w in assignment.Warnings)
        {
            var kind = w.Kind switch
            {
                AssignmentWarningKind.NoEligibleMember => PlanWarningKind.NoEligibleMember,
                AssignmentWarningKind.OverCapacity => PlanWarningKind.OverCapacity,
                _ => throw new InvalidOperationException($"Unknown assignment warning {w.Kind}."),
            };
            warnings.Add(new PlanWarning(kind, w.Message, w.TaskId is { } id ? [id] : [], w.MemberId));
        }
    }
}
