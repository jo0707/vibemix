"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Download, Terminal, AlertTriangle, Loader2 } from "lucide-react"
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
    const { isElectron, executeCommand } = useElectron()
    const { status: ffmpegStatus, refresh: checkFfmpegStatus } = useFFmpegStatus()
    const { toast } = useToast()
    useEffect(() => {
        if (ffmpegStatus.hasChecked) {
            onStatusChange?.(ffmpegStatus.isInstalled)
        }
    }, [ffmpegStatus.hasChecked, ffmpegStatus.isInstalled, onStatusChange])
    const handleInstallFFmpeg = async () => {
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
        return null // Only show in Electron app
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
                            <div className="space-y-3">
                                <Alert className="border-yellow-200 bg-yellow-50">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-800">
                                        <div className="font-medium">Installation Instructions</div>
                                        <div className="text-sm mt-2 space-y-1">
                                            <div>1. Click "Install FFmpeg" below to start automatic installation</div>
                                            <div>2. Wait for the installation to complete in the terminal window</div>
                                            <div>3. Restart VibeMix after installation</div>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                                <div className="flex gap-3">
                                    <Button onClick={handleInstallFFmpeg} disabled={isInstalling} className="flex-1">
                                        {isInstalling ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4 mr-2" />
                                        )}
                                        {isInstalling ? "Installing..." : "Install FFmpeg"}
                                    </Button>
                                </div>
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
