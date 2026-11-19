using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Security;

namespace SprintManager.Api.Controllers.Shared;

/// <summary>Shared plumbing: caller extraction and result-to-HTTP mapping.</summary>
[ApiController]
[Authorize]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>The authenticated caller.</summary>
    protected CurrentUser Caller => CurrentUser.From(User);

    /// <summary>200 with the mapped value, or the matching problem response.</summary>
    protected IActionResult From<T, TDto>(OperationResult<T> result, Func<T, TDto> map) =>
        result.IsSuccess ? Ok(map(result.Value!)) : ToProblem(result.Error!.Value);

    /// <summary>201 with the mapped value, or the matching problem response.</summary>
    protected IActionResult Created<T, TDto>(OperationResult<T> result, Func<T, TDto> map, string actionName, object routeValues) =>
        result.IsSuccess ? CreatedAtAction(actionName, routeValues, map(result.Value!)) : ToProblem(result.Error!.Value);

    /// <summary>204, or the matching problem response.</summary>
    protected IActionResult NoContentFrom<T>(OperationResult<T> result) =>
        result.IsSuccess ? NoContent() : ToProblem(result.Error!.Value);

    private IActionResult ToProblem(OperationError error) => Problem(title: error.Message, statusCode: error.Kind switch
    {
        ErrorKind.NotFound => StatusCodes.Status404NotFound,
        ErrorKind.Forbidden => StatusCodes.Status403Forbidden,
        ErrorKind.Validation => StatusCodes.Status400BadRequest,
        ErrorKind.Conflict => StatusCodes.Status409Conflict,
        _ => StatusCodes.Status500InternalServerError,
    });
}
