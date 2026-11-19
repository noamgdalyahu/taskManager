using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.SprintPlanning.Plans;

/// <summary>Sprint planning page, part 3: compare the manager's assignment with the algorithms.</summary>
[Route("api/sprints/{id:guid}/plan-comparison")]
public sealed class PlanComparisonController(PlanComparisonService service) : ApiControllerBase
{
    /// <summary>Manual vs Greedy vs Hungarian for the sprint's open tasks (managers).</summary>
    [HttpGet]
    [ProducesResponseType<PlanComparisonDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Compare(Guid id, CancellationToken ct) =>
        From(await service.CompareAsync(new SprintId(id), Caller, ct), c => c.ToDto());
}
