namespace SmartTask.Application.Features.AI.DTOs;

public class ImproveDescriptionResponseDto
{
    public string OriginalDescription { get; set; }
        = string.Empty;

    public string ImprovedDescription { get; set; }
        = string.Empty;
}