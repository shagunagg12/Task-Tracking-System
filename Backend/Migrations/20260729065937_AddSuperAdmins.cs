using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSuperAdmins : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SuperAdmins",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProfilePictureUrl = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuperAdmins", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "SuperAdmins",
                columns: new[] { "Id", "Email", "FullName", "PasswordHash", "ProfilePictureUrl" },
                values: new object[] { 1, "connect2rachit882@gmail.com", "Rachit", "$2a$11$54uMqnkFFpn9y/G4h/AsKO2j7DCG5rV7nVklI/a7BX6tloOqT7.Bu", null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SuperAdmins");
        }
    }
}
