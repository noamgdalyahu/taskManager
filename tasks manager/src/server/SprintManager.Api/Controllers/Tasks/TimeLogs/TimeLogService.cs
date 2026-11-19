using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Tasks.TimeLogs;

/// <summary>Time logging; the actual hours feed the reports (estimate vs actual).</summary>
public sealed class TimeLogService(ITimeLogRepository timeLogs, TaskAccess taskAccess, IClock clock)
{
    /// <summary>Logs time (any member of the project).</summary>
    public async Task<OperationResult<TimeLog>> LogAsync(TaskId id, TimeLogRequest request, CurrentUser caller, CancellationToken ct)
    {
        var loaded = await taskAccess.AsMemberAsync(id, caller, ct);
        if (!loaded.IsSuccess)
            return OperationResult<TimeLog>.Fail(loaded.Error!.Value);

        var log = new TimeLog(Guid.NewGuid(), id, caller.Id, new Hours(request.Hours), request.Date ?? clock.Today, request.Note?.Trim());
        await timeLogs.AddAsync(log, ct);
        return OperationResult<TimeLog>.Ok(log);
    }
}
