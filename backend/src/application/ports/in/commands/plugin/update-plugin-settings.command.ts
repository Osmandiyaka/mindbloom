export class UpdatePluginSettingsCommand {
    constructor(
        public readonly pluginId: string,
        public readonly tenantId: string,
        public readonly settings: Record<string, any>,
    ) { }
}
