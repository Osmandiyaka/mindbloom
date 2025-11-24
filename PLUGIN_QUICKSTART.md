# Plugin System - Quick Start Guide

## ✅ What's Been Fixed

1. **Plugin ID Consistency**: Library plugin ID changed from `library-barcode` to `library-management`
2. **Frontend Routing**: Added library plugin route to `/plugins/library`
3. **Marketplace Endpoint**: Working correctly, returns all plugins with installation status
4. **Installation Flow**: Full workflow tested and documented

## 🚀 How to Use the Plugin System

### Step 1: Seed the Marketplace
```bash
node scripts/seed-marketplace.js
```
This populates the `plugins` collection with 8 sample plugins including Library Management.

### Step 2: Start the Backend
```bash
cd backend
npm run start:dev
```
Backend will run on http://localhost:3000

### Step 3: Start the Frontend
```bash
cd frontend
ng serve
```
Frontend will run on http://localhost:4200

### Step 4: Login
- Navigate to http://localhost:4200
- Login with your credentials (e.g., `admin@mindbloom.com` / `admin123`)

### Step 5: Browse Marketplace
- Go to **Setup** > **Marketplace**
- You'll see 8 available plugins
- Each shows:
  - Name, description, author
  - Price, downloads, rating
  - "Install" button or "Installed" badge

### Step 6: Install a Plugin
- Click **Install** on any plugin (e.g., Library Management System)
- Plugin status changes to "Installed"
- Plugin is saved to `installed_plugins` collection for your tenant

### Step 7: Enable the Plugin
- Plugin is installed but disabled by default
- Click **Enable** to activate it
- Plugin status changes to "Enabled"

### Step 8: Launch the Plugin
- Go to **Plugins** (My Plugins page)
- You'll see all your enabled plugins
- Click on a plugin card to launch it
- You'll be navigated to the plugin's UI

For Library Management:
- Route: `/plugins/library`
- Opens the Library Dashboard with:
  - Book catalog
  - Circulation management
  - Member management
  - Reports

## 📋 Available Endpoints

```bash
# Get marketplace plugins
GET /api/plugins/marketplace

# Get installed plugins for your tenant
GET /api/plugins/installed

# Install a plugin
POST /api/plugins/install
Body: { "pluginId": "library-management" }

# Enable a plugin
POST /api/plugins/library-management/enable

# Disable a plugin
POST /api/plugins/library-management/disable

# Uninstall a plugin
DELETE /api/plugins/library-management

# Get plugin settings
GET /api/plugins/library-management/settings

# Update plugin settings
PUT /api/plugins/library-management/settings
Body: { "settings": { "key": "value" } }
```

## 🗄️ Database Collections

### `plugins` - Marketplace
Contains all available plugins that can be installed.

### `installed_plugins` - Per Tenant
Contains plugins installed by each tenant with their settings and status.

## 🧪 Testing the Complete Workflow

A test script is available:

```bash
# Ensure backend is running first
node scripts/test-plugin-workflow.js
```

This script:
1. ✅ Logs in with test credentials
2. ✅ Checks marketplace for available plugins
3. ✅ Installs library management plugin
4. ✅ Enables the plugin
5. ✅ Verifies it appears in installed plugins
6. ✅ Checks database state
7. ✅ Provides next steps

## 📦 Available Plugins

After seeding, you'll have these plugins:

1. **SMS Notifications** - Send SMS to students/parents
2. **Advanced Report Generator** - Generate custom reports
3. **Stripe Payment Gateway** - Accept online payments
4. **Biometric Attendance** - Fingerprint/face recognition
5. **Parent Portal** - Portal for parent engagement
6. **Library Management** - Complete library system ⭐
7. **GPS Transport Tracking** - Track school buses
8. **Analytics Dashboard** - Advanced analytics

## 🎯 Current State

### ✅ Fully Working
- Marketplace listing with real-time installation status
- Plugin installation per tenant
- Plugin enable/disable functionality
- Installed plugins listing with manifests
- Plugin launching from UI
- Frontend routes configured for library plugin
- Backend API routes registered

### 📝 How It Works

1. **Marketplace**: Shows all plugins from `plugins` collection
2. **Install**: Creates entry in `installed_plugins` for your tenant
3. **Enable**: Updates status to "enabled", making it launchable
4. **Launch**: Navigates to route defined in plugin manifest
5. **Use**: Plugin UI and API routes are fully functional

## 🔧 Customization

### Adding a New Plugin

1. Create plugin files in `backend/src/plugins/your-plugin/`
2. Implement `IPlugin` interface with manifest
3. Register in `app.module.ts`
4. Seed to marketplace with `scripts/seed-marketplace.js`
5. Create frontend UI in `frontend/src/app/modules/plugins/pages/your-plugin/`
6. Add route to `plugins.routes.ts`

### Plugin Manifest Structure

```typescript
{
  id: 'your-plugin-id',
  name: 'Your Plugin Name',
  version: '1.0.0',
  description: 'What your plugin does',
  author: 'Your Name',
  permissions: ['READ_STUDENTS', 'WRITE_STUDENTS'],
  provides: {
    routes: [
      { path: '/plugins/your-plugin/data', method: 'GET', handler: 'getData' }
    ],
    menuItems: [
      {
        label: 'Your Plugin',
        icon: '🔌',
        route: '/plugins/your-plugin'
      }
    ],
    settings: [
      { key: 'setting1', label: 'Setting 1', type: 'text', defaultValue: 'default' }
    ]
  }
}
```

## ✨ Summary

Your plugin system is now **production-ready** with:

✅ Complete marketplace functionality  
✅ Installation per tenant  
✅ Enable/disable workflow  
✅ Plugin launcher UI  
✅ Dynamic routing  
✅ Settings management  
✅ Permissions handling  
✅ Full documentation  
✅ Test scripts  

Just follow the steps above to install and launch any plugin!
