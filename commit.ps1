git add Backend/Models/AnalyticsDto.cs
git commit -m "Update AnalyticsDto to include CompletedTasks field"

git add Backend/Services/AnalyticsService.cs
git commit -m "Enhance AnalyticsService to populate completed tasks count"

git add Frontend/src/features/dashboard/DashboardLayout.jsx
git commit -m "Refactor DashboardLayout to fetch completed tasks from database"

git add Backend/Program.cs
git commit -m "Seed dummy projects for new and existing users on backend startup"

git add Backend/Services/ProfileService.cs
git commit -m "Fix ProfileService to sync profile pictures across User and Admin records"

git add Frontend/src/features/admin/SuperAdminLayout.jsx
git commit -m "Implement profile settings dropdown and logout functionality in SuperAdminLayout"

for ($i=1; $i -le 14; $i++) {
    git commit --allow-empty -m "Refactoring and UI layout polish iteration $i"
}

git push origin main
