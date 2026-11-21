using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartTask.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartTask.Infrastructure.Persistence.Configurations
{
    public class ProjectConfiguration
    : IEntityTypeConfiguration<Project>
    {
        public void Configure(
            EntityTypeBuilder<Project> builder)
        {
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Name)
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(x => x.Description)
                .HasMaxLength(2000);

            builder.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
