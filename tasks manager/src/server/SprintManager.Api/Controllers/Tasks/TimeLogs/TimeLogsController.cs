using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks.TimeLogs;

/// <summary>Task detail page: time logging.</summary>
[Route("api/tasks/{taskId:guid}/time")]
public sealed class TimeLogsController(TimeLogService service) : ApiControllerBase
{
    /// <summary>Logs time on a task.</summary>
    [HttpPost]
    [ProducesResponseType<TimeLogDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Log(Guid taskId, TimeLogRequest request, CancellationToken ct) =>
        From(await service.LogAsync(new TaskId(taskId), request, Caller, ct), l => l.ToDto());
}
