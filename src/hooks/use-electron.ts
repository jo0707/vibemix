import { useEffect, useState, useCallback } from "react"

export interface FileSystemItem {
    name: string
    isDirectory: boolean
    path: string
}

export interface CommandResult {
    success: boolean
    stdout?: string
    stderr?: string
    error?: string
    code?: number
}

export interface AppInfo {
    version: string
    name: string
    platform: string
    arch: string
    nodeVersion: string
    electronVersion: string
    chromeVersion: string
}

export const useElectron = () => {
    const [isElectron, setIsElectron] = useState(false)
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null)

    useEffect(() => {
        setIsElectron(typeof window !== "undefined" && !!window.electronAPI)

        if (typeof window !== "undefined" && window.electronAPI) {
            window.electronAPI.getAppInfo().then(setAppInfo)
        }
    }, [])

    // File system operations
    const readFile = useCallback(async (filePath: string) => {
        if (!window.electronAPI) throw new Error("Electron API not available")
        return window.electronAPI.readFile(filePath)
    }, [])

    const writeFile = useCallback(async (filePath: string, content: string, encoding?: "utf-8" | "base64") => {
        if (!window.electronAPI) throw new Error("Electron API not available")
        return window.electronAPI.writeFile(filePath, content, encoding)
    }, [])

    const readDirectory = useCallback(async (dirPath: string) => {
        if (!window.electronAPI) throw new Error("Electron API not available")
        return window.electronAPI.readDirectory(dirPath)
    }, [])

    const selectDirectory = useCallback(async () => {
        if (!window.electronAPI) throw new Error("Electron API not available")
        return window.electronAPI.selectDirectory()
    }, [])

    const selectFile = useCallback(async (filters?: Array<{ name: string; extensions: string[] }>) => {
        if (!window.electronAPI) throw new Error("Electron API not available")
        return window.electronAPI.selectFile(filters)
    }, [])

    // Terminal operations
    const executeCommand = useCallback(async (command: string, cwd?: string) => {
        if (!window.electronAPI) throw new Error("Electron API not available")
        return window.electronAPI.executeCommand(command, cwd)
    }, [])

    const spawnCommand = useCallback(async (command: string, args: string[], cwd?: string) => {
        if (!window.electronAPI) throw new Error("Electron API not available")
        return window.electronAPI.spawnCommand(command, args, cwd)
    }, [])

    // System operations
    const openExternal = useCallback(async (url: string) => {
        if (!window.electronAPI) throw new Error("Electron API not available")
        return window.electronAPI.openExternal(url)
    }, [])

    const openDirectory = useCallback(async (dirPath: string) => {
        if (!window.electronAPI) throw new Error("Electron API not available")
        return window.electronAPI.openDirectory(dirPath)
    }, [])

    const checkFFmpeg = useCallback(async () => {
        if (!window.electronAPI) throw new Error("Electron API not available")
        return window.electronAPI.checkFFmpeg()
    }, [])

    const installFFmpeg = useCallback(async () => {
        if (!window.electronAPI) throw new Error("Electron API not available")
        return window.electronAPI.installFFmpeg()
    }, [])

    // Event handling
    const onCommandOutput = useCallback((callback: (data: { type: "stdout" | "stderr"; data: string }) => void) => {
        if (!window.electronAPI) return () => {}
        return window.electronAPI.onCommandOutput(callback)
    }, [])

    const removeAllCommandOutputListeners = useCallback(() => {
        if (!window.electronAPI) return
        window.electronAPI.removeAllCommandOutputListeners()
    }, [])

    return {
        isElectron,
        appInfo,
        // File system
        readFile,
        writeFile,
        readDirectory,
        selectDirectory,
        selectFile,
        // Terminal
        executeCommand,
        spawnCommand,
        // System
        openExternal,
        openDirectory,
        checkFFmpeg,
        installFFmpeg,
        // Events
        onCommandOutput,
        removeAllCommandOutputListeners,
    }
}
