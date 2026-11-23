using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SprintManager.Api.Security;
using SprintManager.Core.Assignment;
using SprintManager.Core.Domain;
using SprintManager.Core.Planning;
using SprintManager.Data;
using SprintManager.Data.Documents;
using SprintManager.Data.Repositories;

// Demo data for the oral exam: a team, a closed sprint with history, and an active sprint in progress.
//
//   dotnet run --project tools/SprintManager.Seed                 create (refuses if the demo already exists)
//   dotnet run --project tools/SprintManager.Seed -- --reset      delete the previous demo, then create
//   dotnet run --project tools/SprintManager.Seed -- --reset --only   delete only
//   options: --mongo <connection string>  --db <database name>
//
// All demo accounts share one password and use the domain below, so --reset can find and remove exactly them.

const string Domain = "@demo.sprintmanager.local";
const string Password = "Demo1234!";

var arguments = args.ToList();
string Option(string name, string fallback) => arguments.IndexOf(name) is >= 0 and var i && i + 1 < arguments.Count ? arguments[i + 1] : fallback;

// The demo accounts share a public password, so the seed refuses to touch a database that is not on this machine
// unless the caller says so explicitly.
var mongoConnection = Option("--mongo", "mongodb://localhost:27017");
var isLocal = mongoConnection.Contains("localhost", StringComparison.OrdinalIgnoreCase) || mongoConnection.Contains("127.0.0.1");
if (!isLocal && !arguments.Contains("--allow-remote"))
{
    Console.Error.WriteLine("Refusing to seed a non-local database. Pass --allow-remote if you really mean it.");
    Environment.Exit(1);
}

var context = new MongoContext(Options.Create(new MongoOptions
{
    ConnectionString = mongoConnection,
    DatabaseName = Option("--db", "sprintmanager"),
}));
await new MongoIndexInitializer(context).StartAsync(CancellationToken.None);

var users = new MongoUserRepository(context);
var projects = new MongoProjectRepository(context);
var sprints = new MongoSprintRepository(context);
var tasks = new MongoTaskRepository(context);
var timeLogs = new MongoTimeLogRepository(context);
var comments = new MongoCommentRepository(context);
var history = new MongoHistoryRepository(context);
var hasher = new Pbkdf2PasswordHasher();

if (arguments.Contains("--reset"))
{
    var removed = await ResetAsync();
    Console.WriteLine($"Removed previous demo data ({removed} accounts).");
    if (arguments.Contains("--only"))
        return;
}

if (arguments.Contains("--fill-project"))
{
    await FillProjectAsync(Option("--fill-project", ""));
    return;
}

if (arguments.Contains("--migrate-types"))
{
    // Converts tasks stored with the earlier list of eleven types to the current eight. Safe to run twice.
    var renames = new Dictionary<string, string>
    {
        ["DesignTask"] = "UserStory", ["Documentation"] = "Ticket", ["TestingQa"] = "TestCase", ["Performance"] = "Task",
        ["Security"] = "Issue", ["Infrastructure"] = "Task", ["Migration"] = "Task", ["Accessibility"] = "Feature",
        ["Integration"] = "Feature", ["Regression"] = "Bug",
    };
    foreach (var (from, to) in renames)
    {
        var result = await context.Tasks.UpdateManyAsync(Builders<TaskDocument>.Filter.Eq(t => t.Type, from), Builders<TaskDocument>.Update.Set(t => t.Type, to));
        Console.WriteLine($"{from,-15} -> {to,-10} {result.ModifiedCount} tasks");
    }
    return;
}

if (arguments.Contains("--list-accounts"))
{
    // Read-only: who exists, and which projects each account can see.
    var allUsers = await context.Users.Find(Builders<UserDocument>.Filter.Empty).ToListAsync();
    var allProjects = await context.Projects.Find(Builders<ProjectDocument>.Filter.Empty).ToListAsync();
    foreach (var user in allUsers)
        Console.WriteLine($"{user.Email,-45} {user.Name,-12} {user.Role,-8} projects: {string.Join(", ", allProjects.Where(p => p.MemberIds.Contains(user.Id) || p.OwnerId == user.Id).Select(p => p.Name))}");
    return;
}

if (arguments.Contains("--add-typed-tasks"))
{
    await AddTypedTasksAsync(Option("--owner", "noa" + Domain), Option("--project", "Task Manager"));
    return;
}

if (arguments.Contains("--task-manager-project"))
{
    await SeedTaskManagerProjectAsync(Option("--owner", "noa" + Domain));
    return;
}

if (await users.GetByEmailAsync(new EmailAddress("noa" + Domain)) is not null)
{
    Console.WriteLine("Demo data already exists. Run with --reset to recreate it.");
    return;
}

await SeedAsync();

// ================================================================================================

async Task SeedAsync()
{
    var now = DateTimeOffset.UtcNow;
    var today = DateOnly.FromDateTime(DateTime.Now);
    var current = CurrentSprintStart(today);
    var previous = current.AddDays(-14);

    var team = await CreateTeamAsync(now);
    var noa = team["Noa"];
    var project = new Project(ProjectId.New(), "Team Sprint Manager (demo)", "Demo project seeded for the final presentation.",
        noa.Id, team.Values.Select(u => u.Id).ToList(), false, now.AddDays(-30),
        new Dictionary<WorkItemStatus, int> { [WorkItemStatus.InProgress] = 3, [WorkItemStatus.InQA] = 2 });   // WIP limits, so the board shows count/limit
    await projects.AddAsync(project);

    await SeedClosedSprintAsync(project, team, previous, now);
    await SeedActiveSprintAsync(project, team, current, today, now);

    Console.WriteLine();
    Console.WriteLine("Demo data created.");
    Console.WriteLine($"  Project : {project.Name}");
    Console.WriteLine($"  Sprints : Sprint 1 (closed, {previous:yyyy-MM-dd} .. {previous.AddDays(11):yyyy-MM-dd}), Sprint 2 (active, {current:yyyy-MM-dd} .. {current.AddDays(11):yyyy-MM-dd})");
    Console.WriteLine("  Note    : Sprint 2 contains two deliberate manual assignment mistakes (an SQL task given to the React developer, and a DevOps task given to a developer without DevOps)");
    Console.WriteLine("            so the plan comparison has something to find. Use 'Accept plan' to fix them.");
    Console.WriteLine($"  Password for every account: {Password}");
    foreach (var (name, user) in team)
        Console.WriteLine($"    {user.Role,-8} {user.Email.Value,-40} {name}");
}

async Task<Dictionary<string, User>> CreateTeamAsync(DateTimeOffset now)
{
    (string Name, UserRole Role, double Weekly, (string, int)[] Skills)[] people =
    [
        ("Noa", UserRole.Manager, 40, [("C#", 3)]),
        ("Avi", UserRole.Member, 40, [("C#", 5), ("SQL", 4)]),
        ("Dana", UserRole.Member, 40, [("React", 5), ("UX", 4)]),
        ("Eli", UserRole.Member, 32, [("DevOps", 5), ("C#", 3)]),
        ("Maya", UserRole.Member, 40, [("SQL", 5), ("C#", 4)]),
    ];

    var result = new Dictionary<string, User>();
    foreach (var (name, role, weekly, skills) in people)
    {
        var user = new User(MemberId.New(), new EmailAddress(name.ToLowerInvariant() + Domain), hasher.Hash(Password), name, role,
            skills.ToDictionary(s => s.Item1, s => new SkillLevel(s.Item2), StringComparer.OrdinalIgnoreCase), new Hours(weekly), now.AddDays(-40));
        await users.AddAsync(user);
        result[name] = user;
    }
    return result;
}

// ---- Fill an existing project: 12 members and 30 tasks (a tree-felling job) -------------------------
//   dotnet run --project tools/SprintManager.Seed -- --fill-project "cut the trees"
// The members get their own domain, so --reset (which only removes @demo accounts) never touches them.

async Task FillProjectAsync(string projectName)
{
    const string fillDomain = "@trees.sprintmanager.local";
    var document = await context.Projects.Find(p => p.Name == projectName).FirstOrDefaultAsync();
    if (document is null)
    {
        Console.WriteLine($"No project named '{projectName}'.");
        return;
    }
    if (await users.GetByEmailAsync(new EmailAddress("yossi" + fillDomain)) is not null)
    {
        Console.WriteLine("These members already exist; nothing was added.");
        return;
    }

    var project = (await projects.GetAsync(new ProjectId(document.Id)))!;
    var now = DateTimeOffset.UtcNow;
    var sprint = (await sprints.GetForProjectAsync(project.Id)).FirstOrDefault()
        ?? new Sprint(SprintId.New(), project.Id, "ספרינט 1", DateOnly.FromDateTime(DateTime.Now), DateOnly.FromDateTime(DateTime.Now).AddDays(11), SprintStatus.Planned, now);
    if ((await sprints.GetForProjectAsync(project.Id)).Count == 0)
        await sprints.AddAsync(sprint);

    (string Name, double Weekly, (string, int)[] Skills)[] crew =
    [
        ("יוסי", 40, [("כריתה", 5), ("מסור שרשרת", 4)]),
        ("רונן", 40, [("טיפוס", 5), ("בטיחות", 3)]),
        ("תמר", 40, [("בטיחות", 5), ("היתרים", 4)]),
        ("ליאור", 40, [("מסור שרשרת", 5), ("כריתה", 3)]),
        ("שירה", 32, [("לוגיסטיקה", 5), ("נהיגה", 3)]),
        ("גל", 40, [("נהיגה", 5), ("לוגיסטיקה", 3)]),
        ("עומר", 40, [("ריסוק", 5), ("נהיגה", 3)]),
        ("ניצן", 40, [("כרסום גדמים", 5), ("מסור שרשרת", 3)]),
        ("הילה", 32, [("היתרים", 5), ("תכנון", 4)]),
        ("עמית", 40, [("טיפוס", 4), ("כריתה", 4)]),
        ("דור", 40, [("תכנון", 5), ("לוגיסטיקה", 4)]),
        ("קרן", 40, [("בטיחות", 4), ("טיפוס", 3)]),
    ];

    // Logins stay in Latin letters; the names people see are Hebrew.
    var emailNames = new Dictionary<string, string> { ["יוסי"] = "yossi", ["רונן"] = "ronen", ["תמר"] = "tamar", ["ליאור"] = "lior", ["שירה"] = "shira", ["גל"] = "gal", ["עומר"] = "omer", ["ניצן"] = "nitzan", ["הילה"] = "hila", ["עמית"] = "amit", ["דור"] = "dor", ["קרן"] = "keren" };
    var members = new List<User>();
    foreach (var (name, weekly, skills) in crew)
    {
        var user = new User(MemberId.New(), new EmailAddress(emailNames[name] + fillDomain), hasher.Hash(Password), name, UserRole.Member,
            skills.ToDictionary(s => s.Item1, s => new SkillLevel(s.Item2), StringComparer.OrdinalIgnoreCase), new Hours(weekly), now);
        await users.AddAsync(user);
        members.Add(user);
    }
    await projects.UpdateAsync(project with { MemberIds = [.. project.MemberIds, .. members.Select(m => m.Id)] });

    // key, title, hours, skills, keys it depends on (always defined earlier in this list, so the graph has no cycle)
    (string Key, string Title, double Hours, string[] Skills, string[] After)[] work =
    [
        ("survey", "סקר השטח וסימון כל עץ", 8, ["תכנון"], []),
        ("permit", "הגשת בקשה להיתר כריתה מהעירייה", 6, ["היתרים"], ["survey"]),
        ("protected", "בדיקת רשימת המינים המוגנים", 4, ["היתרים"], ["survey"]),
        ("nests", "בדיקת קינים נסתרים לפני הכריתה", 4, ["טיפוס"], ["protected"]),
        ("neighbours", "עדכון השכנים וחברות התשתיות", 3, ["לוגיסטיקה"], ["survey"]),
        ("safetyplan", "כתיבת תוכנית הבטיחות", 8, ["בטיחות"], ["survey"]),
        ("powerlines", "בדיקת קווי החשמל ליד העצים", 6, ["בטיחות"], ["survey"]),
        ("rent", "שכירת מרסקים ומשאיות", 5, ["לוגיסטיקה"], ["permit"]),
        ("service", "טיפול במסורי השרשרת ובציוד", 6, ["מסור שרשרת"], []),
        ("briefing", "תדריך בטיחות לצוות", 4, ["בטיחות"], ["safetyplan"]),
        ("zone", "הקמת אזור מגודר", 5, ["בטיחות"], ["safetyplan", "neighbours", "powerlines"]),
        ("oaks", "כריתת האלונים בשורה הצפונית", 12, ["כריתה", "מסור שרשרת"], ["permit", "zone", "service", "nests"]),
        ("rig", "טיפוס וקשירה של האורן הגדול", 10, ["טיפוס", "בטיחות"], ["zone", "briefing"]),
        ("pine", "פירוק האורן הגדול מלמעלה", 12, ["טיפוס", "מסור שרשרת"], ["rig"]),
        ("cypress", "כריתת הברושים לאורך הגדר המזרחית", 10, ["כריתה"], ["permit", "zone"]),
        ("inspect", "ביקורת בטיחות באמצע העבודה", 3, ["בטיחות"], ["oaks"]),
        ("limb", "גיזום הענפים מהגזעים שנפלו", 8, ["מסור שרשרת"], ["oaks"]),
        ("logs", "חיתוך הגזעים לבולי עץ", 8, ["מסור שרשרת"], ["limb"]),
        ("chipnorth", "ריסוק הענפים מהשורה הצפונית", 6, ["ריסוק"], ["limb"]),
        ("chippine", "ריסוק הענפים מהאורן", 6, ["ריסוק"], ["pine"]),
        ("sort", "מיון העץ: עצי הסקה, קורות ופסולת", 5, ["לוגיסטיקה"], ["logs"]),
        ("haullogs", "הובלת בולי העץ לחצר", 8, ["נהיגה", "לוגיסטיקה"], ["logs", "rent"]),
        ("haulchips", "הובלת שבבי העץ לאתר הקומפוסט", 6, ["נהיגה"], ["chipnorth", "chippine", "rent"]),
        ("stumproad", "כרסום הגדמים ליד הכביש", 8, ["כרסום גדמים"], ["oaks", "cypress"]),
        ("stumpfence", "כרסום הגדמים ליד הגדר", 6, ["כרסום גדמים"], ["cypress"]),
        ("fill", "מילוי ויישור בורות הגדמים", 5, ["לוגיסטיקה"], ["stumproad", "stumpfence"]),
        ("incident", "תיעוד אירועים ואירועי כמעט-ונפגע", 3, ["בטיחות"], ["inspect"]),
        ("photos", "צילום השטח המפונה עבור העירייה", 3, ["תכנון"], ["fill"]),
        ("return", "החזרת הציוד השכור", 4, ["לוגיסטיקה"], ["haulchips", "haullogs"]),
        ("signoff", "סיור אחרון בשטח ואישור סיום", 4, ["תכנון", "בטיחות"], ["fill", "photos", "return"]),
    ];

    var by = project.OwnerId;
    var ids = new Dictionary<string, TaskId>();
    foreach (var (key, title, hours, skills, after) in work)
    {
        var task = new TaskItem(TaskId.New(), project.Id, sprint.Id, title, "", new Hours(hours), null, WorkItemStatus.ToDo, null,
            skills, after.Select(a => ids[a]).ToList(), now, now, null);
        ids[key] = task.Id;
        await tasks.AddAsync(task);
        await history.AddManyAsync([new HistoryEntry(Guid.NewGuid(), task.Id, by, "created", null, task.Title, now)]);
    }

    Console.WriteLine($"Added {members.Count} members and {work.Length} tasks ({work.Sum(w => w.Hours)}h) to '{project.Name}', in {sprint.Name}. All tasks are unassigned: run the planner.");
    Console.WriteLine($"Password for the new accounts: {Password}");
    foreach (var member in members)
        Console.WriteLine($"  {member.Email.Value,-36} {member.Name}");
}

// ---- Sprint 1: finished, gives velocity and report history ---------------------------------------

async Task SeedClosedSprintAsync(Project project, Dictionary<string, User> team, DateOnly start, DateTimeOffset now)
{
    var sprint = new Sprint(SprintId.New(), project.Id, "Sprint 1", start, start.AddDays(11), SprintStatus.Closed, At(start.AddDays(-5)));
    await sprints.AddAsync(sprint);

    // title, hours, skills, who did it, day offset when finished, actual hours logged
    (string, double, string[], string, int, double)[] work =
    [
        ("Project kickoff and requirements", 4, [], "Noa", 0, 5),
        ("Repository and environments", 6, ["DevOps"], "Eli", 1, 7),
        ("Initial data model", 8, ["SQL"], "Maya", 2, 9),
        ("User accounts API", 10, ["C#"], "Avi", 4, 11),
        ("Style guide and components", 8, ["React"], "Dana", 5, 7.5),
        ("Sprint planning mockups", 6, ["React", "UX"], "Dana", 7, 6),
        ("Logging and health checks", 6, ["C#", "DevOps"], "Eli", 8, 8),
        ("Seed test data", 4, ["SQL"], "Maya", 9, 3.5),
    ];

    foreach (var (title, hours, skills, who, dayOffset, actual) in work)
    {
        var finished = At(start.AddDays(WorkingOffset(dayOffset)), 16);
        var task = Task(project, sprint, title, hours, skills, [], WorkItemStatus.Done, team[who], At(start.AddDays(-4)), finished);
        await tasks.AddAsync(task);
        await history.AddManyAsync(CreationHistory(task, team["Noa"]));
        await timeLogs.AddAsync(new TimeLog(Guid.NewGuid(), task.Id, team[who].Id, new Hours(actual), start.AddDays(WorkingOffset(dayOffset)), null));
    }
    Console.WriteLine($"Sprint 1: {work.Length} tasks done, {work.Sum(w => w.Item2)}h estimated.");
}

// ---- Sprint 2: active, planned by the real planner --------------------------------------------------

async Task SeedActiveSprintAsync(Project project, Dictionary<string, User> team, DateOnly start, DateOnly today, DateTimeOffset now)
{
    var sprint = new Sprint(SprintId.New(), project.Id, "Sprint 2", start, start.AddDays(11), SprintStatus.Active, At(start.AddDays(-4)));
    await sprints.AddAsync(sprint);

    var created = At(start.AddDays(-3));
    var ids = new Dictionary<string, TaskId>();
    TaskItem Make(string key, string title, double hours, string[] skills, string[] deps, WorkItemStatus status, string? who = null, DateOnly? deadline = null, DateTimeOffset? finished = null)
    {
        var task = Task(project, sprint, title, hours, skills, deps.Select(d => ids[d]).ToList(), status, who is null ? null : team[who], created, finished) with { Deadline = deadline };
        ids[key] = task.Id;
        return task;
    }

    // The first working days are already done, with their completion dates spread over the sprint so far.
    var plan = new List<TaskItem>
    {
        Make("db", "Design database schema", 8, ["SQL"], [], WorkItemStatus.Done, "Maya", finished: At(start, 15)),
        Make("ci", "Set up CI pipeline", 6, ["DevOps"], [], WorkItemStatus.Done, "Eli", finished: At(start.AddDays(1), 14)),
        Make("auth", "Authentication API", 12, ["C#"], ["db"], WorkItemStatus.Done, "Avi", finished: At(start.AddDays(2), 16)),
        Make("login", "Login screen", 8, ["React"], ["auth"], WorkItemStatus.Done, "Dana", finished: At(start.AddDays(2), 17)),
        Make("proj", "Project CRUD endpoints", 10, ["C#"], ["db"], WorkItemStatus.InProgress, "Avi"),
        Make("docker", "Dockerize services", 6, ["DevOps"], ["ci"], WorkItemStatus.InProgress, "Eli"),
        Make("projui", "Projects list page", 8, ["React"], ["proj"], WorkItemStatus.ToDo),
        Make("backlog", "Task backlog API", 12, ["C#", "SQL"], ["db"], WorkItemStatus.ToDo),
        Make("kanban", "Kanban board UI", 16, ["React"], ["backlog"], WorkItemStatus.ToDo, deadline: today.AddDays(5)),
        Make("reports", "Report queries", 8, ["SQL"], ["backlog"], WorkItemStatus.ToDo),
        Make("staging", "Deploy to staging", 6, ["DevOps"], ["docker", "proj"], WorkItemStatus.ToDo),
        Make("security", "Security review", 8, ["C#"], [], WorkItemStatus.InQA),
        Make("guide", "Write user guide", 6, [], [], WorkItemStatus.ToDo, deadline: today.AddDays(-1)),   // overdue on purpose: shows up as at risk
        Make("perf", "Performance tests", 8, ["C#", "DevOps"], ["backlog"], WorkItemStatus.ToDo),
    };

    // Let the real planner assign everything that is not finished or already started.
    var open = plan.Where(t => t.AssigneeId is null).ToList();
    var calendar = WorkCalendar.Default;
    var days = calendar.WorkingDaysBetween(sprint.StartDate, sprint.EndDate);
    var members = team.Values.Select(u => u.ToMember(days, calendar)).ToList();
    var request = new SprintPlanRequest(plan.Where(t => t.Status is not WorkItemStatus.Done).Select(t => t.ToWorkItem()).ToList(), members, sprint.StartDate, sprint.EndDate, calendar);
    var result = new SprintPlanner(new HungarianAssignmentStrategy()).Plan(request);
    var suggestions = result.Tasks.ToDictionary(p => p.Task.Id, p => p.Assignment.MemberId);
    for (var i = 0; i < plan.Count; i++)
    {
        if (plan[i].AssigneeId is null && suggestions.TryGetValue(plan[i].Id, out var who) && who is not null)
            plan[i] = plan[i] with { AssigneeId = who };
    }

    // Two deliberate manual mistakes, so the "compare with manual assignment" screen has something to find:
    //  - SQL work handed to the React specialist (a skill mismatch)
    //  - a DevOps task handed to a developer who has no DevOps skill (a second skill mismatch)
    var dana = team["Dana"];
    var piled = team["Avi"];
    plan[plan.FindIndex(t => t.Id == ids["reports"])] = plan.Single(t => t.Id == ids["reports"]) with { AssigneeId = dana.Id };
    plan[plan.FindIndex(t => t.Id == ids["perf"])] = plan.Single(t => t.Id == ids["perf"]) with { AssigneeId = piled.Id };

    foreach (var task in plan)
    {
        await tasks.AddAsync(task);
        await history.AddManyAsync(CreationHistory(task, team["Noa"]));
        if (task.Status is WorkItemStatus.Done)
        {
            var date = DateOnly.FromDateTime(task.CompletedAt!.Value.LocalDateTime);
            await timeLogs.AddAsync(new TimeLog(Guid.NewGuid(), task.Id, task.AssigneeId!.Value, new Hours(task.Estimate.Value * 1.15), date, null));
        }
        else if (task.Status is WorkItemStatus.InProgress)
        {
            await timeLogs.AddAsync(new TimeLog(Guid.NewGuid(), task.Id, task.AssigneeId!.Value, new Hours(task.Estimate.Value * 0.4), today.AddDays(-1), "first half done"));
        }
    }

    var avi = team["Avi"];
    var blocked = plan.Single(t => t.Id == ids["security"]);
    await comments.AddAsync(new Comment(Guid.NewGuid(), blocked.Id, team["Noa"].Id, "Waiting for the QA environment to be free.", At(today.AddDays(-1), 11)));
    await comments.AddAsync(new Comment(Guid.NewGuid(), ids["proj"], avi.Id, "Endpoints done, still writing tests.", At(today, 9)));

    Console.WriteLine($"Sprint 2: {plan.Count} tasks ({plan.Count(t => t.Status is WorkItemStatus.Done)} done, {plan.Count(t => t.Status is WorkItemStatus.InProgress)} in progress, {plan.Count(t => t.Status is WorkItemStatus.InQA)} in QA), "
        + $"critical path {result.CriticalPathLength}.");
}

// ---- The "Task Manager" project: a programmers + QA team, typed tasks --------------------------------
//   dotnet run --project tools/SprintManager.Seed -- --task-manager-project [--owner you@example.com]
// Only adds data (never resets). The owner must already exist; the seven team members get their own domain.
// Note: a project owned by a @demo account is removed by --reset together with the demo data.

async Task SeedTaskManagerProjectAsync(string ownerEmail)
{
    const string teamDomain = "@taskmanager.sprintmanager.local";
    var owner = await users.GetByEmailAsync(new EmailAddress(ownerEmail));
    if (owner is null)
    {
        Console.WriteLine($"No account '{ownerEmail}'. Pass an existing account with --owner <email>.");
        return;
    }
    if (await users.GetByEmailAsync(new EmailAddress("omer" + teamDomain)) is not null
        || await context.Projects.Find(p => p.Name == "Task Manager" && p.OwnerId == owner.Id.Value).AnyAsync())
    {
        Console.WriteLine("The Task Manager project already exists; nothing was added.");
        return;
    }

    var now = DateTimeOffset.UtcNow;
    var today = DateOnly.FromDateTime(DateTime.Now);
    var start = CurrentSprintStart(today);

    (string Name, string Group)[] people =
    [
        ("Omer", "Programmer"), ("Lior", "Programmer"), ("Tamar", "Programmer"), ("Yuval", "Programmer"), ("Gal", "Programmer"),
        ("Shira", "QA"), ("Ido", "QA"),
    ];
    var team = new Dictionary<string, User>();
    foreach (var (name, _) in people)
    {
        var user = new User(MemberId.New(), new EmailAddress(name.ToLowerInvariant() + teamDomain), hasher.Hash(Password), name, UserRole.Member,
            new Dictionary<string, SkillLevel>(StringComparer.OrdinalIgnoreCase), new Hours(40), now.AddDays(-20));
        await users.AddAsync(user);
        team[name] = user;
    }

    var project = new Project(ProjectId.New(), "Task Manager", "The task manager itself: built and tested by the programmers and the QA team.",
        owner.Id, [owner.Id, .. team.Values.Select(u => u.Id)], false, now.AddDays(-14),
        new Dictionary<WorkItemStatus, int> { [WorkItemStatus.InProgress] = 4, [WorkItemStatus.InQA] = 3 });
    await projects.AddAsync(project);

    var sprint = new Sprint(SprintId.New(), project.Id, "Sprint 1", start, start.AddDays(11), SprintStatus.Active, At(start.AddDays(-4)));
    await sprints.AddAsync(sprint);

    var created = At(start.AddDays(-3));
    var ids = new Dictionary<string, TaskId>();
    TaskItem Make(string key, TaskType type, string title, double hours, WorkItemStatus status, string? who, string[]? after = null, int? doneDay = null, int? deadlineIn = null, bool inSprint = true)
    {
        var finished = doneDay is { } d ? At(start.AddDays(WorkingOffset(d)), 16) : (DateTimeOffset?)null;
        var task = new TaskItem(TaskId.New(), project.Id, inSprint ? sprint.Id : null, title, "", new Hours(hours), deadlineIn is { } days ? today.AddDays(days) : null,
            status, who is null ? null : team.GetValueOrDefault(who)?.Id ?? owner.Id, [], (after ?? []).Select(a => ids[a]).ToList(), created, finished ?? created,
            status is WorkItemStatus.Done ? finished : null, type);
        ids[key] = task.Id;
        return task;
    }

    var plan = new List<TaskItem>
    {
        Make("epic", TaskType.Epic, "Task Manager v1 release", 4, WorkItemStatus.InProgress, "Noa"),
        Make("schema", TaskType.Task, "Migrate task storage to the new schema", 8, WorkItemStatus.Done, "Omer", doneDay: 0),
        Make("mockups", TaskType.UserStory, "Design the sprint board mockups", 8, WorkItemStatus.Done, "Tamar", doneDay: 1),
        Make("ci", TaskType.Task, "CI pipeline with build and test stages", 6, WorkItemStatus.Done, "Gal", doneDay: 1),
        Make("testplan", TaskType.TestCase, "Test plan for the sprint board", 6, WorkItemStatus.Done, "Shira", doneDay: 2),
        Make("jwt", TaskType.Issue, "Harden JWT login and role checks", 10, WorkItemStatus.Done, "Lior", ["schema"], doneDay: 2),
        Make("boardui", TaskType.Feature, "Connect the board UI to the sprint API", 12, WorkItemStatus.InProgress, "Tamar", ["mockups"]),
        Make("docker", TaskType.Task, "Dockerize the API and the client", 6, WorkItemStatus.InProgress, "Gal", ["ci"]),
        Make("jumpback", TaskType.Bug, "Fix: a moved card jumps back after refresh", 4, WorkItemStatus.InProgress, "Omer"),
        Make("totals", TaskType.Bug, "Fix: wrong total hours after filtering", 3, WorkItemStatus.InQA, "Yuval"),
        Make("authqa", TaskType.TestCase, "Regression suite for login and roles", 8, WorkItemStatus.InQA, "Shira", ["jwt"]),
        Make("dnd", TaskType.Feature, "Drag and drop between columns", 8, WorkItemStatus.ToDo, "Yuval", ["boardui"]),
        Make("a11y", TaskType.Feature, "Keyboard and screen reader support on the board", 8, WorkItemStatus.ToDo, "Yuval", ["boardui"]),
        Make("perf", TaskType.Task, "Make the board load fast with 500 tasks", 10, WorkItemStatus.ToDo, "Omer", ["boardui"], deadlineIn: 6),
        Make("staging", TaskType.Task, "Staging deployment", 6, WorkItemStatus.ToDo, "Gal", ["docker"]),
        Make("mail", TaskType.Feature, "Connect the email notifications provider", 8, WorkItemStatus.ToDo, "Lior"),
        Make("apidocs", TaskType.Ticket, "Write the API reference", 6, WorkItemStatus.ToDo, "Lior"),
        Make("guide", TaskType.Ticket, "User guide for managers and members", 6, WorkItemStatus.ToDo, "Tamar", deadlineIn: 4),
        Make("dndqa", TaskType.TestCase, "Exploratory testing of drag and drop", 6, WorkItemStatus.ToDo, "Ido", ["dnd"]),
        Make("browsers", TaskType.TestCase, "Cross-browser checks: Chrome, Firefox, Safari", 6, WorkItemStatus.ToDo, "Ido", ["boardui"]),
        Make("load", TaskType.Task, "Load test the API", 8, WorkItemStatus.ToDo, "Ido", ["perf"]),
        Make("pentest", TaskType.Issue, "Security test of the public endpoints", 8, WorkItemStatus.ToDo, "Shira", ["jwt"]),
        // Backlog: not planned into a sprint yet.
        Make("mobile", TaskType.Epic, "Mobile app", 8, WorkItemStatus.ToDo, null, inSprint: false),
        Make("comments", TaskType.Task, "Move comments to their own collection", 6, WorkItemStatus.ToDo, null, inSprint: false),
        Make("contrast", TaskType.Feature, "Colour contrast audit of every screen", 4, WorkItemStatus.ToDo, null, inSprint: false),
        Make("slack", TaskType.Feature, "Slack integration for sprint updates", 10, WorkItemStatus.ToDo, null, inSprint: false),
        Make("budget", TaskType.Task, "Page load budget enforced in CI", 4, WorkItemStatus.ToDo, null, inSprint: false),
    };

    foreach (var task in plan)
    {
        await tasks.AddAsync(task);
        await history.AddManyAsync(CreationHistory(task, owner));
        if (task.AssigneeId is not { } assignee)
            continue;
        if (task.Status is WorkItemStatus.Done)
            await timeLogs.AddAsync(new TimeLog(Guid.NewGuid(), task.Id, assignee, new Hours(task.Estimate.Value * 1.1), DateOnly.FromDateTime(task.CompletedAt!.Value.LocalDateTime), null));
        else if (task.Status is WorkItemStatus.InProgress or WorkItemStatus.InQA)
            await timeLogs.AddAsync(new TimeLog(Guid.NewGuid(), task.Id, assignee, new Hours(task.Estimate.Value * 0.5), today.AddDays(-1), "work so far"));
    }
    await comments.AddAsync(new Comment(Guid.NewGuid(), ids["totals"], team["Shira"].Id, "Verified on Chrome, checking the filtered view once more.", At(today, 10)));
    await comments.AddAsync(new Comment(Guid.NewGuid(), ids["jumpback"], team["Omer"].Id, "Reproduced: the optimistic update is overwritten by a stale response.", At(today, 9)));

    Console.WriteLine($"Project 'Task Manager' created: owner {owner.Email.Value}, {team.Count} members (5 programmers, 2 QA).");
    Console.WriteLine($"  Sprint 1 (active, {start:yyyy-MM-dd} .. {start.AddDays(11):yyyy-MM-dd}): {plan.Count(t => t.SprintId is not null)} tasks, backlog: {plan.Count(t => t.SprintId is null)} tasks.");
    Console.WriteLine($"  Password for every new account: {Password}");
    foreach (var (name, group) in people)
        Console.WriteLine($"    {group,-10} {team[name].Email.Value}");
}

// ---- More tasks for a project: three for every task type ---------------------------------------------
//   dotnet run --project tools/SprintManager.Seed -- --add-typed-tasks --owner you@example.com --project "taskManager"
// The programmers and QA accounts are added to the project as members first. See --list-accounts for the names.
// Only adds data. A task whose title already exists in the project is skipped, so running it twice adds nothing.
// Statuses stay inside the work in progress limits (In progress 4, In QA 3) so the board does not turn red.

async Task AddTypedTasksAsync(string ownerEmail, string projectName)
{
    const string teamDomain = "@taskmanager.sprintmanager.local";
    var owner = await users.GetByEmailAsync(new EmailAddress(ownerEmail));
    var document = owner is null ? null : await context.Projects.Find(p => p.Name == projectName && p.OwnerId == owner.Id.Value).FirstOrDefaultAsync();
    if (owner is null || document is null)
    {
        Console.WriteLine($"No '{projectName}' project owned by '{ownerEmail}'. Check the names with --list-accounts.");
        return;
    }

    var project = (await projects.GetAsync(new ProjectId(document.Id)))!;

    // The programmers and QA accounts do the work; make sure they are members of this project.
    var team = new Dictionary<string, User>();
    foreach (var name in new[] { "Omer", "Lior", "Tamar", "Yuval", "Gal", "Shira", "Ido" })
        if (await users.GetByEmailAsync(new EmailAddress(name.ToLowerInvariant() + teamDomain)) is { } member)
            team[name] = member;
    var missing = team.Values.Where(u => !project.MemberIds.Contains(u.Id)).ToList();
    if (missing.Count > 0)
    {
        project = project with { MemberIds = [.. project.MemberIds, .. missing.Select(u => u.Id)] };
        await projects.UpdateAsync(project);
        Console.WriteLine($"Added {missing.Count} members to '{project.Name}': {string.Join(", ", missing.Select(u => u.Name))}.");
    }

    // The sprint the tasks go into: the active one, else one being planned, else a new "Sprint 1" that starts now.
    var projectSprints = await sprints.GetForProjectAsync(project.Id);
    var sprint = projectSprints.FirstOrDefault(s => s.Status == SprintStatus.Active) ?? projectSprints.FirstOrDefault(s => s.Status == SprintStatus.Planned);
    if (sprint is null)
    {
        var begin = CurrentSprintStart(DateOnly.FromDateTime(DateTime.Now));
        sprint = new Sprint(SprintId.New(), project.Id, "Sprint 1", begin, begin.AddDays(11), SprintStatus.Active, At(begin.AddDays(-2)));
        await sprints.AddAsync(sprint);
        Console.WriteLine($"Created {sprint.Name} ({sprint.StartDate:yyyy-MM-dd} .. {sprint.EndDate:yyyy-MM-dd}).");
    }

    var existing = await tasks.GetForProjectAsync(project.Id);
    var known = existing.Select(t => t.Title).ToHashSet(StringComparer.OrdinalIgnoreCase);
    var byTitle = existing.ToDictionary(t => t.Title, t => t.Id, StringComparer.OrdinalIgnoreCase);

    var today = DateOnly.FromDateTime(DateTime.Now);
    var start = sprint.StartDate;
    var created = At(start.AddDays(-2));
    var added = new List<TaskItem>();

    void Add(TaskType type, string title, double hours, WorkItemStatus status, string? who, string? after = null, int? doneDay = null, bool inSprint = true)
    {
        if (known.Contains(title))
            return;
        var finished = doneDay is { } d ? At(start.AddDays(WorkingOffset(d)), 16) : (DateTimeOffset?)null;
        MemberId? assignee = who is null ? null : (team.TryGetValue(who, out var u) ? u.Id : owner.Id);
        var deps = after is not null && byTitle.TryGetValue(after, out var dep) ? new List<TaskId> { dep } : [];
        var task = new TaskItem(TaskId.New(), project.Id, inSprint ? sprint.Id : null, title, "", new Hours(hours), null, status, assignee, [], deps,
            created, finished ?? created, status is WorkItemStatus.Done ? finished : null, type);
        added.Add(task);
        known.Add(title);
        byTitle[title] = task.Id;
    }

    // Epic
    Add(TaskType.Epic, "Reporting and analytics", 4, WorkItemStatus.ToDo, "Noa");
    Add(TaskType.Epic, "Notifications and reminders", 4, WorkItemStatus.ToDo, "Noa");
    Add(TaskType.Epic, "Public API for partners", 6, WorkItemStatus.ToDo, null, inSprint: false);
    // Design Task
    Add(TaskType.UserStory, "Design the task detail page", 6, WorkItemStatus.ToDo, "Tamar", "Design the sprint board mockups");
    Add(TaskType.UserStory, "Design empty and error states", 4, WorkItemStatus.ToDo, "Yuval");
    Add(TaskType.UserStory, "Icon set and spacing audit", 4, WorkItemStatus.Done, "Tamar", doneDay: 2);
    // Documentation
    Add(TaskType.Ticket, "Onboarding guide for new developers", 5, WorkItemStatus.ToDo, "Gal");
    Add(TaskType.Ticket, "Document the board keyboard shortcuts", 3, WorkItemStatus.ToDo, "Yuval");
    Add(TaskType.Ticket, "Architecture decision records", 4, WorkItemStatus.Done, "Lior", doneDay: 2);
    // Testing / QA
    Add(TaskType.TestCase, "Test cases for sprint planning", 6, WorkItemStatus.ToDo, "Shira");
    Add(TaskType.TestCase, "Smoke test checklist for releases", 4, WorkItemStatus.Done, "Ido", doneDay: 1);
    Add(TaskType.TestCase, "Screen reader test pass", 6, WorkItemStatus.ToDo, "Ido", "Keyboard and screen reader support on the board");
    // Performance
    Add(TaskType.Task, "Cache the dashboard queries", 6, WorkItemStatus.ToDo, "Lior");
    Add(TaskType.Task, "Reduce the bundle size of the board page", 5, WorkItemStatus.ToDo, "Yuval");
    Add(TaskType.Task, "Profile slow sprint planning runs", 6, WorkItemStatus.ToDo, "Omer");
    // Security
    Add(TaskType.Issue, "Rate limit the login endpoint", 5, WorkItemStatus.ToDo, "Lior", "Harden JWT login and role checks");
    Add(TaskType.Issue, "Audit dependencies for known vulnerabilities", 4, WorkItemStatus.Done, "Gal", doneDay: 2);
    Add(TaskType.Issue, "Store and rotate signing keys safely", 5, WorkItemStatus.ToDo, "Gal");
    // Infrastructure / DevOps
    Add(TaskType.Task, "Database backups and restore test", 6, WorkItemStatus.ToDo, "Gal");
    Add(TaskType.Task, "Health checks and uptime alerts", 5, WorkItemStatus.InQA, "Gal");
    Add(TaskType.Task, "Preview environments for pull requests", 8, WorkItemStatus.ToDo, null, inSprint: false);
    // Migration
    Add(TaskType.Task, "Move task history to its own collection", 6, WorkItemStatus.ToDo, "Omer");
    Add(TaskType.Task, "Upgrade to the latest .NET and React versions", 8, WorkItemStatus.ToDo, "Omer");
    Add(TaskType.Task, "Import tasks from a CSV file", 6, WorkItemStatus.ToDo, null, inSprint: false);
    // Accessibility
    Add(TaskType.Feature, "Fix the focus order in dialogs", 4, WorkItemStatus.ToDo, "Yuval");
    Add(TaskType.Feature, "Add text alternatives to the charts", 4, WorkItemStatus.ToDo, "Tamar");
    Add(TaskType.Feature, "High contrast mode check", 4, WorkItemStatus.ToDo, null, inSprint: false);
    // Integration
    Add(TaskType.Feature, "Link GitHub pull requests to tasks", 8, WorkItemStatus.ToDo, "Lior");
    Add(TaskType.Feature, "Calendar export of sprint dates", 5, WorkItemStatus.ToDo, "Omer");
    Add(TaskType.Feature, "Webhook for status changes", 6, WorkItemStatus.ToDo, null, inSprint: false);
    // Regression
    Add(TaskType.Bug, "Fix: sprint day is wrong after midnight", 3, WorkItemStatus.ToDo, "Omer");
    Add(TaskType.Bug, "Fix: assignee menu closes on the first click", 2, WorkItemStatus.Done, "Yuval", doneDay: 2);
    Add(TaskType.Bug, "Fix: dashboard forecast is missing after a reset", 3, WorkItemStatus.ToDo, "Lior");

    foreach (var task in added)
    {
        await tasks.AddAsync(task);
        await history.AddManyAsync(CreationHistory(task, owner));
        if (task.Status is WorkItemStatus.Done && task.AssigneeId is { } who)
            await timeLogs.AddAsync(new TimeLog(Guid.NewGuid(), task.Id, who, new Hours(task.Estimate.Value * 1.1), DateOnly.FromDateTime(task.CompletedAt!.Value.LocalDateTime), null));
    }

    Console.WriteLine($"Added {added.Count} tasks to '{project.Name}' ({added.Count(t => t.SprintId is not null)} in {sprint.Name}, {added.Count(t => t.SprintId is null)} in the backlog).");
    foreach (var group in added.GroupBy(t => t.Type).OrderBy(g => g.Key))
        Console.WriteLine($"  {group.Key,-15} {group.Count()}");
}

// ================================================================================================

TaskItem Task(Project project, Sprint sprint, string title, double hours, string[] skills, IReadOnlyList<TaskId> deps,
    WorkItemStatus status, User? assignee, DateTimeOffset createdAt, DateTimeOffset? finished = null) =>
    new(TaskId.New(), project.Id, sprint.Id, title, "", new Hours(hours), null, status, assignee?.Id, skills, deps, createdAt,
        finished ?? createdAt, status is WorkItemStatus.Done ? finished : null);

IReadOnlyCollection<HistoryEntry> CreationHistory(TaskItem task, User by) =>
    [new HistoryEntry(Guid.NewGuid(), task.Id, by.Id, "created", null, task.Title, task.CreatedAt)];

// Local date and hour to a UTC instant.
DateTimeOffset At(DateOnly date, int hour = 9) => new DateTimeOffset(date.ToDateTime(new TimeOnly(hour, 0)), TimeZoneInfo.Local.GetUtcOffset(date.ToDateTime(new TimeOnly(hour, 0)))).ToUniversalTime();

// Day offsets 0..9 count working days (Sun-Thu); this maps them to calendar offsets that skip Fri/Sat.
int WorkingOffset(int workingDay) => workingDay + (workingDay / 5) * 2;

// A Sunday at least three days ago, so the active sprint always has progress to show.
DateOnly CurrentSprintStart(DateOnly today)
{
    var day = today;
    while (day.DayOfWeek != DayOfWeek.Sunday || today.DayNumber - day.DayNumber < 3)
        day = day.AddDays(-1);
    return day;
}

async Task<int> ResetAsync()
{
    var demoUsers = await context.Users.Find(u => u.Email.EndsWith(Domain)).ToListAsync();
    var userIds = demoUsers.Select(u => u.Id).ToList();
    var demoProjects = await context.Projects.Find(Builders<ProjectDocument>.Filter.In(p => p.OwnerId, userIds)).ToListAsync();
    var projectIds = demoProjects.Select(p => p.Id).ToList();
    var taskIds = (await context.Tasks.Find(Builders<TaskDocument>.Filter.In(t => t.ProjectId, projectIds)).ToListAsync()).Select(t => t.Id).ToList();

    await context.TimeLogs.DeleteManyAsync(Builders<TimeLogDocument>.Filter.In(l => l.TaskId, taskIds));
    await context.Comments.DeleteManyAsync(Builders<CommentDocument>.Filter.In(c => c.TaskId, taskIds));
    await context.History.DeleteManyAsync(Builders<HistoryDocument>.Filter.In(h => h.TaskId, taskIds));
    await context.Tasks.DeleteManyAsync(Builders<TaskDocument>.Filter.In(t => t.Id, taskIds));
    await context.PlanJobs.DeleteManyAsync(Builders<PlanJobDocument>.Filter.In(j => j.ProjectId, projectIds));
    await context.Invitations.DeleteManyAsync(Builders<InvitationDocument>.Filter.In(i => i.ProjectId, projectIds));
    await context.Sprints.DeleteManyAsync(Builders<SprintDocument>.Filter.In(s => s.ProjectId, projectIds));
    await context.Projects.DeleteManyAsync(Builders<ProjectDocument>.Filter.In(p => p.Id, projectIds));
    await context.Users.DeleteManyAsync(Builders<UserDocument>.Filter.In(u => u.Id, userIds));
    return demoUsers.Count;
}
