namespace SmartTask.Application.Common.Models;

public class Result
{
    public bool Succeeded { get; set; }
    public string Message { get; set; } = string.Empty;
    public static Result Success(string message = "")
    {
        return new Result
        {
            Succeeded = true,
            Message = message
        };
    }

    public static Result Failure(string message)
    {
        return new Result
        {
            Succeeded = false,
            Message = message
        };
    }
}