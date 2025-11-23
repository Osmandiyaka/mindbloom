# 🚀 Phase 1 Quick Start Guide

> **Goal:** Build the Plugin Framework - the architectural foundation for MindBloom Cloud  
> **Timeline:** 4-6 weeks  
> **Team Size:** 2-3 developers

---

## 📋 Phase 1 Overview

Phase 1 establishes the **platform foundation** that all other features depend on. The plugin framework is the most critical piece - it determines how we'll scale from 17 EPICs to 100+ features through a plugin ecosystem.

### What We're Building

1. **Plugin Framework** - Dynamic module loading, lifecycle management
2. **Enhanced RBAC** - Granular permissions for multi-tenant users
3. **Tenant Self-Service Portal** - Tenant admins manage their own settings
4. **Audit Logging** - Compliance-ready activity tracking

---

## 🎯 Week-by-Week Breakdown

### Week 1-2: Plugin Framework (P1.2) ⭐ CRITICAL PATH

**Objective:** Sample plugin can be installed/enabled/disabled without code changes

#### Day 1-2: Plugin Interface Design

**Backend Tasks:**
```bash
# Create plugin core files
mkdir -p backend/src/core/plugins
touch backend/src/core/plugins/plugin.interface.ts
touch backend/src/core/plugins/plugin.context.ts
touch backend/src/core/plugins/plugin-loader.service.ts
touch backend/src/core/plugins/plugin-registry.service.ts
```

**Files to Create:**

`plugin.interface.ts`:
```typescript
export interface IPlugin {
  // Metadata
  manifest: PluginManifest;
  
  // Lifecycle hooks
  onInstall(context: PluginContext): Promise<void>;
  onEnable(context: PluginContext): Promise<void>;
  onDisable(context: PluginContext): Promise<void>;
  onUninstall(context: PluginContext): Promise<void>;
}

export interface PluginManifest {
  id: string;                    // e.g., "sms-gateway-twilio"
  name: string;                  // e.g., "Twilio SMS Gateway"
  version: string;               // e.g., "1.0.0"
  description: string;
  author: string;
  homepage?: string;
  
  // Permissions required
  permissions: PluginPermission[];
  
  // Dependencies
  dependencies?: {
    core?: string;               // e.g., ">=1.0.0"
    plugins?: Record<string, string>;
  };
  
  // Extension points
  provides: {
    routes?: PluginRoute[];
    menuItems?: PluginMenuItem[];
    dashboardWidgets?: PluginWidget[];
    settings?: PluginSettingSchema[];
  };
}

export enum PluginPermission {
  READ_STUDENTS = 'students:read',
  WRITE_STUDENTS = 'students:write',
  SEND_SMS = 'communications:sms:send',
  MANAGE_SETTINGS = 'settings:manage',
}

export interface PluginContext {
  tenantId: string;
  database: DatabaseAdapter;
  eventBus: EventBus;
  logger: Logger;
  storage: StorageAdapter;
  config: PluginConfig;
}
```

`plugin.context.ts`:
```typescript
import { Injectable, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable({ scope: Scope.REQUEST })
export class PluginContext {
  constructor(
    private readonly tenantId: string,
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
  ) {}

  // Tenant-isolated database access
  getDatabaseAdapter(): DatabaseAdapter {
    return new DatabaseAdapter(this.tenantId);
  }

  // Plugin-specific storage (S3 bucket: {env}-plugins-{pluginId}-{tenantId})
  getStorageAdapter(pluginId: string): StorageAdapter {
    return new StorageAdapter(`plugins/${pluginId}/${this.tenantId}`);
  }

  // Pub/Sub for inter-plugin communication
  getEventBus(): EventBus {
    return this.eventBus;
  }

  // Plugin-scoped logger
  getLogger(pluginId: string): Logger {
    return this.logger.child({ plugin: pluginId, tenant: this.tenantId });
  }
}
```

**Acceptance Test:**
```typescript
describe('Plugin Interface', () => {
  it('should define all lifecycle hooks', () => {
    const plugin: IPlugin = new SamplePlugin();
    expect(plugin.onInstall).toBeDefined();
    expect(plugin.onEnable).toBeDefined();
    expect(plugin.onDisable).toBeDefined();
    expect(plugin.onUninstall).toBeDefined();
  });
});
```

---

#### Day 3-4: Plugin Loader Service

**Task:** Dynamically load plugins at runtime

`plugin-loader.service.ts`:
```typescript
@Injectable()
export class PluginLoaderService {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly registry: PluginRegistryService,
  ) {}

  async loadPlugin(pluginPath: string, tenantId: string): Promise<void> {
    // 1. Read plugin directory
    const manifest = await this.readManifest(`${pluginPath}/plugin.json`);
    
    // 2. Validate manifest
    this.validateManifest(manifest);
    
    // 3. Import plugin module (NestJS dynamic module)
    const PluginModule = await import(`${pluginPath}/plugin.module`);
    
    // 4. Register module dynamically
    const moduleRef = await this.moduleRef.create(PluginModule.default);
    
    // 5. Get plugin instance
    const plugin = moduleRef.get<IPlugin>('PLUGIN_INSTANCE');
    
    // 6. Register in registry
    await this.registry.register(manifest.id, plugin, tenantId);
    
    // 7. Call onInstall hook
    const context = this.createContext(tenantId, manifest.id);
    await plugin.onInstall(context);
  }

  private createContext(tenantId: string, pluginId: string): PluginContext {
    return new PluginContext(
      tenantId,
      this.eventBus,
      this.logger.child({ plugin: pluginId }),
    );
  }
}
```

**Database Schema for Installed Plugins:**
```typescript
// backend/src/infrastructure/persistence/mongoose/schemas/plugin-installation.schema.ts
export const PluginInstallationSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  pluginId: { type: String, required: true },
  version: { type: String, required: true },
  status: { type: String, enum: ['installed', 'enabled', 'disabled'], required: true },
  installedAt: { type: Date, default: Date.now },
  enabledAt: { type: Date },
  config: { type: Schema.Types.Mixed }, // Plugin-specific settings
});

PluginInstallationSchema.index({ tenantId: 1, pluginId: 1 }, { unique: true });
```

**Acceptance Test:**
```bash
# Manually test loading sample plugin
npm run plugin:install -- --plugin=./plugins/sample-hello-world --tenant=greenfield
```

---

#### Day 5-6: Event Bus for Inter-Plugin Communication

`event-bus.service.ts`:
```typescript
@Injectable()
export class EventBus {
  private readonly emitter = new EventEmitter2({
    wildcard: true,
    delimiter: '.',
    maxListeners: 100,
  });

  // Publish event
  publish(event: string, payload: any, tenantId: string): void {
    const tenantedEvent = `${tenantId}.${event}`;
    this.emitter.emit(tenantedEvent, payload);
  }

  // Subscribe to event (tenant-isolated)
  subscribe(event: string, tenantId: string, handler: (payload: any) => void): void {
    const tenantedEvent = `${tenantId}.${event}`;
    this.emitter.on(tenantedEvent, handler);
  }

  // Example: Student created event
  // publisher: eventBus.publish('student.created', { studentId: '123' }, 'greenfield')
  // subscriber: eventBus.subscribe('student.created', 'greenfield', (data) => { ... })
}
```

**Sample Plugin Using Event Bus:**
```typescript
// plugins/sample-sms-notifier/plugin.ts
export class SmsNotifierPlugin implements IPlugin {
  async onEnable(context: PluginContext): Promise<void> {
    const eventBus = context.getEventBus();
    
    // Listen for student.created event
    eventBus.subscribe('student.created', context.tenantId, async (data) => {
      const { studentId, guardianPhone } = data;
      await this.sendWelcomeSms(guardianPhone);
    });
  }

  private async sendWelcomeSms(phone: string): Promise<void> {
    // Send SMS via Twilio
  }
}
```

---

#### Day 7-10: Sample Plugin Development

**Create "Hello World" Plugin:**

```bash
mkdir -p plugins/sample-hello-world
cd plugins/sample-hello-world
```

**Directory Structure:**
```
plugins/sample-hello-world/
├── plugin.json              # Manifest
├── plugin.module.ts         # NestJS module
├── plugin.ts                # Plugin implementation
├── controllers/
│   └── hello.controller.ts  # Adds route /api/plugins/hello
└── README.md
```

`plugin.json`:
```json
{
  "id": "hello-world",
  "name": "Hello World Sample Plugin",
  "version": "1.0.0",
  "description": "Demonstrates plugin architecture",
  "author": "MindBloom Team",
  "permissions": [],
  "provides": {
    "routes": [
      {
        "path": "/plugins/hello",
        "method": "GET",
        "controller": "HelloController.getHello"
      }
    ],
    "menuItems": [
      {
        "label": "Hello Plugin",
        "icon": "👋",
        "route": "/plugins/hello",
        "parent": "system"
      }
    ]
  }
}
```

`plugin.ts`:
```typescript
export class HelloWorldPlugin implements IPlugin {
  manifest = require('./plugin.json');

  async onInstall(context: PluginContext): Promise<void> {
    context.getLogger().info('HelloWorld plugin installed');
    
    // Create plugin-specific table
    const db = context.getDatabaseAdapter();
    await db.createCollection(`${context.tenantId}_hello_logs`);
  }

  async onEnable(context: PluginContext): Promise<void> {
    context.getLogger().info('HelloWorld plugin enabled');
  }

  async onDisable(context: PluginContext): Promise<void> {
    context.getLogger().info('HelloWorld plugin disabled');
  }

  async onUninstall(context: PluginContext): Promise<void> {
    // Cleanup: drop plugin tables
    const db = context.getDatabaseAdapter();
    await db.dropCollection(`${context.tenantId}_hello_logs`);
  }
}
```

**Test Installation:**
```bash
# Backend: Install plugin for tenant
POST /api/tenants/greenfield/plugins
{
  "pluginPath": "/plugins/sample-hello-world"
}

# Expected Response:
{
  "message": "Plugin installed successfully",
  "pluginId": "hello-world",
  "status": "enabled"
}

# Test plugin route
GET /api/plugins/hello
# Response: { "message": "Hello from plugin!" }
```

---

### Week 3-4: Enhanced RBAC System (P2.2)

**Objective:** Granular permission system with custom roles

#### Day 11-13: Role & Permission Entities

**Backend Structure:**
```bash
mkdir -p backend/src/domain/rbac
mkdir -p backend/src/application/rbac/use-cases
mkdir -p backend/src/adapters/http/rbac
```

**Domain Entities:**

`role.entity.ts`:
```typescript
export class Role {
  id: string;
  tenantId: string;
  name: string;                    // e.g., "Teacher", "Librarian"
  description: string;
  isSystemRole: boolean;           // System roles (SuperAdmin) cannot be deleted
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;

  static create(data: CreateRoleDto): Role {
    // Validation logic
    return new Role(data);
  }

  hasPermission(permission: string): boolean {
    return this.permissions.some(p => p.resource === permission);
  }
}
```

`permission.entity.ts`:
```typescript
export class Permission {
  resource: string;               // e.g., "students"
  actions: PermissionAction[];    // ['read', 'create', 'update', 'delete']
  scope: PermissionScope;         // 'own', 'department', 'all'
  conditions?: Record<string, any>; // e.g., { "status": "active" }
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
}

export enum PermissionScope {
  OWN = 'own',           // Teacher sees only their classes
  DEPARTMENT = 'dept',   // HOD sees entire department
  ALL = 'all',           // Principal sees all
}
```

**Predefined System Roles:**
```typescript
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    permissions: ['*:*'], // All permissions
  },
  TENANT_ADMIN: {
    name: 'Tenant Admin',
    permissions: [
      'tenants:*',
      'users:*',
      'roles:*',
      'plugins:*',
    ],
  },
  PRINCIPAL: {
    name: 'Principal',
    permissions: [
      'students:*',
      'staff:read',
      'academics:*',
      'reports:*',
    ],
  },
  TEACHER: {
    name: 'Teacher',
    permissions: [
      'students:read',
      'attendance:create',
      'grades:create',
    ],
    scope: PermissionScope.OWN, // Only their classes
  },
  PARENT: {
    name: 'Parent',
    permissions: [
      'students:read',
      'fees:read',
    ],
    scope: PermissionScope.OWN, // Only their children
  },
};
```

---

#### Day 14-16: Permission Guard Implementation

`permission.guard.ts`:
```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user has required permissions
    return this.hasPermissions(user.role, requiredPermissions);
  }

  private hasPermissions(role: Role, required: string[]): boolean {
    return required.every(permission =>
      role.permissions.some(p => this.matchesPermission(p, permission))
    );
  }

  private matchesPermission(userPerm: Permission, required: string): boolean {
    // Wildcard support: "students:*" matches "students:read"
    const [resource, action] = required.split(':');
    return (
      userPerm.resource === resource &&
      (userPerm.actions.includes(action) || userPerm.actions.includes('*'))
    );
  }
}
```

**Usage in Controller:**
```typescript
@Controller('students')
@UseGuards(TenantGuard, PermissionGuard)
export class StudentsController {
  @Get()
  @Permissions('students:read')  // Custom decorator
  async findAll(@CurrentUser() user: User) {
    // If user is Teacher, auto-filter to their classes
    if (user.role.scope === PermissionScope.OWN) {
      return this.studentService.findByTeacher(user.id);
    }
    return this.studentService.findAll();
  }

  @Post()
  @Permissions('students:create')
  async create(@Body() dto: CreateStudentDto) {
    // ...
  }
}
```

---

#### Day 17-18: Frontend Role Management UI

**Role List Page:**
```typescript
// frontend/src/app/modules/setup/pages/roles/role-list.component.ts
export class RoleListComponent {
  roles = signal<Role[]>([]);

  async ngOnInit() {
    this.roles.set(await this.roleService.getRoles());
  }

  async deleteRole(roleId: string) {
    if (confirm('Delete role?')) {
      await this.roleService.delete(roleId);
      this.loadRoles();
    }
  }
}
```

**Permission Matrix UI:**
```html
<!-- role-edit.component.html -->
<h2>Edit Role: {{ role().name }}</h2>

<table class="permission-matrix">
  <thead>
    <tr>
      <th>Resource</th>
      <th>Read</th>
      <th>Create</th>
      <th>Update</th>
      <th>Delete</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let resource of resources()">
      <td>{{ resource.label }}</td>
      <td><input type="checkbox" [(ngModel)]="permissions[resource.key].read" /></td>
      <td><input type="checkbox" [(ngModel)]="permissions[resource.key].create" /></td>
      <td><input type="checkbox" [(ngModel)]="permissions[resource.key].update" /></td>
      <td><input type="checkbox" [(ngModel)]="permissions[resource.key].delete" /></td>
    </tr>
  </tbody>
</table>

<button (click)="save()">Save Role</button>
```

---

### Week 5: Tenant Self-Service Portal (P2.1)

**Objective:** Tenant admins manage settings without developer intervention

#### Features to Implement

1. **School Settings Page**
   - School name, logo upload, address, contact
   - Timezone selection
   - Academic calendar (start/end dates)
   - Locale settings

2. **User Invitation System**
   - Send email invite with magic link
   - Pre-assign role (Principal, Teacher, etc.)
   - Bulk invite via CSV

3. **Subscription Management**
   - View current plan (Free, Basic, Premium, Enterprise)
   - Usage dashboard (students enrolled, storage used)
   - Upgrade/downgrade plan
   - View invoices

4. **Plugin Marketplace Browser**
   - List available plugins
   - Install/uninstall plugins
   - Configure plugin settings

---

### Week 6: Audit Logging (P2.3)

**Objective:** Track all user actions for compliance (FERPA/GDPR)

**Audit Log Entity:**
```typescript
export class AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;              // 'student.created', 'fees.payment.collected'
  resource: string;            // 'Student'
  resourceId: string;          // '507f1f77bcf86cd799439011'
  oldValue?: any;              // Snapshot before update
  newValue?: any;              // Snapshot after update
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

**Auto-Logging Decorator:**
```typescript
export function Auditable(action: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // Log action to audit log
      await this.auditService.log({
        action,
        resource: target.constructor.name,
        resourceId: result.id,
        newValue: result,
      });

      return result;
    };
  };
}

// Usage
@Auditable('student.created')
async createStudent(dto: CreateStudentDto) {
  return this.studentRepository.save(dto);
}
```

---

## ✅ Phase 1 Completion Checklist

### Plugin Framework
- [ ] `IPlugin` interface defined with lifecycle hooks
- [ ] `PluginLoaderService` dynamically loads modules
- [ ] `PluginRegistryService` tracks installed plugins
- [ ] `EventBus` enables inter-plugin communication
- [ ] Sample "Hello World" plugin working end-to-end
- [ ] Plugin can add routes dynamically
- [ ] Plugin can add menu items dynamically
- [ ] Plugin has isolated database tables (`{tenantId}_{pluginId}_table`)
- [ ] Frontend plugin SDK defined (Angular)

### RBAC System
- [ ] `Role` and `Permission` entities created
- [ ] `PermissionGuard` protects endpoints
- [ ] `@Permissions()` decorator implemented
- [ ] System roles (SuperAdmin, TenantAdmin, Principal, Teacher, Parent) defined
- [ ] Custom role creation UI completed
- [ ] Permission matrix UI completed
- [ ] User role assignment working
- [ ] `hasPermission` directive for UI elements

### Tenant Self-Service Portal
- [ ] School settings page (name, logo, timezone)
- [ ] User invitation system (email with magic link)
- [ ] Subscription management (view plan, upgrade/downgrade)
- [ ] Plugin marketplace browser (install/uninstall)
- [ ] Usage dashboard (students, storage, API calls)

### Audit Logging
- [ ] `AuditLog` entity with retention policy
- [ ] `@Auditable()` decorator for auto-logging
- [ ] Audit log viewer UI with filters
- [ ] Compliance report exports (FERPA/GDPR)

---

## 🧪 Testing Strategy

### Unit Tests (85% coverage target)
```bash
# Backend
npm run test:cov

# Expected coverage:
# - Plugin framework: 90%+
# - RBAC: 85%+
# - Audit logging: 80%+
```

### Integration Tests
```typescript
describe('Plugin Installation E2E', () => {
  it('should install plugin for tenant', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/tenants/greenfield/plugins')
      .send({ pluginPath: './plugins/sample-hello-world' })
      .expect(201);

    expect(response.body.pluginId).toBe('hello-world');
  });

  it('should enable plugin route', async () => {
    await request(app.getHttpServer())
      .get('/api/plugins/hello')
      .expect(200)
      .expect({ message: 'Hello from plugin!' });
  });
});
```

### Manual QA Checklist
- [ ] Install plugin via UI
- [ ] Plugin route accessible after install
- [ ] Plugin menu item appears in sidebar
- [ ] Disable plugin → menu item disappears
- [ ] Uninstall plugin → tables dropped
- [ ] Create custom role "Librarian"
- [ ] Assign "Librarian" role to user
- [ ] Librarian cannot access student creation (permission denied)
- [ ] Audit log shows all role changes

---

## 📖 Documentation Deliverables

### For Developers
- [ ] Plugin Development Guide (`docs/PLUGIN_DEVELOPMENT.md`)
- [ ] Plugin API Reference (Swagger/TypeDoc)
- [ ] Architecture Decision Records (ADRs) for plugin design
- [ ] Sample plugin tutorial (step-by-step)

### For Tenant Admins
- [ ] User Guide: Managing Roles & Permissions
- [ ] User Guide: Installing Plugins
- [ ] User Guide: Configuring School Settings

---

## 🚨 Common Pitfalls to Avoid

1. **Plugin Isolation Issues**
   - ❌ Plugin directly imports core domain entities
   - ✅ Plugin uses PluginContext.getDatabaseAdapter() with tenant isolation

2. **Permission Explosion**
   - ❌ Creating 100+ granular permissions (too complex for admins)
   - ✅ Group permissions by resource (students:*, fees:*)

3. **Hardcoded Tenant Checks**
   - ❌ Manual `if (tenantId === 'greenfield')` checks
   - ✅ Use `TenantGuard` + repository auto-filtering

4. **Event Bus Memory Leaks**
   - ❌ Subscribe to events without cleanup
   - ✅ Unsubscribe in `onDisable()` hook

---

## 📞 Support & Resources

### Daily Standup Topics
- Plugin framework design decisions
- RBAC scope handling (own vs department vs all)
- Frontend plugin injection challenges

### Pair Programming Sessions
- Plugin loader implementation (complex)
- Permission guard logic (critical path)
- Audit decorator implementation

### Weekly Demo
- Show working "Hello World" plugin installation
- Demonstrate custom role creation
- Show audit log viewer

---

## 🎉 Success Metrics

By end of Phase 1, you should be able to:

1. **Plugin Demo:**
   ```bash
   # Install SMS plugin
   POST /api/tenants/greenfield/plugins { "pluginId": "sms-gateway-twilio" }
   
   # Plugin sends SMS when student created
   POST /api/students { ... }
   → SMS sent to parent automatically via plugin event listener
   ```

2. **RBAC Demo:**
   ```bash
   # Create custom role "Exam Coordinator"
   POST /api/roles {
     "name": "Exam Coordinator",
     "permissions": ["exams:*", "students:read"]
   }
   
   # User with this role can create exams but cannot edit students
   ```

3. **Audit Demo:**
   ```bash
   # View audit log
   GET /api/audit-logs?action=student.created&date=2024-01-15
   
   # Export for FERPA compliance
   GET /api/audit-logs/export?format=pdf
   ```

---

**Ready to start?** Begin with Week 1, Day 1: Plugin Interface Design 🚀
