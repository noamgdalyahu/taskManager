using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SprintManager.Api.Security;
using SprintManager.Core.Domain;

namespace SprintManager.Api.Controllers.SprintPlanning.Plans;

/// <summary>Sprint planning page, part 2: "Suggest plan" jobs and accepting the result.</summary>
[ApiController]
[Route("api")]
[Authorize]
public sealed class PlanningController(PlanningService planning) : ControllerBase
{
    /// <summary>Starts a planning job for the sprint. Returns 202 with the job to poll.</summary>
    [HttpPost("sprints/{sprintId:guid}/plan")]
    [Authorize(Policy = Policies.Manager)]
    [ProducesResponseType<PlanJobDto>(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> Suggest(Guid sprintId, SuggestPlanRequest? request, CancellationToken cancellationToken)
    {
        var result = await planning.EnqueueAsync(new SprintId(sprintId), request?.Strategy, CurrentUser.From(User), cancellationToken);
        if (!result.IsSuccess)
            return ToProblem(result);

        var dto = result.Job!.ToDto();
        return AcceptedAtAction(nameof(GetJob), new { jobId = dto.Id }, dto);
    }

    /// <summary>Returns a job and, when finished, its plan.</summary>
    [HttpGet("plan-jobs/{jobId:guid}")]
    [ProducesResponseType<PlanJobDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetJob(Guid jobId, CancellationToken cancellationToken)
    {
        var result = await planning.GetJobAsync(new JobId(jobId), CurrentUser.From(User), cancellationToken);
        return result.IsSuccess ? Ok(result.Job!.ToDto()) : ToProblem(result);
    }

    /// <summary>Applies the suggested assignments of a finished plan to the sprint's tasks.</summary>
    [HttpPost("plan-jobs/{jobId:guid}/accept")]
    [Authorize(Policy = Policies.Manager)]
    [ProducesResponseType<PlanJobDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Accept(Guid jobId, CancellationToken cancellationToken)
    {
        var result = await planning.AcceptAsync(new JobId(jobId), CurrentUser.From(User), cancellationToken);
        return result.IsSuccess ? Ok(result.Job!.ToDto()) : ToProblem(result);
    }

    private IActionResult ToProblem(PlanningResult result) => result.Error switch
    {
        PlanningErrorCode.SprintAlreadyStarted => Problem(title: "This sprint has already started, so it can no longer be planned.", statusCode: StatusCodes.Status409Conflict),
        PlanningErrorCode.PlanNotApplicable => Problem(title: "The plan is not finished or not feasible.", statusCode: StatusCodes.Status409Conflict),
        PlanningErrorCode.SprintNotFound => Problem(title: "Sprint not found.", statusCode: StatusCodes.Status404NotFound),
        PlanningErrorCode.JobNotFound => Problem(title: "Job not found.", statusCode: StatusCodes.Status404NotFound),
        PlanningErrorCode.Forbidden => Problem(title: "Only a manager of this project can plan it.", statusCode: StatusCodes.Status403Forbidden),
        PlanningErrorCode.UnknownStrategy => Problem(title: "Unknown strategy. Use Hungarian or Greedy.", statusCode: StatusCodes.Status400BadRequest),
        PlanningErrorCode.QueueFull => Problem(title: "Planning queue is full, try again shortly.", statusCode: StatusCodes.Status503ServiceUnavailable),
        _ => Problem(statusCode: StatusCodes.Status500InternalServerError),
    };
}
