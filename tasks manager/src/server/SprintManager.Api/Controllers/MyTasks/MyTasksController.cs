using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Controllers.Tasks;

namespace SprintManager.Api.Controllers.MyTasks;

/// <summary>My tasks page (members).</summary>
[Route("api/me/tasks")]
public sealed class MyTasksController(MyTasksService service) : ApiControllerBase
{
    /// <summary>The caller's open tasks ranked by the priority algorithm, with reasons.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MyTaskDto>>> Get(CancellationToken ct)
    {
        var v = await service.GetAsync(Caller, ct);
        return Ok(v.Ranked.Select(p => new MyTaskDto(
            v.TasksById[p.Task.Id].ToDto(v.ProjectTasks), p.Rank, p.Score, p.Reason, p.BlockedCount,
            p.Components.DeadlineUrgency, p.Components.Criticality, p.Components.BlockingShare)).ToList());
    }
}
