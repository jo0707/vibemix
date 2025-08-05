import React from "react"
import { useElectron } from "@/hooks/use-electron"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Monitor } from "lucide-react"
import { FFmpegStatus } from "./ffmpeg-status"
export const DesktopCapabilities: React.FC = () => {
    const { isElectron, appInfo } = useElectron()
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
            <FFmpegStatus />
        </div>
    )
}
