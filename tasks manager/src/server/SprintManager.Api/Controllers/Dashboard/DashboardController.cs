using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Dashboard;

/// <summary>Manager dashboard page.</summary>
[Route("api/sprints/{id:guid}/dashboard")]
public sealed class DashboardController(DashboardService service) : ApiControllerBase
{
    /// <summary>Dashboard of a sprint (managers).</summary>
    [HttpGet]
    [ProducesResponseType<DashboardDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        From(await service.GetAsync(new SprintId(id), Caller, ct), d => d);
}
