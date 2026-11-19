using SprintManager.Core.Domain;

namespace SprintManager.Core.Forecast;

/// <summary>Input of the burndown forecast.</summary>
/// <param name="SprintStart">First day.</param>
/// <param name="SprintEnd">Last day (inclusive).</param>
/// <param name="Today">Reference date.</param>
/// <param name="TotalHours">Sum of estimates of all sprint tasks.</param>
/// <param name="CompletionsByDate">Estimated hours that reached Done, per date (any order; dates outside the sprint are ignored).</param>
/// <param name="HistoricalHoursPerDay">Velocity from previous sprints, used until this sprint has its own data.</param>
/// <param name="Calendar">Working-day calendar.</param>
public sealed record BurndownRequest(
    DateOnly SprintStart,
    DateOnly SprintEnd,
    DateOnly Today,
    Hours TotalHours,
    IReadOnlyList<(DateOnly Date, Hours Hours)> CompletionsByDate,
    double? HistoricalHoursPerDay,
    WorkCalendar? Calendar = null);

/// <summary>One point of a burndown line.</summary>
/// <param name="Date">Day.</param>
/// <param name="RemainingHours">Hours left at the end of that day.</param>
public sealed record BurndownPoint(DateOnly Date, double RemainingHours);

/// <summary>Burndown lines and the completion forecast.</summary>
/// <param name="Ideal">Straight line from total to zero across the working days.</param>
/// <param name="Actual">Remaining hours per day up to today.</param>
/// <param name="Forecast">Projection from today at the chosen velocity, until zero or sprint end + overrun.</param>
/// <param name="RemainingHours">Hours left today.</param>
/// <param name="VelocityHoursPerDay">Pace used for the projection.</param>
/// <param name="VelocitySource">Where the pace came from.</param>
/// <param name="ForecastFinishDate">Day the remaining work hits zero at this pace; null when pace is zero.</param>
/// <param name="IsOnTrack">Forecast finish is on or before sprint end.</param>
public sealed record BurndownForecast(
    IReadOnlyList<BurndownPoint> Ideal,
    IReadOnlyList<BurndownPoint> Actual,
    IReadOnlyList<BurndownPoint> Forecast,
    double RemainingHours,
    double VelocityHoursPerDay,
    VelocitySource VelocitySource,
    DateOnly? ForecastFinishDate,
    bool IsOnTrack);

/// <summary>Which pace the forecast used.</summary>
public enum VelocitySource
{
    /// <summary>Observed in this sprint so far.</summary>
    ThisSprint,
    /// <summary>Average of previous sprints.</summary>
    History,
    /// <summary>No data at all; forecast is undefined.</summary>
    None,
}

/// <summary>
/// Burndown chart data plus a "will we finish on time?" projection.
/// </summary>
/// <remarks>
/// <list type="bullet">
/// <item><b>Ideal</b>: remaining drops by total ÷ workingDays each working day.</item>
/// <item><b>Actual</b>: remaining = total − cumulative completions, one point per day up to today.</item>
/// <item><b>Velocity</b>: this sprint's completed ÷ working days elapsed once at least one task is done and
/// a day has passed; otherwise history; otherwise none. Prefer in-sprint data because it reflects this team,
/// this scope, this month.</item>
/// <item><b>Forecast</b>: from today's remaining, subtract velocity per working day until zero. The day it reaches
/// zero is the finish date. Projection is capped at sprint end + 30 working days to keep the chart bounded.</item>
/// </list>
/// Linear extrapolation is deliberately simple: it is what managers already read off a burndown, and it is
/// explainable. Non-linear models would need more sprints of data than a student project has.
/// <para>Time: O(D + C) for D days and C completions.</para>
/// </remarks>
public static class BurndownForecaster
{
    private const int MaxOverrunWorkingDays = 30;

    /// <summary>Computes the burndown and forecast.</summary>
    public static BurndownForecast Forecast(BurndownRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        var calendar = request.Calendar ?? WorkCalendar.Default;
        var total = request.TotalHours.Value;

        var completedByDay = CompletedByDay(request);
        var ideal = IdealLine(request, calendar, total);
        var actual = ActualLine(request, completedByDay, total);
        var remaining = actual.Count > 0 ? actual[^1].RemainingHours : total;

        var (velocity, source) = ChooseVelocity(request, calendar, total - remaining);
        var forecast = ForecastLine(request, calendar, remaining, velocity);
        var finish = forecast.Count > 0 && forecast[^1].RemainingHours <= 1e-9 ? forecast[^1].Date : (DateOnly?)null;
        if (remaining <= 1e-9)
            finish = request.Today;

        return new BurndownForecast(ideal, actual, forecast, remaining, velocity, source, finish, finish is { } f && f <= request.SprintEnd);
    }

    private static Dictionary<DateOnly, double> CompletedByDay(BurndownRequest request)
    {
        var map = new Dictionary<DateOnly, double>();
        foreach (var (date, hours) in request.CompletionsByDate)
        {
            if (date < request.SprintStart)
                continue;
            map[date] = map.GetValueOrDefault(date) + hours.Value;
        }
        return map;
    }

    private static List<BurndownPoint> IdealLine(BurndownRequest request, WorkCalendar calendar, double total)
    {
        var workingDays = calendar.WorkingDaysBetween(request.SprintStart, request.SprintEnd);
        var perDay = workingDays > 0 ? total / workingDays : total;
        var points = new List<BurndownPoint>();
        var remaining = total;
        for (var d = request.SprintStart; d <= request.SprintEnd; d = d.AddDays(1))
        {
            if (calendar.IsWorkingDay(d))
                remaining = Math.Max(0, remaining - perDay);
            points.Add(new BurndownPoint(d, remaining));
        }
        return points;
    }

    private static List<BurndownPoint> ActualLine(BurndownRequest request, Dictionary<DateOnly, double> completedByDay, double total)
    {
        var points = new List<BurndownPoint>();
        var remaining = total;
        var last = request.Today < request.SprintStart ? request.SprintStart.AddDays(-1) : request.Today;
        for (var d = request.SprintStart; d <= last; d = d.AddDays(1))
        {
            remaining = Math.Max(0, remaining - completedByDay.GetValueOrDefault(d));
            points.Add(new BurndownPoint(d, remaining));
        }
        return points;
    }

    private static (double Velocity, VelocitySource Source) ChooseVelocity(BurndownRequest request, WorkCalendar calendar, double completed)
    {
        var elapsed = request.Today < request.SprintStart ? 0 : calendar.WorkingDaysBetween(request.SprintStart, request.Today);
        if (elapsed > 0 && completed > 0)
            return (completed / elapsed, VelocitySource.ThisSprint);
        if (request.HistoricalHoursPerDay is { } h && h > 0)
            return (h, VelocitySource.History);
        return (0, VelocitySource.None);
    }

    private static List<BurndownPoint> ForecastLine(BurndownRequest request, WorkCalendar calendar, double remaining, double velocity)
    {
        var points = new List<BurndownPoint>();
        if (velocity <= 0 || remaining <= 1e-9)
            return points;

        var limit = request.SprintEnd;
        for (var i = 0; i < MaxOverrunWorkingDays; i++)
            limit = NextWorkingDay(calendar, limit);

        var d = request.Today < request.SprintStart ? request.SprintStart : request.Today.AddDays(1);
        var left = remaining;
        while (d <= limit && left > 1e-9)
        {
            if (calendar.IsWorkingDay(d))
                left = Math.Max(0, left - velocity);
            points.Add(new BurndownPoint(d, left));
            d = d.AddDays(1);
        }
        return points;
    }

    private static DateOnly NextWorkingDay(WorkCalendar calendar, DateOnly from)
    {
        var d = from.AddDays(1);
        while (!calendar.IsWorkingDay(d))
            d = d.AddDays(1);
        return d;
    }
}
