using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.SprintPlanning.Sprints;

/// <summary>Sprint planning page, part 1: the sprint itself.</summary>
[Route("api")]
public sealed class SprintsController(SprintService service) : ApiControllerBase
{
    /// <summary>Sprints of a project.</summary>
    [HttpGet("projects/{projectId:guid}/sprints")]
    [ProducesResponseType<IReadOnlyList<SprintDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(Guid projectId, CancellationToken ct) =>
        From(await service.ListAsync(new ProjectId(projectId), Caller, ct), list => list.Select(v => v.ToDto()).ToList());

    /// <summary>One sprint.</summary>
    [HttpGet("sprints/{id:guid}")]
    [ProducesResponseType<SprintDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        From(await service.GetAsync(new SprintId(id), Caller, ct), v => v.ToDto());

    /// <summary>Creates a sprint (managers).</summary>
    [HttpPost("projects/{projectId:guid}/sprints")]
    [ProducesResponseType<SprintDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(Guid projectId, SprintRequest request, CancellationToken ct)
    {
        var result = await service.CreateAsync(new ProjectId(projectId), request, Caller, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(Get), new { id = result.Value!.Sprint.Id.Value }, result.Value.ToDto())
            : From(result, v => v.ToDto());
    }

    /// <summary>Edits a sprint (managers).</summary>
    [HttpPut("sprints/{id:guid}")]
    [ProducesResponseType<SprintDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, SprintRequest request, CancellationToken ct) =>
        From(await service.UpdateAsync(new SprintId(id), request, Caller, ct), v => v.ToDto());

    /// <summary>Starts a planned sprint (managers).</summary>
    [HttpPost("sprints/{id:guid}/start")]
    [ProducesResponseType<SprintDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Start(Guid id, CancellationToken ct) =>
        From(await service.TransitionAsync(new SprintId(id), SprintStatus.Active, Caller, ct), v => v.ToDto());

    /// <summary>Closes an active sprint (managers).</summary>
    [HttpPost("sprints/{id:guid}/close")]
    [ProducesResponseType<SprintDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Close(Guid id, CancellationToken ct) =>
        From(await service.TransitionAsync(new SprintId(id), SprintStatus.Closed, Caller, ct), v => v.ToDto());
}
