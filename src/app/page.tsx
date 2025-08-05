"use client"
import { useState } from "react"
import { FileUploadComponent } from "@/components/file-upload"
import { ProjectConfigComponent } from "@/components/project-config"
import { StatusResultComponent } from "@/components/status-result"
import { DesktopCapabilities } from "@/components/desktop-capabilities"
import { SongsList } from "@/components/songs-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useElectron } from "@/hooks/use-electron"
import { useFFmpegStatus } from "@/hooks/use-ffmpeg-status"
import { Film } from "lucide-react"
import type { FileItem, ProcessingStatus, Status } from "@/types"
export default function Home() {
    const [images, setImages] = useState<FileItem[]>([])
    const [audio, setAudio] = useState<FileItem[]>([])
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null)
    const { isElectron } = useElectron()
    const handleFileChange = (newImages: FileItem[], newAudio: FileItem[]) => {
        setImages(newImages)
        setAudio(newAudio)
    }
    const handleProcessingUpdate = (progress: ProcessingStatus) => {
        setProcessingStatus(progress)
    }
    const getStatus = (): Status => {
        if (!processingStatus || processingStatus.progress === 0) return "idle"
        if (processingStatus.stage === "complete") return "complete"
        if (processingStatus.stage === "error") return "idle"
        return "processing"
    }
    return (
        <main className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-12 text-center">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <Film className="w-8 h-8 text-primary" />
                        <h1 className="text-4xl font-bold tracking-tighter text-gray-900">VibeMix</h1>
                    </div>
                    <p className="text-lg text-muted-foreground">
                        Create stunning video slideshows from your images with AI-powered soundtracks.
                    </p>
                </header>
                {isElectron ? (
                    <Tabs defaultValue="video-creator" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="video-creator">Video Creator</TabsTrigger>
                            <TabsTrigger value="desktop-features">Desktop Features</TabsTrigger>
                        </TabsList>
                        <TabsContent value="video-creator" className="mt-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                <div className="lg:col-span-4 xl:col-span-3">
                                    <FileUploadComponent
                                        onFileChange={handleFileChange}
                                        images={images}
                                        audio={audio}
                                    />
                                </div>
                                <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
                                    <ProjectConfigComponent
                                        audioFiles={audio}
                                        images={images}
                                        onProcessingUpdate={handleProcessingUpdate}
                                    />
                                    <SongsList audioFiles={audio} />
                                    <StatusResultComponent
                                        status={getStatus()}
                                        progress={processingStatus?.progress || 0}
                                        videoUrl={processingStatus?.outputPath || null}
                                        outputDirectory={processingStatus?.outputDir}
                                    />
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="desktop-features" className="mt-8">
                            <DesktopCapabilities />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-4 xl:col-span-3">
                            <FileUploadComponent onFileChange={handleFileChange} images={images} audio={audio} />
                        </div>
                        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
                            <ProjectConfigComponent
                                audioFiles={audio}
                                images={images}
                                onProcessingUpdate={handleProcessingUpdate}
                            />
                            <SongsList audioFiles={audio} />
                            <StatusResultComponent
                                status={getStatus()}
                                progress={processingStatus?.progress || 0}
                                videoUrl={processingStatus?.outputPath || null}
                                outputDirectory={processingStatus?.outputDir}
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
