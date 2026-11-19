using SprintManager.Core.Domain;

namespace SprintManager.Core.Tests.Domain;

public class TaskRulesTests
{
    private static readonly ProjectId P = ProjectId.New();

    private static TaskItem T(WorkItemStatus status = WorkItemStatus.ToDo, params TaskId[] deps) =>
        new(TaskId.New(), P, null, "t", "", new Hours(1), null, status, null, [], deps, DateTimeOffset.UnixEpoch, DateTimeOffset.UnixEpoch, null);

    [Fact]
    public void SameStatus_IsNoChange()
    {
        var r = TaskRules.CanChangeStatus(T(), WorkItemStatus.ToDo, []);
        Assert.False(r.IsAllowed);
        Assert.Equal(StatusChangeError.NoChange, r.Error);
    }

    [Fact]
    public void StartWithOpenPrerequisite_RefusedAndNamesIt()
    {
        var dep = T(WorkItemStatus.InProgress);
        var task = T(WorkItemStatus.ToDo, dep.Id);

        var r = TaskRules.CanChangeStatus(task, WorkItemStatus.InProgress, [dep]);

        Assert.False(r.IsAllowed);
        Assert.Equal(StatusChangeError.DependenciesUnfinished, r.Error);
        Assert.Equal([dep.Id], r.BlockingTaskIds);
    }

    [Fact]
    public void StartWithDonePrerequisite_Allowed()
    {
        var dep = T(WorkItemStatus.Done);
        Assert.True(TaskRules.CanChangeStatus(T(WorkItemStatus.ToDo, dep.Id), WorkItemStatus.InProgress, [dep]).IsAllowed);
    }

    [Theory]
    [InlineData(WorkItemStatus.ToDo)]
    [InlineData(WorkItemStatus.InQA)]
    public void BackToToDoOrInQA_AlwaysAllowed(WorkItemStatus next)
    {
        var dep = T(WorkItemStatus.ToDo);
        Assert.True(TaskRules.CanChangeStatus(T(WorkItemStatus.InProgress, dep.Id), next, [dep]).IsAllowed);
    }

    [Fact]
    public void WouldCreateCycle_DetectsIndirectLoop()
    {
        // A -> B -> C exists; adding C as prerequisite of A... wait: A depends on B, B depends on C. Adding "C depends on A" closes the loop.
        var c = T();
        var b = T(WorkItemStatus.ToDo, c.Id);
        var a = T(WorkItemStatus.ToDo, b.Id);

        Assert.True(TaskRules.WouldCreateCycle(c.Id, [a.Id], [a, b, c]));
        Assert.False(TaskRules.WouldCreateCycle(a.Id, [c.Id], [a, b, c]));
    }

    [Fact]
    public void WouldCreateCycle_SelfDependency()
    {
        var a = T();
        Assert.True(TaskRules.WouldCreateCycle(a.Id, [a.Id], [a]));
    }
}
