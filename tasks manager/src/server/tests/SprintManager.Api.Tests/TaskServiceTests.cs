using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Controllers.Tasks;
using SprintManager.Api.Controllers.Tasks.Comments;
using SprintManager.Api.Controllers.Tasks.TimeLogs;
using SprintManager.Api.Tests.Support;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Tests;

public class TaskServiceTests
{
    private readonly World w = new();
    private static readonly CancellationToken Ct = CancellationToken.None;

    private static CreateTaskRequest Create(string title, double hours = 8, IReadOnlyList<Guid>? dependsOn = null, Guid? sprintId = null) =>
        new(title, null, hours, null, null, dependsOn, sprintId);

    // ---- create / authorization ---------------------------------------------

    [Fact]
    public async Task Manager_CreatesTask_AndHistoryRecordsCreation()
    {
        var result = await w.TaskService.CreateAsync(w.Project.Id, Create("Schema"), w.AsMia, Ct);

        Assert.True(result.IsSuccess);
        Assert.Equal(WorkItemStatus.ToDo, result.Value!.Task.Status);
        var entry = Assert.Single(w.History.Items);
        Assert.Equal("created", entry.Field);
        Assert.Equal(w.Mia.Id, entry.ChangedBy);
    }

    [Fact]
    public async Task Member_CanCreateTask()
    {
        var result = await w.TaskService.CreateAsync(w.Project.Id, Create("x"), w.AsDan, Ct);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task Outsider_SeesProjectAsNotFound_NeverForbidden()
    {
        var result = await w.TaskService.CreateAsync(w.Project.Id, Create("x"), w.AsOzManager, Ct);

        Assert.Equal(ErrorKind.NotFound, result.Error!.Value.Kind);
    }

    [Fact]
    public async Task Outsider_CannotReadTaskDetail()
    {
        var task = w.AddTask("secret");

        var result = await w.TaskService.GetDetailAsync(task.Id, w.AsOz, Ct);

        Assert.Equal(ErrorKind.NotFound, result.Error!.Value.Kind);
    }

    // ---- dependencies ---------------------------------------------------------

    [Fact]
    public async Task Dependency_OnTaskOfAnotherProject_Rejected()
    {
        var foreign = new TaskItem(TaskId.New(), ProjectId.New(), null, "other", "", new Hours(1), null, WorkItemStatus.ToDo, null, [], [], w.Clock.UtcNow, w.Clock.UtcNow, null);
        w.Tasks.Items[foreign.Id] = foreign;

        var result = await w.TaskService.CreateAsync(w.Project.Id, Create("x", dependsOn: [foreign.Id.Value]), w.AsMia, Ct);

        Assert.Equal(ErrorKind.Validation, result.Error!.Value.Kind);
    }

    [Fact]
    public async Task Update_ThatWouldCreateCycle_Rejected()
    {
        var a = w.AddTask("A");
        var b = w.AddTask("B", dependsOn: [a.Id]);

        var result = await w.TaskService.UpdateAsync(a.Id,
            new UpdateTaskRequest("A", null, 8, null, null, [b.Id.Value], null, null), w.AsMia, Ct);

        Assert.Equal(ErrorKind.Validation, result.Error!.Value.Kind);
        Assert.Contains("cycle", result.Error.Value.Message);
    }

    [Fact]
    public async Task Sprint_FromAnotherProject_Rejected()
    {
        var otherSprint = new Sprint(SprintId.New(), ProjectId.New(), "X", new DateOnly(2026, 1, 1), new DateOnly(2026, 1, 2), SprintStatus.Planned, w.Clock.UtcNow);
        w.Sprints.Items[otherSprint.Id] = otherSprint;

        var result = await w.TaskService.CreateAsync(w.Project.Id, Create("x", sprintId: otherSprint.Id.Value), w.AsMia, Ct);

        Assert.Equal(ErrorKind.Validation, result.Error!.Value.Kind);
    }

    // ---- delete ---------------------------------------------------------------------

    [Fact]
    public async Task Manager_DeletesTask_WithItsCommentsTimeLogsAndHistory()
    {
        var task = w.AddTask("Doomed");
        var keep = w.AddTask("Keep");
        w.Comments.Items.Add(new Comment(Guid.NewGuid(), task.Id, w.Mia.Id, "note", w.Clock.UtcNow));
        w.TimeLogs.Items.Add(new TimeLog(Guid.NewGuid(), task.Id, w.Dan.Id, new Hours(2), new DateOnly(2026, 1, 1), null));
        w.History.Items.Add(new HistoryEntry(Guid.NewGuid(), task.Id, w.Mia.Id, "created", null, "Doomed", w.Clock.UtcNow));
        w.History.Items.Add(new HistoryEntry(Guid.NewGuid(), keep.Id, w.Mia.Id, "created", null, "Keep", w.Clock.UtcNow));

        var result = await w.TaskService.DeleteAsync(task.Id, w.AsMia, Ct);

        Assert.True(result.IsSuccess);
        Assert.False(w.Tasks.Items.ContainsKey(task.Id));
        Assert.True(w.Tasks.Items.ContainsKey(keep.Id));
        Assert.Empty(w.Comments.Items);
        Assert.Empty(w.TimeLogs.Items);
        Assert.Equal(keep.Id, Assert.Single(w.History.Items).TaskId);
    }

    [Fact]
    public async Task Delete_RemovesTheTaskFromWhatDependedOnIt()
    {
        var schema = w.AddTask("Schema");
        var api = w.AddTask("API", dependsOn: [schema.Id]);

        await w.TaskService.DeleteAsync(schema.Id, w.AsMia, Ct);

        Assert.Empty(w.Tasks.Items[api.Id].DependsOn);
    }

    [Fact]
    public async Task Member_CannotDeleteTask()
    {
        var task = w.AddTask("Mine", assignee: w.Dan.Id);

        var result = await w.TaskService.DeleteAsync(task.Id, w.AsDan, Ct);

        Assert.Equal(ErrorKind.Forbidden, result.Error!.Value.Kind);
        Assert.True(w.Tasks.Items.ContainsKey(task.Id));
    }

    [Fact]
    public async Task Outsider_CannotDeleteTask_SeesItAsNotFound()
    {
        var task = w.AddTask("Secret");

        var result = await w.TaskService.DeleteAsync(task.Id, w.AsOzManager, Ct);

        Assert.Equal(ErrorKind.NotFound, result.Error!.Value.Kind);
        Assert.True(w.Tasks.Items.ContainsKey(task.Id));
    }

    // ---- status rules -----------------------------------------------------------

    [Fact]
    public async Task Start_WhileDependencyOpen_IsAllowed()
    {
        var schema = w.AddTask("Schema", assignee: w.Eve.Id);
        var api = w.AddTask("API", assignee: w.Dan.Id, dependsOn: [schema.Id]);

        var result = await w.TaskService.ChangeStatusAsync(api.Id, WorkItemStatus.InProgress, w.AsDan, Ct);

        Assert.True(result.IsSuccess);
        Assert.Equal(WorkItemStatus.InProgress, w.Tasks.Items[api.Id].Status);
    }

    [Fact]
    public async Task Start_AfterDependencyDone_Succeeds_AndHistoryShowsStatusChange()
    {
        var schema = w.AddTask("Schema", status: WorkItemStatus.Done);
        var api = w.AddTask("API", assignee: w.Dan.Id, dependsOn: [schema.Id]);

        var result = await w.TaskService.ChangeStatusAsync(api.Id, WorkItemStatus.InProgress, w.AsDan, Ct);

        Assert.True(result.IsSuccess);
        var entry = Assert.Single(w.History.Items, h => h.Field == "status");
        Assert.Equal(("ToDo", "InProgress"), (entry.OldValue, entry.NewValue));
    }

    [Fact]
    public async Task Member_CanMoveSomeoneElsesTask()
    {
        var task = w.AddTask("Eve's", assignee: w.Eve.Id);

        var result = await w.TaskService.ChangeStatusAsync(task.Id, WorkItemStatus.InProgress, w.AsDan, Ct);

        Assert.True(result.IsSuccess);
        Assert.Equal(WorkItemStatus.InProgress, w.Tasks.Items[task.Id].Status);
    }

    [Fact]
    public async Task Manager_CanMoveAnyTask()
    {
        var task = w.AddTask("Eve's", assignee: w.Eve.Id);

        var result = await w.TaskService.ChangeStatusAsync(task.Id, WorkItemStatus.InProgress, w.AsMia, Ct);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task Done_SetsCompletedAt_AndReopeningClearsIt()
    {
        var task = w.AddTask("T", assignee: w.Dan.Id);

        await w.TaskService.ChangeStatusAsync(task.Id, WorkItemStatus.Done, w.AsDan, Ct);
        Assert.NotNull(w.Tasks.Items[task.Id].CompletedAt);

        await w.TaskService.ChangeStatusAsync(task.Id, WorkItemStatus.ToDo, w.AsDan, Ct);
        Assert.Null(w.Tasks.Items[task.Id].CompletedAt);
    }

    [Fact]
    public async Task SameStatus_IsHarmlessNoOp_NoHistory()
    {
        var task = w.AddTask("T", assignee: w.Dan.Id);

        var result = await w.TaskService.ChangeStatusAsync(task.Id, WorkItemStatus.ToDo, w.AsDan, Ct);

        Assert.True(result.IsSuccess);
        Assert.Empty(w.History.Items);
    }

    // ---- assignment -------------------------------------------------------------

    [Fact]
    public async Task Assign_ToProjectMember_Works_AndIsAudited()
    {
        var task = w.AddTask("T");

        var result = await w.TaskService.AssignAsync(task.Id, w.Dan.Id, w.AsMia, Ct);

        Assert.True(result.IsSuccess);
        Assert.Equal(w.Dan.Id, w.Tasks.Items[task.Id].AssigneeId);
        Assert.Contains(w.History.Items, h => h.Field == "assignee");
    }

    [Fact]
    public async Task Member_CanAssignATask()
    {
        var task = w.AddTask("T");

        var result = await w.TaskService.AssignAsync(task.Id, w.Eve.Id, w.AsDan, Ct);

        Assert.True(result.IsSuccess);
        Assert.Equal(w.Eve.Id, w.Tasks.Items[task.Id].AssigneeId);
    }

    [Fact]
    public async Task Assign_ToNonMember_Rejected()
    {
        var task = w.AddTask("T");

        var result = await w.TaskService.AssignAsync(task.Id, w.Oz.Id, w.AsMia, Ct);

        Assert.Equal(ErrorKind.Validation, result.Error!.Value.Kind);
        Assert.Null(w.Tasks.Items[task.Id].AssigneeId);
    }

    [Fact]
    public async Task Update_RecordsOneHistoryEntryPerChangedField()
    {
        var task = w.AddTask("Old title", hours: 4);

        await w.TaskService.UpdateAsync(task.Id, new UpdateTaskRequest("New title", null, 6, null, null, null, w.Sprint.Id.Value, null), w.AsMia, Ct);

        Assert.Equal(["estimate", "title"], w.History.Items.Select(h => h.Field).Order());
    }

    // ---- comments and time ------------------------------------------------------

    [Fact]
    public async Task Comment_ByMember_Works_ByOutsider_NotFound()
    {
        var task = w.AddTask("T");

        Assert.True((await w.CommentService.AddAsync(task.Id, new CommentRequest("hi"), w.AsDan, Ct)).IsSuccess);
        var denied = await w.CommentService.AddAsync(task.Id, new CommentRequest("hi"), w.AsOz, Ct);

        Assert.Equal(ErrorKind.NotFound, denied.Error!.Value.Kind);
    }

    [Fact]
    public async Task DeleteComment_OnlyOwnUnlessManager()
    {
        var task = w.AddTask("T");
        var comment = (await w.CommentService.AddAsync(task.Id, new CommentRequest("mine"), w.AsDan, Ct)).Value!;

        var byEve = await w.CommentService.DeleteAsync(task.Id, comment.Id, w.AsEve, Ct);
        Assert.Equal(ErrorKind.Forbidden, byEve.Error!.Value.Kind);

        var byManager = await w.CommentService.DeleteAsync(task.Id, comment.Id, w.AsMia, Ct);
        Assert.True(byManager.IsSuccess);
        Assert.Empty(w.Comments.Items);
    }

    [Fact]
    public async Task LogTime_StoresHoursForCaller_DefaultingToToday()
    {
        var task = w.AddTask("T");

        var result = await w.TimeLogService.LogAsync(task.Id, new TimeLogRequest(3.5, null, " paired "), w.AsDan, Ct);

        var log = Assert.Single(w.TimeLogs.Items);
        Assert.Equal((w.Dan.Id, 3.5, w.Clock.Today, "paired"), (log.MemberId, log.Hours.Value, log.Date, log.Note));
        Assert.True(result.IsSuccess);
    }
}
