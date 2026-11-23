using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SprintManager.Api.Realtime;

/// <summary>
/// Real-time channel. The server only ever sends the content-free message "changed"; clients answer by refetching
/// through the normal API, so every read still goes through the usual authorization checks and nothing leaks here.
/// </summary>
[Authorize]
public sealed class ChangesHub : Hub
{
    /// <summary>Path the hub is mapped to (the Vite dev proxy and nginx forward it).</summary>
    public const string Path = "/hubs/changes";

    /// <summary>Name of the one message the server sends.</summary>
    public const string ChangedMessage = "changed";
}
