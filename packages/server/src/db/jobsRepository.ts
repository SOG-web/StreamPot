import { FullJobEntity, JobEntity, JobEntityId, JobStatus, UnsavedJobEntity } from '../types'
import { OutputAsset, SavedAsset, SavedOutputAsset } from '../types/asset';
import getClient from "./db"

export async function addJob(data: UnsavedJobEntity): Promise<JobEntity> {
    const rows = await getClient().query(
        'INSERT INTO jobs (type, user_id, status, payload) VALUES ($1, $2, $3, $4::jsonb) RETURNING *',
        [data.type, data.user_id, data.status, JSON.stringify(data.payload)],
    )

    return rows.rows[0] as JobEntity
}

export async function markJobComplete(id: JobEntityId, output: string) {
    return await getClient().query(
        'UPDATE jobs SET status = $1, completed_at = $2, logs = $3 WHERE id = $4',
        [JobStatus.Completed, new Date(), output, id]
    );
}

export async function markJobFailed(id: JobEntityId, output: string) {
    return await getClient().query(
        'UPDATE jobs SET status = $1, completed_at = $2, logs = $3 WHERE id = $4',
        [JobStatus.Failed, new Date(), output, id]
    );
}

export function updateJobStatus(id: JobEntityId, status: JobStatus) {
    return getClient().query(
        'UPDATE jobs SET status = $1 WHERE id = $2',
        [status, id]
    );
}

export async function getJobWithAssets(id: JobEntityId): Promise<JobEntity | null> {
    const client = getClient();

    const jobRes = await client.query('SELECT * FROM jobs WHERE id = $1 LIMIT 1', [id]);
    if (jobRes.rows.length === 0) return null;

    const job = jobRes.rows[0];
    const assets: SavedOutputAsset[] = (await client.query(
        `SELECT a.name, a.url, a.stored_path as "storedPath", COALESCE(am.size_bytes, 0) as size
         FROM assets a
         LEFT JOIN asset_metadata am ON a.id = am.asset_id
         WHERE a.job_id = $1 AND a.type = 'output' AND a.deleted_at IS NULL`,
        [id]
    )).rows;
    const metadata = (await client.query('SELECT * FROM job_metadata WHERE job_id = $1', [id])).rows;
    const assetMetadata = (await client.query('SELECT * FROM asset_metadata WHERE job_id = $1', [id])).rows;

    return <JobEntity>{
        ...job,
        outputs: assetsToOutputs(assets),
        metadata: metadata.length > 0 ? {
            ...metadata[0],
            assets: assetMetadata.map(row => ({
                ...row,
                ffprobe: typeof row.ffprobe === 'string' ? JSON.parse(row.ffprobe) : row.ffprobe
            }))
        } : null
    };
}

function assetsToOutputs(assets: SavedOutputAsset[]): Record<string, string> {
    return assets.reduce((outputs, asset) => {
        outputs[asset.name] = asset.url
        return outputs
    }, {})
}

export async function getFullJobWithAssets(id: JobEntityId): Promise<FullJobEntity | null> {
    const job = await getJobWithAssets(id);
    if (!job) return null;

    const assets: SavedOutputAsset[] = (await getClient().query(
        `SELECT a.id, a.name, a.url, a.stored_path as "storedPath", COALESCE(am.size_bytes, 0) as size
         FROM assets a
         LEFT JOIN asset_metadata am ON a.id = am.asset_id
         WHERE a.job_id = $1 AND a.type = 'output' AND a.deleted_at IS NULL`,
        [id]
    )).rows;

    return {
        ...job,
        assets
    };
}

export async function getAllJobs(): Promise<JobEntity[]> {
    const client = getClient();
    const [
        jobs,
        assets
    ] = await Promise.all([
        client.query('SELECT * FROM jobs'),
        client.query("SELECT * FROM assets WHERE type = 'output' AND deleted_at IS NULL")
    ])

    return jobs.rows.map(job => <JobEntity>{
        ...job,
        outputs: assetsToOutputs(assets.rows.filter(asset => asset.job_id === job.id)),
    });
}
