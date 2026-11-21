using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SmartTask.Application.Features.Dashboard.Services;

namespace SmartTask.API.Controllers;

[EnableRateLimiting("api")]
[ApiController]
[Authorize]
[Route("api/dashboard")]
public class DashboardController
    : ControllerBase
{
    private readonly IDashboardService
        _dashboardService;

    public DashboardController(
        IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult>
        GetSummary()
    {
        var result =
            await _dashboardService
                .GetSummaryAsync();

        return Ok(result);
    }
}