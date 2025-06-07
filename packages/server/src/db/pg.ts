import { Pool, PoolClient } from 'pg';
import { JobEntity, JobStatus, SavedOutputAsset, OutputAsset, JobEntityId } from '../types';

let pool: Pool | null = null;

function getClient(): PoolClient | Pool {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }
    return pool;
}

// --- Jobs ---

export async function addJob(job: Partial<JobEntity>): Promise<JobEntity> {
    const res = await getClient().query(
        'INSERT INTO jobs (type, user_id, status, payload) VALUES ($1, $2, $3, $4::jsonb) RETURNING *',
        [job.type, job.user_id, job.status, JSON.stringify(job.payload)],
    );
    return res.rows[0];
}

export async function getJobWithAssets(id: JobEntityId): Promise<JobEntity | null> {
    const jobRes = await getClient().query('SELECT * FROM jobs WHERE id = $1 LIMIT 1', [id]);
    if (jobRes.rows.length === 0) return null;

    const job = jobRes.rows[0];
    const assetsRes = await getClient().query(
        "SELECT *, stored_path as \"storedPath\" FROM assets WHERE job_id = $1 AND deleted_at IS NULL",
        [id]
    );

    job.assets = assetsRes.rows;
    // NOTE: Does not fetch metadata for pg client currently
    return job;
}

export async function getAllJobs(): Promise<JobEntity[]> {
    const jobsRes = await getClient().query('SELECT * FROM jobs ORDER BY created_at DESC');
    return jobsRes.rows;
}

export async function updateJobStatus(id: JobEntityId, status: JobStatus): Promise<JobEntity> {
    const res = await getClient().query(
        'UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
    );
    return res.rows[0];
}

export async function markJobComplete(id: JobEntityId, logs: string): Promise<JobEntity> {
    const res = await getClient().query(
        'UPDATE jobs SET status = $1, completed_at = $2, logs = $3 WHERE id = $4 RETURNING *',
        [JobStatus.Completed, new Date(), logs, id]
    );
    return res.rows[0];
}

export async function markJobFailed(id: JobEntityId, logs: string): Promise<JobEntity> {
    const res = await getClient().query(
        'UPDATE jobs SET status = $1, completed_at = $2, logs = $3 WHERE id = $4 RETURNING *',
        [JobStatus.Failed, new Date(), logs, id]
    );
    return res.rows[0];
}

// --- Assets ---

export async function addAssets(job: JobEntity, assets: OutputAsset[]): Promise<SavedOutputAsset[]> {
    if (assets.length === 0) return [];

    const sql = `
        INSERT INTO assets (job_id, name, stored_path, url, type)
        VALUES ${assets.map((_, i) => `($1, $${2 + i * 4}, $${3 + i * 4}, $${4 + i * 4}, $${5 + i * 4})`).join(', ')}
        RETURNING *`;
    
    const params = [
        job.id,
        ...assets.flatMap(a => [a.name, a.storedPath, a.url, 'output']),
    ];
    
    const res = await getClient().query(sql, params);
    return res.rows;
}

export async function getAssetsByJobId(id: JobEntityId): Promise<SavedOutputAsset[]> {
    const res = await getClient().query(
        'SELECT *, stored_path as "storedPath" FROM assets WHERE job_id = $1 AND type = $2 AND deleted_at IS NULL',
        [id, 'output']
    );
    return res.rows;
}

export async function markAssetAsDeleted(id: number): Promise<SavedOutputAsset> {
    const res = await getClient().query(
        'UPDATE assets SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [id]
    );
    return res.rows[0];
} 