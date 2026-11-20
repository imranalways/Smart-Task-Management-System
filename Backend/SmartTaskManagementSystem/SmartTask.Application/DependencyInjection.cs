using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SmartTask.Application.Features.Auth.Validators;

namespace SmartTask.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(
        this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<
            RegisterRequestValidator>();

        return services;
    }
}