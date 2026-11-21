using FluentValidation;
using SmartTask.Application.Features.Tasks.DTOs;

namespace SmartTask.Application.Features.Tasks.Validators;

public class UpdateTaskStatusValidator
    : AbstractValidator<UpdateTaskStatusRequestDto>
{
    public UpdateTaskStatusValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum();
    }
}
