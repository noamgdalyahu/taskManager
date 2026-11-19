namespace SprintManager.Core.Domain;

/// <summary>Application role. Drives authorization on every endpoint.</summary>
public enum UserRole
{
    /// <summary>Sees own tasks, updates status, logs time.</summary>
    Member,
    /// <summary>Creates projects and sprints, plans, assigns, monitors.</summary>
    Manager,
}

/// <summary>
/// A registered user. The same id (<see cref="MemberId"/>) identifies the person everywhere:
/// as a login, as a project member, and as an assignee.
/// </summary>
/// <param name="Id">Identity.</param>
/// <param name="Email">Login, unique.</param>
/// <param name="PasswordHash">Salted, iterated hash. Never the password.</param>
/// <param name="Name">Display name.</param>
/// <param name="Role">Application role.</param>
/// <param name="Skills">Skill name to level; input to assignment.</param>
/// <param name="WeeklyCapacity">Hours available per week.</param>
/// <param name="CreatedAt">Registration time.</param>
public sealed record User(
    MemberId Id,
    EmailAddress Email,
    string PasswordHash,
    string Name,
    UserRole Role,
    IReadOnlyDictionary<string, SkillLevel> Skills,
    Hours WeeklyCapacity,
    DateTimeOffset CreatedAt)
{
    /// <summary>Projects this user onto the algorithmic member model for a sprint of the given length.</summary>
    public Member ToMember(int sprintWorkingDays, WorkCalendar calendar) =>
        new(Id, Name, Skills, new Hours(WeeklyCapacity.Value / 5.0 * sprintWorkingDays * (calendar.HoursPerDay / 8.0)));
}
