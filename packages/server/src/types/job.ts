import { Static, Type } from "@sinclair/typebox";
import { SavedAsset, SavedAssetSchema } from "./asset";

export enum JobStatus {
    Pending = 'pending',
    Processing = 'processing',
    Uploading = 'uploading',
    GeneratingMetadata = 'generating_metadata',
    Completed = 'completed',
    Failed = 'failed'
}

export enum Transformation {
    Actions = 'actions'
}

export const UnsavedJobEntity = Type.Object({
    type: Type.Enum(Transformation),
    user_id: Type.String(),
    status: Type.Enum(JobStatus),
    payload: Type.Array(Type.Any())
});

export const JobEntity = Type.Intersect([
    UnsavedJobEntity,
    Type.Object({
        id: Type.Number(),
        created_at: Type.String(),
        completed_at: Type.Optional(Type.String()),
        logs: Type.Optional(Type.String()),
        outputs: Type.Record(Type.String(), Type.String()),
        metadata: Type.Optional(Type.Any())
    })
]);

export const FullJobEntity = Type.Intersect([
    JobEntity,
    Type.Object({
        assets: Type.Array(SavedAssetSchema)
    })
]);

export type JobEntityId = number;
export type UnsavedJobEntity = Static<typeof UnsavedJobEntity>;
export type JobEntity = Static<typeof JobEntity>;
export type FullJobEntity = Static<typeof FullJobEntity>; 