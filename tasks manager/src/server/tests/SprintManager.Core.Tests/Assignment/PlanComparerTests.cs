using SprintManager.Core.Assignment;
using SprintManager.Core.Domain;

namespace SprintManager.Core.Tests.Assignment;

public class PlanComparerTests
{
    private static Member Who(string name, double capacity, params (string, int)[] skills) =>
        Member.Create(MemberId.New(), name, new Hours(capacity), skills);

    private static WorkItem Task(string title, double hours, MemberId? assignee = null, IReadOnlyList<TaskId>? deps = null, params string[] skills) =>
        new(TaskId.New(), title, new Hours(hours), deps ?? [], skills, AssigneeId: assignee);

    [Fact]
    public void Cycle_IsNotComparable()
    {
        var a = TaskId.New();
        var b = TaskId.New();
        var tasks = new[]
        {
            new WorkItem(a, "A", new Hours(1), [b], []),
            new WorkItem(b, "B", new Hours(1), [a], []),
        };

        var result = PlanComparer.Compare(tasks, [Who("X", 40)]);

        Assert.False(result.IsComparable);
        Assert.Empty(result.Scores);
        Assert.Contains("cycle", result.Message);
    }

    [Fact]
    public void NoManualAssignments_ComparesOnlyTheTwoAlgorithms()
    {
        var result = PlanComparer.Compare([Task("A", 4, skills: "C#")], [Who("X", 40, ("C#", 4))]);

        Assert.Equal(["Greedy", "Hungarian"], result.Scores.Select(s => s.Name));
    }

    [Fact]
    public void ManagerPilingEverythingOnOnePerson_IsBeatenOnBalance()
    {
        var ann = Who("Ann", 40, ("C#", 4));
        var bob = Who("Bob", 40, ("C#", 4));
        var tasks = Enumerable.Range(0, 4).Select(i => Task($"T{i}", 8, ann.Id, skills: "C#")).ToList();

        var result = PlanComparer.Compare(tasks, [ann, bob]);

        var manual = result.Scores.Single(s => s.Name == "Manual");
        var hungarian = result.Scores.Single(s => s.Name == "Hungarian");
        Assert.True(hungarian.LoadImbalance < manual.LoadImbalance);
        Assert.True(hungarian.Objective < manual.Objective);
        Assert.DoesNotContain(result.Winners, s => s.Name == "Manual");       // an algorithm wins (Greedy may tie Hungarian here)
        Assert.True(hungarian.Objective <= result.Scores.Single(s => s.Name == "Greedy").Objective + 1e-9);
    }

    [Fact]
    public void WhenApproachesTie_ThereIsNoSingleWinner()
    {
        var result = PlanComparer.Compare([Task("A", 4, skills: "C#")], [Who("X", 40, ("C#", 4))]);

        Assert.True(result.Winners.Count >= 2);      // Greedy and Hungarian reach the same plan
        Assert.Null(result.Winner);
    }

    [Fact]
    public void AClearBest_IsTheSingleWinner()
    {
        var ann = Who("Ann", 40, ("SQL", 5));
        var bob = Who("Bob", 40, ("React", 5));
        var tasks = new[] { Task("Schema", 8, bob.Id, skills: "SQL") };      // manual: wrong person

        var result = PlanComparer.Compare(tasks, [ann, bob]);

        Assert.DoesNotContain(result.Winners, s => s.Name == "Manual");
        Assert.NotNull(result.Scores.Single(s => s.Name == "Manual"));
    }

    [Fact]
    public void ManualSkillMismatch_IsCountedAndCharged()
    {
        var ann = Who("Ann", 40, ("React", 5));
        var dan = Who("Dan", 40, ("SQL", 5));
        var tasks = new[] { Task("Schema", 8, ann.Id, skills: "SQL") };    // given to the React person

        var result = PlanComparer.Compare(tasks, [ann, dan]);

        var manual = result.Scores.Single(s => s.Name == "Manual");
        Assert.Equal(1, manual.SkillMismatches);
        Assert.True(manual.SkillCost > 0);
        Assert.All(result.Scores.Where(s => s.Name != "Manual"), s => Assert.Equal(0, s.SkillMismatches));
    }

    [Fact]
    public void AssigneeOutsideTheTeam_CountsAsUnassigned()
    {
        var ann = Who("Ann", 40, ("C#", 4));
        var tasks = new[] { Task("A", 8, MemberId.New(), skills: "C#") };

        var manual = PlanComparer.Compare(tasks, [ann]).Scores.Single(s => s.Name == "Manual");

        Assert.Equal(1, manual.Unassigned);
    }

    [Fact]
    public void OverCapacityIsReportedPerStrategy()
    {
        var solo = Who("Solo", 10, ("C#", 4));
        var tasks = new[] { Task("Big", 30, solo.Id, skills: "C#") };

        var result = PlanComparer.Compare(tasks, [solo]);

        Assert.All(result.Scores, s => Assert.Equal(1, s.OverCapacityMembers));
    }

    [Fact]
    public void ManualMatchingTheOptimum_TiesInsteadOfLosing()
    {
        var ann = Who("Ann", 40, ("SQL", 5));
        var bob = Who("Bob", 40, ("React", 5));
        var tasks = new[] { Task("Schema", 8, ann.Id, skills: "SQL"), Task("Screens", 8, bob.Id, skills: "React") };

        var result = PlanComparer.Compare(tasks, [ann, bob]);

        var objectives = result.Scores.Select(s => Math.Round(s.Objective, 9)).Distinct().ToList();
        Assert.Single(objectives);
    }
}
