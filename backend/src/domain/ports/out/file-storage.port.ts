export interface FileObject {
    key: string;
    url?: string;
    size?: number;
    contentType?: string;
}

export interface FileStoragePort {
    upload(fileName: string, data: Buffer, contentType?: string): Promise<FileObject>;
    download(fileName: string): Promise<Buffer>;
    delete(fileName: string): Promise<void>;
    list(prefix?: string): Promise<FileObject[]>;
}
