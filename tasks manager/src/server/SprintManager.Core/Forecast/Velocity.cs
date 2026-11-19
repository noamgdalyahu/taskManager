using SprintManager.Core.Domain;

namespace SprintManager.Core.Forecast;

/// <summary>What a finished sprint tells us about the team's pace.</summary>
/// <param name="CompletedHours">Estimated hours of tasks that reached Done.</param>
/// <param name="WorkingDays">Working days the sprint lasted.</param>
public sealed record SprintThroughput(Hours CompletedHours, int WorkingDays)
{
    /// <summary>Hours completed per working day; 0 for an empty sprint.</summary>
    public double HoursPerDay => WorkingDays > 0 ? CompletedHours.Value / WorkingDays : 0;
}

/// <summary>Team velocity in hours of estimated work completed per working day.</summary>
public static class VelocityCalculator
{
    /// <summary>
    /// Average pace over the most recent <paramref name="window"/> sprints.
    /// A simple moving average: recent sprints predict the next one better than the whole history,
    /// and a short window reacts to team changes.
    /// </summary>
    /// <param name="history">Sprints, oldest first.</param>
    /// <param name="window">How many of the latest sprints to average (default 3).</param>
    /// <returns>Hours per working day, or null when there is no history.</returns>
    public static double? HoursPerDay(IReadOnlyList<SprintThroughput> history, int window = 3)
    {
        ArgumentNullException.ThrowIfNull(history);
        ArgumentOutOfRangeException.ThrowIfLessThan(window, 1);

        var recent = history.Skip(Math.Max(0, history.Count - window)).Where(s => s.WorkingDays > 0).ToList();
        return recent.Count == 0 ? null : recent.Average(s => s.HoursPerDay);
    }
}
