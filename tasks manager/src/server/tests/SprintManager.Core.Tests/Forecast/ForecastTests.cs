using SprintManager.Core.Domain;
using SprintManager.Core.Forecast;

namespace SprintManager.Core.Tests.Forecast;

public class ForecastTests
{
    // Sunday 15/11 .. Thursday 26/11 = 10 working days in the default (Fri/Sat off) calendar.
    private static readonly DateOnly Start = new(2026, 11, 15);
    private static readonly DateOnly End = new(2026, 11, 26);

    private static BurndownRequest Req(DateOnly today, double total, double? history = null, params (DateOnly, double)[] done) =>
        new(Start, End, today, new Hours(total), done.Select(d => (d.Item1, new Hours(d.Item2))).ToList(), history);

    [Fact]
    public void Velocity_MovingAverageOfRecentSprints()
    {
        var history = new List<SprintThroughput>
        {
            new(new Hours(100), 10), // 10/day, outside window of 3
            new(new Hours(80), 10),  // 8
            new(new Hours(60), 10),  // 6
            new(new Hours(40), 10),  // 4
        };

        Assert.Equal(6, VelocityCalculator.HoursPerDay(history));
        Assert.Equal(4, VelocityCalculator.HoursPerDay(history, window: 1));
        Assert.Null(VelocityCalculator.HoursPerDay([]));
    }

    [Fact]
    public void IdealLine_LinearToZeroOnWorkingDays()
    {
        var f = BurndownForecaster.Forecast(Req(Start, 100));

        Assert.Equal(12, f.Ideal.Count);                       // 12 calendar days
        Assert.Equal(90, f.Ideal[0].RemainingHours, 6);        // Sunday: -10
        Assert.Equal(50, f.Ideal[4].RemainingHours, 6);        // Thursday 19th: 5 working days in
        Assert.Equal(50, f.Ideal[5].RemainingHours, 6);        // Friday: flat
        Assert.Equal(50, f.Ideal[6].RemainingHours, 6);        // Saturday: flat
        Assert.Equal(0, f.Ideal[^1].RemainingHours, 6);
    }

    [Fact]
    public void ActualLine_TracksCompletions()
    {
        var today = Start.AddDays(2);
        var f = BurndownForecaster.Forecast(Req(today, 100, null, (Start, 10), (Start.AddDays(1), 20)));

        Assert.Equal([90, 70, 70], f.Actual.Select(p => p.RemainingHours));
        Assert.Equal(70, f.RemainingHours);
    }

    [Fact]
    public void UsesThisSprintVelocity_WhenAvailable_AndForecastsOnTrack()
    {
        // 3 working days elapsed (Sun, Mon, Tue), 30h done => 10h/day; 70 left => 7 more working days: Wed..Thu 26 is exactly 7.
        var today = Start.AddDays(2);
        var f = BurndownForecaster.Forecast(Req(today, 100, 5, (Start, 10), (Start.AddDays(1), 10), (today, 10)));

        Assert.Equal(VelocitySource.ThisSprint, f.VelocitySource);
        Assert.Equal(10, f.VelocityHoursPerDay, 6);
        Assert.Equal(End, f.ForecastFinishDate);
        Assert.True(f.IsOnTrack);
    }

    [Fact]
    public void FallsBackToHistory_BeforeAnyCompletion_AndFlagsLate()
    {
        var f = BurndownForecaster.Forecast(Req(Start, 100, history: 5));

        Assert.Equal(VelocitySource.History, f.VelocitySource);
        Assert.NotNull(f.ForecastFinishDate);
        Assert.True(f.ForecastFinishDate > End);   // 100h at 5/day = 20 working days > 10
        Assert.False(f.IsOnTrack);
    }

    [Fact]
    public void NoData_NoForecast()
    {
        var f = BurndownForecaster.Forecast(Req(Start, 100));

        Assert.Equal(VelocitySource.None, f.VelocitySource);
        Assert.Empty(f.Forecast);
        Assert.Null(f.ForecastFinishDate);
        Assert.False(f.IsOnTrack);
    }

    [Fact]
    public void EverythingDone_FinishIsToday()
    {
        var today = Start.AddDays(3);
        var f = BurndownForecaster.Forecast(Req(today, 20, null, (Start, 20)));

        Assert.Equal(0, f.RemainingHours);
        Assert.Equal(today, f.ForecastFinishDate);
        Assert.True(f.IsOnTrack);
    }

    [Fact]
    public void ForecastLine_StartsAfterTodayAndSkipsWeekends()
    {
        var today = Start.AddDays(3); // Wednesday 18th
        var f = BurndownForecaster.Forecast(Req(today, 100, null, (Start, 40))); // 4 days elapsed, 10/day, 60 left

        Assert.Equal(today.AddDays(1), f.Forecast[0].Date);                 // Thursday
        Assert.Equal(50, f.Forecast[0].RemainingHours, 6);
        Assert.Equal(50, f.Forecast[1].RemainingHours, 6);                  // Friday flat
        Assert.Equal(50, f.Forecast[2].RemainingHours, 6);                  // Saturday flat
        Assert.Equal(40, f.Forecast[3].RemainingHours, 6);                  // Sunday
    }
}
