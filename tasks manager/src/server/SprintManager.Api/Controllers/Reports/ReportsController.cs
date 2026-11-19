using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Reports;

/// <summary>Reports page.</summary>
[Route("api/projects/{id:guid}/reports")]
public sealed class ReportsController(ReportsService service) : ApiControllerBase
{
    /// <summary>Sprint history and member accuracy of a project (managers).</summary>
    [HttpGet]
    [ProducesResponseType<ReportsDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        From(await service.GetAsync(new ProjectId(id), Caller, ct), r => r);
}
