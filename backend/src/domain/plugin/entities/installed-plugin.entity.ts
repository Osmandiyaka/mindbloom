export class InstalledPlugin {
    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly pluginId: string,
        public readonly version: string,
        public readonly status: InstalledPluginStatus,
        public readonly settings: Record<string, any>,
        public readonly permissions: string[],
        public readonly installedAt: Date,
        public readonly enabledAt?: Date,
        public readonly disabledAt?: Date,
        public readonly lastError?: string,
        public readonly updatedAt?: Date,
    ) { }

    static create(
        id: string,
        tenantId: string,
        pluginId: string,
        version: string,
        permissions: string[],
    ): InstalledPlugin {
        return new InstalledPlugin(
            id,
            tenantId,
            pluginId,
            version,
            InstalledPluginStatus.INSTALLED,
            {},
            permissions,
            new Date(),
            undefined,
            undefined,
            undefined,
            new Date(),
        );
    }

    enable(): InstalledPlugin {
        return new InstalledPlugin(
            this.id,
            this.tenantId,
            this.pluginId,
            this.version,
            InstalledPluginStatus.ENABLED,
            this.settings,
            this.permissions,
            this.installedAt,
            new Date(),
            undefined,
            undefined,
            new Date(),
        );
    }

    disable(): InstalledPlugin {
        return new InstalledPlugin(
            this.id,
            this.tenantId,
            this.pluginId,
            this.version,
            InstalledPluginStatus.DISABLED,
            this.settings,
            this.permissions,
            this.installedAt,
            this.enabledAt,
            new Date(),
            undefined,
            new Date(),
        );
    }

    updateSettings(settings: Record<string, any>): InstalledPlugin {
        return new InstalledPlugin(
            this.id,
            this.tenantId,
            this.pluginId,
            this.version,
            this.status,
            { ...this.settings, ...settings },
            this.permissions,
            this.installedAt,
            this.enabledAt,
            this.disabledAt,
            this.lastError,
            new Date(),
        );
    }

    setError(error: string): InstalledPlugin {
        return new InstalledPlugin(
            this.id,
            this.tenantId,
            this.pluginId,
            this.version,
            InstalledPluginStatus.ERROR,
            this.settings,
            this.permissions,
            this.installedAt,
            this.enabledAt,
            this.disabledAt,
            error,
            new Date(),
        );
    }

    updateVersion(version: string): InstalledPlugin {
        return new InstalledPlugin(
            this.id,
            this.tenantId,
            this.pluginId,
            version,
            this.status,
            this.settings,
            this.permissions,
            this.installedAt,
            this.enabledAt,
            this.disabledAt,
            undefined,
            new Date(),
        );
    }
}

export enum InstalledPluginStatus {
    INSTALLED = 'installed',
    ENABLED = 'enabled',
    DISABLED = 'disabled',
    ERROR = 'error',
}
