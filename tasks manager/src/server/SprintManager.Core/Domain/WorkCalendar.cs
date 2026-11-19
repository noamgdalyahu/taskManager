namespace SprintManager.Core.Domain;

/// <summary>Converts between effort hours and calendar dates, skipping weekends.</summary>
/// <param name="HoursPerDay">Productive hours in one working day.</param>
/// <param name="WeekendDays">Days that do not count as working days.</param>
public sealed record WorkCalendar(double HoursPerDay = 8, IReadOnlySet<DayOfWeek>? WeekendDays = null)
{
    /// <summary>Israeli default: Friday and Saturday off.</summary>
    public static readonly WorkCalendar Default = new(8, new HashSet<DayOfWeek> { DayOfWeek.Friday, DayOfWeek.Saturday });

    private IReadOnlySet<DayOfWeek> Weekend => WeekendDays ?? Default.WeekendDays!;

    /// <summary>True when work happens on this date.</summary>
    public bool IsWorkingDay(DateOnly date) => !Weekend.Contains(date.DayOfWeek);

    /// <summary>Number of working days in [from, to] inclusive; 0 when to &lt; from.</summary>
    public int WorkingDaysBetween(DateOnly from, DateOnly to)
    {
        var count = 0;
        for (var d = from; d <= to; d = d.AddDays(1))
        {
            if (IsWorkingDay(d))
                count++;
        }
        return count;
    }

    /// <summary>Total working hours in [from, to] inclusive.</summary>
    public Hours WorkingHoursBetween(DateOnly from, DateOnly to) => new(WorkingDaysBetween(from, to) * HoursPerDay);

    /// <summary>
    /// The date on which <paramref name="hours"/> of effort, started at the beginning of <paramref name="start"/>, is finished.
    /// Zero hours finish on the start day (or the next working day if start is a weekend).
    /// </summary>
    public DateOnly AddWorkingHours(DateOnly start, Hours hours)
    {
        var remaining = hours.Value;
        var day = start;
        while (!IsWorkingDay(day))
            day = day.AddDays(1);

        while (remaining > HoursPerDay)
        {
            remaining -= HoursPerDay;
            day = day.AddDays(1);
            while (!IsWorkingDay(day))
                day = day.AddDays(1);
        }
        return day;
    }
}
