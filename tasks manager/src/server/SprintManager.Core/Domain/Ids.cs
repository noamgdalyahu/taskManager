namespace SprintManager.Core.Domain;

/// <summary>Strongly typed identifier of a work item (task).</summary>
/// <remarks>
/// A dedicated struct (instead of a raw <see cref="Guid"/>) means the compiler rejects
/// passing a member id where a task id is expected. No implicit conversions on purpose.
/// </remarks>
public readonly record struct TaskId(Guid Value)
{
    /// <summary>Creates a new random id.</summary>
    public static TaskId New() => new(Guid.NewGuid());

    /// <inheritdoc />
    public override string ToString() => Value.ToString();
}

/// <summary>Strongly typed identifier of a team member (user).</summary>
public readonly record struct MemberId(Guid Value)
{
    /// <summary>Creates a new random id.</summary>
    public static MemberId New() => new(Guid.NewGuid());

    /// <inheritdoc />
    public override string ToString() => Value.ToString();
}

/// <summary>Strongly typed identifier of a project.</summary>
public readonly record struct ProjectId(Guid Value)
{
    /// <summary>Creates a new random id.</summary>
    public static ProjectId New() => new(Guid.NewGuid());

    /// <inheritdoc />
    public override string ToString() => Value.ToString();
}

/// <summary>Strongly typed identifier of a sprint.</summary>
public readonly record struct SprintId(Guid Value)
{
    /// <summary>Creates a new random id.</summary>
    public static SprintId New() => new(Guid.NewGuid());

    /// <inheritdoc />
    public override string ToString() => Value.ToString();
}
