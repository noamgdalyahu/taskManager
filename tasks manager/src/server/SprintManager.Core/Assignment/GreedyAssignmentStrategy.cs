using SprintManager.Core.Domain;

namespace SprintManager.Core.Assignment;

/// <summary>
/// Baseline strategy: handle tasks one at a time, most important first, and give each to the
/// member that looks cheapest <i>right now</i>. Never revisits a decision.
/// </summary>
/// <remarks>
/// Order: critical tasks first, then larger estimates first (big rocks before pebbles).
/// Per task: pick the eligible member minimising
/// <c>baseCost + Weights.Balance × (currentLoad + estimate) / capacity</c>.
/// This is the "obvious" manual approach, and the reference point for measuring the Hungarian
/// strategy. Its weakness is myopia: an early cheap pick can force an expensive one later.
/// <para>Time: O(T log T + T × M). Space: O(T + M).</para>
/// </remarks>
public sealed class GreedyAssignmentStrategy : IAssignmentStrategy
{
    /// <inheritdoc />
    public string Name => "Greedy";

    /// <inheritdoc />
    public AssignmentResult Assign(AssignmentRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var cost = CostMatrixBuilder.Build(request);
        var load = new double[request.Members.Count];
        var assignments = new TaskAssignment[request.Tasks.Count];
        var warnings = new List<AssignmentWarning>();

        foreach (var t in OrderTasks(request))
        {
            var task = request.Tasks[t];
            var best = PickMember(request, cost[t], load, task.Estimate.Value);
            assignments[t] = best < 0
                ? Unassigned(task, warnings)
                : Commit(request, t, best, cost[t][best], load);
        }

        AssignmentSupport.AddOverCapacityWarnings(request.Members, load, warnings);
        return AssignmentSupport.BuildResult(Name, request, assignments, load, warnings);
    }

    /// <summary>Critical first, then longest first; ties keep input order (stable).</summary>
    private static IEnumerable<int> OrderTasks(AssignmentRequest request) =>
        Enumerable.Range(0, request.Tasks.Count)
            .OrderByDescending(t => request.CriticalTaskIds.Contains(request.Tasks[t].Id))
            .ThenByDescending(t => request.Tasks[t].Estimate.Value);

    /// <summary>Index of the cheapest eligible member including the balance term, or -1.</summary>
    private static int PickMember(AssignmentRequest request, double[] rowCost, double[] load, double estimate)
    {
        var best = -1;
        var bestScore = double.PositiveInfinity;
        for (var m = 0; m < request.Members.Count; m++)
        {
            if (double.IsPositiveInfinity(rowCost[m]))
                continue;

            var score = rowCost[m] + request.Weights.Balance * AssignmentSupport.LoadFraction(load[m] + estimate, request.Members[m]);
            if (score < bestScore)
            {
                bestScore = score;
                best = m;
            }
        }
        return best;
    }

    private static TaskAssignment Commit(AssignmentRequest request, int t, int m, double baseCost, double[] load)
    {
        var task = request.Tasks[t];
        var member = request.Members[m];
        load[m] += task.Estimate.Value;
        var critical = request.CriticalTaskIds.Contains(task.Id);
        return new TaskAssignment(task.Id, member.Id, baseCost, CostMatrixBuilder.Reason(task, member, new Hours(load[m]), critical));
    }

    private static TaskAssignment Unassigned(WorkItem task, List<AssignmentWarning> warnings)
    {
        warnings.Add(new AssignmentWarning(
            AssignmentWarningKind.NoEligibleMember, task.Id, null,
            $"No member has all the skills required by '{task.Title}' ({string.Join(", ", task.RequiredSkills)})."));
        return new TaskAssignment(task.Id, null, 0, "no eligible member");
    }
}
