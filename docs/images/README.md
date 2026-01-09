# Diagram Images

This folder contains diagram screenshots referenced in the main README.

## Required Diagrams

### 1. `erd-diagram.png`
**Entity Relationship Diagram** showing:
- Organization (with parent-child hierarchy)
- User (with roles and organization links)
- Task (with status, priority, assignments)
- AuditLog (for security tracking)

**How to generate:**
1. Copy the PlantUML code below
2. Paste into [plantuml.com](http://www.plantuml.com/plantuml/uml/)
3. Export as PNG and save as `erd-diagram.png`

```plantuml
@startuml
!define Table(name,desc) class name as "desc" << (T,#FFAAAA) >>
!define primary_key(x) <b>PK: x</b>
!define foreign_key(x) <color:blue><b>FK: x</b></color>

Table(Organization, "Organization") {
  primary_key(id: UUID)
  --
  name: String
  parentId: UUID (nullable)
  createdAt: DateTime
  updatedAt: DateTime
}

Table(User, "User") {
  primary_key(id: UUID)
  --
  username: String {unique}
  email: String {unique}
  password: String (hashed)
  role: Enum (OWNER|ADMIN|VIEWER)
  foreign_key(organizationId: UUID)
  createdAt: DateTime
  updatedAt: DateTime
}

Table(Task, "Task") {
  primary_key(id: UUID)
  --
  title: String
  description: Text
  status: Enum (todo|in_progress|done)
  priority: Enum (low|medium|high)
  category: String
  order: Integer
  foreign_key(organizationId: UUID)
  foreign_key(createdById: UUID)
  foreign_key(assignedToId: UUID) (nullable)
  createdAt: DateTime
  updatedAt: DateTime
}

Table(AuditLog, "Audit Log") {
  primary_key(id: UUID)
  --
  foreign_key(userId: UUID)
  action: String (CREATE|UPDATE|DELETE|LOGIN)
  entityType: String (task|user|organization)
  entityId: UUID (nullable)
  details: Text
  ipAddress: String (nullable)
  createdAt: DateTime
}

Organization "1" *-- "0..*" Organization : parent/child
Organization "1" *-- "0..*" User : has users
Organization "1" *-- "0..*" Task : has tasks
User "1" *-- "0..*" Task : created by
User "1" *-- "0..*" Task : assigned to
User "1" *-- "0..*" AuditLog : performed by

@enduml
```

---

### 2. `jwt-flow.png`
**JWT Authentication Flow** sequence diagram showing:
- User login with credentials
- Password verification with bcrypt
- JWT token generation and storage
- Authenticated API requests with Bearer token
- RBAC permission checks

**How to generate:**
1. Copy the PlantUML code below
2. Paste into [plantuml.com](http://www.plantuml.com/plantuml/uml/)
3. Export as PNG and save as `jwt-flow.png`

```plantuml
@startuml
actor User
participant Frontend
participant "Backend\nAuth Controller" as Auth
participant "JWT Strategy" as JWT
database "Database" as DB

User -> Frontend: Enter username/password
Frontend -> Auth: POST /api/auth/login
Auth -> DB: Find user by username
DB --> Auth: User record
Auth -> Auth: Compare password\n(bcrypt.compare)
Auth -> Auth: Generate JWT token\n(payload: {userId, username, role, orgId})
Auth --> Frontend: {access_token, user}
Frontend -> Frontend: Store token in localStorage
Frontend -> Auth: GET /api/tasks\n(Authorization: Bearer <token>)
Auth -> JWT: Validate token signature
JWT -> DB: Load user by ID from token
DB --> JWT: User with role & org
JWT -> Auth: Attach user to request
Auth -> Auth: Check RBAC permissions
Auth --> Frontend: Task data (if authorized)

@enduml
```

---

## Alternative: VS Code PlantUML Extension

Instead of using the online tool, you can install the **PlantUML extension** in VS Code:

1. Install extension: `jebbs.plantuml`
2. Install Java (required for PlantUML)
3. Open the PlantUML code in a `.puml` file
4. Press `Alt+D` to preview
5. Right-click preview → Export as PNG

---

## Optional: Additional Screenshots

You can also add screenshots of the application itself:
- `dashboard-light.png` - Light mode Kanban board
- `dashboard-dark.png` - Dark mode Kanban board
- `analytics-chart.png` - Task completion metrics
- `keyboard-shortcuts.png` - Shortcuts help modal

Simply take screenshots and reference them in the README with:
```markdown
![Dashboard Light Mode](./docs/images/dashboard-light.png)
```
