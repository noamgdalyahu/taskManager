using SprintManager.Core.Assignment;
using SprintManager.Core.Domain;

namespace SprintManager.Core.Tests.Assignment;

/// <summary>Behavioural tests run against both strategies; the Strategy pattern makes this a one-liner.</summary>
public class AssignmentStrategyTests
{
    public static TheoryData<IAssignmentStrategy> Strategies => new()
    {
        new GreedyAssignmentStrategy(),
        new HungarianAssignmentStrategy(),
    };

    private static WorkItem Task(string title, double hours, params string[] skills) =>
        new(TaskId.New(), title, new Hours(hours), [], skills);

    private static Member Who(string name, double capacity, params (string, int)[] skills) =>
        Member.Create(MemberId.New(), name, new Hours(capacity), skills);

    private static MemberId? AssigneeOf(AssignmentResult r, WorkItem t) =>
        r.Assignments.Single(a => a.TaskId == t.Id).MemberId;

    [Theory, MemberData(nameof(Strategies))]
    public void NoTasks_EmptyResult(IAssignmentStrategy s)
    {
        var r = s.Assign(AssignmentRequest.Of([], [Who("A", 40)]));

        Assert.Empty(r.Assignments);
        Assert.Empty(r.Warnings);
        Assert.Equal(0, r.TotalCost);
    }

    [Theory, MemberData(nameof(Strategies))]
    public void NoMembers_EveryTaskUnassignedWithWarning(IAssignmentStrategy s)
    {
        var t = Task("T", 4, "C#");
        var r = s.Assign(AssignmentRequest.Of([t], []));

        Assert.Null(AssigneeOf(r, t));
        Assert.Single(r.Warnings, w => w.Kind == AssignmentWarningKind.NoEligibleMember);
    }

    [Theory, MemberData(nameof(Strategies))]
    public void MissingSkill_IsAHardConstraint(IAssignmentStrategy s)
    {
        var t = Task("DB work", 4, "SQL");
        var dev = Who("Frontend", 40, ("React", 5));
        var r = s.Assign(AssignmentRequest.Of([t], [dev]));

        Assert.Null(AssigneeOf(r, t));
        Assert.Single(r.Warnings, w => w.Kind == AssignmentWarningKind.NoEligibleMember && w.TaskId == t.Id);
    }

    [Theory, MemberData(nameof(Strategies))]
    public void PrefersTheExpert_WhenLoadIsEqual(IAssignmentStrategy s)
    {
        var t = Task("API", 4, "C#");
        var junior = Who("Junior", 40, ("C#", 2));
        var senior = Who("Senior", 40, ("C#", 5));
        var r = s.Assign(AssignmentRequest.Of([t], [junior, senior]));

        Assert.Equal(senior.Id, AssigneeOf(r, t));
        Assert.Contains("C# 5/5", r.Assignments[0].Reason);
    }

    [Theory, MemberData(nameof(Strategies))]
    public void SpreadsEqualTasks_AcrossEqualMembers(IAssignmentStrategy s)
    {
        var tasks = Enumerable.Range(0, 4).Select(i => Task($"T{i}", 5, "C#")).ToList();
        var members = new[] { Who("A", 40, ("C#", 4)), Who("B", 40, ("C#", 4)) };
        var r = s.Assign(AssignmentRequest.Of(tasks, members));

        Assert.Equal(10, r.LoadPerMember[members[0].Id].Value);
        Assert.Equal(10, r.LoadPerMember[members[1].Id].Value);
        Assert.Equal(0, r.LoadImbalance(members), 9);
    }

    [Theory, MemberData(nameof(Strategies))]
    public void OverCapacity_IsWarnedNotHidden(IAssignmentStrategy s)
    {
        var tasks = new[] { Task("Big", 30, "C#"), Task("Big2", 30, "C#") };
        var only = Who("Solo", 40, ("C#", 5));
        var r = s.Assign(AssignmentRequest.Of(tasks, [only]));

        Assert.All(r.Assignments, a => Assert.Equal(only.Id, a.MemberId));
        Assert.Single(r.Warnings, w => w.Kind == AssignmentWarningKind.OverCapacity && w.MemberId == only.Id);
    }

    [Theory, MemberData(nameof(Strategies))]
    public void CriticalTask_GetsTheExpert_EvenIfLessLoadedJuniorExists(IAssignmentStrategy s)
    {
        var critical = Task("Core", 8, "C#");
        var filler = Task("Docs", 8, "C#");
        var junior = Who("Junior", 40, ("C#", 2));
        var senior = Who("Senior", 40, ("C#", 5));
        var r = s.Assign(new AssignmentRequest([filler, critical], [junior, senior], new HashSet<TaskId> { critical.Id }, new AssignmentWeights(Critical: 3)));

        Assert.Equal(senior.Id, AssigneeOf(r, critical));
    }

    [Theory, MemberData(nameof(Strategies))]
    public void ResultHasOneEntryPerTask_InInputOrder(IAssignmentStrategy s)
    {
        var tasks = Enumerable.Range(0, 6).Select(i => Task($"T{i}", i + 1, "C#")).ToList();
        var r = s.Assign(AssignmentRequest.Of(tasks, [Who("A", 40, ("C#", 3)), Who("B", 40, ("C#", 3))]));

        Assert.Equal(tasks.Select(t => t.Id), r.Assignments.Select(a => a.TaskId));
    }
}
