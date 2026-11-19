using SprintManager.Core.Assignment;
using SprintManager.Core.Domain;
using SprintManager.Core.Planning;

namespace SprintManager.Core.Tests.Planning;

public class SprintPlannerTests
{
    private static readonly DateOnly Sunday = new(2026, 11, 15);      // Sunday: working day in the default calendar
    private static readonly DateOnly TwoWeeksLater = new(2026, 11, 26); // Thursday: 10 working days total

    private static Member Dev(string name, double capacity = 80, params (string, int)[] skills) =>
        Member.Create(MemberId.New(), name, new Hours(capacity), skills.Length == 0 ? [("C#", 4)] : skills);

    private static SprintPlanRequest Request(IReadOnlyList<WorkItem> tasks, params Member[] members) =>
        new(tasks, members, Sunday, TwoWeeksLater);

    [Fact]
    public void EmptySprint_FeasibleAndEmpty()
    {
        var plan = new SprintPlanner().Plan(Request([], Dev("A")));

        Assert.True(plan.IsFeasible);
        Assert.Empty(plan.Tasks);
        Assert.Empty(plan.Warnings);
    }

    [Fact]
    public void Cycle_IsBlocking_NoTasksPlanned()
    {
        var a = TaskId.New();
        var b = TaskId.New();
        var tasks = new[]
        {
            new WorkItem(a, "A", new Hours(4), [b], ["C#"]),
            new WorkItem(b, "B", new Hours(4), [a], ["C#"]),
        };

        var plan = new SprintPlanner().Plan(Request(tasks, Dev("A")));

        Assert.False(plan.IsFeasible);
        Assert.Empty(plan.Tasks);
        var w = Assert.Single(plan.Warnings);
        Assert.Equal(PlanWarningKind.DependencyCycle, w.Kind);
        Assert.Equal(2, w.TaskIds.Count);
        Assert.Contains("A", w.Message);
    }

    [Fact]
    public void HappyPath_OrderTimingAssignmentAndNoWarnings()
    {
        var a = TaskId.New();
        var tasks = new[]
        {
            new WorkItem(TaskId.New(), "B", new Hours(8), [a], ["C#"]),
            new WorkItem(a, "A", new Hours(8), [], ["C#"]),
        };

        var plan = new SprintPlanner().Plan(Request(tasks, Dev("Ann"), Dev("Bob")));

        Assert.True(plan.IsFeasible);
        Assert.Empty(plan.Warnings);
        Assert.Equal(["A", "B"], plan.Tasks.Select(t => t.Task.Title));
        Assert.Equal(16, plan.CriticalPathLength.Value);
        Assert.Equal(Sunday, plan.Tasks[0].EarliestFinishDate);             // 8h = done within day 1
        Assert.Equal(Sunday.AddDays(1), plan.Tasks[1].EarliestFinishDate);  // 16h = done within day 2
        Assert.All(plan.Tasks, t => Assert.NotNull(t.Assignment.MemberId));
    }

    [Fact]
    public void CriticalChainLongerThanSprint_Warns()
    {
        // 10 working days × 8h = 80h sprint; chain of 90h sequential.
        var a = TaskId.New();
        var tasks = new[]
        {
            new WorkItem(a, "A", new Hours(45), [], ["C#"]),
            new WorkItem(TaskId.New(), "B", new Hours(45), [a], ["C#"]),
        };

        var plan = new SprintPlanner().Plan(Request(tasks, Dev("Ann", 200), Dev("Bob", 200)));

        Assert.True(plan.IsFeasible); // not blocking, but warned
        Assert.Contains(plan.Warnings, w => w.Kind == PlanWarningKind.ExceedsSprintLength);
    }

    [Fact]
    public void TotalEstimateAboveTeamCapacity_Warns()
    {
        var tasks = Enumerable.Range(0, 5).Select(i => new WorkItem(TaskId.New(), $"T{i}", new Hours(10), [], ["C#"])).ToList();

        var plan = new SprintPlanner().Plan(Request(tasks, Dev("Solo", 30)));

        Assert.Contains(plan.Warnings, w => w.Kind == PlanWarningKind.ExceedsTeamCapacity);
        Assert.Contains(plan.Warnings, w => w.Kind == PlanWarningKind.OverCapacity);
    }

    [Fact]
    public void DeadlineBeforeEarliestFinish_Warns()
    {
        var a = TaskId.New();
        var tasks = new[]
        {
            new WorkItem(a, "A", new Hours(24), [], ["C#"]),
            new WorkItem(TaskId.New(), "B", new Hours(8), [a], ["C#"], Deadline: Sunday.AddDays(1)),
        };

        var plan = new SprintPlanner().Plan(Request(tasks, Dev("Ann")));

        var w = Assert.Single(plan.Warnings, w => w.Kind == PlanWarningKind.DeadlineAtRisk);
        Assert.Equal(tasks[1].Id, w.TaskIds.Single());
    }

    [Fact]
    public void MissingSkill_SurfacesAsPlanWarning()
    {
        var tasks = new[] { new WorkItem(TaskId.New(), "DB", new Hours(4), [], ["SQL"]) };

        var plan = new SprintPlanner().Plan(Request(tasks, Dev("Frontend", 40, ("React", 5))));

        Assert.True(plan.IsFeasible);
        Assert.Contains(plan.Warnings, w => w.Kind == PlanWarningKind.NoEligibleMember);
        Assert.Null(plan.Tasks[0].Assignment.MemberId);
    }

    [Fact]
    public void StrategyIsInjectable()
    {
        var tasks = new[] { new WorkItem(TaskId.New(), "T", new Hours(4), [], ["C#"]) };

        var plan = new SprintPlanner(new GreedyAssignmentStrategy()).Plan(Request(tasks, Dev("A")));

        Assert.Equal("Greedy", plan.Assignment!.StrategyName);
    }

    [Fact]
    public void WorkCalendar_SkipsWeekends()
    {
        var cal = WorkCalendar.Default;
        var thursday = new DateOnly(2026, 11, 12);

        Assert.Equal(thursday, cal.AddWorkingHours(thursday, new Hours(8)));
        Assert.Equal(new DateOnly(2026, 11, 15), cal.AddWorkingHours(thursday, new Hours(9)));  // skips Fri, Sat
        Assert.Equal(5, cal.WorkingDaysBetween(new DateOnly(2026, 11, 15), new DateOnly(2026, 11, 21)));
        Assert.Equal(0, cal.WorkingDaysBetween(thursday, thursday.AddDays(-1)));
    }
}
