using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Projects;

/// <summary>Projects list and project page: create, edit, archive.</summary>
public sealed class ProjectService(IProjectRepository projects, ProjectAccess access, IClock clock)
{
    /// <summary>Projects the caller belongs to.</summary>
    public Task<IReadOnlyList<Project>> ListAsync(CurrentUser caller, bool includeArchived, CancellationToken ct) =>
        projects.GetForMemberAsync(caller.Id, includeArchived, ct);

    /// <summary>One project, if the caller is a member.</summary>
    public Task<OperationResult<Project>> GetAsync(ProjectId id, CurrentUser caller, CancellationToken ct) =>
        access.AsMemberAsync(id, caller, ct);

    /// <summary>Creates a project owned by the caller (managers only).</summary>
    public async Task<OperationResult<Project>> CreateAsync(ProjectRequest request, CurrentUser caller, CancellationToken ct)
    {
        if (!caller.IsManager)
            return OperationResult.Forbidden<Project>("Only managers create projects.");

        var project = new Project(ProjectId.New(), request.Name.Trim(), request.Description?.Trim() ?? "", caller.Id, [caller.Id], false, clock.UtcNow);
        await projects.AddAsync(project, ct);
        return OperationResult<Project>.Ok(project);
    }

    /// <summary>Renames or re-describes.</summary>
    public async Task<OperationResult<Project>> UpdateAsync(ProjectId id, ProjectRequest request, CurrentUser caller, CancellationToken ct)
    {
        var found = await access.AsManagerAsync(id, caller, ct);
        if (!found.IsSuccess)
            return found;

        var updated = found.Value! with { Name = request.Name.Trim(), Description = request.Description?.Trim() ?? "" };
        await projects.UpdateAsync(updated, ct);
        return OperationResult<Project>.Ok(updated);
    }

    /// <summary>
    /// Sets the work-in-progress limit of each board column (managers). As in Azure Boards a limit is a signal, not a lock:
    /// the board shows the column count in red when it is exceeded but still lets cards in. Columns not listed are unlimited.
    /// </summary>
    public async Task<OperationResult<Project>> SetWipLimitsAsync(ProjectId id, IReadOnlyDictionary<string, int>? limits, CurrentUser caller, CancellationToken ct)
    {
        var found = await access.AsManagerAsync(id, caller, ct);
        if (!found.IsSuccess)
            return found;

        var parsed = new Dictionary<WorkItemStatus, int>();
        foreach (var (column, limit) in limits ?? new Dictionary<string, int>())
        {
            // Enum.TryParse also accepts "1" or " inprogress"; a column is only ever named by its exact status name.
            if (!Enum.TryParse<WorkItemStatus>(column, out var status) || status.ToString() != column)
                return OperationResult.Invalid<Project>($"'{column}' is not a board column.");
            if (limit is < 1 or > 99)
                return OperationResult.Invalid<Project>($"The limit for {column} must be between 1 and 99.");
            parsed[status] = limit;
        }

        var updated = found.Value! with { WipLimits = parsed };
        await projects.UpdateAsync(updated, ct);
        return OperationResult<Project>.Ok(updated);
    }

    /// <summary>Archives or restores.</summary>
    public async Task<OperationResult<Project>> SetArchivedAsync(ProjectId id, bool archived, CurrentUser caller, CancellationToken ct)
    {
        var found = await access.AsManagerAsync(id, caller, ct);
        if (!found.IsSuccess)
            return found;

        var updated = found.Value! with { IsArchived = archived };
        await projects.UpdateAsync(updated, ct);
        return OperationResult<Project>.Ok(updated);
    }
}
