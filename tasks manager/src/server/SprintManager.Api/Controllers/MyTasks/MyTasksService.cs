using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;
using SprintManager.Core.Priority;

namespace SprintManager.Api.Controllers.MyTasks;

/// <summary>A member's ranked task list.</summary>
public sealed record MyTasksView(IReadOnlyList<PrioritizedTask> Ranked, IReadOnlyDictionary<TaskId, TaskItem> TasksById, IReadOnlyDictionary<TaskId, TaskItem> ProjectTasks);

/// <summary>"My tasks" page: the caller's open tasks ordered by the priority algorithm.</summary>
public sealed class MyTasksService(ITaskRepository tasks, IClock clock)
{
    /// <summary>
    /// The caller's open tasks across all sprints they have work in, ranked by the priority algorithm.
    /// Ranking runs per sprint (slack is only meaningful inside one sprint's graph) and the lists are then merged by score.
    /// </summary>
    public async Task<MyTasksView> GetAsync(CurrentUser caller, CancellationToken ct)
    {
        var mine = await tasks.GetForAssigneeAsync(caller.Id, ct);
        var sprintIds = mine.Where(t => t.SprintId is not null && !t.ToWorkItem().IsDone).Select(t => t.SprintId!.Value).Distinct().ToList();

        var ranked = new List<PrioritizedTask>();
        var projectTasks = new Dictionary<TaskId, TaskItem>();
        foreach (var sprintId in sprintIds)
        {
            var sprintTasks = await tasks.GetForSprintAsync(sprintId, ct);
            foreach (var t in sprintTasks)
                projectTasks[t.Id] = t;
            ranked.AddRange(PriorityScorer.Rank(new PriorityRequest(sprintTasks.Select(t => t.ToWorkItem()).ToList(), caller.Id, clock.Today)));
        }

        var merged = ranked.OrderByDescending(p => p.Score).Select((p, i) => p with { Rank = i + 1 }).ToList();
        return new MyTasksView(merged, mine.ToDictionary(t => t.Id), projectTasks);
    }
}
