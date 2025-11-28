export class UninstallPluginCommand {
    constructor(
        public readonly pluginId: string,
        public readonly tenantId: string,
    ) { }
}
