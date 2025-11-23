import { PluginContext } from './plugin.context';

/**
 * Plugin Manifest - Metadata and configuration for a plugin
 */
export interface PluginManifest {
  /** Unique identifier for the plugin (e.g., "sms-gateway-twilio") */
  id: string;

  /** Human-readable name (e.g., "Twilio SMS Gateway") */
  name: string;

  /** Semantic version (e.g., "1.0.0") */
  version: string;

  /** Brief description of plugin functionality */
  description: string;

  /** Plugin author/organization */
  author: string;

  /** Homepage or repository URL */
  homepage?: string;

  /** Permissions required by this plugin */
  permissions: PluginPermission[];

  /** Dependencies on core platform and other plugins */
  dependencies?: {
    /** Minimum core platform version (e.g., ">=1.0.0") */
    core?: string;
    /** Other plugin dependencies with version constraints */
    plugins?: Record<string, string>;
  };

  /** Extension points this plugin provides */
  provides: {
    /** API routes registered by this plugin */
    routes?: PluginRoute[];
    /** Menu items to inject into UI */
    menuItems?: PluginMenuItem[];
    /** Dashboard widgets */
    dashboardWidgets?: PluginWidget[];
    /** Settings schema for plugin configuration */
    settings?: PluginSettingSchema[];
  };
}

/**
 * Plugin Permissions - Resource-based permissions
 */
export enum PluginPermission {
  // Student permissions
  READ_STUDENTS = 'students:read',
  WRITE_STUDENTS = 'students:write',
  DELETE_STUDENTS = 'students:delete',

  // Communication permissions
  SEND_SMS = 'communications:sms:send',
  SEND_EMAIL = 'communications:email:send',
  SEND_NOTIFICATIONS = 'communications:notifications:send',

  // Financial permissions
  READ_FEES = 'fees:read',
  WRITE_FEES = 'fees:write',
  PROCESS_PAYMENTS = 'fees:payments:process',

  // Settings permissions
  MANAGE_SETTINGS = 'settings:manage',
  READ_SETTINGS = 'settings:read',

  // System permissions
  MANAGE_PLUGINS = 'system:plugins:manage',
  ACCESS_AUDIT_LOGS = 'system:audit:read',
}

/**
 * Plugin Route Definition
 */
export interface PluginRoute {
  /** Route path (e.g., "/plugins/sms/send") */
  path: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Controller method to handle this route */
  handler: string;
  /** Permissions required to access this route */
  permissions?: PluginPermission[];
}

/**
 * Plugin Menu Item Definition
 */
export interface PluginMenuItem {
  /** Display label */
  label: string;
  /** Icon (emoji or icon class) */
  icon: string;
  /** Frontend route */
  route: string;
  /** Parent menu (e.g., "system", "academics") */
  parent?: string;
  /** Order/position in menu */
  order?: number;
}

/**
 * Plugin Dashboard Widget Definition
 */
export interface PluginWidget {
  /** Unique widget ID */
  id: string;
  /** Widget title */
  title: string;
  /** Component to render */
  component: string;
  /** Default size */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Plugin Setting Schema
 */
export interface PluginSettingSchema {
  /** Setting key */
  key: string;
  /** Setting label */
  label: string;
  /** Setting type */
  type: 'text' | 'number' | 'boolean' | 'select' | 'password';
  /** Default value */
  defaultValue?: any;
  /** Is this setting required? */
  required?: boolean;
  /** Options for select type */
  options?: Array<{ label: string; value: any }>;
  /** Validation rules */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

/**
 * Core Plugin Interface - All plugins must implement this
 */
export interface IPlugin {
  /** Plugin metadata */
  readonly manifest: PluginManifest;

  /**
   * Called when plugin is first installed for a tenant
   * Use this to create database tables, initial data, etc.
   */
  onInstall(context: PluginContext): Promise<void>;

  /**
   * Called when plugin is enabled/activated for a tenant
   * Use this to register event listeners, start background jobs, etc.
   */
  onEnable(context: PluginContext): Promise<void>;

  /**
   * Called when plugin is disabled/deactivated for a tenant
   * Use this to cleanup event listeners, stop background jobs, etc.
   */
  onDisable(context: PluginContext): Promise<void>;

  /**
   * Called when plugin is uninstalled from a tenant
   * Use this to drop database tables, cleanup data, etc.
   */
  onUninstall(context: PluginContext): Promise<void>;
}

/**
 * Plugin Status
 */
export enum PluginStatus {
  INSTALLED = 'installed',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ERROR = 'error',
}
