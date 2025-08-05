"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Circle, Play, FolderOpen } from "lucide-react"
import { useElectron } from "@/hooks/use-electron"
import { useToast } from "@/hooks/use-toast"
import type { Status } from "@/types"

interface Props {
    status: Status
    progress: number
    videoUrl: string | null
    outputDirectory?: string
}

export function StatusResultComponent({ status, progress, videoUrl, outputDirectory }: Props) {
    const { openDirectory } = useElectron()
    const { toast } = useToast()

    const handleOpenDirectory = async () => {
        if (outputDirectory) {
            try {
                await openDirectory(outputDirectory)
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not open directory" })
            }
        }
    }

    const getStatusIcon = () => {
        switch (status) {
            case "complete":
                return <CheckCircle className="w-6 h-6 text-green-600" />
            case "processing":
                return <Play className="w-6 h-6 text-blue-600 animate-pulse" />
            default:
                return <Circle className="w-6 h-6 text-gray-400" />
        }
    }

    const getStatusText = () => {
        switch (status) {
            case "complete":
                return "Video Generation Complete!"
            case "processing":
                return "Processing Video..."
            default:
                return "Ready to Generate Video"
        }
    }

    const getStatusColor = () => {
        switch (status) {
            case "complete":
                return "text-green-700"
            case "processing":
                return "text-blue-700"
            default:
                return "text-gray-600"
        }
    }

    return (
        <Card className="shadow-md border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <span>3. Status & Results</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                    {getStatusIcon()}
                    <div className="flex-1">
                        <h3 className={`font-semibold text-lg ${getStatusColor()}`}>{getStatusText()}</h3>
                        {status === "processing" && (
                            <div className="mt-3 space-y-2">
                                <Progress value={progress} className="w-full" />
                                <p className="text-sm text-gray-600">{progress.toFixed(0)}% complete</p>
                            </div>
                        )}
                        {status === "complete" && videoUrl && (
                            <div className="mt-3 space-y-3">
                                <p className="text-sm text-gray-600">Video has been successfully generated!</p>
                                <div className="flex gap-2">
                                    {outputDirectory && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleOpenDirectory}
                                            className="flex items-center gap-2"
                                        >
                                            <FolderOpen className="w-4 h-4" />
                                            Open Output Folder
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
