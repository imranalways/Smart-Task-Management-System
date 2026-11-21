using FluentValidation;
using SmartTask.Application.Features.Tasks.DTOs;

namespace SmartTask.Application.Features.Tasks.Validators;

public class AssignTaskValidator
    : AbstractValidator<AssignTaskRequestDto>
{
    public AssignTaskValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty();
    }
}
