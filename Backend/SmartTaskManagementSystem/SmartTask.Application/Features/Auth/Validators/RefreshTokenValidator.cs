using FluentValidation;
using SmartTask.Application.Features.Auth.DTOs;

namespace SmartTask.Application.Features.Auth.Validators;

public class RefreshTokenValidator
    : AbstractValidator<RefreshTokenRequestDto>
{
    public RefreshTokenValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty();
    }
}