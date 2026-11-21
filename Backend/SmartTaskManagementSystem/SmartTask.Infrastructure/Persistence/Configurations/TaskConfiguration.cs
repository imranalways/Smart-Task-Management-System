using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartTask.Domain.Entities;

namespace SmartTask.Infrastructure.Persistence.Configurations;

public class TaskConfiguration
    : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(
        EntityTypeBuilder<TaskItem> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(4000);

        builder.HasOne(x => x.Project)
            .WithMany(x => x.Tasks)
            .HasForeignKey(x => x.ProjectId);

        builder.HasOne(x => x.AssignedToUser)
            .WithMany(x => x.AssignedTasks)
            .HasForeignKey(x => x.AssignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}