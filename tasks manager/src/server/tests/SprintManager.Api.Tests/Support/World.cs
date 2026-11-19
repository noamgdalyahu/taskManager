using Microsoft.Extensions.Logging.Abstractions;
using SprintManager.Api.Controllers.Auth;
using SprintManager.Api.Controllers.SprintPlanning.Plans;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Controllers.Tasks;
using SprintManager.Api.Controllers.Tasks.Comments;
using SprintManager.Api.Controllers.Tasks.Events;
using SprintManager.Api.Controllers.Tasks.TimeLogs;
using SprintManager.Api.Controllers.Team;
using SprintManager.Api.Security;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Tests.Support;

/// <summary>
/// A small pre-built team and project wired to in-memory fakes and real services:
/// manager Mia (owner), members Dan and Eve, outsider Oz (not in the project), one planned sprint.
/// </summary>
public sealed class World
{
    public FakeClock Clock { get; } = new();
    public FakeUsers Users { get; } = new();
    public FakeProjects Projects { get; } = new();
    public FakeSprints Sprints { get; } = new();
    public FakeTasks Tasks { get; } = new();
    public FakeComments Comments { get; } = new();
    public FakeHistory History { get; } = new();
    public FakeTimeLogs TimeLogs { get; } = new();
    public FakeInvitations Invitations { get; } = new();
    public FakeJobs Jobs { get; } = new();
    public FakeQueue Queue { get; } = new();
    public FakeHasher Hasher { get; } = new();

    public User Mia { get; }
    public User Dan { get; }
    public User Eve { get; }
    public User Oz { get; }
    public Project Project { get; private set; }
    public Sprint Sprint { get; private set; }

    public CurrentUser AsMia => new(Mia.Id, UserRole.Manager);
    public CurrentUser AsDan => new(Dan.Id, UserRole.Member);
    public CurrentUser AsEve => new(Eve.Id, UserRole.Member);
    public CurrentUser AsOz => new(Oz.Id, UserRole.Member);
    public CurrentUser AsOzManager => new(Oz.Id, UserRole.Manager);

    public ProjectAccess ProjectAccess { get; }
    public TaskAccess TaskAccess { get; }
    public TaskChangePublisher Publisher { get; }

    public World()
    {
        Mia = AddUser("mia@t.com", "Mia", UserRole.Manager, ("C#", 3));
        Dan = AddUser("dan@t.com", "Dan", UserRole.Member, ("C#", 5), ("SQL", 4));
        Eve = AddUser("eve@t.com", "Eve", UserRole.Member, ("React", 5));
        Oz = AddUser("oz@t.com", "Oz", UserRole.Member);

        Project = new Project(ProjectId.New(), "Demo", "", Mia.Id, [Mia.Id, Dan.Id, Eve.Id], false, Clock.UtcNow);
        Projects.Items[Project.Id] = Project;
        Sprint = new Sprint(SprintId.New(), Project.Id, "S1", new DateOnly(2026, 11, 15), new DateOnly(2026, 11, 26), SprintStatus.Planned, Clock.UtcNow);
        Sprints.Items[Sprint.Id] = Sprint;

        ProjectAccess = new ProjectAccess(Projects);
        TaskAccess = new TaskAccess(Tasks, ProjectAccess);
        Publisher = new TaskChangePublisher([new HistoryRecorder(History)]);
    }

    public TaskService TaskService => new(Tasks, Sprints, Comments, History, TimeLogs, ProjectAccess, TaskAccess, Publisher, Clock);
    public CommentService CommentService => new(Comments, TaskAccess, Clock);
    public TimeLogService TimeLogService => new(TimeLogs, TaskAccess, Clock);
    public TeamService TeamService => new(Projects, Users, Invitations, ProjectAccess, Clock);
    public PlanningService PlanningService => new(Sprints, Projects, Tasks, Users, Jobs, Queue, Publisher, Clock, NullLogger<PlanningService>.Instance);

    public AuthService AuthService(JwtTokenService tokens) => new(Users, Hasher, tokens, Clock);

    public User AddUser(string email, string name, UserRole role, params (string, int)[] skills)
    {
        var user = new User(
            MemberId.New(), new EmailAddress(email), Hasher.Hash("Passw0rd!"), name, role,
            skills.ToDictionary(s => s.Item1, s => new SkillLevel(s.Item2), StringComparer.OrdinalIgnoreCase),
            new Hours(40), Clock.UtcNow);
        Users.Items[user.Id] = user;
        return user;
    }

    /// <summary>Adds a task straight into the fake store (bypasses the service, for arranging state).</summary>
    public TaskItem AddTask(string title, double hours = 8, WorkItemStatus status = WorkItemStatus.ToDo, MemberId? assignee = null,
        IReadOnlyList<TaskId>? dependsOn = null, bool inSprint = true, params string[] skills)
    {
        var task = new TaskItem(TaskId.New(), Project.Id, inSprint ? Sprint.Id : null, title, "", new Hours(hours), null, status, assignee,
            skills, dependsOn ?? [], Clock.UtcNow, Clock.UtcNow, status is WorkItemStatus.Done ? Clock.UtcNow : null);
        Tasks.Items[task.Id] = task;
        return task;
    }
}
