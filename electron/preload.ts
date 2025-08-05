import { contextBridge, ipcRenderer } from "electron"

// Define the API interface
export interface ElectronAPI {
    // File system operations
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
    writeFile: (
        filePath: string,
        content: string,
        encoding?: "utf-8" | "base64"
    ) => Promise<{ success: boolean; error?: string }>
    readDirectory: (dirPath: string) => Promise<{
        success: boolean
        files?: Array<{ name: string; isDirectory: boolean; path: string }>
        error?: string
    }>
    selectDirectory: () => Promise<{ success: boolean; path?: string; error?: string }>
    selectFile: (filters?: Array<{ name: string; extensions: string[] }>) => Promise<{
        success: boolean
        path?: string
        error?: string
    }>

    // Terminal operations
    executeCommand: (
        command: string,
        cwd?: string
    ) => Promise<{
        success: boolean
        stdout?: string
        stderr?: string
        error?: string
    }>
    spawnCommand: (
        command: string,
        args: string[],
        cwd?: string
    ) => Promise<{
        success: boolean
        code?: number
        stdout?: string
        stderr?: string
        error?: string
    }>

    // System operations
    openExternal: (url: string) => Promise<{ success: boolean; error?: string }>
    openDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>
    checkFFmpeg: () => Promise<{ success: boolean; installed: boolean; version?: string; error?: string }>
    installFFmpeg: () => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>
    getAppInfo: () => Promise<{
        version: string
        name: string
        platform: string
        arch: string
        nodeVersion: string
        electronVersion: string
        chromeVersion: string
    }>

    // Event listeners
    onCommandOutput: (callback: (data: { type: "stdout" | "stderr"; data: string }) => void) => () => void
    removeAllCommandOutputListeners: () => void
}

// Expose the API to the renderer process
const electronAPI: ElectronAPI = {
    // File system operations
    readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
    writeFile: (filePath: string, content: string, encoding?: "utf-8" | "base64") =>
        ipcRenderer.invoke("write-file", filePath, content, encoding),
    readDirectory: (dirPath: string) => ipcRenderer.invoke("read-directory", dirPath),
    selectDirectory: () => ipcRenderer.invoke("select-directory"),
    selectFile: (filters) => ipcRenderer.invoke("select-file", filters),

    // Terminal operations
    executeCommand: (command: string, cwd?: string) => ipcRenderer.invoke("execute-command", command, cwd),
    spawnCommand: (command: string, args: string[], cwd?: string) =>
        ipcRenderer.invoke("spawn-command", command, args, cwd),

    // System operations
    openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
    openDirectory: (dirPath: string) => ipcRenderer.invoke("open-directory", dirPath),
    checkFFmpeg: () => ipcRenderer.invoke("check-ffmpeg"),
    installFFmpeg: () => ipcRenderer.invoke("install-ffmpeg"),
    getAppInfo: () => ipcRenderer.invoke("get-app-info"),

    // Event listeners
    onCommandOutput: (callback) => {
        const listener = (_: any, data: { type: "stdout" | "stderr"; data: string }) => callback(data)
        ipcRenderer.on("command-output", listener)
        return () => ipcRenderer.removeListener("command-output", listener)
    },
    removeAllCommandOutputListeners: () => {
        ipcRenderer.removeAllListeners("command-output")
    },
}

// Expose the API
contextBridge.exposeInMainWorld("electronAPI", electronAPI)

// Type declaration for global access
declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}
