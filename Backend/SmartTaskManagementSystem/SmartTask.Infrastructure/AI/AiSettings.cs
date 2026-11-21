namespace SmartTask.Infrastructure.AI;

public class AiSettings
{
    public string BaseUrl { get; set; } = string.Empty;

    public string Model { get; set; } = string.Empty;

    public string Token { get; set; } = string.Empty;

    public double Temperature { get; set; }

    public int MaxTokens { get; set; }

    public int TimeoutSeconds { get; set; }
}