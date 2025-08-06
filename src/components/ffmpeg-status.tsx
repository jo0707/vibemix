"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Download, Terminal, AlertTriangle, Loader2, Copy } from "lucide-react"
import { useElectron } from "@/hooks/use-electron"
import { useFFmpegStatus } from "@/hooks/use-ffmpeg-status"
import { useToast } from "@/hooks/use-toast"
interface FFmpegStatusProps {
    onStatusChange?: (isInstalled: boolean) => void
}
export function FFmpegStatus({ onStatusChange }: FFmpegStatusProps) {
    const [isInstalling, setIsInstalling] = useState(false)
    const [installationOutput, setInstallationOutput] = useState<string>("")
    const [showInstallOutput, setShowInstallOutput] = useState(false)
    const { isElectron, executeCommand, appInfo } = useElectron()
    const { status: ffmpegStatus, refresh: checkFfmpegStatus } = useFFmpegStatus()
    const { toast } = useToast()

    const platform = appInfo?.platform || "unknown"

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({
                title: "Copied!",
                description: "Command copied to clipboard",
            })
        })
    }

    const getInstallationInstructions = () => {
        switch (platform) {
            case "win32":
                return {
                    title: "Windows Installation",
                    method: "winget",
                    command: "winget install -e --id Gyan.FFmpeg",
                    alternative: {
                        method: "Manual Download",
                        steps: [
                            "1. Visit https://www.gyan.dev/ffmpeg/builds/",
                            "2. Download the latest release build",
                            "3. Extract to a folder (e.g., C:\\ffmpeg)",
                            "4. Add C:\\ffmpeg\\bin to your PATH environment variable",
                        ],
                    },
                }
            case "darwin":
                return {
                    title: "macOS Installation",
                    method: "Homebrew",
                    command: "brew install ffmpeg",
                    alternative: {
                        method: "MacPorts",
                        steps: [
                            "1. Install MacPorts from https://www.macports.org/",
                            "2. Run: sudo port install ffmpeg",
                        ],
                    },
                }
            case "linux":
                return {
                    title: "Linux Installation",
                    method: "Package Manager",
                    command: "sudo apt update && sudo apt install ffmpeg",
                    alternative: {
                        method: "Other Distributions",
                        steps: [
                            "Ubuntu/Debian: sudo apt install ffmpeg",
                            "CentOS/RHEL: sudo yum install ffmpeg",
                            "Fedora: sudo dnf install ffmpeg",
                            "Arch Linux: sudo pacman -S ffmpeg",
                        ],
                    },
                }
            default:
                return {
                    title: "Installation Required",
                    method: "Manual Installation",
                    command: "Please install FFmpeg for your operating system",
                    alternative: {
                        method: "Visit Official Website",
                        steps: ["Visit https://ffmpeg.org/download.html for platform-specific instructions"],
                    },
                }
        }
    }

    const installInstructions = getInstallationInstructions()
    useEffect(() => {
        if (ffmpegStatus.hasChecked) {
            onStatusChange?.(ffmpegStatus.isInstalled)
        }
    }, [ffmpegStatus.hasChecked, ffmpegStatus.isInstalled, onStatusChange])
    const handleInstallFFmpeg = async () => {
        if (platform !== "win32") {
            toast({
                title: "Manual Installation Required",
                description: "Please use the terminal commands shown below for your platform",
                variant: "default",
            })
            return
        }

        setIsInstalling(true)
        setShowInstallOutput(true)
        setInstallationOutput("Starting FFmpeg installation...\n")

        try {
            const terminalCommand = `start "FFmpeg Installation" cmd /k "echo Installing FFmpeg via winget... && echo This may take a few minutes && echo. && winget install -e --id Gyan.FFmpeg && echo. && echo Installation complete! You may need to restart VibeMix. && echo Press any key to close this window... && pause >nul"`

            await executeCommand(terminalCommand)
            await new Promise((resolve) => setTimeout(resolve, 2000))

            setInstallationOutput((prev) => prev + "Installation started in terminal window...\n")
            setInstallationOutput((prev) => prev + "Please wait for the installation to complete.\n")
            setInstallationOutput((prev) => prev + "You may need to restart VibeMix after installation.\n")

            toast({
                title: "Installation Started",
                description: "FFmpeg installation is running in a terminal window. Please wait for it to complete.",
            })

            setTimeout(() => {
                setIsInstalling(false)
                toast({
                    title: "Check Installation",
                    description: "Please click 'Check FFmpeg Status' to verify the installation.",
                })
            }, 5000)
        } catch (error) {
            console.error("Error installing FFmpeg:", error)
            setInstallationOutput((prev) => prev + `Error: ${error}\n`)
            toast({
                variant: "destructive",
                title: "Installation Error",
                description: "Failed to start FFmpeg installation",
            })
            setIsInstalling(false)
        }
    }
    if (!isElectron) {
        return null
    }
    return (
        <Card className="shadow-md border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <Terminal className="w-6 h-6" />
                    FFmpeg Status
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {ffmpegStatus.isChecking ? (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-blue-800">Checking FFmpeg installation...</span>
                    </div>
                ) : ffmpegStatus.hasChecked ? (
                    <div className="space-y-4">
                        {ffmpegStatus.isInstalled ? (
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    <div className="font-medium">FFmpeg is installed and ready!</div>
                                    {ffmpegStatus.version && (
                                        <div className="text-sm mt-1 font-mono text-green-700">
                                            {ffmpegStatus.version}
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="border-red-200 bg-red-50">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                    <div className="font-medium">FFmpeg is not installed</div>
                                    <div className="text-sm mt-1">
                                        FFmpeg is required for video processing. Install it to create videos.
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                        {!ffmpegStatus.isInstalled && (
                            <div className="space-y-4">
                                <Alert className="border-yellow-200 bg-yellow-50">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-800">
                                        <div className="font-medium">FFmpeg Installation Required</div>
                                        <div className="text-sm mt-1">
                                            Choose your installation method below based on your operating system.
                                        </div>
                                    </AlertDescription>
                                </Alert>

                                <Tabs defaultValue="primary" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="primary">{installInstructions.method}</TabsTrigger>
                                        <TabsTrigger value="alternative">Alternative</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="primary" className="space-y-3 mt-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-2">
                                                {installInstructions.title}
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-gray-900 text-green-400 px-3 py-2 rounded font-mono text-sm">
                                                        {installInstructions.command}
                                                    </code>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => copyToClipboard(installInstructions.command)}
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                {platform === "win32" && (
                                                    <Button
                                                        onClick={handleInstallFFmpeg}
                                                        disabled={isInstalling}
                                                        className="w-full"
                                                    >
                                                        {isInstalling ? (
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <Download className="w-4 h-4 mr-2" />
                                                        )}
                                                        {isInstalling ? "Installing..." : "Auto Install (Windows)"}
                                                    </Button>
                                                )}
                                                {platform !== "win32" && (
                                                    <div className="text-sm text-gray-600 mt-2">
                                                        Please run the command above in your terminal
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="alternative" className="space-y-3 mt-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-2">
                                                {installInstructions.alternative.method}
                                            </h4>
                                            <div className="space-y-1">
                                                {installInstructions.alternative.steps.map((step, index) => (
                                                    <div
                                                        key={index}
                                                        className="text-sm text-gray-700 flex items-start gap-2"
                                                    >
                                                        {step.includes("sudo") || step.includes("http") ? (
                                                            <>
                                                                <span className="flex-1">{step}</span>
                                                                {(step.includes("sudo") ||
                                                                    step.includes("brew") ||
                                                                    step.includes("port")) && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() =>
                                                                            copyToClipboard(
                                                                                step.replace(/^\d+\.\s*/, "")
                                                                            )
                                                                        }
                                                                        className="h-6 px-2"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </Button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span>{step}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                {showInstallOutput && installationOutput && (
                                    <div className="mt-4">
                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                            Installation Progress:
                                        </div>
                                        <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
                                            {installationOutput}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={checkFfmpegStatus}
                                disabled={ffmpegStatus.isChecking}
                            >
                                {ffmpegStatus.isChecking ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Terminal className="w-4 h-4 mr-2" />
                                )}
                                Check FFmpeg Status
                            </Button>
                            {ffmpegStatus.isInstalled && (
                                <div className="text-sm text-green-600 font-medium">✓ Ready for video processing</div>
                            )}
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    )
}
