export class BrowsePluginsQuery {
    constructor(
        public readonly category?: string,
        public readonly search?: string,
    ) { }
}
