import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { JobEntityId, SavedOutputAsset } from './types';
import { DeletionError, NoOutputsError } from './errors';
import { getAssetsByJobId, markAssetAsDeleted } from './db';
import { getStorageDriver } from './config';

interface StorageDriver {
    uploadFile(localFilePath: string, remoteFileName: string): Promise<any>;
    getPublicUrl(key: string): Promise<string>;
    deleteFilesByJobId(id: JobEntityId): Promise<SavedOutputAsset[]>;
}

class S3Storage implements StorageDriver {
    private s3Client: S3Client;

    constructor() {
        this.s3Client = new S3Client({
            endpoint: process.env.S3_ENDPOINT,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY,
            },
            region: process.env.S3_REGION,
            forcePathStyle: true
        });
    }

    async uploadFile(localFilePath: string, remoteFileName: string) {
        const fileStream = fs.createReadStream(localFilePath);

        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: remoteFileName,
            Body: fileStream,
            ACL: 'public-read',
        });

        return this.s3Client.send(command);
    }

    async getPublicUrl(key: string) {
        return `https://${process.env.S3_PUBLIC_DOMAIN}/${key}`;
    }

    async deleteFilesByJobId(id: JobEntityId): Promise<SavedOutputAsset[]> {
        const assets = await getAssetsByJobId(id);
        const assetsToDelete = assets.filter(a => a.type === 'output' && a.deleted_at === null);

        if (assetsToDelete.length === 0) {
            throw new NoOutputsError(id);
        }

        const assetDict: Record<string, SavedOutputAsset> = {};
        for (const asset of assetsToDelete) {
            assetDict[asset.storedPath] = asset;
        }

        const cmd = new DeleteObjectsCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Delete: {
                Objects: Object.keys(assetDict).map(Key => ({ Key })),
                Quiet: false,
            },
        });
        const result = await this.s3Client.send(cmd);

        if (result.Errors && result.Errors.length > 0) {
            const e = result.Errors[0];
            throw new DeletionError(e.Key as string, new Error(e.Message));
        }

        const deletedKeys = (result.Deleted ?? [])
            .map(d => d.Key)
            .filter((k): k is string => Boolean(k));

        const marked = await Promise.all(
            deletedKeys
                .map(key => assetDict[key])
                .filter((asset): asset is SavedOutputAsset => asset !== undefined)
                .map(asset => markAssetAsDeleted(asset.id))
        );

        return marked;
    }
}

class LocalStorage implements StorageDriver {
    private storagePath: string;
    private publicUrl: string;

    constructor() {
        this.storagePath = process.env.LOCAL_STORAGE_PATH || 'public/outputs';
        this.publicUrl = process.env.PUBLIC_URL || 'http://localhost:3000/outputs';
        this.ensureStoragePathExists();
    }

    private async ensureStoragePathExists() {
        try {
            await fsp.mkdir(this.storagePath, { recursive: true });
        } catch (error) {
            console.error("Failed to create storage directory", error);
        }
    }

    async uploadFile(localFilePath: string, remoteFileName: string) {
        const destination = path.join(this.storagePath, remoteFileName);
        const dirname = path.dirname(destination);
        await fsp.mkdir(dirname, { recursive: true });
        return fsp.copyFile(localFilePath, destination);
    }

    async getPublicUrl(key: string) {
        return `${this.publicUrl}/${key}`;
    }

    async deleteFilesByJobId(id: JobEntityId): Promise<SavedOutputAsset[]> {
        const assets = await getAssetsByJobId(id);
        const assetsToDelete = assets.filter(a => a.type === 'output' && a.deleted_at === null);

        if (assetsToDelete.length === 0) {
            throw new NoOutputsError(id);
        }
        
        const deletedAssets: SavedOutputAsset[] = [];
        for (const asset of assetsToDelete) {
            try {
                const filePath = path.join(this.storagePath, asset.storedPath);
                await fsp.unlink(filePath);
                const marked = await markAssetAsDeleted(asset.id);
                deletedAssets.push(marked);
            } catch (error) {
                // TODO: better error handling
                console.error(`Failed to delete file ${asset.storedPath}`, error);
            }
        }

        return deletedAssets;
    }
}

let storage: StorageDriver | null = null;

function getStorage(): StorageDriver {
    if (storage) {
        return storage;
    }

    const driver = getStorageDriver();
    if (driver === 'local') {
        storage = new LocalStorage();
    } else {
        storage = new S3Storage();
    }
    return storage;
}

export async function uploadFile({ localFilePath, remoteFileName }: {
    localFilePath: string,
    remoteFileName: string
}) {
    return getStorage().uploadFile(localFilePath, remoteFileName);
}

export async function getPublicUrl(key: string) {
    return getStorage().getPublicUrl(key);
}

export async function deleteFilesByJobId(
    id: JobEntityId
): Promise<SavedOutputAsset[]> {
    return getStorage().deleteFilesByJobId(id);
}