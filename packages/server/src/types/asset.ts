import { Static, Type } from "@sinclair/typebox"

interface BaseAsset {
    url: string
}

export interface InputAsset extends BaseAsset {
    type: 'input'
}
export interface OutputAsset extends BaseAsset {
    type: 'output'
    name: string
    storedPath: string
}

export type Asset = InputAsset | OutputAsset

export interface SavedInputAsset extends InputAsset {
    id: number
    job_id: number
    deleted_at: string | null
    created_at: string
}

export interface SavedOutputAsset extends OutputAsset {
    id: number
    job_id: number
    deleted_at: string | null
    created_at: string
}

export type SavedAsset = SavedInputAsset | SavedOutputAsset

export const SavedAssetSchema = Type.Object({
    id: Type.Number(),
    job_id: Type.Number(),
    deleted_at: Type.Union([Type.String(), Type.Null()]),
    created_at: Type.String(),
    url: Type.String(),
    type: Type.String(),
    name: Type.Optional(Type.String()),
    stored_path: Type.Optional(Type.String()),
    size: Type.Optional(Type.Number())
})
