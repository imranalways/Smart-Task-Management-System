using System.Net;
using System.Text.Json;
using SmartTask.Application.Common.Models;
using SmartTask.Application.Exceptions;

namespace SmartTask.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(
        RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            context.Response.ContentType = "application/json";

            var (statusCode, message) = ex switch
            {
                NotFoundException => (StatusCodes.Status404NotFound, ex.Message),
                BadRequestException => (StatusCodes.Status400BadRequest, ex.Message),
                ForbiddenException => (StatusCodes.Status403Forbidden, ex.Message),
                UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, ex.Message),
                _ => (StatusCodes.Status500InternalServerError,
                      "An unexpected error occurred.")
            };

            context.Response.StatusCode = statusCode;

            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message
            });
        }
    }

    private static async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        var response =
            new ErrorResponse
            {
                Success = false
            };

        switch (exception)
        {
            case NotFoundException:
                context.Response.StatusCode =
                    (int)HttpStatusCode.NotFound;

                response.Message =
                    exception.Message;
                break;

            case BadRequestException:
                context.Response.StatusCode =
                    (int)HttpStatusCode.BadRequest;

                response.Message =
                    exception.Message;
                break;

            case UnauthorizedException:
                context.Response.StatusCode =
                    (int)HttpStatusCode.Unauthorized;

                response.Message =
                    exception.Message;
                break;

            case ForbiddenException:
                context.Response.StatusCode =
                    (int)HttpStatusCode.Forbidden;

                response.Message = exception.Message;
                break;

            default:
                context.Response.StatusCode =
                    (int)HttpStatusCode.InternalServerError;

                response.Message =
                    "An unexpected error occurred.";
                break;
        }

        context.Response.ContentType =
            "application/json";

        var json =
            JsonSerializer.Serialize(
                response);

        await context.Response.WriteAsync(
            json);
    }
}