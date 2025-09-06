export interface FileItem {
    file: File
    name: string
    duration?: number
}
export interface VideoConfig {
    title: string
    loopCount: number
    imageDuration: number
    processingDevice: "cpu" | "gpu" | "amd-gpu"
    cutEnabled?: boolean
    cutInterval?: number
}
export interface ProcessingStatus {
    stage: "idle" | "preparing" | "processing-video" | "processing-audio" | "finalizing" | "complete" | "error"
    progress: number
    message: string
    outputPath?: string
    outputDir?: string
}
export interface CommandResult {
    success: boolean
    stdout?: string
    stderr?: string
    error?: string
}
export interface FFmpegStatus {
    isChecking: boolean
    isInstalled: boolean
    version?: string
    error?: string
    hasChecked: boolean
}
export type Status = "idle" | "processing" | "complete"
