using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.SignalR;

namespace SprintManager.Api.Realtime;

/// <summary>
/// After any successful request that changes data (POST, PUT, PATCH, DELETE) tells every connected client to refetch.
/// The ping carries no data, so it needs no per-project routing; the refetch itself is authorized as usual.
/// </summary>
public sealed class BroadcastChangesFilter(IHubContext<ChangesHub> hub) : IAsyncActionFilter
{
    private static readonly HashSet<string> Reads = new(StringComparer.OrdinalIgnoreCase) { "GET", "HEAD", "OPTIONS" };

    /// <inheritdoc />
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();
        var http = context.HttpContext;
        var changed = !Reads.Contains(http.Request.Method)
            && executed.Exception is null
            && http.Response.StatusCode is >= 200 and < 300
            && http.User.Identity?.IsAuthenticated == true;
        if (changed)
            await hub.Clients.All.SendAsync(ChangesHub.ChangedMessage, http.RequestAborted);
    }
}
