export function shouldCollectAssetMetadata() {
    return process.env.COLLECT_ASSET_METADATA === 'true'
}

export function shouldUseDockerForFFmpeg() {
    return process.env.FFMPEG_STRATEGY === 'docker'
}

export function getStorageDriver() {
    return process.env.STORAGE_DRIVER ?? 's3';
}

export function getDbClient() {
    return process.env.DB_CLIENT ?? 'pg';
}

export function shouldUseAPIKey() {
    return process.env.API_KEY !== undefined && process.env.API_KEY !== ""
}