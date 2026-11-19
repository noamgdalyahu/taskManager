using SprintManager.Core.Assignment;
using SprintManager.Core.Domain;
using SprintManager.Core.Planning;
using SprintManager.Data.Serialization;

namespace SprintManager.Data.Tests;

public class PlanJsonTests
{
    private static SprintPlan SamplePlan()
    {
        var a = TaskId.New();
        var tasks = new[]
        {
            new WorkItem(a, "A", new Hours(8), [], ["C#"]),
            new WorkItem(TaskId.New(), "B", new Hours(16), [a], ["C#"], new DateOnly(2026, 12, 1)),
            new WorkItem(TaskId.New(), "Side", new Hours(2), [], ["C#"]),
        };
        var member = Member.Create(MemberId.New(), "Ann", new Hours(80), ("C#", 5));
        return new SprintPlanner().Plan(new SprintPlanRequest(tasks, [member], new DateOnly(2026, 11, 15), new DateOnly(2026, 11, 26)));
    }

    [Fact]
    public void RoundTrip_PreservesTheWholePlan()
    {
        var original = SamplePlan();
        Assert.True(original.CriticalPathLength.Value > 0);   // guard: the sample is meaningful

        var copy = PlanJson.Deserialize(PlanJson.Serialize(original));

        Assert.Equal(original.IsFeasible, copy.IsFeasible);
        Assert.Equal(original.CriticalPathLength, copy.CriticalPathLength);
        Assert.Equal(original.TotalEstimate, copy.TotalEstimate);
        Assert.Equal(original.TeamCapacity, copy.TeamCapacity);
        Assert.Equal(original.CriticalPath, copy.CriticalPath);
        Assert.Equal(original.Tasks.Count, copy.Tasks.Count);
        for (var i = 0; i < original.Tasks.Count; i++)
        {
            Assert.Equal(original.Tasks[i].Task.Id, copy.Tasks[i].Task.Id);
            Assert.Equal(original.Tasks[i].Timing, copy.Tasks[i].Timing);
            Assert.Equal(original.Tasks[i].EarliestFinishDate, copy.Tasks[i].EarliestFinishDate);
            Assert.Equal(original.Tasks[i].Assignment.MemberId, copy.Tasks[i].Assignment.MemberId);
        }
        Assert.Equal(original.Assignment!.LoadPerMember.OrderBy(kv => kv.Key.Value), copy.Assignment!.LoadPerMember.OrderBy(kv => kv.Key.Value));
        Assert.Equal(original.Warnings.Count, copy.Warnings.Count);
    }

    [Fact]
    public void SlackSurvives_SoCriticalFlagIsNotLost()
    {
        var copy = PlanJson.Deserialize(PlanJson.Serialize(SamplePlan()));

        var side = copy.Tasks.Single(t => t.Task.Title == "Side");
        Assert.False(side.Timing.IsCritical);
        Assert.True(side.Timing.Slack.Value > 0);
    }
}
