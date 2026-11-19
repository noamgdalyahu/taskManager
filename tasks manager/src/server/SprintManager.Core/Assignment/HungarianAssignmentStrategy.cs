using SprintManager.Core.Domain;

namespace SprintManager.Core.Assignment;

/// <summary>
/// Optimal strategy: adapts the Hungarian algorithm (one task per worker) to our problem
/// (many tasks per member, limited capacity, workload balance).
/// </summary>
/// <remarks>
/// The adaptation, which is the part that is "ours":
/// <list type="number">
/// <item><b>Slots.</b> Each member is expanded into T slots (one per task), so any member could in principle
/// take everything. A slot is a column. Capacity is enforced softly through pricing and warnings.</item>
/// <item><b>Balance by slot load.</b> The s-th slot of a member is priced as if the member already carried
/// the load of s tasks: <c>baseCost + Weights.Balance × (prefixLoad(s) + estimate) / capacity</c>.
/// Round 0 uses <c>s × averageEstimate</c> as the prefix load (nothing better is known yet).</item>
/// <item><b>Iterative refinement.</b> After a solve we know which estimates each member actually got.
/// Their sorted cumulative sums become the new prefix loads, the matrix is re-priced and re-solved.
/// Up to <see cref="MaxRounds"/> rounds; the best round by the true objective is kept, so refinement
/// can only improve on round 0.</item>
/// <item><b>Hard constraints as infinity.</b> Missing skills become forbidden columns. If the solver is forced
/// into one anyway (nobody eligible), the task is reported unassigned.</item>
/// <item><b>Padding.</b> With no members there are no slots; dummy columns keep the matrix valid and every
/// task is reported unassigned.</item>
/// </list>
/// <para>Time: O(R × T² × M·k) for R rounds. For a sprint (tens of tasks, a handful of members) this is milliseconds.</para>
/// </remarks>
public sealed class HungarianAssignmentStrategy : IAssignmentStrategy
{
    /// <summary>Maximum re-pricing rounds (round 0 plus refinements).</summary>
    public const int MaxRounds = 4;

    /// <inheritdoc />
    public string Name => "Hungarian";

    // Note: Materialise is static so it cannot read Name; the literal above and below must match.

    /// <inheritdoc />
    public AssignmentResult Assign(AssignmentRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var baseCost = CostMatrixBuilder.Build(request);
        var slots = BuildSlots(request);
        var prefixLoad = InitialPrefixLoads(request, slots);

        int[]? best = null;
        var bestObjective = double.PositiveInfinity;

        for (var round = 0; round < MaxRounds; round++)
        {
            var matrix = BuildSlotMatrix(request, baseCost, slots, prefixLoad);
            var memberOfTask = ToMembers(request, baseCost, slots, HungarianSolver.Solve(matrix));
            var objective = AssignmentSupport.TrueObjective(request, baseCost, memberOfTask);

            if (best is not null && objective >= bestObjective - 1e-12)
                break;  // no improvement: converged

            best = memberOfTask;
            bestObjective = objective;
            prefixLoad = RefinedPrefixLoads(request, slots, memberOfTask);
        }

        return Materialise(request, baseCost, best ?? []);
    }

    /// <summary>A column of the expanded matrix: which member, and which of their slots.</summary>
    private readonly record struct Slot(int Member, int Index);

    /// <summary>
    /// Every member gets one slot per task. Capacity is a soft constraint (priced by the balance term and
    /// reported as a warning), not a hard cut-off: dropping tasks silently would hide the overload from the manager.
    /// </summary>
    private static List<Slot> BuildSlots(AssignmentRequest request)
    {
        var slots = new List<Slot>(request.Members.Count * request.Tasks.Count);
        for (var m = 0; m < request.Members.Count; m++)
        {
            for (var s = 0; s < request.Tasks.Count; s++)
                slots.Add(new Slot(m, s));
        }
        return slots;
    }

    /// <summary>Round 0: assume every earlier slot holds an average-sized task.</summary>
    private static double[] InitialPrefixLoads(AssignmentRequest request, List<Slot> slots)
    {
        var averageEstimate = request.Tasks.Count == 0 ? 0 : request.Tasks.Average(t => t.Estimate.Value);
        var prefix = new double[slots.Count];
        for (var c = 0; c < slots.Count; c++)
            prefix[c] = slots[c].Index * averageEstimate;
        return prefix;
    }

    /// <summary>Later rounds: prefix load of slot s = sum of the s smallest estimates the member actually received.</summary>
    private static double[] RefinedPrefixLoads(AssignmentRequest request, List<Slot> slots, int[] memberOfTask)
    {
        var received = new List<double>[request.Members.Count];
        for (var m = 0; m < received.Length; m++)
            received[m] = [];
        for (var t = 0; t < memberOfTask.Length; t++)
        {
            if (memberOfTask[t] >= 0)
                received[memberOfTask[t]].Add(request.Tasks[t].Estimate.Value);
        }

        var averageEstimate = request.Tasks.Count == 0 ? 0 : request.Tasks.Average(t => t.Estimate.Value);
        var prefix = new double[slots.Count];
        for (var c = 0; c < slots.Count; c++)
        {
            var mine = received[slots[c].Member];
            mine.Sort();
            var sum = 0d;
            for (var i = 0; i < slots[c].Index; i++)
                sum += i < mine.Count ? mine[i] : averageEstimate;   // beyond what they got: fall back to average
            prefix[c] = sum;
        }
        return prefix;
    }

    /// <summary>Expands task×member costs into task×slot costs, with balance and padding.</summary>
    private static double[][] BuildSlotMatrix(AssignmentRequest request, double[][] baseCost, List<Slot> slots, double[] prefixLoad)
    {
        var taskCount = request.Tasks.Count;
        var cols = Math.Max(slots.Count, taskCount);   // pad with dummies when tasks > slots

        var matrix = new double[taskCount][];
        for (var t = 0; t < taskCount; t++)
        {
            matrix[t] = new double[cols];
            for (var c = 0; c < cols; c++)
            {
                if (c >= slots.Count)
                {
                    matrix[t][c] = HungarianSolver.Forbidden;   // dummy: only used if unavoidable
                    continue;
                }

                var slot = slots[c];
                var member = request.Members[slot.Member];
                var basePair = baseCost[t][slot.Member];
                var loadIfTaken = prefixLoad[c] + request.Tasks[t].Estimate.Value;
                matrix[t][c] = double.IsPositiveInfinity(basePair)
                    ? double.PositiveInfinity
                    : basePair + request.Weights.Balance * AssignmentSupport.LoadFraction(loadIfTaken, member);
            }
        }
        return matrix;
    }

    /// <summary>Column choice → member index per task, -1 when the pair is infeasible or a dummy column.</summary>
    private static int[] ToMembers(AssignmentRequest request, double[][] baseCost, List<Slot> slots, int[] chosenColumn)
    {
        var memberOfTask = new int[request.Tasks.Count];
        for (var t = 0; t < memberOfTask.Length; t++)
        {
            var col = chosenColumn[t];
            var feasible = col < slots.Count && !double.IsPositiveInfinity(baseCost[t][slots[col].Member]);
            memberOfTask[t] = feasible ? slots[col].Member : -1;
        }
        return memberOfTask;
    }

    private static AssignmentResult Materialise(AssignmentRequest request, double[][] baseCost, int[] memberOfTask)
    {
        var load = new double[request.Members.Count];
        for (var t = 0; t < memberOfTask.Length; t++)
        {
            if (memberOfTask[t] >= 0)
                load[memberOfTask[t]] += request.Tasks[t].Estimate.Value;
        }

        var assignments = new TaskAssignment[request.Tasks.Count];
        var warnings = new List<AssignmentWarning>();
        for (var t = 0; t < assignments.Length; t++)
        {
            var task = request.Tasks[t];
            var m = memberOfTask[t];
            assignments[t] = m >= 0
                ? Assigned(request, task, m, baseCost[t][m], load[m])
                : Unassigned(task, warnings);
        }

        AssignmentSupport.AddOverCapacityWarnings(request.Members, load, warnings);
        return AssignmentSupport.BuildResult("Hungarian", request, assignments, load, warnings);
    }

    private static TaskAssignment Assigned(AssignmentRequest request, WorkItem task, int m, double baseCost, double finalLoad)
    {
        var member = request.Members[m];
        var critical = request.CriticalTaskIds.Contains(task.Id);
        return new TaskAssignment(task.Id, member.Id, baseCost, CostMatrixBuilder.Reason(task, member, new Hours(finalLoad), critical));
    }

    private static TaskAssignment Unassigned(WorkItem task, List<AssignmentWarning> warnings)
    {
        warnings.Add(new AssignmentWarning(
            AssignmentWarningKind.NoEligibleMember, task.Id, null,
            $"No member has all the skills required by '{task.Title}' ({string.Join(", ", task.RequiredSkills)})."));
        return new TaskAssignment(task.Id, null, 0, "no eligible member");
    }
}
