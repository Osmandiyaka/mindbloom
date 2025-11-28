export class DisablePluginCommand {
    constructor(
        public readonly pluginId: string,
        public readonly tenantId: string,
    ) { }
}
