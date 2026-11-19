using SprintManager.Core.Domain;

namespace SprintManager.Core.Assignment;

/// <summary>
/// Scores the assignment a manager made by hand (<see cref="WorkItem.AssigneeId"/>) with the same cost function the
/// strategies use, so "manual vs Greedy vs Hungarian" is an apples-to-apples comparison.
/// </summary>
/// <remarks>
/// Not an <see cref="IAssignmentStrategy"/>: it does not decide anything, it only measures. Rules:
/// <list type="bullet">
/// <item>A task with no assignee, or an assignee outside the team, is "not assigned".</item>
/// <item>A task given to a member without a required skill keeps its place but is charged the worst skill gap
/// (<see cref="AssignmentWeights.Skill"/> × 1) and produces a <see cref="AssignmentWarningKind.SkillMismatch"/> warning.</item>
/// </list>
/// Time: O(T × M × S).
/// </remarks>
public static class ManualAssignmentEvaluator
{
    /// <summary>Name shown in comparisons.</summary>
    public const string Name = "Manual";

    /// <summary>Evaluates the existing assignees.</summary>
    public static AssignmentResult Evaluate(AssignmentRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var indexOf = new Dictionary<MemberId, int>(request.Members.Count);
        for (var m = 0; m < request.Members.Count; m++)
            indexOf[request.Members[m].Id] = m;

        var memberOfTask = new int[request.Tasks.Count];
        var load = new double[request.Members.Count];
        for (var t = 0; t < memberOfTask.Length; t++)
        {
            var assignee = request.Tasks[t].AssigneeId;
            memberOfTask[t] = assignee is { } id && indexOf.TryGetValue(id, out var m) ? m : -1;
            if (memberOfTask[t] >= 0)
                load[memberOfTask[t]] += request.Tasks[t].Estimate.Value;
        }

        var cost = CostMatrixBuilder.Build(request);
        var warnings = new List<AssignmentWarning>();
        var assignments = new TaskAssignment[memberOfTask.Length];
        for (var t = 0; t < assignments.Length; t++)
            assignments[t] = Describe(request, cost, memberOfTask[t], t, load, warnings);

        AssignmentSupport.AddOverCapacityWarnings(request.Members, load, warnings);
        return AssignmentSupport.BuildResult(Name, request, assignments, load, warnings);
    }

    private static TaskAssignment Describe(AssignmentRequest request, double[][] cost, int m, int t, double[] load, List<AssignmentWarning> warnings)
    {
        var task = request.Tasks[t];
        if (m < 0)
            return new TaskAssignment(task.Id, null, 0, "not assigned");

        var member = request.Members[m];
        var pair = cost[t][m];
        if (double.IsPositiveInfinity(pair))
        {
            pair = request.Weights.Skill;   // worst possible gap, so a mismatch is never "free"
            warnings.Add(new AssignmentWarning(AssignmentWarningKind.SkillMismatch, task.Id, member.Id,
                $"{member.Name} lacks a skill required by '{task.Title}' ({string.Join(", ", task.RequiredSkills)})."));
        }

        var critical = request.CriticalTaskIds.Contains(task.Id);
        return new TaskAssignment(task.Id, member.Id, pair, CostMatrixBuilder.Reason(task, member, new Hours(load[m]), critical));
    }
}
