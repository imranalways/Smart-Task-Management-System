using Microsoft.Extensions.Options;
using SmartTask.Application.Contracts.AI;
using System.Net.Http.Json;
using System.Text.Json;

namespace SmartTask.Infrastructure.AI;

public class GeminiProvider : IAiProvider
{
    private readonly AiSettings _settings;
    public GeminiProvider(
        IOptions<AiSettings> options)
    {
        _settings = options.Value;
    }
    public async Task<string> ImproveDescriptionAsync(
    string description)
    {
        using var httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(
                _settings.TimeoutSeconds)
        };

        httpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer",
                _settings.Token);

        var requestBody = new
        {
            model = _settings.Model,

            messages = new object[]
            {
            new
            {
                role = "system",
                content =
                    """
                    You are a professional project manager.

                    Improve task descriptions.

                    Requirements:
                    - Fix grammar
                    - Improve clarity
                    - Make professional
                    - Expand short descriptions
                    - Make actionable

                    Return only the improved description.
                    """
            },

            new
            {
                role = "user",
                content = description
            }
            },

            temperature = _settings.Temperature,

            max_tokens = _settings.MaxTokens
        };

        var response =
            await httpClient.PostAsJsonAsync(
                $"{_settings.BaseUrl}chat/completions",
                requestBody);

        if (!response.IsSuccessStatusCode)
        {
            var error =
                await response.Content.ReadAsStringAsync();

            throw new Exception(
                $"Gemini API Error: {error}");
        }

        var json =
            await response.Content.ReadAsStringAsync();

        using var document =
            JsonDocument.Parse(json);

        return document
            .RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString()
            ?? string.Empty;
    }
}