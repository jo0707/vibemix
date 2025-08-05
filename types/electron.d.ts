interface ElectronAPI {
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
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

    onCommandOutput: (callback: (data: { type: "stdout" | "stderr"; data: string }) => void) => () => void
    removeAllCommandOutputListeners: () => void
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}

export {}
