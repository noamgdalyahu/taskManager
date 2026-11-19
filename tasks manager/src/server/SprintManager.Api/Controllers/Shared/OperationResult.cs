namespace SprintManager.Api.Controllers.Shared;

/// <summary>HTTP-agnostic failure categories shared by the CRUD services.</summary>
public enum ErrorKind
{
    /// <summary>Resource does not exist, or exists but must look absent to this caller.</summary>
    NotFound,
    /// <summary>Caller lacks the role or the membership.</summary>
    Forbidden,
    /// <summary>Input is syntactically fine but violates a business rule.</summary>
    Validation,
    /// <summary>State conflict (duplicate, already used, wrong lifecycle state).</summary>
    Conflict,
}

/// <summary>A failure with a message for the client.</summary>
public readonly record struct OperationError(ErrorKind Kind, string Message);

/// <summary>
/// Outcome of a CRUD-style service call. Auth and planning keep their own specific result types;
/// the CRUD services share this one because their success/failure shapes are identical and
/// a dozen near-copies would add nothing but code.
/// </summary>
public sealed record OperationResult<T>
{
    /// <summary>Success flag.</summary>
    public bool IsSuccess { get; private init; }

    /// <summary>Value on success.</summary>
    public T? Value { get; private init; }

    /// <summary>Error on failure.</summary>
    public OperationError? Error { get; private init; }

    /// <summary>Success.</summary>
    public static OperationResult<T> Ok(T value) => new() { IsSuccess = true, Value = value };

    /// <summary>Failure.</summary>
    public static OperationResult<T> Fail(ErrorKind kind, string message) => new() { IsSuccess = false, Error = new OperationError(kind, message) };

    /// <summary>Failure carried over from another result.</summary>
    public static OperationResult<T> Fail(OperationError error) => new() { IsSuccess = false, Error = error };
}

/// <summary>Shorthand constructors.</summary>
public static class OperationResult
{
    /// <summary>Not found.</summary>
    public static OperationResult<T> NotFound<T>(string what) => OperationResult<T>.Fail(ErrorKind.NotFound, $"{what} not found.");

    /// <summary>Forbidden.</summary>
    public static OperationResult<T> Forbidden<T>(string message) => OperationResult<T>.Fail(ErrorKind.Forbidden, message);

    /// <summary>Validation.</summary>
    public static OperationResult<T> Invalid<T>(string message) => OperationResult<T>.Fail(ErrorKind.Validation, message);

    /// <summary>Conflict.</summary>
    public static OperationResult<T> Conflict<T>(string message) => OperationResult<T>.Fail(ErrorKind.Conflict, message);
}
