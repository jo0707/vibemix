import { useState, useEffect, useCallback } from "react"
import { useElectron } from "./use-electron"
import { useToast } from "./use-toast"
import type { FFmpegStatus } from "@/types"
export const useFFmpegStatus = () => {
    const [status, setStatus] = useState<FFmpegStatus>({
        isChecking: false,
        isInstalled: false,
        hasChecked: false,
    })
    const { isElectron, checkFFmpeg } = useElectron()
    const { toast } = useToast()
    const checkStatus = useCallback(async () => {
        if (!isElectron) return
        setStatus((prev) => ({ ...prev, isChecking: true }))
        try {
            const result = await checkFFmpeg()
            setStatus({
                isChecking: false,
                isInstalled: result.installed,
                version: result.version,
                error: result.error,
                hasChecked: true,
            })
            if (!result.installed) {
                toast({
                    variant: "destructive",
                    title: "FFmpeg Not Installed",
                    description:
                        "FFmpeg is required for video processing. Please install it from the Desktop Features tab.",
                    duration: 8000,
                })
            }
            return result
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error"
            setStatus({
                isChecking: false,
                isInstalled: false,
                error: errorMessage,
                hasChecked: true,
            })
            return { success: false, installed: false, error: errorMessage }
        }
    }, [isElectron, checkFFmpeg, toast])
    useEffect(() => {
        if (isElectron && !status.hasChecked) {
            checkStatus()
        }
    }, [isElectron, status.hasChecked, checkStatus])
    return { status, checkStatus, refresh: checkStatus }
}
