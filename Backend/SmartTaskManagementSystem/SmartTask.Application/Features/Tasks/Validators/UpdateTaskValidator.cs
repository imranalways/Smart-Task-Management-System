using FluentValidation;
using SmartTask.Application.Features.Tasks.DTOs;

namespace SmartTask.Application.Features.Tasks.Validators;

public class UpdateTaskValidator
    : AbstractValidator<UpdateTaskRequestDto>
{
    public UpdateTaskValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();

        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(300);

        RuleFor(x => x.Description)
            .MaximumLength(4000);

        RuleFor(x => x.DueDate)
            .GreaterThan(DateTime.UtcNow);
    }
}