using SprintManager.Core.Domain;

namespace SprintManager.Core.Graph;

/// <summary>
/// Orders tasks so that every prerequisite comes before the tasks that depend on it,
/// and detects dependency cycles when no such order exists.
/// </summary>
/// <remarks>
/// Algorithm: Kahn's algorithm (BFS over in-degrees).
/// <list type="number">
/// <item>Start with every task that has no prerequisites (in-degree 0).</item>
/// <item>Pop one, append it to the order, and "remove" it: decrement the in-degree of each successor.</item>
/// <item>A successor whose in-degree reaches 0 is now free and joins the queue.</item>
/// <item>If the order is shorter than the task count, the leftover tasks all sit on cycles.</item>
/// </list>
/// Kahn is chosen over DFS because the same in-degree bookkeeping is reused by the critical path
/// forward pass, and because the queue order is deterministic and easy to explain.
/// <para>Time: O(V + E). Space: O(V).</para>
/// </remarks>
public static class TopologicalSorter
{
    /// <summary>Sorts the graph, or reports a cycle.</summary>
    public static TopologicalSortResult Sort(DependencyGraph graph)
    {
        ArgumentNullException.ThrowIfNull(graph);

        var inDegree = graph.CopyInDegrees();
        var queue = new Queue<int>();
        for (var i = 0; i < graph.Count; i++)
        {
            if (inDegree[i] == 0)
                queue.Enqueue(i);
        }

        var order = new List<int>(graph.Count);
        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            order.Add(current);

            foreach (var next in graph.SuccessorsOf(current))
            {
                inDegree[next]--;
                if (inDegree[next] == 0)
                    queue.Enqueue(next);
            }
        }

        return order.Count == graph.Count
            ? TopologicalSortResult.Acyclic(order)
            : TopologicalSortResult.Cyclic(ExtractCycle(graph, inDegree));
    }

    /// <summary>
    /// Finds one concrete cycle among the tasks Kahn could not release (in-degree still &gt; 0).
    /// </summary>
    /// <remarks>
    /// Every leftover task has at least one leftover prerequisite, so walking "backwards" along
    /// prerequisites from any leftover task must eventually revisit a task: that revisit closes the cycle.
    /// We walk prerequisites (not successors) so the reported list reads naturally:
    /// "A depends on B depends on C depends on A". O(V + E).
    /// </remarks>
    private static IReadOnlyList<TaskId> ExtractCycle(DependencyGraph graph, int[] remainingInDegree)
    {
        var start = Array.FindIndex(remainingInDegree, d => d > 0);
        var visitedAtStep = new Dictionary<int, int>();
        var path = new List<int>();

        var current = start;
        while (visitedAtStep.TryAdd(current, path.Count))
        {
            path.Add(current);
            current = LeftoverPrerequisiteOf(graph, current, remainingInDegree);
        }

        // 'current' was seen before at index visitedAtStep[current]; the cycle is path[thatIndex..].
        var cycleStart = visitedAtStep[current];
        var cycle = new List<TaskId>(path.Count - cycleStart);
        for (var i = path.Count - 1; i >= cycleStart; i--)
            cycle.Add(graph.Tasks[path[i]].Id);  // reversed so it reads in dependency direction

        return cycle;
    }

    /// <summary>A prerequisite of <paramref name="index"/> that is itself still stuck on a cycle.</summary>
    private static int LeftoverPrerequisiteOf(DependencyGraph graph, int index, int[] remainingInDegree)
    {
        foreach (var prerequisiteId in graph.Tasks[index].DependsOn)
        {
            if (graph.TryGetIndex(prerequisiteId, out var p) && remainingInDegree[p] > 0)
                return p;
        }

        throw new InvalidOperationException("Leftover task without leftover prerequisite; graph state is inconsistent.");
    }
}
