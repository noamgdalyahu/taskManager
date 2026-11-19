using SprintManager.Core.Domain;

namespace SprintManager.Core.Assignment;

/// <summary>Tunable weights of the assignment cost function. All default to a balanced setting.</summary>
/// <param name="Skill">Weight of the skill gap (prefer experts).</param>
/// <param name="Balance">Weight of workload balance (prefer the least loaded member).</param>
/// <param name="Critical">Extra multiplier applied to the skill gap of critical-path tasks (experts on the critical path).</param>
public sealed record AssignmentWeights(double Skill = 1.0, double Balance = 1.0, double Critical = 1.0)
{
    /// <summary>Default weights.</summary>
    public static readonly AssignmentWeights Default = new();
}

/// <summary>Everything an assignment strategy needs.</summary>
/// <param name="Tasks">Tasks to assign.</param>
/// <param name="Members">Available members.</param>
/// <param name="CriticalTaskIds">Tasks on the critical path (from CPM); empty when unknown.</param>
/// <param name="Weights">Cost weights.</param>
public sealed record AssignmentRequest(
    IReadOnlyList<WorkItem> Tasks,
    IReadOnlyList<Member> Members,
    IReadOnlySet<TaskId> CriticalTaskIds,
    AssignmentWeights Weights)
{
    /// <summary>Creates a request with default weights.</summary>
    public static AssignmentRequest Of(IReadOnlyList<WorkItem> tasks, IReadOnlyList<Member> members, IReadOnlySet<TaskId>? critical = null) =>
        new(tasks, members, critical ?? new HashSet<TaskId>(), AssignmentWeights.Default);
}

/// <summary>Why a task was not assigned, or why an assignment needs attention.</summary>
public enum AssignmentWarningKind
{
    /// <summary>No member has all the required skills.</summary>
    NoEligibleMember,
    /// <summary>The member's assigned hours exceed their capacity.</summary>
    OverCapacity,
    /// <summary>A manual assignment gives the task to a member who lacks a required skill (never produced by the strategies).</summary>
    SkillMismatch,
}

/// <summary>A warning attached to the result.</summary>
/// <param name="Kind">Category.</param>
/// <param name="TaskId">Related task, if any.</param>
/// <param name="MemberId">Related member, if any.</param>
/// <param name="Message">Human readable text.</param>
public sealed record AssignmentWarning(AssignmentWarningKind Kind, TaskId? TaskId, MemberId? MemberId, string Message);

/// <summary>One task assigned to one member, with the reason shown to the manager.</summary>
/// <param name="TaskId">Task.</param>
/// <param name="MemberId">Member, or null when nobody is eligible.</param>
/// <param name="Cost">Cost of this pair under the cost function (lower is better).</param>
/// <param name="Reason">Explanation, for example "expert in C# (5), load 12/40h, critical path".</param>
public sealed record TaskAssignment(TaskId TaskId, MemberId? MemberId, double Cost, string Reason);

/// <summary>Result of an assignment strategy.</summary>
/// <param name="StrategyName">Which strategy produced it (for comparison).</param>
/// <param name="Assignments">One entry per task, in input order.</param>
/// <param name="LoadPerMember">Assigned hours per member.</param>
/// <param name="TotalCost">Sum of assignment costs.</param>
/// <param name="Warnings">Problems the manager should see.</param>
public sealed record AssignmentResult(
    string StrategyName,
    IReadOnlyList<TaskAssignment> Assignments,
    IReadOnlyDictionary<MemberId, Hours> LoadPerMember,
    double TotalCost,
    IReadOnlyList<AssignmentWarning> Warnings)
{
    /// <summary>Standard deviation of load as a fraction of capacity; 0 means perfectly balanced.</summary>
    public double LoadImbalance(IReadOnlyList<Member> members)
    {
        if (members.Count == 0)
            return 0;

        var fractions = members
            .Select(m => m.Capacity.Value > 0 ? (LoadPerMember.TryGetValue(m.Id, out var h) ? h.Value : 0) / m.Capacity.Value : 0)
            .ToArray();
        var mean = fractions.Average();
        return Math.Sqrt(fractions.Sum(f => (f - mean) * (f - mean)) / fractions.Length);
    }
}

/// <summary>Strategy pattern: interchangeable task-to-member assignment algorithms.</summary>
public interface IAssignmentStrategy
{
    /// <summary>Short name shown in comparisons.</summary>
    string Name { get; }

    /// <summary>Assigns every task in the request to at most one member.</summary>
    AssignmentResult Assign(AssignmentRequest request);
}
