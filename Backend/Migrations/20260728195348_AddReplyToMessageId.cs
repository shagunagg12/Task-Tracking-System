using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddReplyToMessageId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ReplyToMessageId",
                table: "ProjectMessages",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReplyToMessageId",
                table: "Messages",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReplyToMessageId",
                table: "ProjectMessages");

            migrationBuilder.DropColumn(
                name: "ReplyToMessageId",
                table: "Messages");
        }
    }
}
