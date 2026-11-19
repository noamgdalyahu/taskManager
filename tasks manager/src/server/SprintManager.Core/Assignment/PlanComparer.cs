using System.Diagnostics;
using SprintManager.Core.Domain;
using SprintManager.Core.Graph;

namespace SprintManager.Core.Assignment;

/// <summary>One strategy's result reduced to comparable numbers.</summary>
/// <param name="Name">Manual, Greedy or Hungarian.</param>
/// <param name="Objective">Σ over assigned tasks of (skill cost + Balance × final load fraction of the member). Lower is better.</param>
/// <param name="SkillCost">Σ skill cost only.</param>
/// <param name="LoadImbalance">Standard deviation of load as a fraction of capacity; 0 is perfectly balanced.</param>
/// <param name="Unassigned">Tasks nobody holds (for the strategies: nobody eligible; for Manual: not assigned yet).</param>
/// <param name="SkillMismatches">Tasks held by a member who lacks a required skill (Manual only).</param>
/// <param name="OverCapacityMembers">Members loaded beyond their capacity.</param>
/// <param name="Milliseconds">Time the evaluation took.</param>
public sealed record StrategyScore(
    string Name,
    double Objective,
    double SkillCost,
    double LoadImbalance,
    int Unassigned,
    int SkillMismatches,
    int OverCapacityMembers,
    double Milliseconds);

/// <summary>Side-by-side comparison of the manager's assignment and the algorithms.</summary>
/// <param name="IsComparable">False when the dependency graph has a cycle (no critical path, no meaningful costs).</param>
/// <param name="Message">Explanation when not comparable.</param>
/// <param name="Scores">Manual (only if at least one task is assigned), Greedy, Hungarian.</param>
public sealed record PlanComparison(bool IsComparable, string? Message, IReadOnlyList<StrategyScore> Scores)
{
    /// <summary>Scores within this distance of the best are considered equal.</summary>
    public const double TieTolerance = 1e-6;

    /// <summary>
    /// Every approach that is best by fewest unassigned tasks, then lowest objective. More than one entry means a tie:
    /// on easy sprints Greedy, Hungarian and a sensible manual plan often reach exactly the same result.
    /// </summary>
    public IReadOnlyList<StrategyScore> Winners
    {
        get
        {
            if (Scores.Count == 0)
                return [];
            var fewest = Scores.Min(s => s.Unassigned);
            var candidates = Scores.Where(s => s.Unassigned == fewest).ToList();
            var best = candidates.Min(s => s.Objective);
            return candidates.Where(s => s.Objective <= best + TieTolerance).ToList();
        }
    }

    /// <summary>The single best approach, or null when there is a tie (or nothing to compare).</summary>
    public StrategyScore? Winner => Winners.Count == 1 ? Winners[0] : null;
}

/// <summary>
/// Runs the manager's existing assignment, the Greedy baseline and the Hungarian strategy on the same tasks, with the
/// same critical-path information and the same cost function, and scores them identically. This is the measurable
/// "improvement over the existing solution" required by the track.
/// </summary>
public static class PlanComparer
{
    /// <summary>Compares the three approaches on a set of open tasks.</summary>
    public static PlanComparison Compare(IReadOnlyList<WorkItem> tasks, IReadOnlyList<Member> members, AssignmentWeights? weights = null)
    {
        ArgumentNullException.ThrowIfNull(tasks);
        ArgumentNullException.ThrowIfNull(members);

        var graph = DependencyGraph.Build(tasks);
        var sort = TopologicalSorter.Sort(graph);
        if (!sort.IsAcyclic)
            return new PlanComparison(false, "The tasks contain a dependency cycle; break it before comparing.", []);

        var critical = CriticalPathAnalyzer.Analyze(graph, sort.Order).CriticalPath.ToHashSet();
        var request = new AssignmentRequest(tasks, members, critical, weights ?? AssignmentWeights.Default);

        var scores = new List<StrategyScore>(3);
        if (tasks.Any(t => t.AssigneeId is not null))
            scores.Add(Measure(request, ManualAssignmentEvaluator.Evaluate));
        scores.Add(Measure(request, new GreedyAssignmentStrategy().Assign));
        scores.Add(Measure(request, new HungarianAssignmentStrategy().Assign));
        return new PlanComparison(true, null, scores);
    }

    private static StrategyScore Measure(AssignmentRequest request, Func<AssignmentRequest, AssignmentResult> run)
    {
        var watch = Stopwatch.StartNew();
        var result = run(request);
        watch.Stop();

        var members = request.Members.ToDictionary(m => m.Id);
        double skill = 0, objective = 0;
        var unassigned = 0;
        foreach (var a in result.Assignments)
        {
            if (a.MemberId is not { } id)
            {
                unassigned++;
                continue;
            }
            skill += a.Cost;
            objective += a.Cost + request.Weights.Balance * AssignmentSupport.LoadFraction(result.LoadPerMember[id].Value, members[id]);
        }

        return new StrategyScore(
            result.StrategyName,
            objective,
            skill,
            result.LoadImbalance(request.Members),
            unassigned,
            result.Warnings.Count(w => w.Kind is AssignmentWarningKind.SkillMismatch),
            result.Warnings.Count(w => w.Kind is AssignmentWarningKind.OverCapacity),
            watch.Elapsed.TotalMilliseconds);
    }
}
