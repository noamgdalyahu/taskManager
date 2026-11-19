using SprintManager.Api.Controllers.Tasks;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Board;

/// <summary>Kanban board.</summary>
public sealed record BoardDto(Guid SprintId, IReadOnlyList<BoardColumnDto> Columns);

/// <summary>One column.</summary>
public sealed record BoardColumnDto(WorkItemStatus Status, IReadOnlyList<TaskDto> Tasks);
