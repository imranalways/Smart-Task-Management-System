using FluentValidation;
using SmartTask.Application.Features.Projects.DTOs;

public class CreateProjectValidator
    : AbstractValidator<CreateProjectRequestDto>
{
    public CreateProjectValidator()
    {
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