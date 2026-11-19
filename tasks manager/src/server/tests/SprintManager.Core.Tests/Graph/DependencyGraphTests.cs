using SprintManager.Core.Domain;
using SprintManager.Core.Graph;

namespace SprintManager.Core.Tests.Graph;

public class DependencyGraphTests
{
    [Fact]
    public void Build_EmptyList_ProducesEmptyGraph()
    {
        var g = DependencyGraph.Build([]);

        Assert.Equal(0, g.Count);
        Assert.Equal(0, g.EdgeCount);
    }

    [Fact]
    public void Build_CountsEdgesAndInDegrees()
    {
        var f = new GraphFixture().Task("A").Task("B:A").Task("C:A,B");
        var g = f.Build();

        Assert.Equal(3, g.Count);
        Assert.Equal(3, g.EdgeCount);
        Assert.Equal(0, g.InDegreeOf(g.IndexOf(f.Id("A"))));
        Assert.Equal(1, g.InDegreeOf(g.IndexOf(f.Id("B"))));
        Assert.Equal(2, g.InDegreeOf(g.IndexOf(f.Id("C"))));
        Assert.Equal(2, g.SuccessorsOf(g.IndexOf(f.Id("A"))).Count);
    }

    [Fact]
    public void Build_IgnoresDependenciesOnTasksOutsideTheGraph()
    {
        var external = TaskId.New();
        var task = new WorkItem(TaskId.New(), "T", new Hours(1), [external], []);

        var g = DependencyGraph.Build([task]);

        Assert.Equal(0, g.EdgeCount);
        Assert.Equal(0, g.InDegreeOf(0));
    }

    [Fact]
    public void Build_DuplicateIds_Throws()
    {
        var id = TaskId.New();
        var a = new WorkItem(id, "A", new Hours(1), [], []);
        var b = new WorkItem(id, "B", new Hours(1), [], []);

        Assert.Throws<ArgumentException>(() => DependencyGraph.Build([a, b]));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(double.NaN)]
    [InlineData(double.PositiveInfinity)]
    public void Hours_RejectsInvalidValues(double value)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new Hours(value));
    }
}
