using SprintManager.Core.Domain;

namespace SprintManager.Core.Assignment;

/// <summary>Helpers shared by the strategies (composition instead of a base class).</summary>
internal static class AssignmentSupport
{
    /// <summary>Load as a fraction of capacity; a member with zero capacity counts as fully loaded.</summary>
    public static double LoadFraction(double hours, Member member) =>
        member.Capacity.Value > 0 ? hours / member.Capacity.Value : 1 + hours;

    /// <summary>Adds one warning per member whose load exceeds capacity.</summary>
    public static void AddOverCapacityWarnings(IReadOnlyList<Member> members, double[] load, List<AssignmentWarning> warnings)
    {
        for (var m = 0; m < members.Count; m++)
        {
            if (load[m] <= members[m].Capacity.Value + CostMatrixBuilderTolerance)
                continue;

            warnings.Add(new AssignmentWarning(
                AssignmentWarningKind.OverCapacity, null, members[m].Id,
                $"{members[m].Name} is assigned {load[m]:0.#}h but has {members[m].Capacity.Value:0.#}h."));
        }
    }

    /// <summary>Packs arrays into the public result record.</summary>
    public static AssignmentResult BuildResult(
        string name, AssignmentRequest request, TaskAssignment[] assignments, double[] load, List<AssignmentWarning> warnings)
    {
        var loadPerMember = new Dictionary<MemberId, Hours>(request.Members.Count);
        for (var m = 0; m < request.Members.Count; m++)
            loadPerMember[request.Members[m].Id] = new Hours(load[m]);

        var total = 0d;
        foreach (var a in assignments)
            total += a.Cost;

        return new AssignmentResult(name, assignments, loadPerMember, total, warnings);
    }

    /// <summary>
    /// The true objective both strategies aim to minimise, evaluated on a finished assignment:
    /// Σ over assigned tasks of (baseCost + Balance × finalLoad(member) / capacity), and
    /// <see cref="HungarianSolver.Forbidden"/> per unassigned task.
    /// Used by the Hungarian refinement loop to keep its best round, and by tests to compare strategies.
    /// </summary>
    public static double TrueObjective(AssignmentRequest request, double[][] baseCost, int[] memberOfTask)
    {
        var load = new double[request.Members.Count];
        for (var t = 0; t < memberOfTask.Length; t++)
        {
            if (memberOfTask[t] >= 0)
                load[memberOfTask[t]] += request.Tasks[t].Estimate.Value;
        }

        var total = 0d;
        for (var t = 0; t < memberOfTask.Length; t++)
        {
            var m = memberOfTask[t];
            total += m < 0
                ? HungarianSolver.Forbidden
                : baseCost[t][m] + request.Weights.Balance * LoadFraction(load[m], request.Members[m]);
        }
        return total;
    }

    private const double CostMatrixBuilderTolerance = 1e-9;
}
