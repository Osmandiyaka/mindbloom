import { FileObject, FileStoragePort } from '../../domain/ports/out/file-storage.port';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export class S3FileStorageAdapter implements FileStoragePort {
    private client: S3Client;

    constructor(
        private readonly bucket: string,
        private readonly prefix: string,
        region: string,
        endpoint?: string,
    ) {
        this.client = new S3Client({
            region,
            endpoint,
            forcePathStyle: !!endpoint,
        });
    }

    private resolveKey(fileName: string): string {
        return `${this.prefix.replace(/\/$/, '')}/${fileName.replace(/^\//, '')}`;
    }

    async upload(fileName: string, data: Buffer, contentType?: string): Promise<FileObject> {
        const Key = this.resolveKey(fileName);
        await this.client.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key,
            Body: data,
            ContentType: contentType,
        }));
        return { key: Key, url: `https://${this.bucket}.s3.amazonaws.com/${Key}`, size: data.length, contentType };
    }

    async download(fileName: string): Promise<Buffer> {
        const Key = this.resolveKey(fileName);
        const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key }));
        const stream = res.Body as Readable;
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }

    async delete(fileName: string): Promise<void> {
        const Key = this.resolveKey(fileName);
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key }));
    }

    async list(prefix: string = ''): Promise<FileObject[]> {
        const listPrefix = this.resolveKey(prefix);
        const res = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: listPrefix }));
        return (res.Contents || []).map(obj => ({
            key: obj.Key || '',
            size: obj.Size,
        }));
    }
}
