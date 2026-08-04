# MATTS (Management and Task Tracking System) 🚀

MATTS is a comprehensive, full-stack enterprise web application designed to streamline project management, facilitate team collaboration, and boost productivity through gamification and real-time communication.

## ✨ Key Features

*   **📊 Advanced Analytics & Dashboards:** Real-time metrics for tasks, projects, efficiency scoring, and department-wide analytics.
*   **💬 Real-Time Collaboration:** Live 1-on-1 and project-based group chats built with SignalR websockets, featuring unread badges and instant notifications.
*   **🗓️ Automated Meeting Scheduling:** Seamless integration with the **Google Calendar API (OAuth 2.0)** to auto-generate Google Meet links, paired with SMTP email invitations sent directly to participants.
*   **🏆 Gamification & Rewards Store:** Employees earn points for completing tasks and hitting milestones (e.g., Task Rookie). Points can be redeemed in the company Rewards Store for vouchers and perks.
*   **📋 Kanban Task Management:** Interactive Kanban boards for managing project workflows, assigning tasks, and tracking sprint progress.
*   **🔐 Role-Based Access Control (RBAC):** Distinct roles (Employee, Admin, SuperAdmin) using .NET Claims-based authentication to securely manage permissions, departments, and user access.
*   **☁️ CI/CD Pipeline:** Fully automated deployments to Azure App Service utilizing GitHub Actions workflows.

## 🛠️ Technology Stack

**Frontend:**
*   React.js (Vite)
*   Vanilla CSS (Custom, highly optimized responsive design)
*   React Router for navigation
*   Recharts for data visualization

**Backend:**
*   .NET 8 Web API
*   C# & Entity Framework Core (EF Core)
*   SQL Server
*   SignalR (Real-time websockets)
*   Google.Apis.Calendar.v3 (OAuth 2.0 Integration)
*   MailKit / SMTP (Email notifications)

**Architecture & Principles:**
*   **Service Layer Pattern:** Clean separation of business logic from controllers.
*   **Data Transfer Objects (DTOs):** Secure data transmission and payload minimization.
*   **SQL Query Optimization:** Extensive use of `AsNoTracking()`, efficient aggregations (`CountAsync`), and smart `.Select()` projections to prevent N+1 queries.
*   **Dependency Injection (DI):** Highly decoupled, testable backend services.

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+)
*   [.NET 8 SDK](https://dotnet.microsoft.com/download)
*   SQL Server

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Update the `appsettings.json` with your SQL Server Connection String, SMTP credentials, and JWT secret.
3. Apply Entity Framework migrations to set up the database:
   ```bash
   dotnet ef database update
   ```
4. Run the API:
   ```bash
   dotnet run
   ```
   *The backend will run on `http://localhost:5024`*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`*

## 🌐 Deployment
This project is configured with a GitHub Actions workflow (`main_matts.yml`) that automatically builds and deploys the .NET backend and React frontend build artifacts to an Azure Web App whenever changes are pushed to the `main` branch.

---
*Built with ❤️ by The Revenant Corps.*
