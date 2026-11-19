using System.ComponentModel.DataAnnotations;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.SprintPlanning.Sprints;

/// <summary>Create or update a sprint.</summary>
public sealed record SprintRequest(
    [Required, MinLength(1), MaxLength(120)] string Name,
    [Required] DateOnly StartDate,
    [Required] DateOnly EndDate);

/// <summary>Sprint with derived capacity.</summary>
public sealed record SprintDto(
    Guid Id, Guid ProjectId, string Name, DateOnly StartDate, DateOnly EndDate, SprintStatus Status,
    int WorkingDays, double TeamCapacityHours, int TaskCount, double TotalEstimateHours);
