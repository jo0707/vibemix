"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { FolderOpen, Video, Hourglass, PlayCircle } from "lucide-react"
import type { Status } from "@/app/page"
import { useOutputDirectory } from "@/hooks/use-output-directory"
import { useElectron } from "@/hooks/use-electron"
import { useToast } from "@/hooks/use-toast"

interface StatusResultComponentProps {
    status: Status
    progress: number
    videoUrl: string | null
    outputDirectory?: string
}

export function StatusResultComponent({ status, progress, videoUrl, outputDirectory }: StatusResultComponentProps) {
    const { openOutputDirectory } = useOutputDirectory()
    const { isElectron } = useElectron()
    const { toast } = useToast()

    const handleOpenOutputDirectory = async () => {
        try {
            if (outputDirectory) {
                await openOutputDirectory(outputDirectory)
            } else {
                await openOutputDirectory()
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not open output directory",
            })
        }
    }

    const renderContent = () => {
        switch (status) {
            case "idle":
                return (
                    <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
                        <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="font-semibold text-gray-600">Ready to Generate</h3>
                        <p className="text-sm">Your video will appear here once generated.</p>
                    </div>
                )
            case "processing":
                return (
                    <div className="flex flex-col items-center justify-center gap-4 py-10 h-64">
                        <Hourglass className="w-12 h-12 mx-auto mb-2 text-primary animate-spin" />
                        <h3 className="font-semibold text-gray-800">Generating Your Masterpiece...</h3>
                        <div className="w-full max-w-sm">
                            <Progress value={progress} className="w-full h-2" />
                            <p className="text-sm text-center mt-2 text-muted-foreground">{progress}% complete</p>
                        </div>
                    </div>
                )
            case "complete":
                return (
                    <div className="space-y-4">
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative group">
                            {videoUrl ? (
                                <>
                                    <video
                                        src={isElectron ? `file://${videoUrl}` : videoUrl}
                                        className="w-full h-full object-cover"
                                        controls
                                        preload="metadata"
                                    />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <PlayCircle className="w-20 h-20 text-white/80" />
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                                    <h4 className="text-lg font-medium text-gray-500">Preview Not Available</h4>
                                </div>
                            )}
                        </div>
                        {isElectron ? (
                            <Button size="lg" className="w-full font-semibold" onClick={handleOpenOutputDirectory}>
                                <FolderOpen className="w-5 h-5 mr-2" />
                                Open Output Directory
                            </Button>
                        ) : (
                            <Button size="lg" className="w-full font-semibold" asChild>
                                <a href={videoUrl || "#"} download="vibemix-generated-video.mp4">
                                    <FolderOpen className="w-5 h-5 mr-2" />
                                    Download Video
                                </a>
                            </Button>
                        )}
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <Card className="shadow-md border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <span>3. Generate & Download</span>
                </CardTitle>
            </CardHeader>
            <CardContent>{renderContent()}</CardContent>
        </Card>
    )
}
