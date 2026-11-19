using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Controllers.SprintPlanning.Plans;
using SprintManager.Api.Jobs;
using SprintManager.Api.Tests.Support;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Tests;

public class RecoveryAndComparisonTests
{
    private readonly World w = new();
    private static readonly CancellationToken Ct = CancellationToken.None;

    private PlanJob AddJob(PlanJobStatus status, int minutesAgo = 0)
    {
        var job = PlanJob.Queued(w.Sprint.Id, w.Project.Id, w.Mia.Id, "Hungarian", w.Clock.UtcNow.AddMinutes(-minutesAgo)) with { Status = status };
        w.Jobs.Items[job.Id] = job;
        return job;
    }

    private PlanJobRecovery Recovery() => new(w.Jobs, w.Queue, w.Clock);

    // ---- restart recovery -----------------------------------------------------------

    [Fact]
    public async Task QueuedJobs_AreRequeued_OldestFirst()
    {
        var newer = AddJob(PlanJobStatus.Queued, minutesAgo: 1);
        var older = AddJob(PlanJobStatus.Queued, minutesAgo: 10);

        var report = await Recovery().RecoverAsync(Ct);

        Assert.Equal(new RecoveryReport(2, 0, 0), report);
        Assert.Equal([older.Id, newer.Id], w.Queue.Enqueued);
    }

    [Fact]
    public async Task RunningJobs_AreMarkedFailed_NotRequeued()
    {
        var job = AddJob(PlanJobStatus.Running);

        var report = await Recovery().RecoverAsync(Ct);

        Assert.Equal(1, report.Interrupted);
        Assert.Empty(w.Queue.Enqueued);
        Assert.Equal(PlanJobStatus.Failed, w.Jobs.Items[job.Id].Status);
        Assert.Contains("restart", w.Jobs.Items[job.Id].Error);
    }

    [Fact]
    public async Task FinishedJobs_AreLeftAlone()
    {
        var done = AddJob(PlanJobStatus.Done);
        var failed = AddJob(PlanJobStatus.Failed);

        var report = await Recovery().RecoverAsync(Ct);

        Assert.Equal(default, report);
        Assert.Equal(PlanJobStatus.Done, w.Jobs.Items[done.Id].Status);
        Assert.Equal(PlanJobStatus.Failed, w.Jobs.Items[failed.Id].Status);
    }

    [Fact]
    public async Task WhenQueueIsFull_QueuedJobsAreFailedWithAReason_NotLeftHanging()
    {
        var job = AddJob(PlanJobStatus.Queued);
        w.Queue.Full = true;

        var report = await Recovery().RecoverAsync(Ct);

        Assert.Equal(1, report.Dropped);
        Assert.Equal(PlanJobStatus.Failed, w.Jobs.Items[job.Id].Status);
    }

    [Fact]
    public async Task RecoveredJob_CanThenRunNormally()
    {
        w.AddTask("A", skills: "SQL");
        var job = AddJob(PlanJobStatus.Queued);
        await Recovery().RecoverAsync(Ct);

        await w.PlanningService.RunAsync(w.Queue.Enqueued.Single(), Ct);

        Assert.Equal(PlanJobStatus.Done, w.Jobs.Items[job.Id].Status);
    }

    // ---- plan comparison --------------------------------------------------------------

    private PlanComparisonService Comparison() => new(w.Sprints, w.Tasks, w.Users, w.ProjectAccess);

    [Fact]
    public async Task Compare_ShowsManualAgainstBothAlgorithms()
    {
        w.AddTask("Schema", skills: "SQL", assignee: w.Eve.Id);     // manager gave SQL work to the React person
        w.AddTask("Screens", skills: "React", assignee: w.Eve.Id);

        var result = await Comparison().CompareAsync(w.Sprint.Id, w.AsMia, Ct);

        Assert.True(result.IsSuccess);
        Assert.Equal(["Manual", "Greedy", "Hungarian"], result.Value!.Scores.Select(s => s.Name));
        Assert.Equal(1, result.Value.Scores[0].SkillMismatches);
        Assert.DoesNotContain(result.Value.Winners, s => s.Name == "Manual");
    }

    [Fact]
    public async Task Compare_IgnoresDoneTasks()
    {
        w.AddTask("Finished", status: WorkItemStatus.Done, assignee: w.Dan.Id);
        w.AddTask("Open");

        var result = await Comparison().CompareAsync(w.Sprint.Id, w.AsMia, Ct);

        Assert.Equal(["Greedy", "Hungarian"], result.Value!.Scores.Select(s => s.Name));   // nothing open is assigned
    }

    [Fact]
    public async Task Compare_IsForMembersOfTheProjectOnly()
    {
        Assert.True((await Comparison().CompareAsync(w.Sprint.Id, w.AsDan, Ct)).IsSuccess);
        Assert.Equal(ErrorKind.NotFound, (await Comparison().CompareAsync(w.Sprint.Id, w.AsOzManager, Ct)).Error!.Value.Kind);
        Assert.Equal(ErrorKind.NotFound, (await Comparison().CompareAsync(SprintId.New(), w.AsMia, Ct)).Error!.Value.Kind);
    }

    [Fact]
    public async Task Compare_WithCycle_ReportsNotComparable_NotAnError()
    {
        var a = w.AddTask("A");
        var b = w.AddTask("B", dependsOn: [a.Id]);
        w.Tasks.Items[a.Id] = a with { DependsOn = [b.Id] };

        var result = await Comparison().CompareAsync(w.Sprint.Id, w.AsMia, Ct);

        Assert.True(result.IsSuccess);
        Assert.False(result.Value!.IsComparable);
    }

    [Fact]
    public async Task Compare_RefusesHugeSprints()
    {
        for (var i = 0; i < PlanComparisonService.MaxTasks + 1; i++)
            w.AddTask($"T{i}", 1);

        var result = await Comparison().CompareAsync(w.Sprint.Id, w.AsMia, Ct);

        Assert.Equal(ErrorKind.Validation, result.Error!.Value.Kind);
    }
}
