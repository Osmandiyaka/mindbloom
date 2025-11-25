import { BadRequestException, Injectable } from '@nestjs/common';
import { PluginManifest } from './plugin.interface';

@Injectable()
export class PluginManifestValidator {
    validate(manifest: PluginManifest): void {
        const requiredString = ['id', 'name', 'version', 'description', 'author'];
        for (const key of requiredString) {
            if (!manifest[key as keyof PluginManifest]) {
                throw new BadRequestException(`Plugin manifest missing ${key}`);
            }
        }

        if (!Array.isArray(manifest.permissions)) {
            throw new BadRequestException('Plugin manifest permissions must be an array');
        }

        if (!manifest.provides) {
            throw new BadRequestException('Plugin manifest must declare provides');
        }

        if (manifest.provides.menuItems) {
            for (const item of manifest.provides.menuItems) {
                if (!item.label || !item.route) {
                    throw new BadRequestException('Plugin menu items require label and route');
                }
            }
        }
    }
}
