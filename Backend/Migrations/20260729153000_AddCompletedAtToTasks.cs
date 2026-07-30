using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCompletedAtToTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "ProjectTasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "SuperAdmins",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$qiK9KOfKXKnwICc1e.lgGu83eXW3qYy/HG624sexp3QinFhWqvJBq");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "ProjectTasks");

            migrationBuilder.UpdateData(
                table: "SuperAdmins",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$.gkxx1a.R/6TKCOJTWaPd.EisY2n0XD59YFHjSrLYkhGlHd2fdSri");
        }
    }
}
