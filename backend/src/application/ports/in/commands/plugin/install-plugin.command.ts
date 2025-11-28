export class InstallPluginCommand {
    constructor(
        public readonly pluginId: string,
        public readonly tenantId: string,
    ) { }
}
