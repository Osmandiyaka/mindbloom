export class Plugin {
    constructor(
        public readonly id: string,
        public readonly pluginId: string,
        public readonly name: string,
        public readonly version: string,
        public readonly description: string,
        public readonly author: string,
        public readonly category: PluginCategory,
        public readonly status: PluginStatus,
        public readonly isOfficial: boolean,
        public readonly iconUrl: string,
        public readonly bannerUrl: string,
        public readonly screenshots: string[],
        public readonly price: number,
        public readonly downloads: number,
        public readonly rating: number,
        public readonly ratingCount: number,
        public readonly manifest: Record<string, any>,
        public readonly settings: Record<string, any>,
        public readonly tags: string[],
        public readonly changelog: PluginChangelog[],
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(
        id: string,
        pluginId: string,
        name: string,
        version: string,
        description: string,
        author: string,
        category: PluginCategory,
        isOfficial: boolean,
        iconUrl: string,
        manifest: Record<string, any>,
    ): Plugin {
        return new Plugin(
            id,
            pluginId,
            name,
            version,
            description,
            author,
            category,
            PluginStatus.AVAILABLE,
            isOfficial,
            iconUrl,
            '',
            [],
            0,
            0,
            0,
            0,
            manifest,
            {},
            [],
            [],
            new Date(),
            new Date(),
        );
    }

    updateVersion(version: string, changelog: PluginChangelog): Plugin {
        return new Plugin(
            this.id,
            this.pluginId,
            this.name,
            version,
            this.description,
            this.author,
            this.category,
            this.status,
            this.isOfficial,
            this.iconUrl,
            this.bannerUrl,
            this.screenshots,
            this.price,
            this.downloads,
            this.rating,
            this.ratingCount,
            this.manifest,
            this.settings,
            this.tags,
            [...this.changelog, changelog],
            this.createdAt,
            new Date(),
        );
    }

    updateStatus(status: PluginStatus): Plugin {
        return new Plugin(
            this.id,
            this.pluginId,
            this.name,
            this.version,
            this.description,
            this.author,
            this.category,
            status,
            this.isOfficial,
            this.iconUrl,
            this.bannerUrl,
            this.screenshots,
            this.price,
            this.downloads,
            this.rating,
            this.ratingCount,
            this.manifest,
            this.settings,
            this.tags,
            this.changelog,
            this.createdAt,
            new Date(),
        );
    }

    incrementDownloads(): Plugin {
        return new Plugin(
            this.id,
            this.pluginId,
            this.name,
            this.version,
            this.description,
            this.author,
            this.category,
            this.status,
            this.isOfficial,
            this.iconUrl,
            this.bannerUrl,
            this.screenshots,
            this.price,
            this.downloads + 1,
            this.rating,
            this.ratingCount,
            this.manifest,
            this.settings,
            this.tags,
            this.changelog,
            this.createdAt,
            new Date(),
        );
    }

    updateRating(newRating: number): Plugin {
        const totalRating = this.rating * this.ratingCount + newRating;
        const newRatingCount = this.ratingCount + 1;
        const averageRating = totalRating / newRatingCount;

        return new Plugin(
            this.id,
            this.pluginId,
            this.name,
            this.version,
            this.description,
            this.author,
            this.category,
            this.status,
            this.isOfficial,
            this.iconUrl,
            this.bannerUrl,
            this.screenshots,
            this.price,
            this.downloads,
            Math.round(averageRating * 10) / 10,
            newRatingCount,
            this.manifest,
            this.settings,
            this.tags,
            this.changelog,
            this.createdAt,
            new Date(),
        );
    }
}

export enum PluginCategory {
    COMMUNICATION = 'communication',
    PAYMENT = 'payment',
    ACADEMICS = 'academics',
    ANALYTICS = 'analytics',
    REPORTING = 'reporting',
    ATTENDANCE = 'attendance',
    LIBRARY = 'library',
    TRANSPORT = 'transport',
    HOSTEL = 'hostel',
    HR = 'hr',
    SECURITY = 'security',
    INTEGRATION = 'integration',
    UTILITY = 'utility',
    OTHER = 'other',
}

export enum PluginStatus {
    AVAILABLE = 'available',
    INSTALLED = 'installed',
    ENABLED = 'enabled',
    DISABLED = 'disabled',
    ERROR = 'error',
    DEPRECATED = 'deprecated',
}

export interface PluginChangelog {
    version: string;
    date: Date;
    changes: string[];
}
