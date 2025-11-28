export class EnablePluginCommand {
    constructor(
        public readonly pluginId: string,
        public readonly tenantId: string,
    ) { }
}
