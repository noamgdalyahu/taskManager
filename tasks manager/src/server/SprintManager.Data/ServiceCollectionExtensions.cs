using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SprintManager.Core.Abstractions;
using SprintManager.Data.Repositories;

namespace SprintManager.Data;

/// <summary>Registers the MongoDB data layer.</summary>
public static class ServiceCollectionExtensions
{
    /// <summary>Adds the context, repositories and index initialiser.</summary>
    public static IServiceCollection AddMongoData(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<MongoOptions>(configuration.GetSection(MongoOptions.Section));
        services.AddSingleton<MongoContext>();
        services.AddHostedService<MongoIndexInitializer>();

        // Repositories are stateless over a thread-safe client, so singletons are correct and cheapest.
        services.AddSingleton<IUserRepository, MongoUserRepository>();
        services.AddSingleton<IProjectRepository, MongoProjectRepository>();
        services.AddSingleton<ISprintRepository, MongoSprintRepository>();
        services.AddSingleton<ITaskRepository, MongoTaskRepository>();
        services.AddSingleton<IPlanJobRepository, MongoPlanJobRepository>();
        services.AddSingleton<ITimeLogRepository, MongoTimeLogRepository>();
        services.AddSingleton<ICommentRepository, MongoCommentRepository>();
        services.AddSingleton<IHistoryRepository, MongoHistoryRepository>();
        services.AddSingleton<IInvitationRepository, MongoInvitationRepository>();
        return services;
    }
}