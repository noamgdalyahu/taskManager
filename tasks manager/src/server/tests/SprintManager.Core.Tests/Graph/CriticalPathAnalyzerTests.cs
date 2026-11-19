using SprintManager.Core.Domain;
using SprintManager.Core.Graph;

namespace SprintManager.Core.Tests.Graph;

public class CriticalPathAnalyzerTests
{
    private static CriticalPathResult Analyze(GraphFixture f, out DependencyGraph g)
    {
        g = f.Build();
        var sort = TopologicalSorter.Sort(g);
        Assert.True(sort.IsAcyclic);
        return CriticalPathAnalyzer.Analyze(g, sort.Order);
    }

    private static TaskTiming T(CriticalPathResult r, DependencyGraph g, GraphFixture f, string name) =>
        r.Timings[g.IndexOf(f.Id(name))];

    [Fact]
    public void EmptyGraph_ZeroDurationEmptyPath()
    {
        var r = Analyze(new GraphFixture(), out _);

        Assert.Equal(0, r.TotalDuration.Value);
        Assert.Empty(r.CriticalPath);
        Assert.Empty(r.Timings);
    }

    [Fact]
    public void SingleTask_IsTheWholePath()
    {
        var f = new GraphFixture().Task("A", 5);
        var r = Analyze(f, out var g);

        Assert.Equal(5, r.TotalDuration.Value);
        Assert.Equal(["A"], r.CriticalPath.Select(f.NameOf));
        var a = T(r, g, f, "A");
        Assert.Equal(0, a.EarliestStart.Value);
        Assert.Equal(5, a.LatestFinish.Value);
        Assert.Equal(0, a.Slack.Value);
    }

    [Fact]
    public void Chain_SumsDurations_NoSlack()
    {
        var f = new GraphFixture().Task("A", 2).Task("B:A", 3).Task("C:B", 4);
        var r = Analyze(f, out var g);

        Assert.Equal(9, r.TotalDuration.Value);
        Assert.Equal(["A", "B", "C"], r.CriticalPath.Select(f.NameOf));
        Assert.Equal(2, T(r, g, f, "B").EarliestStart.Value);
        Assert.Equal(5, T(r, g, f, "C").EarliestStart.Value);
        Assert.All(r.Timings, t => Assert.True(t.IsCritical));
    }

    [Fact]
    public void Diamond_ShortBranchHasSlack_LongBranchIsCritical()
    {
        //   A(1) -> B(5) -> D(1)
        //   A(1) -> C(2) -> D(1)
        var f = new GraphFixture().Task("A", 1).Task("B:A", 5).Task("C:A", 2).Task("D:B,C", 1);
        var r = Analyze(f, out var g);

        Assert.Equal(7, r.TotalDuration.Value);
        Assert.Equal(["A", "B", "D"], r.CriticalPath.Select(f.NameOf));

        var c = T(r, g, f, "C");
        Assert.Equal(1, c.EarliestStart.Value);
        Assert.Equal(4, c.LatestStart.Value);   // must finish by 6 so D can start at 6
        Assert.Equal(3, c.Slack.Value);
        Assert.False(c.IsCritical);

        Assert.Equal(6, T(r, g, f, "D").EarliestStart.Value);
    }

    [Fact]
    public void IndependentTasks_DurationIsTheLongest_OthersHaveSlack()
    {
        var f = new GraphFixture().Task("A", 3).Task("B", 8).Task("C", 1);
        var r = Analyze(f, out var g);

        Assert.Equal(8, r.TotalDuration.Value);
        Assert.Equal(["B"], r.CriticalPath.Select(f.NameOf));
        Assert.Equal(5, T(r, g, f, "A").Slack.Value);
        Assert.Equal(7, T(r, g, f, "C").Slack.Value);
    }

    [Fact]
    public void ZeroEstimateTask_HandledWithoutBreakingTheChain()
    {
        var f = new GraphFixture().Task("A", 2).Task("M:A", 0).Task("B:M", 3);
        var r = Analyze(f, out _);

        Assert.Equal(5, r.TotalDuration.Value);
        Assert.Equal(["A", "M", "B"], r.CriticalPath.Select(f.NameOf));
    }

    [Fact]
    public void Analyze_OrderOfWrongLength_Throws()
    {
        var g = new GraphFixture().Task("A").Task("B").Build();

        Assert.Throws<ArgumentException>(() => CriticalPathAnalyzer.Analyze(g, [0]));
    }

    [Fact]
    public void Invariants_HoldOnRandomDags()
    {
        var rng = new Random(7);
        for (var trial = 0; trial < 200; trial++)
        {
            var g = RandomDag(rng, rng.Next(1, 30));
            var r = CriticalPathAnalyzer.Analyze(g, TopologicalSorter.Sort(g).Order);

            // Critical path length equals total duration.
            var pathLength = r.CriticalPath.Sum(id => g.Tasks[g.IndexOf(id)].Estimate.Value);
            Assert.Equal(r.TotalDuration.Value, pathLength, 6);

            foreach (var t in r.Timings)
            {
                Assert.True(t.EarliestStart.Value <= t.LatestStart.Value + CriticalPathAnalyzer.Epsilon);
                Assert.True(t.LatestFinish.Value <= r.TotalDuration.Value + CriticalPathAnalyzer.Epsilon);
                // Every prerequisite finishes before we start.
                foreach (var dep in g.Tasks[g.IndexOf(t.TaskId)].DependsOn)
                    Assert.True(r.Timings[g.IndexOf(dep)].EarliestFinish.Value <= t.EarliestStart.Value + CriticalPathAnalyzer.Epsilon);
            }
        }
    }

    private static DependencyGraph RandomDag(Random rng, int nodes)
    {
        var ids = Enumerable.Range(0, nodes).Select(_ => TaskId.New()).ToArray();
        var tasks = new List<WorkItem>();
        for (var i = 0; i < nodes; i++)
        {
            var deps = Enumerable.Range(0, i).Where(_ => rng.NextDouble() < 0.3).Select(j => ids[j]).ToList();
            tasks.Add(new WorkItem(ids[i], $"T{i}", new Hours(rng.Next(0, 10)), deps, []));
        }
        return DependencyGraph.Build(tasks.OrderBy(_ => rng.Next()).ToList());
    }
}
