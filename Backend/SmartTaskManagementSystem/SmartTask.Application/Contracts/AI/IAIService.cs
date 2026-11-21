using SmartTask.Application.Features.AI.DTOs;

namespace SmartTask.Application.Contracts.AI;

public interface IAIService
{
    Task<ImproveDescriptionResponseDto>
        ImproveDescriptionAsync(
            ImproveDescriptionRequestDto request);
}