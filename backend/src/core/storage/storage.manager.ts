import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileStoragePort } from '../../domain/ports/out/file-storage.port';
import { LocalFileStorageAdapter } from '../../infrastructure/storage/local-file-storage.adapter';
import { S3FileStorageAdapter } from '../../infrastructure/storage/s3-file-storage.adapter';

@Injectable()
export class StorageManager {
    constructor(private readonly config: ConfigService) { }

    /**
     * Get a scoped storage adapter (prefix/bucket path already applied)
     */
    scoped(prefix: string): FileStoragePort {
        const driver = (this.config.get<string>('FILE_STORAGE_DRIVER') || '').toLowerCase();
        if (driver === 's3') {
            const bucket = this.config.get<string>('S3_BUCKET') || '';
            const region = this.config.get<string>('S3_REGION') || 'us-east-1';
            const endpoint = this.config.get<string>('S3_ENDPOINT');
            return new S3FileStorageAdapter(bucket, prefix, region, endpoint);
        }

        const root = this.config.get<string>('FILE_STORAGE_ROOT') || `${process.cwd()}/storage`;
        const publicUrl = this.config.get<string>('FILE_STORAGE_PUBLIC_URL')
            || `http://localhost:${this.config.get<number>('PORT') || process.env.PORT || 3000}/files`;
        return new LocalFileStorageAdapter(root, prefix, publicUrl);
    }
}
