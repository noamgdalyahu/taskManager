using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;
using SprintManager.Data.Documents;

namespace SprintManager.Data;

/// <summary>
/// Single entry point to the database: one client (thread-safe, pooled, registered as singleton)
/// and typed accessors for each collection.
/// </summary>
public sealed class MongoContext
{
    static MongoContext()
    {
        // Store Guids as standard BSON binary (subtype 4), the cross-driver representation.
        BsonSerializer.TryRegisterSerializer(new GuidSerializer(GuidRepresentation.Standard));
        BsonSerializer.TryRegisterSerializer(new DateOnlySerializer(BsonType.String));
    }

    /// <summary>Opens the client and database.</summary>
    public MongoContext(IOptions<MongoOptions> options)
    {
        var client = new MongoClient(options.Value.ConnectionString);
        Database = client.GetDatabase(options.Value.DatabaseName);
    }

    /// <summary>The database (for health checks and index creation).</summary>
    public IMongoDatabase Database { get; }

    /// <summary>users collection.</summary>
    public IMongoCollection<UserDocument> Users => Database.GetCollection<UserDocument>("users");

    /// <summary>projects collection.</summary>
    public IMongoCollection<ProjectDocument> Projects => Database.GetCollection<ProjectDocument>("projects");

    /// <summary>sprints collection.</summary>
    public IMongoCollection<SprintDocument> Sprints => Database.GetCollection<SprintDocument>("sprints");

    /// <summary>tasks collection.</summary>
    public IMongoCollection<TaskDocument> Tasks => Database.GetCollection<TaskDocument>("tasks");

    /// <summary>planJobs collection.</summary>
    public IMongoCollection<PlanJobDocument> PlanJobs => Database.GetCollection<PlanJobDocument>("planJobs");

    /// <summary>timeLogs collection.</summary>
    public IMongoCollection<TimeLogDocument> TimeLogs => Database.GetCollection<TimeLogDocument>("timeLogs");

    /// <summary>comments collection.</summary>
    public IMongoCollection<CommentDocument> Comments => Database.GetCollection<CommentDocument>("comments");

    /// <summary>history collection.</summary>
    public IMongoCollection<HistoryDocument> History => Database.GetCollection<HistoryDocument>("history");

    /// <summary>invitations collection.</summary>
    public IMongoCollection<InvitationDocument> Invitations => Database.GetCollection<InvitationDocument>("invitations");
}
