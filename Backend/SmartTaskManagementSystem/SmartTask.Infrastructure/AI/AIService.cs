using SmartTask.Application.Contracts.AI;
using SmartTask.Application.Features.AI.DTOs;

public class AIService : IAIService
{
    private readonly IAiProvider _provider;

    public AIService(
        IAiProvider provider)
    {
        _provider = provider;
    }

    public async Task<
        ImproveDescriptionResponseDto>
        ImproveDescriptionAsync(
            ImproveDescriptionRequestDto request)
    {
        var improved =
            await _provider
                .ImproveDescriptionAsync(
                    request.Description);

        return new ImproveDescriptionResponseDto
        {
            OriginalDescription =
                request.Description,

            ImprovedDescription =
                improved
        };
    }
}