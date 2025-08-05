import { app, BrowserWindow, ipcMain, dialog, shell, protocol } from "electron"
import { spawn, exec } from "child_process"
import * as path from "path"
import * as fs from "fs"
import { promisify } from "util"

const execAsync = promisify(exec)
const isDev = process.env.NODE_ENV === "development"

let mainWindow: BrowserWindow

function createWindow(): void {
    // Create the browser window
    mainWindow = new BrowserWindow({
        height: 900,
        width: 1400,
        minHeight: 600,
        minWidth: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // Disable web security to allow loading local CSS/JS files
        },
        titleBarStyle: "default",
        show: false, // Don't show until ready
    })

    // Load the app
    if (isDev) {
        mainWindow.loadURL("http://localhost:9002")
        // Open DevTools in development
        mainWindow.webContents.openDevTools()
    } else {
        // Load the static HTML file with proper file protocol
        const indexPath = path.join(__dirname, "../out/index.html")
        mainWindow.loadFile(indexPath)

        // Enable file protocol to load CSS and JS files
        mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            if (url.startsWith("file://")) {
                return { action: "allow" }
            }
            return { action: "deny" }
        })
    }

    // Show window when ready to prevent visual flash
    mainWindow.once("ready-to-show", () => {
        mainWindow.show()
    })

    // Handle window closed
    mainWindow.on("closed", () => {
        mainWindow = null as any
    })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    // Register file protocol handler for static assets in production
    if (!isDev) {
        protocol.registerFileProtocol("file", (request, callback) => {
            const pathname = decodeURI(request.url.replace("file:///", ""))
            callback(pathname)
        })
    }

    createWindow()
})

// Quit when all windows are closed
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit()
    }
})

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// IPC handlers for file system operations
ipcMain.handle("read-file", async (_, filePath: string) => {
    try {
        const content = await fs.promises.readFile(filePath, "utf-8")
        return { success: true, content }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle("write-file", async (_, filePath: string, content: string, encoding?: "utf-8" | "base64") => {
    try {
        if (encoding === "base64") {
            const buffer = Buffer.from(content, "base64")
            await fs.promises.writeFile(filePath, buffer)
        } else {
            await fs.promises.writeFile(filePath, content, "utf-8")
        }
        return { success: true }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle("read-directory", async (_, dirPath: string) => {
    try {
        const files = await fs.promises.readdir(dirPath, { withFileTypes: true })
        const result = files.map((file) => ({
            name: file.name,
            isDirectory: file.isDirectory(),
            path: path.join(dirPath, file.name),
        }))
        return { success: true, files: result }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle("select-directory", async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ["openDirectory"],
        })

        if (!result.canceled && result.filePaths.length > 0) {
            return { success: true, path: result.filePaths[0] }
        }

        return { success: false, error: "No directory selected" }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle("select-file", async (_, filters?: { name: string; extensions: string[] }[]) => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ["openFile"],
            filters: filters || [{ name: "All Files", extensions: ["*"] }],
        })

        if (!result.canceled && result.filePaths.length > 0) {
            return { success: true, path: result.filePaths[0] }
        }

        return { success: false, error: "No file selected" }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})

// IPC handlers for terminal operations
ipcMain.handle("execute-command", async (_, command: string, cwd?: string) => {
    try {
        const { stdout, stderr } = await execAsync(command, {
            cwd: cwd || process.cwd(),
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        })
        return {
            success: true,
            stdout: stdout.toString(),
            stderr: stderr.toString(),
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            stdout: error.stdout?.toString() || "",
            stderr: error.stderr?.toString() || "",
        }
    }
})

ipcMain.handle("spawn-command", (_, command: string, args: string[], cwd?: string) => {
    return new Promise((resolve) => {
        const child = spawn(command, args, {
            cwd: cwd || process.cwd(),
            stdio: "pipe",
        })

        let stdout = ""
        let stderr = ""

        child.stdout?.on("data", (data) => {
            stdout += data.toString()
            // Send real-time updates
            mainWindow.webContents.send("command-output", {
                type: "stdout",
                data: data.toString(),
            })
        })

        child.stderr?.on("data", (data) => {
            stderr += data.toString()
            // Send real-time updates
            mainWindow.webContents.send("command-output", {
                type: "stderr",
                data: data.toString(),
            })
        })

        child.on("close", (code) => {
            resolve({
                success: code === 0,
                code,
                stdout,
                stderr,
            })
        })

        child.on("error", (error) => {
            resolve({
                success: false,
                error: error.message,
                stdout,
                stderr,
            })
        })
    })
})

// Handle external links
ipcMain.handle("open-external", async (_, url: string) => {
    try {
        await shell.openExternal(url)
        return { success: true }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})

// Open directory in file explorer
ipcMain.handle("open-directory", async (_, dirPath: string) => {
    try {
        await shell.showItemInFolder(dirPath)
        return { success: true }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
})

// Check if FFmpeg is installed
ipcMain.handle("check-ffmpeg", async () => {
    try {
        const { stdout } = await execAsync("ffmpeg -version")
        return {
            success: true,
            installed: true,
            version: stdout.split("\n")[0], // First line contains version info
        }
    } catch (error) {
        return {
            success: true,
            installed: false,
            error: (error as Error).message,
        }
    }
})

// Install FFmpeg using winget
ipcMain.handle("install-ffmpeg", async () => {
    try {
        const command = "winget install -e --id Gyan.FFmpeg"
        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 1024 * 1024 * 50, // 50MB buffer for installation output
        })
        return {
            success: true,
            stdout: stdout.toString(),
            stderr: stderr.toString(),
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            stdout: error.stdout?.toString() || "",
            stderr: error.stderr?.toString() || "",
        }
    }
})

// Get app info
ipcMain.handle("get-app-info", () => {
    return {
        version: app.getVersion(),
        name: app.getName(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome,
    }
})
