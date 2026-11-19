using SprintManager.Api.Controllers.Projects;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Tests.Support;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Tests;

public class WipLimitsTests
{
    private readonly World w = new();
    private static readonly CancellationToken Ct = CancellationToken.None;

    private ProjectService Service => new(w.Projects, w.ProjectAccess, w.Clock);

    [Fact]
    public async Task Manager_SetsLimits_AndTheyAreStored()
    {
        var result = await Service.SetWipLimitsAsync(w.Project.Id, new Dictionary<string, int> { ["InProgress"] = 3, ["InQA"] = 1 }, w.AsMia, Ct);

        Assert.True(result.IsSuccess);
        var stored = w.Projects.Items[w.Project.Id].WipLimits!;
        Assert.Equal(3, stored[WorkItemStatus.InProgress]);
        Assert.Equal(1, stored[WorkItemStatus.InQA]);
        Assert.False(stored.ContainsKey(WorkItemStatus.ToDo));      // not listed: unlimited
    }

    [Fact]
    public async Task SettingLimitsAgain_ReplacesThem_SoColumnsCanBeUnlimitedAgain()
    {
        await Service.SetWipLimitsAsync(w.Project.Id, new Dictionary<string, int> { ["InProgress"] = 3 }, w.AsMia, Ct);

        await Service.SetWipLimitsAsync(w.Project.Id, new Dictionary<string, int>(), w.AsMia, Ct);

        Assert.Empty(w.Projects.Items[w.Project.Id].WipLimits!);
    }

    [Fact]
    public async Task Member_CannotSetLimits_Outsider_SeesNothing()
    {
        var limits = new Dictionary<string, int> { ["InProgress"] = 3 };

        Assert.Equal(ErrorKind.Forbidden, (await Service.SetWipLimitsAsync(w.Project.Id, limits, w.AsDan, Ct)).Error!.Value.Kind);
        Assert.Equal(ErrorKind.NotFound, (await Service.SetWipLimitsAsync(w.Project.Id, limits, w.AsOzManager, Ct)).Error!.Value.Kind);
        Assert.Null(w.Projects.Items[w.Project.Id].WipLimits);
    }

    [Theory]
    [InlineData("Review", 3)]      // not a column
    [InlineData("1", 3)]           // a number that happens to parse as an enum value
    [InlineData("InProgress", 0)]  // a limit of zero would forbid the column; "no limit" is expressed by leaving it out
    [InlineData("InProgress", 100)]
    [InlineData("InProgress", -2)]
    public async Task InvalidLimits_AreRejected_AndNothingIsSaved(string column, int limit)
    {
        var result = await Service.SetWipLimitsAsync(w.Project.Id, new Dictionary<string, int> { [column] = limit }, w.AsMia, Ct);

        Assert.Equal(ErrorKind.Validation, result.Error!.Value.Kind);
        Assert.Null(w.Projects.Items[w.Project.Id].WipLimits);
    }
}
