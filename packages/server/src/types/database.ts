import { FFprobeResult } from "./ffprobe";

export type JobMetadata = {
    job_id: number
    job_duration_ms: number
    input_bytes: number
    output_bytes: number
    assets: {
        id: number | null,
        name: string | null,
        size: number,
        type: 'input' | 'output',
        ffprobe: FFprobeResult
    }[]
}