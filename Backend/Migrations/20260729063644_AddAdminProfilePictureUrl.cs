using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminProfilePictureUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.AddColumn<string>(
                name: "ProfilePictureUrl",
                table: "Admins",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AppNotifications_Meetings_MeetingId",
                table: "AppNotifications",
                column: "MeetingId",
                principalTable: "Meetings",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AppNotifications_ProjectTasks_TaskId",
                table: "AppNotifications",
                column: "TaskId",
                principalTable: "ProjectTasks",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AppNotifications_Projects_ProjectId",
                table: "AppNotifications",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id");
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

            migrationBuilder.DropColumn(
                name: "ProfilePictureUrl",
                table: "Admins");

            migrationBuilder.AddForeignKey(
                name: "FK_AppNotifications_Meetings_MeetingId",
                table: "AppNotifications",
                column: "MeetingId",
                principalTable: "Meetings",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AppNotifications_ProjectTasks_TaskId",
                table: "AppNotifications",
                column: "TaskId",
                principalTable: "ProjectTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AppNotifications_Projects_ProjectId",
                table: "AppNotifications",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
