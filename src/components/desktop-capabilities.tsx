import React, { useState, useEffect } from "react"
import { useElectron } from "@/hooks/use-electron"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FolderOpen, FileText, Terminal, Play, Info, ExternalLink, Monitor, HardDrive, Cpu } from "lucide-react"
import { FFmpegStatus } from "./ffmpeg-status"
export const DesktopCapabilities: React.FC = () => {
    const {
        isElectron,
        appInfo,
        readFile,
        writeFile,
        readDirectory,
        selectDirectory,
        selectFile,
        executeCommand,
        openExternal,
        onCommandOutput,
        removeAllCommandOutputListeners,
    } = useElectron()
    const [selectedPath, setSelectedPath] = useState<string>("")
    const [fileContent, setFileContent] = useState<string>("")
    const [commandInput, setCommandInput] = useState<string>("ls")
    const [commandOutput, setCommandOutput] = useState<string>("")
    const [directoryContents, setDirectoryContents] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => {
        if (!isElectron) return
        const unsubscribe = onCommandOutput((data) => {
            setCommandOutput((prev) => prev + data.data)
        })
        return () => {
            unsubscribe()
            removeAllCommandOutputListeners()
        }
    }, [isElectron, onCommandOutput, removeAllCommandOutputListeners])
    const handleSelectDirectory = async () => {
        try {
            const result = await selectDirectory()
            if (result.success && result.path) {
                setSelectedPath(result.path)
                const dirResult = await readDirectory(result.path)
                if (dirResult.success && dirResult.files) {
                    setDirectoryContents(dirResult.files)
                }
            }
        } catch (error) {
            console.error("Error selecting directory:", error)
        }
    }
    const handleSelectFile = async () => {
        try {
            const result = await selectFile([
                { name: "Text Files", extensions: ["txt", "md", "json"] },
                { name: "All Files", extensions: ["*"] },
            ])
            if (result.success && result.path) {
                setSelectedPath(result.path)
                const fileResult = await readFile(result.path)
                if (fileResult.success && fileResult.content) {
                    setFileContent(fileResult.content)
                }
            }
        } catch (error) {
            console.error("Error selecting file:", error)
        }
    }
    const handleSaveFile = async () => {
        if (!selectedPath || !fileContent) return
        try {
            setIsLoading(true)
            const result = await writeFile(selectedPath, fileContent)
            if (result.success) {
                alert("File saved successfully!")
            } else {
                alert("Error saving file: " + result.error)
            }
        } catch (error) {
            console.error("Error saving file:", error)
        } finally {
            setIsLoading(false)
        }
    }
    const handleExecuteCommand = async () => {
        if (!commandInput.trim()) return
        try {
            setIsLoading(true)
            setCommandOutput("")
            const result = await executeCommand(commandInput, selectedPath || undefined)
            if (result.success) {
                setCommandOutput(result.stdout || "")
                if (result.stderr) {
                    setCommandOutput((prev) => prev + "\nSTDERR:\n" + result.stderr)
                }
            } else {
                setCommandOutput(`Error: ${result.error}\n${result.stdout || ""}\n${result.stderr || ""}`)
            }
        } catch (error) {
            console.error("Error executing command:", error)
            setCommandOutput(`Error: ${error}`)
        } finally {
            setIsLoading(false)
        }
    }
    const handleOpenExternal = () => {
        openExternal("https://electronjs.org/")
    }
    if (!isElectron) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        Desktop Features
                    </CardTitle>
                    <CardDescription>This component requires the Electron desktop environment</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground">
                        <p>Please run this application as a desktop app to access file system and terminal features.</p>
                        <p className="mt-2 text-sm">
                            Run: <code>bun run electron:dev</code>
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }
    return (
        <div className="space-y-6 w-full max-w-4xl mx-auto">
            {}
            {appInfo && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Application Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Version</p>
                                <Badge variant="secondary">{appInfo.version}</Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Platform</p>
                                <Badge variant="outline">{appInfo.platform}</Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Architecture</p>
                                <Badge variant="outline">{appInfo.arch}</Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Electron</p>
                                <Badge variant="outline">v{appInfo.electronVersion}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
            {}
            <FFmpegStatus />
            {}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        File System Access
                    </CardTitle>
                    <CardDescription>Select and manipulate files and directories on your system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Button onClick={handleSelectDirectory} variant="outline">
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Select Directory
                        </Button>
                        <Button onClick={handleSelectFile} variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            Select File
                        </Button>
                    </div>
                    {selectedPath && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Selected: {selectedPath}</p>
                            {directoryContents.length > 0 && (
                                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                                    <p className="text-sm font-medium mb-2">Directory Contents:</p>
                                    {directoryContents.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                            {item.isDirectory ? (
                                                <FolderOpen className="h-4 w-4" />
                                            ) : (
                                                <FileText className="h-4 w-4" />
                                            )}
                                            <span>{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {fileContent && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-medium">File Content:</p>
                                        <Button onClick={handleSaveFile} disabled={isLoading} size="sm">
                                            Save Changes
                                        </Button>
                                    </div>
                                    <Textarea
                                        value={fileContent}
                                        onChange={(e) => setFileContent(e.target.value)}
                                        className="min-h-32 font-mono text-sm"
                                        placeholder="File content will appear here..."
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            {}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Terminal className="h-5 w-5" />
                        Terminal Access
                    </CardTitle>
                    <CardDescription>Execute system commands and see real-time output</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={commandInput}
                            onChange={(e) => setCommandInput(e.target.value)}
                            placeholder="Enter command (e.g., ls, dir, node --version)"
                            onKeyDown={(e) => e.key === "Enter" && handleExecuteCommand()}
                        />
                        <Button onClick={handleExecuteCommand} disabled={isLoading}>
                            <Play className="h-4 w-4 mr-2" />
                            Run
                        </Button>
                    </div>
                    {commandOutput && (
                        <div className="border rounded-lg p-3 bg-black text-green-400 font-mono text-sm max-h-60 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">{commandOutput}</pre>
                        </div>
                    )}
                </CardContent>
            </Card>
            {}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Cpu className="h-5 w-5" />
                        System Integration
                    </CardTitle>
                    <CardDescription>Interact with the operating system</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleOpenExternal} variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Electron Documentation
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
