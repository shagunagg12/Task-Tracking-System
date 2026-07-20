@echo off
echo Starting Backend (C# .NET Web API)...
start "Backend" cmd /c "cd Backend && dotnet run"

echo Starting Frontend (React/Vite)...
start "Frontend" cmd /c "cd Frontend && npm run dev -- --open"

echo Both frontend and backend are starting in separate windows!
