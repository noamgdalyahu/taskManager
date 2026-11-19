using SprintManager.Api.Controllers.Tasks;

namespace SprintManager.Api.Controllers.MyTasks;

/// <summary>A member's task with its priority explanation.</summary>
public sealed record MyTaskDto(TaskDto Task, int Rank, double Score, string Reason, int BlockedCount, double DeadlineUrgency, double Criticality, double BlockingShare);
