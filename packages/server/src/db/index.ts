import { getDbClient } from '../config';
import * as pg from './pg';
import * as prisma from './prisma';
import { JobEntity, JobStatus, SavedOutputAsset, OutputAsset, JobEntityId } from '../types';

interface DbClient {
    addJob(job: Partial<JobEntity>): Promise<JobEntity>;
    getJobWithAssets(id: JobEntityId): Promise<JobEntity | null>;
    getAllJobs(): Promise<JobEntity[]>;
    getAssetsByJobId(id: JobEntityId): Promise<SavedOutputAsset[]>;
    updateJobStatus(id: JobEntityId, status: JobStatus): Promise<JobEntity>;
    markJobComplete(id: JobEntityId, logs: string): Promise<JobEntity>;
    markJobFailed(id: JobEntityId, logs: string): Promise<JobEntity>;
    addAssets(job: JobEntity, assets: OutputAsset[]): Promise<SavedOutputAsset[]>;
    markAssetAsDeleted(id: number): Promise<SavedOutputAsset>;
}

let client: DbClient;

if (getDbClient() === 'prisma') {
    client = prisma;
} else {
    client = pg;
}

export default client;
