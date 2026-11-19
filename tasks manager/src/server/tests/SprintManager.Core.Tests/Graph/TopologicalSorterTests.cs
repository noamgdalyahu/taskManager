using SprintManager.Core.Domain;
using SprintManager.Core.Graph;

namespace SprintManager.Core.Tests.Graph;

public class TopologicalSorterTests
{
    [Fact]
    public void Sort_EmptyGraph_IsAcyclicWithEmptyOrder()
    {
        var result = TopologicalSorter.Sort(DependencyGraph.Build([]));

        Assert.True(result.IsAcyclic);
        Assert.Empty(result.Order);
    }

    [Fact]
    public void Sort_SingleTask_ReturnsIt()
    {
        var g = new GraphFixture().Task("A").Build();

        var result = TopologicalSorter.Sort(g);

        Assert.True(result.IsAcyclic);
        Assert.Equal([0], result.Order);
    }

    [Fact]
    public void Sort_Chain_PreservesDependencyOrder()
    {
        var f = new GraphFixture().Task("C:B").Task("B:A").Task("A"); // declared out of order on purpose
        var g = f.Build();

        var result = TopologicalSorter.Sort(g);

        Assert.True(result.IsAcyclic);
        Assert.Equal(["A", "B", "C"], result.Order.Select(i => f.NameOfIndex(g, i)));
    }

    [Fact]
    public void Sort_Diamond_EveryPrerequisiteComesBeforeItsDependents()
    {
        var f = new GraphFixture().Task("A").Task("B:A").Task("C:A").Task("D:B,C");
        var g = f.Build();

        var result = TopologicalSorter.Sort(g);

        Assert.True(result.IsAcyclic);
        AssertValidOrder(g, result.Order);
    }

    [Fact]
    public void Sort_IndependentTasks_AllAppearOnce()
    {
        var g = new GraphFixture().Task("A").Task("B").Task("C").Build();

        var result = TopologicalSorter.Sort(g);

        Assert.True(result.IsAcyclic);
        Assert.Equal([0, 1, 2], result.Order.Order());
    }

    [Fact]
    public void Sort_SelfDependency_ReportsCycleOfOne()
    {
        var f = new GraphFixture().Task("A:A");
        var g = f.Build();

        var result = TopologicalSorter.Sort(g);

        Assert.False(result.IsAcyclic);
        Assert.Equal(["A"], result.Cycle.Select(f.NameOf));
    }

    [Fact]
    public void Sort_TwoNodeCycle_ReportsBoth()
    {
        var f = new GraphFixture().Task("A:B").Task("B:A");
        var g = f.Build();

        var result = TopologicalSorter.Sort(g);

        Assert.False(result.IsAcyclic);
        Assert.Equal(2, result.Cycle.Count);
        AssertIsCycle(f, result.Cycle);
    }

    [Fact]
    public void Sort_CycleWithTail_ReportsOnlyTheCycleNodes()
    {
        // X -> A -> B -> C -> A ; X and Y are acyclic, A,B,C form the cycle.
        var f = new GraphFixture().Task("X").Task("A:X,C").Task("B:A").Task("C:B").Task("Y:C");
        var g = f.Build();

        var result = TopologicalSorter.Sort(g);

        Assert.False(result.IsAcyclic);
        Assert.Equal(["A", "B", "C"], result.Cycle.Select(f.NameOf).Order());
        AssertIsCycle(f, result.Cycle);
    }

    [Fact]
    public void Sort_RandomDag_AlwaysProducesValidOrder()
    {
        var rng = new Random(42);
        for (var trial = 0; trial < 200; trial++)
        {
            var g = RandomDag(rng, nodes: rng.Next(1, 40), density: rng.NextDouble() * 0.4);

            var result = TopologicalSorter.Sort(g);

            Assert.True(result.IsAcyclic);
            Assert.Equal(g.Count, result.Order.Count);
            AssertValidOrder(g, result.Order);
        }
    }

    /// <summary>Random DAG: edges only go from lower to higher index, which guarantees acyclicity.</summary>
    private static DependencyGraph RandomDag(Random rng, int nodes, double density)
    {
        var ids = Enumerable.Range(0, nodes).Select(_ => TaskId.New()).ToArray();
        var tasks = new List<WorkItem>(nodes);
        for (var i = 0; i < nodes; i++)
        {
            var deps = Enumerable.Range(0, i).Where(_ => rng.NextDouble() < density).Select(j => ids[j]).ToList();
            tasks.Add(new WorkItem(ids[i], $"T{i}", new Hours(1), deps, []));
        }
        // Shuffle so the sorter cannot rely on declaration order.
        return DependencyGraph.Build(tasks.OrderBy(_ => rng.Next()).ToList());
    }

    private static void AssertValidOrder(DependencyGraph g, IReadOnlyList<int> order)
    {
        var position = new int[g.Count];
        for (var p = 0; p < order.Count; p++)
            position[order[p]] = p;

        for (var i = 0; i < g.Count; i++)
        {
            foreach (var dep in g.Tasks[i].DependsOn)
            {
                if (g.TryGetIndex(dep, out var d))
                    Assert.True(position[d] < position[i], $"{g.Tasks[d].Title} must come before {g.Tasks[i].Title}");
            }
        }
    }

    /// <summary>Each task in the list depends on the previous one, and the first depends on the last.</summary>
    private static void AssertIsCycle(GraphFixture f, IReadOnlyList<TaskId> cycle)
    {
        var byId = f.Tasks.ToDictionary(t => t.Id);
        for (var i = 0; i < cycle.Count; i++)
        {
            var previous = cycle[(i - 1 + cycle.Count) % cycle.Count];
            Assert.Contains(previous, byId[cycle[i]].DependsOn);
        }
    }
}
