using SprintManager.Core.Domain;

namespace SprintManager.Core.Graph;

/// <summary>
/// Directed graph of task dependencies. An edge A -> B means "A must finish before B starts"
/// (B depends on A). Built once per planning run and shared by the sort and the critical path.
/// </summary>
/// <remarks>
/// Representation: adjacency lists over dense integer indexes (0..N-1) instead of dictionaries
/// keyed by <see cref="TaskId"/>. Every algorithm then works on arrays, which is O(1) per access
/// and easy to reason about. The id/index mapping is kept in one place here.
/// <para>Space: O(V + E). Build time: O(V + E).</para>
/// </remarks>
public sealed class DependencyGraph
{
    private readonly Dictionary<TaskId, int> _indexOf;
    private readonly List<int>[] _successors;   // successors[i] = tasks that depend on i
    private readonly int[] _inDegree;           // number of unfinished prerequisites of i

    /// <summary>Tasks in index order; <c>Tasks[i]</c> is the task with index <c>i</c>.</summary>
    public IReadOnlyList<WorkItem> Tasks { get; }

    /// <summary>Number of vertices.</summary>
    public int Count => Tasks.Count;

    /// <summary>Number of edges (dependency links that point to a task inside this graph).</summary>
    public int EdgeCount { get; }

    private DependencyGraph(
        IReadOnlyList<WorkItem> tasks,
        Dictionary<TaskId, int> indexOf,
        List<int>[] successors,
        int[] inDegree,
        int edgeCount)
    {
        Tasks = tasks;
        _indexOf = indexOf;
        _successors = successors;
        _inDegree = inDegree;
        EdgeCount = edgeCount;
    }

    /// <summary>Builds the graph from a set of tasks and their <see cref="WorkItem.DependsOn"/> lists.</summary>
    /// <remarks>
    /// Dependencies on tasks that are not in <paramref name="tasks"/> (for example a task already done
    /// in a previous sprint) are ignored: they cannot block anything inside this planning run.
    /// Duplicate ids throw, because they would silently corrupt the index mapping.
    /// </remarks>
    /// <exception cref="ArgumentException">Two tasks share the same id.</exception>
    public static DependencyGraph Build(IReadOnlyList<WorkItem> tasks)
    {
        ArgumentNullException.ThrowIfNull(tasks);

        var indexOf = new Dictionary<TaskId, int>(tasks.Count);
        for (var i = 0; i < tasks.Count; i++)
        {
            if (!indexOf.TryAdd(tasks[i].Id, i))
                throw new ArgumentException($"Duplicate task id {tasks[i].Id}.", nameof(tasks));
        }

        var successors = new List<int>[tasks.Count];
        var inDegree = new int[tasks.Count];
        for (var i = 0; i < tasks.Count; i++)
            successors[i] = [];

        var edges = 0;
        for (var to = 0; to < tasks.Count; to++)
        {
            foreach (var prerequisiteId in tasks[to].DependsOn)
            {
                if (!indexOf.TryGetValue(prerequisiteId, out var from))
                    continue; // external prerequisite, not part of this run

                successors[from].Add(to);
                inDegree[to]++;
                edges++;
            }
        }

        return new DependencyGraph(tasks, indexOf, successors, inDegree, edges);
    }

    /// <summary>Index of a task inside this graph.</summary>
    /// <exception cref="KeyNotFoundException">The task is not part of this graph.</exception>
    public int IndexOf(TaskId id) => _indexOf[id];

    /// <summary>Tries to resolve a task's index.</summary>
    public bool TryGetIndex(TaskId id, out int index) => _indexOf.TryGetValue(id, out index);

    /// <summary>Indexes of the tasks that depend on <paramref name="index"/>.</summary>
    public IReadOnlyList<int> SuccessorsOf(int index) => _successors[index];

    /// <summary>Number of prerequisites of <paramref name="index"/> inside this graph.</summary>
    public int InDegreeOf(int index) => _inDegree[index];

    /// <summary>Returns a mutable copy of the in-degree array for algorithms that consume it (Kahn).</summary>
    internal int[] CopyInDegrees() => (int[])_inDegree.Clone();
}
