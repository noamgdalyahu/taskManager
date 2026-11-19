using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SprintManager.Api.Controllers.Auth;
using SprintManager.Api.Controllers.Board;
using SprintManager.Api.Controllers.Dashboard;
using SprintManager.Api.Controllers.MyTasks;
using SprintManager.Api.Controllers.Profile;
using SprintManager.Api.Controllers.Projects;
using SprintManager.Api.Controllers.Reports;
using SprintManager.Api.Controllers.Shared;
using SprintManager.Api.Controllers.SprintPlanning.Plans;
using SprintManager.Api.Controllers.SprintPlanning.Sprints;
using SprintManager.Api.Controllers.Tasks;
using SprintManager.Api.Controllers.Tasks.Comments;
using SprintManager.Api.Controllers.Tasks.Events;
using SprintManager.Api.Controllers.Tasks.TimeLogs;
using SprintManager.Api.Controllers.Team;
using SprintManager.Api.Infrastructure;
using SprintManager.Api.Jobs;
using SprintManager.Api.Options;
using SprintManager.Api.Security;
using SprintManager.Core.Abstractions;
using SprintManager.Core.Domain;
using SprintManager.Data;

var builder = WebApplication.CreateBuilder(args);

// ---- Options -------------------------------------------------------------
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.Section));
builder.Services.Configure<PlanningOptions>(builder.Configuration.GetSection(PlanningOptions.Section));
builder.Services.Configure<CorsOptions>(builder.Configuration.GetSection(CorsOptions.Section));
var jwt = builder.Configuration.GetSection(JwtOptions.Section).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Jwt section is missing. Set Jwt:SigningKey via user-secrets or environment.");
var cors = builder.Configuration.GetSection(CorsOptions.Section).Get<CorsOptions>() ?? new CorsOptions();

// ---- Data layer ----------------------------------------------------------
builder.Services.AddMongoData(builder.Configuration);

// ---- Cross-cutting --------------------------------------------------------
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();

// ---- Application services: one group per page (see Controllers/<Page>) -----
builder.Services.AddScoped<ProjectAccess>();
builder.Services.AddScoped<TaskAccess>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ProfileService>();
builder.Services.AddScoped<ProjectService>();
builder.Services.AddScoped<TeamService>();
builder.Services.AddScoped<SprintService>();
builder.Services.AddScoped<PlanningService>();
builder.Services.AddScoped<PlanComparisonService>();
builder.Services.AddScoped<BoardService>();
builder.Services.AddScoped<MyTasksService>();
builder.Services.AddScoped<TaskService>();
builder.Services.AddScoped<CommentService>();
builder.Services.AddScoped<TimeLogService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<ReportsService>();

// Observer: task changes fan out to every registered observer (history today, notifications later).
builder.Services.AddScoped<TaskChangePublisher>();
builder.Services.AddScoped<ITaskChangeObserver, HistoryRecorder>();

// ---- Background jobs (async / parallel) -----------------------------------
builder.Services.AddSingleton<IPlanJobQueue, ChannelPlanJobQueue>();
builder.Services.AddSingleton<PlanJobRecovery>();
builder.Services.AddHostedService<PlanJobRecoveryService>();   // registered first: repairs job state before workers start
builder.Services.AddHostedService<PlanningWorker>();

// ---- Authentication and authorization -------------------------------------
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(Policies.Manager, p => p.RequireRole(nameof(UserRole.Manager)));

// ---- Rate limiting: brute-force protection on login/register ---------------
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

// ---- CORS: only the known client origins -----------------------------------
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(cors.Origins)
    .AllowAnyHeader()
    .AllowAnyMethod()));

// Enums travel as strings ("InProgress"). MVC and the OpenAPI generator read different JSON options, so both are set:
// the first is what controllers actually send, the second is what the OpenAPI document (and the client's generated
// TypeScript types) describes. Setting only one makes the contract lie about the wire format.
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();

var app = builder.Build();

// Pipeline order: exceptions → HTTPS → CORS → rate limit → authN → authZ → endpoints
app.UseExceptionHandler();
app.UseStatusCodePages();
if (app.Environment.IsDevelopment())
    app.MapOpenApi();
else
{
    // Not in development: the Vite dev proxy talks plain HTTP, and a 307 to https://localhost:7232 makes the browser
    // leave the proxy (and drops the Authorization header), so every request after login fails.
    app.UseHsts();
    app.UseHttpsRedirection();
}
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health").AllowAnonymous();

app.Run();
