using FluentValidation;
using SmartTask.Application.Features.Auth.DTOs;

namespace SmartTask.Application.Features.Auth.Validators;

public class LoginRequestValidator
    : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Password)
            .NotEmpty();
    }
}