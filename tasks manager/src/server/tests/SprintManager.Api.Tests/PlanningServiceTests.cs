using SprintManager.Api.Controllers.SprintPlanning.Plans;
using SprintManager.Api.Tests.Support;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Tests;

public class PlanningServiceTests
{
    private readonly World w = new();
    private static readonly CancellationToken Ct = CancellationToken.None;

    private async Task<PlanJob> RunPlanAsync(string? strategy = null)
    {
        var queued = await w.PlanningService.EnqueueAsync(w.Sprint.Id, strategy, w.AsMia, Ct);
        Assert.True(queued.IsSuccess);
        await w.PlanningService.RunAsync(queued.Job!.Id, Ct);
        return w.Jobs.Items[queued.Job.Id];
    }

    // ---- enqueue ---------------------------------------------------------------

    [Fact]
    public async Task Enqueue_CreatesQueuedJob_AndSignalsTheQueue()
    {
        var result = await w.PlanningService.EnqueueAsync(w.Sprint.Id, null, w.AsMia, Ct);

        Assert.True(result.IsSuccess);
        Assert.Equal(PlanJobStatus.Queued, result.Job!.Status);
        Assert.Equal("Hungarian", result.Job.StrategyName);
        Assert.Equal([result.Job.Id], w.Queue.Enqueued);
    }

    [Fact]
    public async Task Enqueue_ByMember_Forbidden_ByOutsiderManager_Forbidden()
    {
        var byMember = await w.PlanningService.EnqueueAsync(w.Sprint.Id, null, w.AsDan, Ct);
        var byForeignManager = await w.PlanningService.EnqueueAsync(w.Sprint.Id, null, w.AsOzManager, Ct);

        Assert.Equal(PlanningErrorCode.Forbidden, byMember.Error);
        Assert.Equal(PlanningErrorCode.Forbidden, byForeignManager.Error);
        Assert.Empty(w.Queue.Enqueued);
    }

    [Fact]
    public async Task Enqueue_UnknownStrategy_Rejected_UnknownSprint_NotFound()
    {
        Assert.Equal(PlanningErrorCode.UnknownStrategy, (await w.PlanningService.EnqueueAsync(w.Sprint.Id, "Magic", w.AsMia, Ct)).Error);
        Assert.Equal(PlanningErrorCode.SprintNotFound, (await w.PlanningService.EnqueueAsync(SprintId.New(), null, w.AsMia, Ct)).Error);
    }

    [Fact]
    public async Task Enqueue_WhenQueueFull_FailsFast_AndMarksJobFailed()
    {
        w.Queue.Full = true;

        var result = await w.PlanningService.EnqueueAsync(w.Sprint.Id, null, w.AsMia, Ct);

        Assert.Equal(PlanningErrorCode.QueueFull, result.Error);
        var job = Assert.Single(w.Jobs.Items.Values);
        Assert.Equal(PlanJobStatus.Failed, job.Status);
    }

    // ---- run -------------------------------------------------------------------

    [Fact]
    public async Task Run_ProducesPlan_WithSkillBasedAssignment_AndTimings()
    {
        var sql = w.AddTask("Schema", 8, skills: "SQL");
        w.AddTask("Screens", 8, skills: "React");
        w.AddTask("API", 16, dependsOn: [sql.Id], skills: "C#");

        var job = await RunPlanAsync();

        Assert.Equal(PlanJobStatus.Done, job.Status);
        Assert.NotNull(job.QueueTime);
        Assert.NotNull(job.RunTime);
        var plan = job.Result!;
        Assert.True(plan.IsFeasible);
        Assert.Equal(24, plan.CriticalPathLength.Value);
        string Who(string title) => w.Users.Items[plan.Tasks.Single(t => t.Task.Title == title).Assignment.MemberId!.Value].Name;
        Assert.Equal("Dan", Who("Schema"));      // only Dan has SQL
        Assert.Equal("Eve", Who("Screens"));     // only Eve has React
        Assert.Equal("Dan", Who("API"));         // C# 5 beats Mia's 3
    }

    [Fact]
    public async Task Run_IsDeterministic_ForIdenticalInput()
    {
        w.AddTask("A", 8);
        w.AddTask("B", 8);
        w.AddTask("C", 8);

        var first = (await RunPlanAsync()).Result!.Tasks.Select(t => (t.Task.Title, t.Assignment.MemberId)).ToList();
        var second = (await RunPlanAsync()).Result!.Tasks.Select(t => (t.Task.Title, t.Assignment.MemberId)).ToList();

        Assert.Equal(first, second);
    }

    [Fact]
    public async Task Run_WithCycle_StoresInfeasiblePlan_NotFailure()
    {
        var a = w.AddTask("A");
        var b = w.AddTask("B", dependsOn: [a.Id]);
        w.Tasks.Items[a.Id] = a with { DependsOn = [b.Id] };

        var job = await RunPlanAsync();

        Assert.Equal(PlanJobStatus.Done, job.Status);
        Assert.False(job.Result!.IsFeasible);
        Assert.Contains(job.Result.Warnings, x => x.Kind == SprintManager.Core.Planning.PlanWarningKind.DependencyCycle);
    }

    [Fact]
    public async Task Run_IgnoresDoneTasks()
    {
        w.AddTask("Finished", status: WorkItemStatus.Done);
        w.AddTask("Open");

        var job = await RunPlanAsync();

        Assert.Equal(["Open"], job.Result!.Tasks.Select(t => t.Task.Title));
    }

    [Fact]
    public async Task Run_Twice_SecondCallIsIgnored()
    {
        var queued = (await w.PlanningService.EnqueueAsync(w.Sprint.Id, null, w.AsMia, Ct)).Job!;
        await w.PlanningService.RunAsync(queued.Id, Ct);
        var finishedAt = w.Jobs.Items[queued.Id].FinishedAt;

        await w.PlanningService.RunAsync(queued.Id, Ct);

        Assert.Equal(finishedAt, w.Jobs.Items[queued.Id].FinishedAt);
    }

    // ---- read job ----------------------------------------------------------------

    [Fact]
    public async Task GetJob_MemberOfProject_Sees_Outsider_NotFound()
    {
        var job = (await w.PlanningService.EnqueueAsync(w.Sprint.Id, null, w.AsMia, Ct)).Job!;

        Assert.True((await w.PlanningService.GetJobAsync(job.Id, w.AsDan, Ct)).IsSuccess);
        Assert.Equal(PlanningErrorCode.JobNotFound, (await w.PlanningService.GetJobAsync(job.Id, w.AsOz, Ct)).Error);
    }

    // ---- accept --------------------------------------------------------------------

    [Fact]
    public async Task Accept_WritesAssignees_AndAuditsEachChange()
    {
        var task = w.AddTask("Schema", skills: "SQL");
        var job = await RunPlanAsync();

        var result = await w.PlanningService.AcceptAsync(job.Id, w.AsMia, Ct);

        Assert.True(result.IsSuccess);
        Assert.Equal(w.Dan.Id, w.Tasks.Items[task.Id].AssigneeId);
        Assert.Contains(w.History.Items, h => h.Field == "assignee" && h.TaskId == task.Id && h.ChangedBy == w.Mia.Id);
    }

    [Fact]
    public async Task Accept_DoesNotOverwriteManualChangesMadeAfterThePlanRan()
    {
        var task = w.AddTask("Schema", skills: "SQL");
        var job = await RunPlanAsync();
        w.Clock.Advance(TimeSpan.FromMinutes(5));
        w.Tasks.Items[task.Id] = w.Tasks.Items[task.Id] with { AssigneeId = w.Eve.Id, UpdatedAt = w.Clock.UtcNow };

        await w.PlanningService.AcceptAsync(job.Id, w.AsMia, Ct);

        Assert.Equal(w.Eve.Id, w.Tasks.Items[task.Id].AssigneeId);    // manager's later choice wins
    }

    [Fact]
    public async Task Accept_RefusedWhenNotDone_NotManager_OrInfeasible()
    {
        var queued = (await w.PlanningService.EnqueueAsync(w.Sprint.Id, null, w.AsMia, Ct)).Job!;
        Assert.Equal(PlanningErrorCode.PlanNotApplicable, (await w.PlanningService.AcceptAsync(queued.Id, w.AsMia, Ct)).Error);

        await w.PlanningService.RunAsync(queued.Id, Ct);
        Assert.Equal(PlanningErrorCode.Forbidden, (await w.PlanningService.AcceptAsync(queued.Id, w.AsDan, Ct)).Error);
    }
}
