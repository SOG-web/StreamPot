import { OutputAsset } from "../types";
import fs from "fs/promises";
import { join } from "node:path";
import { v4 as uuidv4 } from "uuid";
import { getPublicUrl, uploadFile } from "../storage";

export interface Environment {
    directory: string
}

export async function createEnvironment() {
    const name = `/tmp/ffmpeg-${uuidv4()}`;

    await fs.mkdir(name, { mode: 0o755 });

    return {
        directory: name
    };
}

async function getFiles(dir: string): Promise<string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = join(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return Array.prototype.concat(...files);
}

export async function uploadAssets({ directory }: Environment): Promise<OutputAsset[]> {
    const files = await getFiles(directory);

    const uploadPromises = files.map(async (fullPath) => {
        const localFilePath = fullPath;
        const remoteFileName = fullPath.substring(directory.length + 1);

        await uploadFile({ localFilePath, remoteFileName });

        const url = await getPublicUrl(remoteFileName)

        return <OutputAsset>{ name: remoteFileName, url, storedPath: remoteFileName };
    });

    const assets = await Promise.all(uploadPromises);

    return assets.filter(asset => asset !== null);
}

export async function deleteEnvironment({ directory }: Environment) {
    await fs.rm(directory, { recursive: true });
}
