using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMeetingForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MeetingId",
                table: "AppNotifications",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "AppNotifications",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TaskId",
                table: "AppNotifications",
                type: "int",
                nullable: true);

            // MeetingParticipants and Meetings already exist in database

            migrationBuilder.CreateIndex(
                name: "IX_AppNotifications_MeetingId",
                table: "AppNotifications",
                column: "MeetingId");

            migrationBuilder.CreateIndex(
                name: "IX_AppNotifications_ProjectId",
                table: "AppNotifications",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_AppNotifications_TaskId",
                table: "AppNotifications",
                column: "TaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppNotifications_Meetings_MeetingId",
                table: "AppNotifications",
                column: "MeetingId",
                principalTable: "Meetings",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_AppNotifications_ProjectTasks_TaskId",
                table: "AppNotifications",
                column: "TaskId",
                principalTable: "ProjectTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_AppNotifications_Projects_ProjectId",
                table: "AppNotifications",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppNotifications_Meetings_MeetingId",
                table: "AppNotifications");

            migrationBuilder.DropForeignKey(
                name: "FK_AppNotifications_ProjectTasks_TaskId",
                table: "AppNotifications");

            migrationBuilder.DropForeignKey(
                name: "FK_AppNotifications_Projects_ProjectId",
                table: "AppNotifications");

            // MeetingParticipants and Meetings left intact on rollback

            migrationBuilder.DropIndex(
                name: "IX_AppNotifications_MeetingId",
                table: "AppNotifications");

            migrationBuilder.DropIndex(
                name: "IX_AppNotifications_ProjectId",
                table: "AppNotifications");

            migrationBuilder.DropIndex(
                name: "IX_AppNotifications_TaskId",
                table: "AppNotifications");

            migrationBuilder.DropColumn(
                name: "MeetingId",
                table: "AppNotifications");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "AppNotifications");

            migrationBuilder.DropColumn(
                name: "TaskId",
                table: "AppNotifications");
        }
    }
}
