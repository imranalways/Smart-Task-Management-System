using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartTask.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartTask.Infrastructure.Persistence.Configurations
{
    public class ProjectMemberConfiguration
    : IEntityTypeConfiguration<ProjectMember>
    {
        public void Configure(
            EntityTypeBuilder<ProjectMember> builder)
        {
            builder.HasKey(x => x.Id);

            builder.HasOne(x => x.Project)
                .WithMany(x => x.Members)
                .HasForeignKey(x => x.ProjectId);

            builder.HasOne(x => x.User)
                .WithMany(x => x.ProjectMemberships)
                .HasForeignKey(x => x.UserId);

            builder.HasIndex(x =>
                new
                {
                    x.ProjectId,
                    x.UserId
                })
                .IsUnique();
        }
    }
}
