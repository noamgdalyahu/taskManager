using SprintManager.Core.Domain;

namespace SprintManager.Core.Assignment;

/// <summary>
/// Turns the business constraints into numbers: a cost for every (task, member) pair.
/// Both strategies share this so that their results are comparable and the cost function
/// can be explained in one place.
/// </summary>
/// <remarks>
/// cost(task, member) =
/// <list type="bullet">
/// <item><see cref="Infeasible"/> when the member lacks a required skill (hard constraint);</item>
/// <item>otherwise <c>Weights.Skill × skillGap × criticalFactor</c>, where skillGap is the average
/// <see cref="SkillLevel.GapToExpert"/> over the task's required skills (0 = all expert) and
/// criticalFactor = 1 + Weights.Critical for critical-path tasks, 1 otherwise.</item>
/// </list>
/// Workload balance is <b>not</b> in this matrix because it depends on what else the member
/// gets; each strategy adds it in its own way (greedy: running load; Hungarian: slot index).
/// Time: O(T × M × S) for S required skills per task.
/// </remarks>
public static class CostMatrixBuilder
{
    /// <summary>Cost marking a pair that must never be chosen.</summary>
    public const double Infeasible = double.PositiveInfinity;

    /// <summary>Builds the matrix <c>cost[taskIndex][memberIndex]</c>.</summary>
    public static double[][] Build(AssignmentRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var cost = new double[request.Tasks.Count][];
        for (var t = 0; t < request.Tasks.Count; t++)
        {
            var task = request.Tasks[t];
            var criticalFactor = request.CriticalTaskIds.Contains(task.Id) ? 1 + request.Weights.Critical : 1;
            cost[t] = new double[request.Members.Count];

            for (var m = 0; m < request.Members.Count; m++)
                cost[t][m] = PairCost(task, request.Members[m], request.Weights.Skill, criticalFactor);
        }
        return cost;
    }

    /// <summary>Cost of a single pair; see class remarks.</summary>
    public static double PairCost(WorkItem task, Member member, double skillWeight, double criticalFactor)
    {
        if (!member.HasAll(task.RequiredSkills))
            return Infeasible;

        return skillWeight * SkillGap(task, member) * criticalFactor;
    }

    /// <summary>Average gap to expert over the required skills; 0 when none are required.</summary>
    public static double SkillGap(WorkItem task, Member member)
    {
        if (task.RequiredSkills.Count == 0)
            return 0;

        var total = 0d;
        foreach (var skill in task.RequiredSkills)
            total += member.LevelIn(skill)?.GapToExpert ?? 1;

        return total / task.RequiredSkills.Count;
    }

    /// <summary>Builds the reason text shown to the manager for a chosen pair.</summary>
    public static string Reason(WorkItem task, Member member, Hours loadAfter, bool critical)
    {
        var skills = task.RequiredSkills.Count == 0
            ? "no specific skill needed"
            : string.Join(", ", task.RequiredSkills.Select(s => $"{s} {member.LevelIn(s)?.Value ?? 0}/{SkillLevel.Max}"));

        var load = $"load {loadAfter.Value:0.#}/{member.Capacity.Value:0.#}h";
        return critical ? $"{skills}; {load}; on critical path" : $"{skills}; {load}";
    }
}
