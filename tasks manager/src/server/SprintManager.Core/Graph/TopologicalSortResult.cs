using SprintManager.Core.Domain;

namespace SprintManager.Core.Graph;

/// <summary>Outcome of a topological sort: either a valid order or a dependency cycle.</summary>
/// <remarks>
/// A cycle is an expected business error (the manager created circular dependencies),
/// so it is returned as data rather than thrown. The result type is specific to this
/// operation, following the project's error handling convention.
/// </remarks>
public sealed record TopologicalSortResult
{
    /// <summary>True when the graph is acyclic and <see cref="Order"/> is valid.</summary>
    public bool IsAcyclic { get; private init; }

    /// <summary>Task indexes in a valid execution order (every prerequisite before its dependents).</summary>
    public IReadOnlyList<int> Order { get; private init; } = [];

    /// <summary>
    /// When cyclic: the task ids forming one cycle, in edge order
    /// (each task depends on the previous one, and the first depends on the last).
    /// </summary>
    public IReadOnlyList<TaskId> Cycle { get; private init; } = [];

    /// <summary>Builds a successful result.</summary>
    public static TopologicalSortResult Acyclic(IReadOnlyList<int> order) =>
        new() { IsAcyclic = true, Order = order };

    /// <summary>Builds a failed result carrying the detected cycle.</summary>
    public static TopologicalSortResult Cyclic(IReadOnlyList<TaskId> cycle) =>
        new() { IsAcyclic = false, Cycle = cycle };
}
