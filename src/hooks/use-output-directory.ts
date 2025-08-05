import { useState, useEffect, useCallback } from "react"
import { useElectron } from "./use-electron"
const OUTPUT_DIR_KEY = "vibemix-output-directory"
export const useOutputDirectory = () => {
    const [outputDirectory, setOutputDirectory] = useState<string | null>(null)
    const { isElectron, selectDirectory, openDirectory } = useElectron()
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(OUTPUT_DIR_KEY)
            if (saved) {
                setOutputDirectory(saved)
            }
        }
    }, [])
    const saveOutputDirectory = useCallback((path: string) => {
        setOutputDirectory(path)
        if (typeof window !== "undefined") {
            localStorage.setItem(OUTPUT_DIR_KEY, path)
        }
    }, [])
    const selectOutputDirectory = useCallback(async () => {
        if (!isElectron) {
            throw new Error("Directory selection is only available in desktop mode")
        }
        const result = await selectDirectory()
        if (result.success && result.path) {
            saveOutputDirectory(result.path)
            return { success: true, path: result.path }
        }
        return { success: false, error: result.error || "No directory selected" }
    }, [isElectron, selectDirectory, saveOutputDirectory])
    const clearOutputDirectory = useCallback(() => {
        setOutputDirectory(null)
        if (typeof window !== "undefined") {
            localStorage.removeItem(OUTPUT_DIR_KEY)
        }
    }, [])
    const openOutputDirectory = useCallback(
        async (dirPath?: string) => {
            if (!isElectron) {
                throw new Error("Opening directories is only available in desktop mode")
            }
            const pathToOpen = dirPath || outputDirectory
            if (!pathToOpen) {
                throw new Error("No output directory available to open")
            }
            return await openDirectory(pathToOpen)
        },
        [isElectron, openDirectory, outputDirectory]
    )
    return {
        outputDirectory,
        saveOutputDirectory,
        selectOutputDirectory,
        clearOutputDirectory,
        openOutputDirectory,
        hasOutputDirectory: !!outputDirectory,
    }
}
