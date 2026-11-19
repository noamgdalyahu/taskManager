using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Projects;

/// <summary>Explicit mapping for projects.</summary>
public static class ProjectMapping
{
    /// <summary>Project to DTO.</summary>
    public static ProjectDto ToDto(this Project p) =>
        new(p.Id.Value, p.Name, p.Description, p.OwnerId.Value, p.MemberIds.Count, p.IsArchived, p.CreatedAt,
            (p.WipLimits ?? new Dictionary<WorkItemStatus, int>()).ToDictionary(kv => kv.Key.ToString(), kv => kv.Value));
}
