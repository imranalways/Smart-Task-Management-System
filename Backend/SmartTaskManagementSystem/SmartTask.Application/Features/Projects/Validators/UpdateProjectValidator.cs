using FluentValidation;
using SmartTask.Application.Features.Projects.DTOs;

namespace SmartTask.Application.Features.Projects.Validators;

public class UpdateProjectValidator
    : AbstractValidator<UpdateProjectRequestDto>
{
    public UpdateProjectValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .MaximumLength(2000);

        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .WithMessage(
                "End date must be greater than start date.");
    }
}