# Plugin System Workflow Guide

## Overview
The MindBloom plugin system allows you to extend the platform with custom functionality through a marketplace-based installation system.

## Plugin Lifecycle

### 1. Marketplace (Available Plugins)
- All available plugins are stored in the `plugins` collection in MongoDB
- Access via: `GET /api/plugins/marketplace`
- Returns list of all plugins with their manifests, pricing, ratings, etc.
- Shows installation status for the current tenant

### 2. Installation
- Install a plugin via: `POST /api/plugins/install` with body `{ "pluginId": "plugin-name" }`
- This:
  - Checks if plugin exists in marketplace
  - Creates entry in `installed_plugins` collection for the tenant
  - Sets status to `installed` (not yet enabled)
  - Increments download count
  
### 3. Enabling
- Enable a plugin via: `POST /api/plugins/{pluginId}/enable`
- This:
  - Updates status to `enabled`
  - Sets `enabledAt` timestamp
  - Plugin becomes active and its routes/features become available

### 4. Using the Plugin
- Once enabled, plugin appears in "My Plugins" page
- Clicking on plugin navigates to route defined in manifest's first menuItem
- Plugin's API routes become accessible at `/api/plugins/{pluginId}/*`

### 5. Managing Settings
- Get settings: `GET /api/plugins/{pluginId}/settings`
- Update settings: `PUT /api/plugins/{pluginId}/settings`

### 6. Disabling
- Disable via: `POST /api/plugins/{pluginId}/disable`
- Plugin remains installed but inactive

### 7. Uninstallation
- Uninstall via: `DELETE /api/plugins/{pluginId}`
- Removes from `installed_plugins` collection

## Database Collections

### `plugins` (Marketplace)
```javascript
{
  pluginId: "library-management",
  name: "Library Management System",
  version: "1.0.0",
  description: "...",
  manifest: {
    permissions: [...],
    provides: {
      routes: [...],
      menuItems: [
        {
          label: "Library",
          icon: "📚",
          route: "/plugins/library"  // Frontend route
        }
      ],
      settings: [...]
    }
  },
  // ... other marketplace fields
}
```

### `installed_plugins` (Per Tenant)
```javascript
{
  tenantId: ObjectId("..."),
  pluginId: "library-management",
  version: "1.0.0",
  status: "enabled",  // or "installed", "disabled"
  settings: {},
  permissions: ["READ_STUDENTS", "WRITE_STUDENTS"],
  installedAt: Date,
  enabledAt: Date,
}
```

## Frontend Flow

### Setup Page - Marketplace Tab
1. User navigates to `/setup/marketplace`
2. Component calls `pluginService.getMarketplace()`
3. Displays grid of available plugins
4. Shows "Install" button for non-installed plugins
5. Shows "Installed" badge for installed plugins

### Installing from UI
1. User clicks "Install" on a plugin card
2. Calls `pluginService.installPlugin(pluginId)`
3. Backend creates entry in `installed_plugins`
4. Frontend refreshes marketplace list
5. User is prompted to enable the plugin

### My Plugins Page
1. User navigates to `/plugins` (Plugin Launcher)
2. Component calls `pluginService.getInstalledPlugins()`
3. Displays enabled plugins as launchable cards
4. Displays disabled plugins in separate section

### Launching a Plugin
1. User clicks on plugin card
2. Component reads `plugin.manifest.provides.menuItems[0].route`
3. Navigates to that route (e.g., `/plugins/library`)
4. Angular router loads the plugin's UI component

## Current Implementation Status

### ✅ Working
- Marketplace listing endpoint
- Plugin installation endpoint
- Plugin enable/disable endpoints
- Installed plugins listing
- Plugin metadata stored with manifest

### ⚠️ Requires Setup
1. **Frontend Routes**: Plugin routes must be added to `frontend/src/app/modules/plugins/plugins.routes.ts`
2. **Database Seeding**: Run `node scripts/seed-marketplace.js` to populate plugins
3. **Plugin Registration**: Backend plugins must be registered in app.module.ts

### 🐛 Known Issues
1. **Plugin ID Mismatch**: Some plugins have different IDs in manifest vs database
   - Library plugin: manifest has `library-barcode`, should be `library-management`
   
2. **Route Configuration**: Frontend routes not automatically registered from manifest

## Setup Instructions

### 1. Seed the Marketplace
```bash
node scripts/seed-marketplace.js
```

### 2. Start Backend
```bash
cd backend
npm run start:dev
```

### 3. Install Library Plugin (Example)
```bash
# Login first, then:
curl -X POST http://localhost:3000/api/plugins/install \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pluginId": "library-management"}'

# Enable it
curl -X POST http://localhost:3000/api/plugins/library-management/enable \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Add Frontend Route
In `frontend/src/app/modules/plugins/plugins.routes.ts`:
```typescript
{
    path: 'library',
    loadChildren: () => import('./pages/library/library.routes').then(m => m.LIBRARY_ROUTES)
}
```

### 5. Test in Frontend
1. Login to application
2. Go to Setup > Marketplace
3. Find and install plugin
4. Go to My Plugins
5. Click on installed plugin
6. Should navigate to plugin UI

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plugins/marketplace` | List all available plugins |
| GET | `/api/plugins/installed` | List installed plugins for tenant |
| POST | `/api/plugins/install` | Install a plugin |
| POST | `/api/plugins/:id/enable` | Enable installed plugin |
| POST | `/api/plugins/:id/disable` | Disable plugin |
| DELETE | `/api/plugins/:id` | Uninstall plugin |
| GET | `/api/plugins/:id/settings` | Get plugin settings |
| PUT | `/api/plugins/:id/settings` | Update plugin settings |

## Troubleshooting

### Plugin doesn't appear in marketplace
- Run `node scripts/seed-marketplace.js`
- Check `plugins` collection in MongoDB

### Plugin installs but doesn't enable
- Check installed_plugins collection for status
- Try calling enable endpoint directly

### Plugin launches but shows 404
- Check if frontend route is configured
- Verify route matches manifest's menuItem.route
- Check Angular routing configuration

### Plugin routes don't work
- Verify backend controller is registered
- Check plugin module is imported in app.module.ts
- Verify PluginRegistry has registered the plugin

## Best Practices

1. **Plugin IDs**: Use consistent kebab-case IDs everywhere
2. **Versioning**: Follow semantic versioning
3. **Permissions**: Request minimum required permissions
4. **Routes**: Use meaningful, RESTful API routes
5. **Testing**: Test full workflow before publishing

