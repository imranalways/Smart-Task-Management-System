# Smart Task Management System

A full-stack project and task management application built with **ASP.NET Core 10**, **Entity Framework Core**, **SQL Server**, and **Angular 19**. It provides role-based project and task workflows, dashboard reporting, and an AI-assisted task-description improvement feature.

**GitHub repository:** https://github.com/imranalways/Smart-Task-Management-System

## Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Roles and Permissions](#roles-and-permissions)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Run the Application](#run-the-application)
- [API Overview](#api-overview)
- [AI Description Improvement](#ai-description-improvement)
- [Repository Structure](#repository-structure)
- [Security Notes](#security-notes)

## Features

### Authentication and Authorization
- User registration and login.
- JWT bearer authentication.
- Role-based authorization for Admin, Project Manager, and Team Member.
- Angular authentication route guard and HTTP interceptor.
- Refresh-token support is represented in the frontend authentication service; see the authentication API note below before describing it as fully operational.

### Project Management
- Create, view, update, and delete projects.
- Manage project members.
- Search, filter, sort, and paginate project lists.
- Role- and membership-aware project access.

### Task Management
- Create, view, update, and delete tasks.
- Assign and unassign tasks.
- Update task status and priority.
- Set due dates.
- Search, filter, sort, and paginate task lists.
- Restrict task assignment to eligible members of the task's project.

### Dashboard
- Total project and task statistics.
- Task counts by status and priority.
- Completed and pending task statistics.
- Upcoming due tasks.

### Additional Features
- AI-assisted task-description improvement.
- FluentValidation request validation.
- Global exception handling.
- Serilog logging.
- Swagger / OpenAPI documentation.
- SQL Server health check endpoint.
- Basic API rate limiting.
- Responsive Angular UI using standalone components.

## Technology Stack

| Layer | Technologies |
|---|---|
| Backend | ASP.NET Core 10, C# |
| Architecture | Layered architecture |
| ORM / Data access | Entity Framework Core |
| Database | Microsoft SQL Server |
| Authentication | JWT Bearer |
| Validation | FluentValidation |
| API documentation | Swagger / OpenAPI, Swashbuckle |
| Logging | Serilog |
| Frontend | Angular 19, TypeScript |
| UI | Bootstrap 5, Font Awesome |
| Reactive programming | RxJS |
| Authentication utility | jwt-decode |
| Notifications and dialogs | SweetAlert2 |
| AI integration | Gemini-compatible OpenAI chat-completions API |

## Architecture

The backend is divided into these projects:

- **SmartTask.API** — controllers, middleware, API configuration, authentication and authorization, Swagger, CORS, rate limiting, and application startup.
- **SmartTask.Application** — DTOs, service contracts, validators, common response models, and application exceptions.
- **SmartTask.Domain** — domain entities, role constants, and project/task enums.
- **SmartTask.Infrastructure** — EF Core persistence, repositories, application services, authentication implementation, AI provider integration, and migrations.
- **SmartTask.UnitTests** — unit test project.
- **SmartTask.IntegrationTests** — integration test project.

The Angular application uses standalone components and lazy-loaded feature routes. Shared services, models, guards, and interceptors are organized under `src/app/core`; feature pages are organized under `src/app/features`.

## Roles and Permissions

| Role | Responsibilities |
|---|---|
| **Admin** | Administrative access, user-role management, and project/team administration. |
| **Project Manager** | Create and manage projects and their members/tasks within backend-enforced permissions. |
| **Team Member** | View accessible projects and assigned tasks; update the status of tasks assigned to them. |

Task assignment is validated by the backend. The target user must be active, have the TeamMember role, and be a member of the task's project.

The backend is the authority for access control. Frontend visibility rules are not a substitute for API authorization.

## Prerequisites

Install:

- .NET 10 SDK.
- Node.js and npm compatible with the installed Angular CLI.
- Microsoft SQL Server (LocalDB or a local SQL Server instance).
- SQL Server Management Studio or another SQL client.
- Git.

## Configuration

### Backend connection string

Edit:

`Backend/SmartTaskManagementSystem/SmartTask.API/appsettings.json`

The repository currently contains a local SQL Server connection string similar to:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=localhost;Database=SmartTaskDb;Integrated Security=True;TrustServerCertificate=True;"
  }
}
```

Change it to match your SQL Server instance and authentication method.

### AI provider token

The AI provider reads its token from the `Ai:Token` configuration setting. Supply the token through a secure configuration source, such as .NET User Secrets or an environment variable. For PowerShell:

```powershell
$env:Ai__Token = "YOUR_AI_PROVIDER_TOKEN"
```

Never commit a real AI token to source control.

### Initial administrator

The startup seeder reads these settings:

- `DefaultAdmin:Email`
- `DefaultAdmin:Password`
- `DefaultAdmin:FirstName`
- `DefaultAdmin:LastName`

Configure them securely before running the API if the initial administrator account should be seeded. Example PowerShell variables:

```powershell
$env:DefaultAdmin__Email = "admin@example.com"
$env:DefaultAdmin__Password = "USE_A_STRONG_UNIQUE_PASSWORD"
$env:DefaultAdmin__FirstName = "System"
$env:DefaultAdmin__LastName = "Administrator"
```

Do not publish the actual administrator password in this repository or in screenshots.

### Frontend API URL

Check these files:

- `Frontend/smart-task-management-ui/src/environments/environment.ts`
- `Frontend/smart-task-management-ui/src/environments/environment.prod.ts`

The current repository value is `https://localhost:44341/api`. It must match the API URL you actually run. The API launch settings also define an HTTPS profile on port `7180`; if using that profile, update the Angular API URL accordingly.

## Database Setup

The SQL Server script is located at:

`Documents/SQL/SmartTaskDB.sql`

1. Start SQL Server.
2. Create a database named `SmartTaskDb` if it does not already exist.
3. Open `Documents/SQL/SmartTaskDB.sql` in SQL Server Management Studio.
4. Execute the script against the intended SQL Server instance.
5. Verify that the tables and relationships were created.
6. Confirm that the backend connection string targets the same database.

EF Core migrations are also included under:

`Backend/SmartTaskManagementSystem/SmartTask.Infrastructure/Migrations`

Use the SQL script or the EF Core migration workflow appropriate for the environment. Do not apply both blindly to an existing database; first inspect the schema and `__EFMigrationsHistory`.

## Run the Application

### 1. Restore and run the backend

From the repository root:

```bash
dotnet restore Backend/SmartTaskManagementSystem/SmartTask.API/SmartTask.API.csproj
dotnet run --project Backend/SmartTaskManagementSystem/SmartTask.API/SmartTask.API.csproj
```

Swagger is enabled in the Development environment. Open `/swagger` on the API's active HTTPS address, for example:

`https://localhost:7180/swagger`

The health-check endpoint is:

```http
GET /health
```

### 2. Install and run the frontend

Open another terminal:

```bash
cd Frontend/smart-task-management-ui
npm install
npm start
```

Open http://localhost:4200.

### 3. Build and test the frontend

```bash
npm run build
npm test
```

## API Overview

The exported OpenAPI specification is:

`Documents/API Collection/swagger.json`

The collection currently documents these routes:

| Area | Method | Endpoint | Description |
|---|---|---|---|
| AI | POST | `/api/ai/improve-description` | Improve a task description. |
| Authentication | POST | `/api/auth/register` | Register a user. |
| Authentication | POST | `/api/auth/login` | Authenticate a user. |
| Dashboard | GET | `/api/dashboard/summary` | Retrieve dashboard statistics. |
| Projects | POST | `/api/projects` | Create a project. |
| Projects | GET | `/api/projects` | Get a paginated project list. |
| Projects | GET | `/api/projects/{id}` | Get project details. |
| Projects | PUT | `/api/projects/{id}` | Update a project. |
| Projects | DELETE | `/api/projects/{id}` | Delete a project. |
| Project members | POST | `/api/projects/{projectId}/members` | Add a member. |
| Project members | GET | `/api/projects/{projectId}/members` | List project members. |
| Project members | DELETE | `/api/projects/{projectId}/members/{userId}` | Remove a member. |
| Tasks | POST | `/api/tasks` | Create a task. |
| Tasks | GET | `/api/tasks` | Get a paginated task list. |
| Tasks | GET | `/api/tasks/my` | Get tasks assigned to the current user. |
| Tasks | GET | `/api/tasks/{id}` | Get task details. |
| Tasks | PUT | `/api/tasks/{id}` | Update a task. |
| Tasks | DELETE | `/api/tasks/{id}` | Delete a task. |
| Tasks | POST | `/api/tasks/{taskId}/assign` | Assign a task. |
| Tasks | DELETE | `/api/tasks/{taskId}/assign` | Unassign a task. |
| Tasks | PUT | `/api/tasks/{taskId}/status` | Update task status. |
| Users | GET | `/api/users` | Get the active user directory. |
| Users | GET | `/api/users/GetUsersForTeamMember` | Get users for the team-member workflow. |
| User roles | GET | `/api/admin/user-roles/users` | List users and roles (Admin). |
| User roles | GET | `/api/admin/user-roles/roles` | List available roles (Admin). |
| User roles | PUT | `/api/admin/user-roles/users/{userId}` | Change a user's role (Admin). |

Most endpoints return the common `ApiResponse` envelope. Delete endpoints may return `204 No Content`. The AI endpoint returns its AI response DTO directly.

### Authentication endpoint verification note

In the current `main` branch, the backend `AuthController` and exported Swagger collection expose **register** and **login**. The Angular `AuthService` also contains calls to `/api/auth/refresh` and `/api/auth/logout`, but those two routes are not present in the current controller or Swagger export. Verify or implement those API endpoints before describing refresh-token rotation and server-side logout as fully operational end-to-end features.

## AI Description Improvement

The authenticated endpoint is:

```http
POST /api/ai/improve-description
Content-Type: application/json
Authorization: Bearer <access-token>
```

Example request:

```json
{
  "description": "fix login bug and check validation"
}
```

The response includes the original and improved descriptions. The AI provider is configured through the `Ai` settings section, including base URL, model, token, temperature, maximum token count, and timeout.

The current system prompt instructs the model to correct grammar, improve clarity, use professional wording, expand short descriptions, and make the task actionable. It asks the model to return only the improved description.

The request validator requires a non-empty description with a maximum length of 4,000 characters. See [PROMPTS.md](PROMPTS.md) for the prompt design, example, validation, and safety considerations.

## Repository Structure

```text
Smart-Task-Management-System/
├── Backend/
│   └── SmartTaskManagementSystem/
│       ├── SmartTask.API/
│       ├── SmartTask.Application/
│       ├── SmartTask.Domain/
│       ├── SmartTask.Infrastructure/
│       ├── SmartTask.UnitTests/
│       └── SmartTask.IntegrationTests/
├── Frontend/
│   └── smart-task-management-ui/
│       └── src/app/
│           ├── core/
│           ├── features/
│           ├── layouts/
│           └── shared/
├── Documents/
│   ├── API Collection/
│   │   └── swagger.json
│   └── SQL/
│       └── SmartTaskDB.sql
├── PROMPTS.md
└── README.md
```

## Security Notes

- Keep JWT signing secrets, AI provider tokens, database credentials, and administrator credentials out of source control.
- Replace local development connection strings and localhost API URLs for deployment.
- Configure CORS for the actual frontend origin.
- Use strong, unique administrator credentials.
- The AI feature sends submitted task-description text to the configured external AI provider. Do not include secrets or confidential personal data in task descriptions.
- Review AI-generated text before saving it.
- The current AI request validator checks presence and maximum length; it is not a prompt-injection detector or a content-moderation system.
