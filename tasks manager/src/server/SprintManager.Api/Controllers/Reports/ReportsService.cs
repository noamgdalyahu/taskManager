using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.Reports;

/// <summary>Reports: sprint history, estimate vs actual, velocity trend.</summary>
public sealed class ReportsService(
    ISprintRepository sprints,
    ITaskRepository tasks,
    IUserRepository users,
    ITimeLogRepository timeLogs,
    ProjectAccess access)
{
    private static readonly WorkCalendar Calendar = WorkCalendar.Default;

    /// <summary>Sprint history and per-member accuracy for a project; every member may read it.</summary>
    public async Task<OperationResult<ReportsDto>> GetAsync(ProjectId projectId, CurrentUser caller, CancellationToken ct)
    {
        var found = await access.AsMemberAsync(projectId, caller, ct);
        if (!found.IsSuccess)
            return OperationResult<ReportsDto>.Fail(found.Error!.Value);

        var allSprints = (await sprints.GetForProjectAsync(projectId, ct)).Where(s => s.Status is not SprintStatus.Planned).OrderBy(s => s.StartDate).ToList();
        var allTasks = await tasks.GetForProjectAsync(projectId, ct);
        var logs = await timeLogs.GetForTasksAsync(allTasks.Select(t => t.Id).ToList(), ct);
        var logsByTask = logs.GroupBy(l => l.TaskId).ToDictionary(g => g.Key, g => g.Sum(l => l.Hours.Value));
        var team = (await users.GetManyAsync(found.Value!.MemberIds, ct)).ToDictionary(u => u.Id);

        var sprintReports = allSprints.Select(s => SprintReport(s, allTasks, logsByTask)).ToList();
        var memberReports = allTasks
            .Where(t => t.Status is WorkItemStatus.Done && t.AssigneeId is not null)
            .GroupBy(t => t.AssigneeId!.Value)
            .Select(g =>
            {
                var estimate = g.Sum(t => t.Estimate.Value);
                var logged = g.Sum(t => logsByTask.GetValueOrDefault(t.Id));
                return new MemberReportDto(g.Key.Value, team.TryGetValue(g.Key, out var u) ? u.Name : "(removed)", Round(estimate), Round(logged), Accuracy(estimate, logged), g.Count());
            })
            .OrderByDescending(m => m.CompletedEstimateHours)
            .ToList();

        var closed = sprintReports.Where(r => r.Status is SprintStatus.Closed).Select(r => r.VelocityHoursPerDay).ToList();
        return OperationResult<ReportsDto>.Ok(new ReportsDto(sprintReports, memberReports, closed.Count > 0 ? closed.Average() : null));
    }

    private static SprintReportDto SprintReport(Sprint s, IReadOnlyList<TaskItem> allTasks, IReadOnlyDictionary<TaskId, double> logsByTask)
    {
        var mine = allTasks.Where(t => t.SprintId == s.Id).ToList();
        var done = mine.Where(t => t.Status is WorkItemStatus.Done).ToList();
        var completed = done.Sum(t => t.Estimate.Value);
        var logged = done.Sum(t => logsByTask.GetValueOrDefault(t.Id));
        var days = Calendar.WorkingDaysBetween(s.StartDate, s.EndDate);
        return new SprintReportDto(s.Id.Value, s.Name, s.StartDate, s.EndDate, s.Status, Round(mine.Sum(t => t.Estimate.Value)), Round(completed), Round(logged),
            Accuracy(completed, logged), days > 0 ? Round(completed / days) : 0);
    }

    private static double Round(double value) => Math.Round(value, 2);

    /// <summary>Estimate ÷ actual as a percentage; 100 = perfect, below 100 = work took longer than estimated. 0 when nothing was logged.</summary>
    private static double Accuracy(double estimate, double logged) => logged > 0 ? Math.Round(estimate / logged * 100, 1) : 0;
}
