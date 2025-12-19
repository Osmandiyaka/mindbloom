# MindBloom AI Coding Agent Instructions

## Project Overview
MindBloom is a multi-tenant SaaS school management system with a plugin marketplace architecture. Built as a monorepo with Angular 17 frontend, NestJS backend, and MongoDB.

## Architecture Fundamentals

### Hexagonal Architecture (Backend)
- **Domain Layer** (`backend/src/domain/`): Pure business entities & port interfaces (e.g., `IStudentRepository`)
- **Application Layer** (`backend/src/application/`): Use cases orchestrating business logic
- **Infrastructure Layer** (`backend/src/infrastructure/`): Concrete implementations (Mongoose repositories, mail adapters)
- **Presentation Layer** (`backend/src/modules/*/controllers`): REST controllers handling HTTP

**Pattern**: Always inject port interfaces, not concrete implementations. Use `@Inject(STUDENT_REPOSITORY)` tokens.

### Multi-Tenancy (Critical)
All data operations MUST be tenant-scoped. This is enforced at the repository level:

```typescript
// Extend TenantScopedRepository in backend/src/common/tenant/
export class MyRepository extends TenantScopedRepository<MyDoc, MyEntity> {
  async findAll() {
    const filter = this.withTenantFilter({}); // Auto-adds tenantId
    return this.model.find(filter);
  }
}
```

- `TenantContext` (request-scoped) provides `tenantId` from JWT/subdomain
- **Never** write queries without tenant filtering - use `withTenantFilter()` or `requireTenant()`
- See [backend/docs/adr/001-multi-tenant-architecture.md](backend/docs/adr/001-multi-tenant-architecture.md) for isolation strategy

### Plugin System
Plugins extend platform functionality via marketplace installation. Each plugin implements `IPlugin` with lifecycle hooks:

```typescript
// backend/src/core/plugins/plugin.interface.ts
interface IPlugin {
  manifest: PluginManifest;
  onInstall(context: PluginContext): Promise<void>;
  onEnable(context: PluginContext): Promise<void>;
  onDisable/onUninstall...
}
```

**Key Collections**:
- `plugins`: Marketplace catalog (all available plugins)
- `installed_plugins`: Per-tenant installations with status (installed/enabled/disabled)

**Plugin Routes**: Registered at `/api/plugins/{pluginId}/*` based on manifest. See [backend/src/plugins/library-management/library.plugin.ts](backend/src/plugins/library-management/library.plugin.ts) for reference implementation.

## Development Workflows

### Local Development Setup
```bash
# From root - starts both frontend:4200 and backend:3000
npm run dev

# Backend API: http://localhost:3000/api
# Swagger docs: http://localhost:3000/api/docs
# Frontend: http://localhost:4200
```

### Building
```bash
npm run build           # All packages (shared → web → api)
npm run build:shared    # Always build shared first (used by both)
```

### Testing & Seeding
```bash
# Backend tests
cd backend && npm run test

# Seed plugins marketplace
node scripts/seed-marketplace.js

# Create test tenant
node scripts/create-test-tenant.js
```

**Scripts**: All in `scripts/*.js` - use these for data seeding, tenant provisioning, plugin installation testing.

## Frontend Patterns (Angular 17)

### Standalone Components
All components use Angular 17 standalone pattern - no NgModules:
```typescript
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, /* ... */],
  // ...
})
```

### Authentication & Routing
- `AuthService` (signals-based): `session()`, `status()`, `isAuthenticated()`
- Auth stored in localStorage via `AuthStorage` class
- Multi-tenancy: Users can have memberships in multiple tenants
- Guards: Check auth before accessing protected routes

### Theme System
Runtime-switchable themes via `ThemeService` (7 themes: 4 light, 3 dark + auto mode):
```typescript
themeService.setTheme('ocean-blue-light');
themeService.setMode('dark' | 'light' | 'auto');
```
Persisted to localStorage. See [THEME_SYSTEM.md](THEME_SYSTEM.md).

### Component Organization
- **Core** (`frontend/src/app/core/`): Auth, guards, interceptors, services
- **Shared** (`frontend/src/app/shared/components/`): Reusable UI components (buttons, cards, modals)
- **Modules** (`frontend/src/app/modules/`): Feature modules (students, library, dashboard)
- **Layouts** (`frontend/src/app/layouts/`): Page layouts with sidebar

### Style Architecture
Global SCSS theme in `frontend/src/styles/theme/`:
- `_colors.scss`: Complete palette (AccentBlue, Slate system, semantic colors)
- `_button.scss`, `_input.scss`, `_card.scss`, etc.: Component-level styles
- Use mixins from `_mixins.scss` for consistent styling

## Database & ORM

### Mongoose (not Prisma)
Despite references to Prisma in docs, the project uses **Mongoose** with MongoDB:
- Schemas in `backend/src/plugins/*/schemas/`
- All entities MUST include `tenantId: string` field
- Use Mongoose middleware for pre-hooks when needed

### Connection Handling
Single MongoDB connection by default. Hybrid architecture allows dedicated DB per tenant (see ADR-001).

## Common Patterns

### Creating a New Feature Module (Backend)
1. Add domain entity in `domain/{feature}/entities/`
2. Define port interface in `domain/{feature}/ports/`
3. Implement repository in `infrastructure/adapters/{feature}/` extending `TenantScopedRepository`
4. Create use cases in `application/{feature}/use-cases/`
5. Add controller in `modules/{feature}/` injecting use cases
6. Register module in `app.module.ts`

### Creating a New Plugin
1. Create directory in `backend/src/plugins/{plugin-name}/`
2. Implement `IPlugin` interface with manifest
3. Define Mongoose schemas with `tenantId` field
4. Register routes in manifest.provides.routes
5. Seed marketplace: Add entry to `scripts/seed-marketplace.js`

### Frontend Module Creation
1. Generate with Angular CLI or create manually in `modules/{feature}/`
2. Add route to `app.routes.ts` with lazy loading
3. Add menu item to sidebar in `layouts/layout-with-sidebar/`
4. Use shared components from `app/shared/components/`

## Critical Guidelines

1. **Never skip tenant filtering** - All DB queries must filter by `tenantId`
2. **Use dependency injection properly** - Inject interfaces (ports) in use cases, not concrete classes
3. **Respect hexagonal boundaries** - Domain layer has no external dependencies
4. **Plugin lifecycle matters** - Handle install/enable/disable/uninstall hooks properly
5. **Shared models first** - Update `shared/models/` when adding cross-cutting types
6. **Auth flows are multi-tenant** - Users can belong to multiple tenants; always respect active tenant

## Key Reference Files
- [PLUGIN_ARCHITECTURE.md](PLUGIN_ARCHITECTURE.md) - Complete plugin system design
- [backend/HEXAGONAL_ARCHITECTURE.md](backend/HEXAGONAL_ARCHITECTURE.md) - Clean architecture layers
- [backend/docs/adr/001-multi-tenant-architecture.md](backend/docs/adr/001-multi-tenant-architecture.md) - Tenancy strategy
- [QUICKSTART.md](QUICKSTART.md) - Setup instructions
- [PLUGIN_WORKFLOW.md](PLUGIN_WORKFLOW.md) - Plugin installation flow
