using SprintManager.Core.Domain;
using SprintManager.Core.Graph;

namespace SprintManager.Core.Tests.Graph;

/// <summary>
/// Builds test graphs from a compact notation: <c>"A", "B:A", "C:A,B"</c>
/// means B depends on A and C depends on A and B. Names map to stable ids.
/// </summary>
internal sealed class GraphFixture
{
    private readonly Dictionary<string, TaskId> _ids = new();
    private readonly List<WorkItem> _tasks = [];

    public TaskId Id(string name)
    {
        if (!_ids.TryGetValue(name, out var id))
        {
            id = TaskId.New();
            _ids[name] = id;
        }
        return id;
    }

    public GraphFixture Task(string spec, double estimate = 1)
    {
        var parts = spec.Split(':', 2);
        var name = parts[0];
        var deps = parts.Length == 2
            ? parts[1].Split(',', StringSplitOptions.RemoveEmptyEntries).Select(Id).ToList()
            : [];

        _tasks.Add(new WorkItem(Id(name), name, new Hours(estimate), deps, []));
        return this;
    }

    public IReadOnlyList<WorkItem> Tasks => _tasks;

    public DependencyGraph Build() => DependencyGraph.Build(_tasks);

    public string NameOf(TaskId id) => _ids.First(kv => kv.Value == id).Key;

    public string NameOfIndex(DependencyGraph g, int index) => NameOf(g.Tasks[index].Id);
}
