import { PrismaClient, Job, Asset, Metadata } from '../generated/prisma';
import { JobEntity, JobStatus, SavedOutputAsset, OutputAsset, JobEntityId } from '../types';
import { JobNotFoundError } from '../errors';

const prisma = new PrismaClient();

// --- Private Mappers ---

function toJobEntity(job: Job & { assets?: Asset[]; metadata?: Metadata[] }): JobEntity {
    return {
        ...job,
        type: job.type as JobEntity['type'],
        status: job.status as JobStatus,
        payload: job.payload as any, // The payload is expected to be correct by this point
        assets: job.assets?.map(toSavedOutputAsset) ?? [],
        metadata: job.metadata ?? [],
    };
}

function toSavedOutputAsset(asset: Asset): SavedOutputAsset {
    return {
        ...asset,
        storedPath: asset.stored_path,
        type: 'output',
    };
}


// --- Public API ---

export async function addJob(job: Partial<JobEntity>): Promise<JobEntity> {
    const newJob = await prisma.job.create({
        data: {
            type: job.type!,
            user_id: job.user_id!,
            status: job.status!,
            payload: job.payload! as any,
        },
    });
    return toJobEntity(newJob);
}

export async function getJobWithAssets(id: JobEntityId): Promise<JobEntity | null> {
    const job = await prisma.job.findUnique({
        where: { id },
        include: { assets: true, metadata: true },
    });
    if (!job) return null;
    return toJobEntity(job);
}

export async function getAllJobs(): Promise<JobEntity[]> {
    const jobs = await prisma.job.findMany({
        include: { assets: true, metadata: true },
        orderBy: { created_at: 'desc' },
    });
    return jobs.map(toJobEntity);
}

export async function getAssetsByJobId(id: JobEntityId): Promise<SavedOutputAsset[]> {
    const job = await prisma.job.findUnique({
        where: { id },
        include: { assets: true },
    });
    if (!job) throw new JobNotFoundError(id);
    return job.assets.map(toSavedOutputAsset);
}

export async function updateJobStatus(id: JobEntityId, status: JobStatus): Promise<JobEntity> {
    const updatedJob = await prisma.job.update({
        where: { id },
        data: { status },
    });
    return toJobEntity(updatedJob);
}

export async function markJobComplete(id: JobEntityId, logs: string): Promise<JobEntity> {
    const updatedJob = await prisma.job.update({
        where: { id },
        data: {
            status: JobStatus.Completed,
            completed_at: new Date(),
            logs,
        },
    });
    return toJobEntity(updatedJob);
}

export async function markJobFailed(id: JobEntityId, logs: string): Promise<JobEntity> {
    const updatedJob = await prisma.job.update({
        where: { id },
        data: {
            status: JobStatus.Failed,
            completed_at: new Date(),
            logs,
        },
    });
    return toJobEntity(updatedJob);
}

export async function addAssets(job: JobEntity, assets: OutputAsset[]): Promise<SavedOutputAsset[]> {
    const createdAssets = await prisma.$transaction(
        assets.map((asset) =>
            prisma.asset.create({
                data: {
                    job_id: job.id,
                    name: asset.name,
                    stored_path: asset.storedPath,
                    url: asset.url,
                    type: 'output',
                },
            })
        )
    );
    return createdAssets.map(toSavedOutputAsset);
}

export async function markAssetAsDeleted(id: number): Promise<SavedOutputAsset> {
    const updatedAsset = await prisma.asset.update({
        where: { id },
        data: { deleted_at: new Date() },
    });
    return toSavedOutputAsset(updatedAsset);
} 