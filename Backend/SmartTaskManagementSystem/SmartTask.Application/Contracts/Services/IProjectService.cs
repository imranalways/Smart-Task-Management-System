using SmartTask.Application.Common.Models;
using SmartTask.Application.Features.Projects.DTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartTask.Application.Contracts.Services
{
    public interface IProjectService
    {
        Task<ProjectDto> CreateAsync(
            CreateProjectRequestDto request);

        Task<ProjectDto> UpdateAsync(
            UpdateProjectRequestDto request);

        Task DeleteAsync(Guid id);

        Task<ProjectDto> GetByIdAsync(Guid id);

        Task<PagedResponse<ProjectDto>>
            GetPagedAsync(
                PagedRequest request);
    }
}
