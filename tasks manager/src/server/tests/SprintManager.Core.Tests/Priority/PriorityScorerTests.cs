using SprintManager.Core.Domain;
using SprintManager.Core.Priority;

namespace SprintManager.Core.Tests.Priority;

public class PriorityScorerTests
{
    private static readonly DateOnly Today = new(2026, 11, 15); // Sunday
    private static readonly MemberId Me = MemberId.New();
    private static readonly MemberId Other = MemberId.New();

    private static WorkItem T(string title, double hours = 4, IReadOnlyList<TaskId>? deps = null, DateOnly? deadline = null,
        WorkItemStatus status = WorkItemStatus.ToDo, MemberId? assignee = null, TaskId? id = null) =>
        new(id ?? TaskId.New(), title, new Hours(hours), deps ?? [], ["C#"], deadline, status, assignee ?? Me);

    private static IReadOnlyList<PrioritizedTask> Rank(params WorkItem[] tasks) =>
        PriorityScorer.Rank(new PriorityRequest(tasks, Me, Today));

    [Fact]
    public void NoTasks_Empty()
    {
        Assert.Empty(Rank());
    }

    [Fact]
    public void OnlyMyOpenTasks_AreRanked()
    {
        var ranked = Rank(
            T("mine"),
            T("theirs", assignee: Other),
            T("done", status: WorkItemStatus.Done));

        Assert.Equal(["mine"], ranked.Select(p => p.Task.Title));
        Assert.Equal(1, ranked[0].Rank);
    }

    [Fact]
    public void OverdueBeatsFarDeadline_BeatsNoDeadline()
    {
        var ranked = Rank(
            T("none"),
            T("far", deadline: Today.AddDays(40)),
            T("overdue", deadline: Today.AddDays(-1)),
            T("soon", deadline: Today.AddDays(2)));

        Assert.Equal(["overdue", "soon", "far", "none"], ranked.Select(p => p.Task.Title));
        Assert.Contains("overdue", ranked[0].Reason);
        Assert.Equal(1, ranked[0].Components.DeadlineUrgency);
        Assert.Equal(0, ranked[^1].Components.DeadlineUrgency);
    }

    [Fact]
    public void BlockerOfAChain_OutranksLeaf()
    {
        var root = TaskId.New();
        var mid = TaskId.New();
        var ranked = Rank(
            T("leaf"),
            T("root", id: root),
            T("mid", id: mid, deps: [root], assignee: Other),
            T("end", deps: [mid], assignee: Other));

        Assert.Equal("root", ranked[0].Task.Title);
        Assert.Equal(2, ranked[0].BlockedCount);          // transitive: mid and end
        Assert.Contains("blocks 2 tasks", ranked[0].Reason);
        Assert.Equal(0, ranked[1].BlockedCount);
    }

    [Fact]
    public void CriticalPathTask_OutranksSlackTask()
    {
        // long(10) and short(1) both feed 'end'; short has 9h of slack.
        var longId = TaskId.New();
        var shortId = TaskId.New();
        var ranked = Rank(
            T("short", 1, id: shortId),
            T("long", 10, id: longId),
            T("end", 1, deps: [longId, shortId], assignee: Other));

        Assert.Equal("long", ranked[0].Task.Title);
        Assert.Equal(1, ranked[0].Components.Criticality);
        Assert.Contains("critical path", ranked[0].Reason);
        Assert.Equal(0, ranked[1].Components.Criticality);
    }

    [Fact]
    public void InProgress_BreaksTiesTowardFinishingStartedWork()
    {
        var ranked = Rank(T("new"), T("started", status: WorkItemStatus.InProgress));

        Assert.Equal("started", ranked[0].Task.Title);
        Assert.Contains("already started", ranked[0].Reason);
    }

    [Fact]
    public void DoneDependency_NoLongerCountsAsBlocking()
    {
        var done = TaskId.New();
        var ranked = Rank(
            T("done", id: done, status: WorkItemStatus.Done),
            T("after", deps: [done]));

        Assert.Equal(["after"], ranked.Select(p => p.Task.Title));
        Assert.Equal(0, ranked[0].BlockedCount);
    }

    [Fact]
    public void RanksAreSequential_AndScoresDescending()
    {
        var ranked = Rank(
            T("a", deadline: Today.AddDays(1)),
            T("b"),
            T("c", deadline: Today.AddDays(5)),
            T("d", status: WorkItemStatus.InProgress));

        Assert.Equal([1, 2, 3, 4], ranked.Select(p => p.Rank));
        Assert.Equal(ranked.Select(p => p.Score).OrderByDescending(s => s), ranked.Select(p => p.Score));
    }
}
