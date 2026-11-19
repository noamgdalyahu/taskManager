namespace SprintManager.Data;

/// <summary>MongoDB connection settings, bound from the "Mongo" section.</summary>
public sealed class MongoOptions
{
    /// <summary>Section name.</summary>
    public const string Section = "Mongo";

    /// <summary>Connection string.</summary>
    public required string ConnectionString { get; init; }

    /// <summary>Database name.</summary>
    public required string DatabaseName { get; init; }
}
