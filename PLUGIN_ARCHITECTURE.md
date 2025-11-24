# Plugin System Architecture

## Overview

MindBloom features a comprehensive plugin system that allows extending the platform's functionality through modular, installable plugins. The system supports both official and third-party plugins with a complete marketplace for discovery, installation, and management.

## Architecture Components

### 1. Domain Layer

#### Plugin Entity
Represents a plugin in the marketplace with metadata, ratings, downloads, and manifest.

**Key Properties:**
- `pluginId`: Unique identifier
- `name`, `version`, `description`: Basic metadata
- `category`: Plugin category (communication, payment, analytics, etc.)
- `isOfficial`: Whether it's an official MindBloom plugin
- `downloads`, `rating`, `ratingCount`: Marketplace metrics
- `manifest`: Plugin configuration and capabilities
- `tags`: Searchable tags

#### InstalledPlugin Entity
Represents a plugin installed for a specific tenant.

**Key Properties:**
- `tenantId`: Tenant who installed the plugin
- `pluginId`: Reference to marketplace plugin
- `status`: installed | enabled | disabled | error
- `settings`: Plugin-specific configuration
- `permissions`: Granted permissions

### 2. Plugin Interface (IPlugin)

All plugins must implement this interface with lifecycle hooks:

```typescript
interface IPlugin {
  readonly manifest: PluginManifest;
  onInstall(context: PluginContext): Promise<void>;
  onEnable(context: PluginContext): Promise<void>;
  onDisable(context: PluginContext): Promise<void>;
  onUninstall(context: PluginContext): Promise<void>;
}
```

**Lifecycle Hooks:**
- `onInstall`: First-time setup (create tables, default data)
- `onEnable`: Activation (register events, start jobs)
- `onDisable`: Deactivation (cleanup listeners, stop jobs)
- `onUninstall`: Complete removal (drop tables, delete data)

### 3. Plugin Manifest

Declares plugin capabilities, permissions, and extension points:

```typescript
interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: PluginPermission[];
  provides: {
    routes?: PluginRoute[];          // API endpoints
    menuItems?: PluginMenuItem[];    // UI navigation
    dashboardWidgets?: PluginWidget[]; // Dashboard cards
    settings?: PluginSettingSchema[]; // Configuration UI
  };
}
```

### 4. Plugin Context

Injected into lifecycle hooks, provides access to platform services:

```typescript
interface PluginContext {
  tenantId: string;
  pluginId: string;
  logger: Logger;
  eventBus: EventBus;
  settings: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    clear(): Promise<void>;
  };
  hasPermission(permission: string): boolean;
}
```

### 5. Plugin Registry

Manages plugin lifecycle and maintains active plugin instances:

**Key Responsibilities:**
- Register available plugins
- Load enabled plugins for tenants
- Execute lifecycle hooks
- Maintain plugin contexts
- Handle plugin errors

### 6. Event Bus

Enables inter-plugin communication and reaction to platform events:

```typescript
// Publish event
eventBus.publish('student.created', studentData, tenantId);

// Subscribe to event
eventBus.subscribe('fee.overdue', tenantId, async (data) => {
  // Handle fee overdue event
});
```

**Tenant Isolation:** All events are automatically scoped to tenants, preventing data leakage.

## Plugin Categories

1. **Communication** - SMS, Email, Push notifications
2. **Payment** - Payment gateways, billing
3. **Analytics** - Reporting, dashboards, insights
4. **Attendance** - Biometric, QR codes, RFID
5. **Reporting** - Custom reports, export tools
6. **Library** - Book management, barcode scanning
7. **Transport** - GPS tracking, route management
8. **Hostel** - Room allocation, attendance
9. **HR** - Employee management, payroll
10. **Security** - Access control, surveillance
11. **Integration** - Third-party integrations
12. **Utility** - General purpose tools

## Marketplace Features

### Frontend (Angular)
- **Browse**: Grid view with search and category filters
- **Plugin Cards**: Icon, name, description, ratings, downloads
- **Status Indicators**: Installed, enabled, disabled badges
- **Actions**: Install, enable, disable, uninstall
- **Search**: Full-text search across names, descriptions, tags
- **Filters**: Category-based filtering

### Backend (NestJS)
- **Endpoints:**
  - `GET /plugins/marketplace` - Browse available plugins
  - `GET /plugins/installed` - Get tenant's installed plugins
  - `POST /plugins/install` - Install a plugin
  - `POST /plugins/:id/enable` - Enable plugin
  - `POST /plugins/:id/disable` - Disable plugin
  - `DELETE /plugins/:id` - Uninstall plugin

## Sample Plugins

### 1. SMS Notification Plugin
**Purpose:** Send SMS notifications to students and parents

**Features:**
- Bulk SMS messaging
- Message templates
- Event-driven notifications (fees, attendance)
- Scheduled messages

**Permissions:**
- `communications:sms:send`
- `students:read`

### 2. Report Generator Plugin
**Purpose:** Create and export custom reports

**Features:**
- Drag-and-drop report builder
- PDF, Excel, CSV export
- Report templates
- Scheduled report generation
- Auto-archiving

**Permissions:**
- `students:read`
- `fees:read`

## Plugin Development Guide

### Creating a Plugin

1. **Implement IPlugin interface:**

```typescript
@Injectable()
export class MyPlugin implements IPlugin {
  readonly manifest: PluginManifest = {
    id: 'my-plugin',
    name: 'My Awesome Plugin',
    version: '1.0.0',
    description: 'Does amazing things',
    author: 'Your Name',
    permissions: [PluginPermission.READ_STUDENTS],
    provides: {
      routes: [{
        path: '/plugins/my-plugin/action',
        method: 'POST',
        handler: 'doAction',
      }],
      menuItems: [{
        label: 'My Plugin',
        icon: '🚀',
        route: '/plugins/my-plugin',
      }],
    },
  };

  async onInstall(context: PluginContext): Promise<void> {
    // Setup code
  }

  async onEnable(context: PluginContext): Promise<void> {
    // Activation code
    context.eventBus.on('student.created', this.handleStudentCreated);
  }

  async onDisable(context: PluginContext): Promise<void> {
    // Cleanup code
  }

  async onUninstall(context: PluginContext): Promise<void> {
    // Removal code
  }

  private handleStudentCreated = async (data: any) => {
    // Handle event
  };
}
```

2. **Register in Plugin Registry:**

```typescript
pluginRegistry.registerPlugin('my-plugin', new MyPlugin());
```

3. **Add to Marketplace:**

```javascript
// In seed script
{
  pluginId: 'my-plugin',
  name: 'My Awesome Plugin',
  version: '1.0.0',
  // ... other marketplace fields
}
```

### Best Practices

1. **Permissions:** Request only necessary permissions
2. **Error Handling:** Always wrap operations in try-catch
3. **Tenant Isolation:** Never mix tenant data
4. **Event Cleanup:** Always unsubscribe in onDisable
5. **Settings Validation:** Validate all user-provided settings
6. **Logging:** Use context.logger for debugging
7. **Versioning:** Follow semantic versioning
8. **Testing:** Test all lifecycle hooks

## Security

### Permission System
Plugins declare required permissions in manifest. Platform enforces these at runtime.

**Available Permissions:**
- Student operations: `students:read`, `students:write`, `students:delete`
- Communication: `communications:sms:send`, `communications:email:send`
- Financial: `fees:read`, `fees:write`, `fees:payments:process`
- System: `system:plugins:manage`, `system:audit:read`

### Tenant Isolation
- All plugin data is scoped to tenant
- EventBus automatically isolates events by tenant
- InstalledPlugin entities are tenant-specific
- No cross-tenant data access possible

### Sandboxing
- Plugins run in isolated contexts
- Limited to declared capabilities
- Cannot access unauthorized platform APIs
- Settings are validated and sanitized

## Database Schema

### plugins Collection
```javascript
{
  pluginId: String (unique),
  name: String,
  version: String,
  category: String,
  status: String,
  isOfficial: Boolean,
  downloads: Number,
  rating: Number,
  ratingCount: Number,
  manifest: Object,
  tags: [String],
  // ... other fields
}
```

### installed_plugins Collection
```javascript
{
  tenantId: String (indexed),
  pluginId: String (indexed),
  version: String,
  status: String,
  settings: Object,
  permissions: [String],
  installedAt: Date,
  enabledAt: Date,
  // ... other fields
}
```

**Unique Index:** `(tenantId, pluginId)` - Ensures one installation per tenant

## Seeding the Marketplace

Run the seed script to populate marketplace with sample plugins:

```bash
cd scripts
MONGO_URI=mongodb://localhost:27017/mindbloom node seed-plugins.js
```

This adds 8 sample plugins across different categories.

## Future Enhancements

1. **Plugin Store:** Public marketplace for third-party plugins
2. **Version Management:** Update installed plugins to newer versions
3. **Dependencies:** Plugin can depend on other plugins
4. **Hooks API:** More extension points throughout the platform
5. **Plugin SDK:** Development toolkit and CLI
6. **Webhooks:** External webhook support for plugins
7. **Analytics:** Plugin usage tracking and metrics
8. **Reviews:** User reviews and ratings in marketplace
9. **Paid Plugins:** Payment processing for premium plugins
10. **Auto-updates:** Automatic plugin updates

## Troubleshooting

### Plugin Installation Fails
- Check plugin exists in marketplace
- Verify not already installed
- Check tenant has permission to install
- Review plugin logs for errors

### Plugin Not Enabled After Installation
- Manually enable via marketplace UI
- Check for errors in plugin's onEnable hook
- Verify required settings are configured
- Check plugin status in database

### Events Not Firing
- Verify plugin is enabled (not just installed)
- Check event names match exactly
- Ensure tenant ID is correct
- Review eventBus subscription code

## API Examples

### Install Plugin
```bash
POST /plugins/install
{
  "pluginId": "sms-twilio"
}
```

### Enable Plugin
```bash
POST /plugins/sms-twilio/enable
```

### Get Installed Plugins
```bash
GET /plugins/installed
```

### Browse Marketplace
```bash
GET /plugins/marketplace?category=communication&search=sms
```

## Conclusion

The plugin system provides a powerful, secure, and flexible way to extend MindBloom's functionality. With proper architecture separation, tenant isolation, and comprehensive lifecycle management, plugins can add significant value while maintaining system stability and security.
