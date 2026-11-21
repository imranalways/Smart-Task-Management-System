using SmartTask.Application.Features.Dashboard.DTOs;

namespace SmartTask.Application.Features.Dashboard.Services;

public interface IDashboardService
{
    Task<DashboardSummaryDto>
        GetSummaryAsync();
}