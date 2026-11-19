using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Projects;

/// <summary>Projects list and project page.</summary>
[Route("api/projects")]
public sealed class ProjectsController(ProjectService service) : ApiControllerBase
{
    /// <summary>Projects the caller belongs to.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProjectDto>>> List([FromQuery] bool includeArchived, CancellationToken ct) =>
        Ok((await service.ListAsync(Caller, includeArchived, ct)).Select(p => p.ToDto()).ToList());

    /// <summary>One project.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType<ProjectDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        From(await service.GetAsync(new ProjectId(id), Caller, ct), p => p.ToDto());

    /// <summary>Creates a project (managers).</summary>
    [HttpPost]
    [ProducesResponseType<ProjectDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(ProjectRequest request, CancellationToken ct)
    {
        var result = await service.CreateAsync(request, Caller, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(Get), new { id = result.Value!.Id.Value }, result.Value.ToDto())
            : From(result, p => p.ToDto());
    }

    /// <summary>Edits a project (managers).</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType<ProjectDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, ProjectRequest request, CancellationToken ct) =>
        From(await service.UpdateAsync(new ProjectId(id), request, Caller, ct), p => p.ToDto());

    /// <summary>Sets the work-in-progress limit of each board column (managers). Columns left out have no limit.</summary>
    [HttpPut("{id:guid}/wip-limits")]
    [ProducesResponseType<ProjectDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetWipLimits(Guid id, WipLimitsRequest request, CancellationToken ct) =>
        From(await service.SetWipLimitsAsync(new ProjectId(id), request.Limits, Caller, ct), p => p.ToDto());

    /// <summary>Archives or restores (managers).</summary>
    [HttpPatch("{id:guid}/archive")]
    [ProducesResponseType<ProjectDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Archive(Guid id, [FromQuery] bool archived = true, CancellationToken ct = default) =>
        From(await service.SetArchivedAsync(new ProjectId(id), archived, Caller, ct), p => p.ToDto());
}
