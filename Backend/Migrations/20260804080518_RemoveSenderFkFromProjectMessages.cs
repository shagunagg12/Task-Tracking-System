using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSenderFkFromProjectMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectMessages_Users_SenderId",
                table: "ProjectMessages");

            migrationBuilder.DropIndex(
                name: "IX_ProjectMessages_SenderId",
                table: "ProjectMessages");

            migrationBuilder.CreateTable(
                name: "UserPoints",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Points = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPoints", x => x.id);
                });

            migrationBuilder.UpdateData(
                table: "SuperAdmins",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$XGBJBIPzRNKi..oJLGWo/eajIrWPeyubZeuPO2.16aCwqNtf54zai");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserPoints");

            migrationBuilder.UpdateData(
                table: "SuperAdmins",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$vQt89wE6vLCy3A07cScGYueHZ.xizxc5gAV6J9v6jVWPRlVqbQili");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMessages_SenderId",
                table: "ProjectMessages",
                column: "SenderId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectMessages_Users_SenderId",
                table: "ProjectMessages",
                column: "SenderId",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
