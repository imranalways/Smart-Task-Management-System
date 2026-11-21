using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartTask.Application.Contracts.AI;
using SmartTask.Application.Features.AI.DTOs;

namespace SmartTask.API.Controllers;

[ApiController]
[Authorize]
[Route("api/ai")]
public class AIController : ControllerBase
{
    private readonly IAIService _aiService;

    public AIController(
        IAIService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("improve-description")]
    public async Task<IActionResult>
        ImproveDescription(
            ImproveDescriptionRequestDto request)
    {
        var result =
            await _aiService
                .ImproveDescriptionAsync(
                    request);

        return Ok(result);
    }
}