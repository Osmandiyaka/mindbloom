import { promises as fs } from 'fs';
import * as path from 'path';
import { FileObject, FileStoragePort } from '../../domain/ports/out/file-storage.port';

export class LocalFileStorageAdapter implements FileStoragePort {
    constructor(
        private readonly root: string,
        private readonly prefix: string = '',
        private readonly publicBaseUrl: string = '',
    ) { }

    private resolvePath(fileName: string): string {
        const safeName = fileName.replace(/^\//, '');
        return path.join(this.root, this.prefix, safeName);
    }

    private buildUrl(key: string): string | undefined {
        if (!this.publicBaseUrl) return undefined;
        return `${this.publicBaseUrl.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
    }

    private async ensureDir(filePath: string) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
    }

    async upload(fileName: string, data: Buffer, contentType?: string): Promise<FileObject> {
        const fullPath = this.resolvePath(fileName);
        await this.ensureDir(fullPath);
        await fs.writeFile(fullPath, data);
        const key = path.join(this.prefix, fileName).replace(/\\/g, '/');
        return { key, url: this.buildUrl(key), size: data.length, contentType };
    }

    async download(fileName: string): Promise<Buffer> {
        const fullPath = this.resolvePath(fileName);
        return fs.readFile(fullPath);
    }

    async delete(fileName: string): Promise<void> {
        const fullPath = this.resolvePath(fileName);
        await fs.rm(fullPath, { force: true });
    }

    async list(prefix: string = ''): Promise<FileObject[]> {
        const base = this.resolvePath(prefix);
        let stats;
        try {
            stats = await fs.stat(base);
        } catch {
            return [];
        }
        if (stats.isFile()) {
            const key = path.join(this.prefix, prefix).replace(/\\/g, '/');
            return [{ key, url: this.buildUrl(key), size: stats.size }];
        }

        const files = await fs.readdir(base, { withFileTypes: true });
        const results: FileObject[] = [];
        for (const file of files) {
            if (file.isDirectory()) continue;
            const fPath = path.join(base, file.name);
            const fStats = await fs.stat(fPath);
            const key = path.join(this.prefix, prefix, file.name).replace(/\\/g, '/');
            results.push({
                key,
                url: this.buildUrl(key),
                size: fStats.size,
            });
        }
        return results;
    }
}
