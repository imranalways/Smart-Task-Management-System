using FluentValidation;
using SmartTask.Application.Features.AI.DTOs;

namespace SmartTask.Application.Features.AI.Validators;

public class ImproveDescriptionValidator
    : AbstractValidator<ImproveDescriptionRequestDto>
{
    public ImproveDescriptionValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty()
            .MaximumLength(4000);
    }
}