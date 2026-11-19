using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Shared;

/// <summary>
/// Resource-based authorization in one place: "is this caller allowed to touch this project?".
/// Every service goes through here, so the IDOR check (project of another team) cannot be forgotten.
/// A project the caller does not belong to is reported as NotFound, never Forbidden, so ids cannot be probed.
/// </summary>
public sealed class ProjectAccess(IProjectRepository projects)
{
    /// <summary>Loads the project if the caller is a member of it.</summary>
    public async Task<OperationResult<Project>> AsMemberAsync(ProjectId id, CurrentUser caller, CancellationToken ct)
    {
        var project = await projects.GetAsync(id, ct);
        return project is not null && project.HasMember(caller.Id)
            ? OperationResult<Project>.Ok(project)
            : OperationResult.NotFound<Project>("Project");
    }

    /// <summary>Loads the project if the caller is a manager and a member of it.</summary>
    public async Task<OperationResult<Project>> AsManagerAsync(ProjectId id, CurrentUser caller, CancellationToken ct)
    {
        var result = await AsMemberAsync(id, caller, ct);
        if (!result.IsSuccess)
            return result;
        return caller.IsManager
            ? result
            : OperationResult.Forbidden<Project>("Only a manager of this project can do that.");
    }
}
