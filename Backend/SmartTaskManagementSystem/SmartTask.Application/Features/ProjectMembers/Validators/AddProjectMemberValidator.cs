using FluentValidation;
using SmartTask.Application.Features.ProjectMembers.DTOs;

namespace SmartTask.Application.Features.ProjectMembers.Validators;

public class AddProjectMemberValidator
    : AbstractValidator<AddProjectMemberRequestDto>
{
    public AddProjectMemberValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty();
    }
}
