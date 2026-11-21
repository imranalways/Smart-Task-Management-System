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

    public async Task InvokeAsync(
        HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(
                context,
                ex);
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