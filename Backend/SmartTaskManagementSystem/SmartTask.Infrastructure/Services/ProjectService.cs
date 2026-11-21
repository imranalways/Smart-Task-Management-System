using SmartTask.Application.Common.Models;
using SmartTask.Application.Contracts.Persistence;
using SmartTask.Application.Contracts.Services;
using SmartTask.Application.Exceptions;
using SmartTask.Application.Features.Projects.DTOs;
using SmartTask.Domain.Entities;
using SmartTask.Domain.Enums;

namespace SmartTask.Infrastructure.Services;

public class ProjectService : IProjectService
{
    private readonly IProjectRepository _projectRepository;
    private readonly ICurrentUserService _currentUserService;

    public ProjectService(
        IProjectRepository projectRepository,
        ICurrentUserService currentUserService)
    {
        _projectRepository = projectRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ProjectDto> CreateAsync(
        CreateProjectRequestDto request)
    {
        var project = new Project
        {
            Id = Guid.NewGuid(),

            Name = request.Name,

            Description = request.Description,

            Status = ProjectStatus.Active,

            StartDate = request.StartDate,

            EndDate = request.EndDate,

            CreatedBy = _currentUserService.UserId,

            CreatedAt = DateTime.UtcNow,

            UpdatedAt = DateTime.UtcNow
        };

        await _projectRepository.AddAsync(project);

        await _projectRepository.SaveChangesAsync();

        return new ProjectDto
        {
            Id = project.Id,

            Name = project.Name,

            Description = project.Description,

            Status = project.Status.ToString(),

            StartDate = project.StartDate,

            EndDate = project.EndDate,

            CreatedBy = project.CreatedBy
        };
    }

    public async Task<ProjectDto> UpdateAsync(
        UpdateProjectRequestDto request)
    {
        var project =
            await _projectRepository.GetByIdAsync(
                request.Id);

        if (project is null)
        {
            throw new NotFoundException(
                "Project not found.");
        }

        project.Name = request.Name;

        project.Description = request.Description;

        project.Status = request.Status;

        project.StartDate = request.StartDate;

        project.EndDate = request.EndDate;

        project.UpdatedAt = DateTime.UtcNow;

        await _projectRepository.UpdateAsync(
            project);

        await _projectRepository.SaveChangesAsync();

        return MapToDto(project);
    }

    public async Task DeleteAsync(Guid id)
    {
        var project =
            await _projectRepository.GetByIdAsync(id);

        if (project is null)
        {
            throw new NotFoundException(
                "Project not found.");
        }

        await _projectRepository.DeleteAsync(
            project);

        await _projectRepository.SaveChangesAsync();
    }

    public async Task<ProjectDto> GetByIdAsync(
        Guid id)
    {
        var project =
            await _projectRepository.GetByIdAsync(id);

        if (project is null)
        {
            throw new NotFoundException(
                "Project not found.");
        }

        return MapToDto(project);
    }

    public async Task<PagedResponse<ProjectDto>>
        GetPagedAsync(
            PagedRequest request)
    {
        var pagedProjects =
            await _projectRepository.GetPagedAsync(
                request);

        return new PagedResponse<ProjectDto>
        {
            PageNumber = pagedProjects.PageNumber,

            PageSize = pagedProjects.PageSize,

            TotalRecords =
                pagedProjects.TotalRecords,

            TotalPages =
                pagedProjects.TotalPages,

            Items = pagedProjects.Items
                .Select(MapToDto)
                .ToList()
        };
    }

    private static ProjectDto MapToDto(
        Project project)
    {
        return new ProjectDto
        {
            Id = project.Id,

            Name = project.Name,

            Description = project.Description,

            Status = project.Status.ToString(),

            StartDate = project.StartDate,

            EndDate = project.EndDate,

            CreatedBy = project.CreatedBy,

            CreatedByName =
                project.CreatedByUser != null
                    ? $"{project.CreatedByUser.FirstName} {project.CreatedByUser.LastName}"
                    : string.Empty
        };
    }
}