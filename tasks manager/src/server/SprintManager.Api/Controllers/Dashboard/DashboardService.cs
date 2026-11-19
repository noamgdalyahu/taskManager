using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;
using SprintManager.Core.Forecast;
using SprintManager.Core.Graph;

namespace SprintManager.Api.Controllers.Dashboard;

/// <summary>Manager dashboard: progress, burndown forecast, workload and risks, computed by the Core algorithms.</summary>
public sealed class DashboardService(
    ISprintRepository sprints,
    ITaskRepository tasks,
    IUserRepository users,
    ProjectAccess access,
    IClock clock)
{
    private static readonly WorkCalendar Calendar = WorkCalendar.Default;

    /// <summary>Dashboard for one sprint; every member of the project may read it (decided by the user).</summary>
    public async Task<OperationResult<DashboardDto>> GetAsync(SprintId sprintId, CurrentUser caller, CancellationToken ct)
    {
        var sprint = await sprints.GetAsync(sprintId, ct);
        if (sprint is null)
            return OperationResult.NotFound<DashboardDto>("Sprint");
        var found = await access.AsMemberAsync(sprint.ProjectId, caller, ct);
        if (!found.IsSuccess)
            return found.Error!.Value.Kind == ErrorKind.NotFound ? OperationResult.NotFound<DashboardDto>("Sprint") : OperationResult<DashboardDto>.Fail(found.Error.Value);

        var project = found.Value!;
        var sprintTasks = await tasks.GetForSprintAsync(sprintId, ct);
        var team = await users.GetManyAsync(project.MemberIds, ct);
        var today = clock.Today;

        var total = sprintTasks.Sum(t => t.Estimate.Value);
        var completed = sprintTasks.Where(t => t.Status is WorkItemStatus.Done).Sum(t => t.Estimate.Value);

        var history = await HistoryAsync(project.Id, sprintId, ct);
        var burndown = BurndownForecaster.Forecast(new BurndownRequest(
            sprint.StartDate, sprint.EndDate, today, new Hours(total),
            sprintTasks.Where(t => t.CompletedAt is not null).Select(t => (DateOnly.FromDateTime(t.CompletedAt!.Value.LocalDateTime), t.Estimate)).ToList(),
            VelocityCalculator.HoursPerDay(history), Calendar));

        var days = Calendar.WorkingDaysBetween(sprint.StartDate, sprint.EndDate);
        var workload = team.Select(u => Workload(u, sprintTasks, days)).ToList();
        var (atRisk, criticalPath) = AtRisk(sprintTasks, sprint, today);

        return OperationResult<DashboardDto>.Ok(new DashboardDto(
            sprint.Id.Value, sprint.Name, sprint.Status, total, completed,
            total > 0 ? Math.Round(completed / total * 100, 1) : 0,
            today > sprint.EndDate ? 0 : Calendar.WorkingDaysBetween(today < sprint.StartDate ? sprint.StartDate : today, sprint.EndDate),
            burndown.ForecastFinishDate, burndown.IsOnTrack, burndown.VelocityHoursPerDay, burndown.VelocitySource.ToString(),
            Points(burndown.Ideal), Points(burndown.Actual), Points(burndown.Forecast), workload, atRisk, criticalPath));
    }

    private async Task<IReadOnlyList<SprintThroughput>> HistoryAsync(ProjectId projectId, SprintId exclude, CancellationToken ct)
    {
        var closed = (await sprints.GetForProjectAsync(projectId, ct)).Where(s => s.Status is SprintStatus.Closed && s.Id != exclude).OrderBy(s => s.StartDate).ToList();
        var all = await tasks.GetForProjectAsync(projectId, ct);
        return closed.Select(s => new SprintThroughput(
            new Hours(all.Where(t => t.SprintId == s.Id && t.Status is WorkItemStatus.Done).Sum(t => t.Estimate.Value)),
            Calendar.WorkingDaysBetween(s.StartDate, s.EndDate))).ToList();
    }

    private static MemberWorkloadDto Workload(User user, IReadOnlyList<TaskItem> sprintTasks, int sprintDays)
    {
        var mine = sprintTasks.Where(t => t.AssigneeId == user.Id).ToList();
        var assigned = mine.Sum(t => t.Estimate.Value);
        var capacity = user.ToMember(sprintDays, Calendar).Capacity.Value;
        return new MemberWorkloadDto(user.Id.Value, user.Name, assigned, capacity,
            mine.Where(t => t.Status is WorkItemStatus.Done).Sum(t => t.Estimate.Value),
            capacity > 0 ? Math.Round(assigned / capacity * 100, 1) : 0);
    }

    /// <summary>Critical-path analysis of the open work, then rules for what is "at risk".</summary>
    private static (IReadOnlyList<AtRiskTaskDto>, IReadOnlyList<Guid>) AtRisk(IReadOnlyList<TaskItem> sprintTasks, Sprint sprint, DateOnly today)
    {
        var open = sprintTasks.Where(t => t.Status is not WorkItemStatus.Done).ToList();
        if (open.Count == 0)
            return ([], []);

        var graph = DependencyGraph.Build(open.Select(t => t.ToWorkItem()).ToList());
        var sort = TopologicalSorter.Sort(graph);
        var critical = sort.IsAcyclic ? CriticalPathAnalyzer.Analyze(graph, sort.Order).CriticalPath.ToHashSet() : [];

        var risks = new List<AtRiskTaskDto>();
        foreach (var t in open)
        {
            var reasons = new List<string>();
            if (t.Deadline is { } due && due < today) reasons.Add("overdue");
            else if (t.Deadline is { } soon && soon <= today.AddDays(2)) reasons.Add("due within 2 days");
            if (t.AssigneeId is null) reasons.Add("unassigned");
            if (today > sprint.EndDate) reasons.Add("sprint ended");

            var isCritical = critical.Contains(t.Id);
            if (reasons.Count > 0 || (isCritical && t.Status is WorkItemStatus.ToDo && today >= sprint.StartDate))
            {
                if (isCritical && t.Status is WorkItemStatus.ToDo) reasons.Add("critical and not started");
                risks.Add(new AtRiskTaskDto(t.Id.Value, t.Title, t.AssigneeId?.Value, string.Join(", ", reasons), isCritical));
            }
        }
        return (risks.OrderByDescending(r => r.IsCritical).ThenBy(r => r.Title).ToList(), critical.Select(c => c.Value).ToList());
    }

    private static IReadOnlyList<BurndownPointDto> Points(IReadOnlyList<BurndownPoint> points) =>
        points.Select(p => new BurndownPointDto(p.Date, Math.Round(p.RemainingHours, 2))).ToList();
}
