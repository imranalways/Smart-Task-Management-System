namespace SmartTask.Application.Contracts.AI;

public interface IAiProvider
{
    Task<string> ImproveDescriptionAsync(
        string description);
}