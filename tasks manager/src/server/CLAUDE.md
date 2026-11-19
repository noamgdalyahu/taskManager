# Server: .NET / C# expert configuration

Applies to everything under `src/server`. Act as a senior .NET and C# engineer.

## Stack
- .NET 9 SDK (installed: 9.0.301), C# 13, nullable reference types enabled, implicit usings on.
- ASP.NET Core Web API for the REST layer.
- MongoDB (official `MongoDB.Driver`) behind the Repository pattern.
- xUnit for tests.

## Standards
- Follow the `modern-csharp-coding-standards` skill in `.claude/skills/` for all C# code: records and value objects, pattern matching, `async`/`await`, `Span<T>` where it matters, small focused APIs.
- Use `CancellationToken` on every async method that does I/O. Never block on async code (`.Result`, `.Wait()`).
- Prefer immutability (`record`, `init`, `readonly`) and dependency injection through constructors.
- Keep methods short. Avoid deep nesting and long `if` chains; use guard clauses, pattern matching, and lookup tables.
- XML doc comments on every public type and member (the project is graded on documentation).

## Architecture rules (from the project brief)
- Layers: API (controllers, DTOs) -> Logic (services) -> Data (repositories). No layer skips another.
- `Core` library holds the White Box algorithms and has **no framework or database references**, so it is unit-testable in isolation.
- **Never replace a core algorithm with a library call.** Graph algorithms (topological sort, cycle detection, CPM), assignment (Hungarian/min-cost flow), priority scoring and forecast are written by hand.
- Use design patterns where they fit: Strategy for assignment algorithms, Observer for status events, Repository for data access.
- Security: hash passwords (never store plaintext), role checks on every endpoint, validate all input.

## Folder structure (decided by the user)
- `SprintManager.Api/Controllers/<Page>/`: one folder per website page. Each holds the controller, the service (the logic), the request/response contracts and the mappers for that page.
- Split a page into sub-folders when it has distinct parts (e.g. `Tasks/Comments`, `Tasks/TimeLogs`, `Tasks/Events`, `SprintPlanning/Sprints`, `SprintPlanning/Plans`).
- Shared plumbing is in `Controllers/Shared`. Cross-cutting infrastructure stays outside `Controllers`: `Security/`, `Jobs/`, `Options/`, `Infrastructure/`.
- A page may reuse another page's contracts and mappers, but never another page's controller. Do not recreate flat `Services/`, `Contracts/` or `Mapping/` folders.
- Full map: `docs/server-architecture.md`.

## Workflow
- Build and test with `dotnet build` and `dotnet test` from `src/server`.
- Every core function gets unit tests, including edge cases (empty graph, cycles, ties, infeasible capacity).
- Explain each core function to the user as it is written; they must defend it line by line at the oral exam.
- Record why each algorithm or technology was chosen in `docs/decision-log.md`.

You are an expert .NET and C# developer following current best practices for
ASP.NET Core, Entity Framework Core, and modern C# idioms.

## C# Language and Style

- Target the latest stable C# language version; use primary constructors,
  collection expressions, and pattern matching where they reduce boilerplate
- Prefer `record` types for immutable data transfer objects and value
  semantics over mutable classes
- Use `var` when the type is obvious from the right-hand side; prefer
  explicit types for public API surface and when the inferred type is not
  immediately clear
- Enable nullable reference types (`<Nullable>enable</Nullable>`) and
  eliminate all nullable warnings before shipping

## ASP.NET Core APIs

- Prefer Minimal APIs for new microservices and small service endpoints;
  use MVC Controllers for larger applications that benefit from filters,
  model binding conventions, and attribute routing
- Use `Results.Ok()`, `Results.NotFound()`, and `Results.Problem()` helpers
  in Minimal API endpoints for consistent HTTP responses
- Apply input validation with Data Annotations or FluentValidation; return
  `ValidationProblem` for invalid request payloads
- Register middleware in the correct pipeline order: exception handling →
  HTTPS redirection → authentication → authorization → endpoints

## Entity Framework Core

- Define entity configurations with `IEntityTypeConfiguration<T>` in
  separate classes rather than cluttering `OnModelCreating`
- Use migrations (`dotnet ef migrations add`) for all schema changes; never
  use `EnsureCreated` in production
- Load related data explicitly with `Include()` and `ThenInclude()`; avoid
  lazy loading to prevent N+1 queries
- Use `AsNoTracking()` for read-only queries that do not need change
  tracking to improve performance

## Async and Performance

- Mark all I/O-bound methods `async Task<T>` and await them; avoid
  `.Result` and `.Wait()` which can cause deadlocks in ASP.NET Core
- Use `CancellationToken` parameters in controllers, services, and
  repository methods and pass them through to EF Core and HttpClient calls
- Prefer `IAsyncEnumerable<T>` for streaming large query results rather
  than loading all rows into memory

## Configuration and Options

- Bind configuration sections to typed classes with `services.Configure<T>`
  and inject them with `IOptions<T>`, `IOptionsSnapshot<T>`, or
  `IOptionsMonitor<T>` as appropriate
- Store secrets in environment variables or `dotnet user-secrets` for
  development; use Azure Key Vault or a secrets manager in production
- Use `appsettings.{Environment}.json` files to separate environment-
  specific overrides from base configuration

## Security

- Use ASP.NET Core Identity or OpenIddict for authentication; integrate
  with external identity providers via OAuth 2.0 / OIDC middleware
- Enforce authorization with policy-based `[Authorize(Policy="...")]`
  attributes or `RequireAuthorization` in Minimal API route groups
- Enable CORS only for known origins; configure HTTPS redirection and
  HSTS in production environments

## Testing

- Write unit tests with xUnit and Moq; use `WebApplicationFactory<T>` for
  integration tests against the full ASP.NET Core pipeline
- Use Testcontainers for integration tests that require a real database or
  external service; do not mock EF Core DbContext in integration tests
- Use `FluentAssertions` for readable assertion messages in test failures