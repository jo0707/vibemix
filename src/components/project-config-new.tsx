"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Film, Clock, FolderOpen } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { useVideoProcessor } from "@/hooks/use-video-processor"
import { useElectron } from "@/hooks/use-electron"
import { useOutputDirectory } from "@/hooks/use-output-directory"
import { useToast } from "@/hooks/use-toast"
import { formatDuration } from "@/lib/file-utils"
import type { FileItem, VideoConfig, ProcessingStatus } from "@/types"

interface Props {
    audioFiles: FileItem[]
    images: FileItem[]
    onProcessingUpdate?: (progress: ProcessingStatus) => void
}

export function ProjectConfigComponent({ audioFiles, images, onProcessingUpdate }: Props) {
    const { control, handleSubmit, watch } = useForm<VideoConfig>({
        defaultValues: { title: "", loopCount: 1, imageDuration: 3, processingDevice: "cpu" },
    })

    const { generateVideo, isProcessing, progress } = useVideoProcessor()
    const { isElectron } = useElectron()
    const { outputDirectory, selectOutputDirectory, openOutputDirectory } = useOutputDirectory()
    const { toast } = useToast()

    const hasAudio = audioFiles.length > 0
    const hasImages = images.length > 0
    const loopCount = watch("loopCount")

    const totalDuration = useMemo(() => {
        const singleLoopDuration = audioFiles.reduce((acc: number, file: FileItem) => acc + (file.duration || 0), 0)
        return singleLoopDuration * (loopCount > 0 ? loopCount : 1)
    }, [audioFiles, loopCount])

    const onSubmit = async (data: VideoConfig) => {
        if (!isElectron) {
            toast({
                variant: "destructive",
                title: "Desktop App Required",
                description: "Video processing requires the desktop version.",
            })
            return
        }

        if (!hasImages) {
            toast({ variant: "destructive", title: "No Images", description: "Please upload at least one image." })
            return
        }

        if (!hasAudio) {
            toast({ variant: "destructive", title: "No Audio", description: "Please upload at least one audio file." })
            return
        }

        try {
            const result = await generateVideo(data, images, audioFiles, outputDirectory || undefined)

            if (result.success) {
                toast({ title: "Video Generated Successfully!", description: `Video saved to: ${result.outputPath}` })

                onProcessingUpdate?.({
                    stage: "complete",
                    progress: 100,
                    message: "Video generation complete!",
                    outputPath: result.outputPath,
                    outputDir: result.outputDir,
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Video Generation Failed",
                    description: result.error || "Unknown error occurred",
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Unknown error occurred",
            })
        }
    }

    React.useEffect(() => {
        if (onProcessingUpdate && progress) {
            onProcessingUpdate(progress)
        }
    }, [progress, onProcessingUpdate])

    const handleOpenOutputDirectory = async () => {
        if (progress?.outputDir) {
            try {
                await openOutputDirectory(progress.outputDir)
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Could not open output directory" })
            }
        }
    }

    return (
        <Card className="shadow-md border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <span>2. Configure Project</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                        <Label className="font-medium text-gray-700">Output Directory</Label>
                        <Button size="sm" variant="outline" onClick={selectOutputDirectory} disabled={!isElectron}>
                            <FolderOpen className="w-4 h-4 mr-2" />
                            {outputDirectory ? "Change Folder" : "Select Folder"}
                        </Button>
                    </div>
                    {outputDirectory ? (
                        <p className="text-sm text-gray-600 font-mono bg-white px-3 py-2 rounded border">
                            {outputDirectory}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500 italic">
                            {isElectron
                                ? "No output directory selected."
                                : "Output directory selection requires desktop app"}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="font-medium text-gray-700">
                                Project Title
                            </Label>
                            <Controller
                                name="title"
                                control={control}
                                rules={{ required: "Project title is required" }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <Input id="title" placeholder="e.g., Summer Vacation 2024" {...field} />
                                        {fieldState.error && (
                                            <p className="text-sm text-red-600">{fieldState.error.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="loopCount" className="font-medium text-gray-700">
                                    Loop Count
                                </Label>
                                <Controller
                                    name="loopCount"
                                    control={control}
                                    rules={{ min: { value: 1, message: "Must be at least 1" } }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <Input
                                                id="loopCount"
                                                type="number"
                                                min="1"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                            />
                                            {fieldState.error && (
                                                <p className="text-sm text-red-600">{fieldState.error.message}</p>
                                            )}
                                        </>
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="imageDuration" className="font-medium text-gray-700">
                                    Image Duration (s)
                                </Label>
                                <Controller
                                    name="imageDuration"
                                    control={control}
                                    rules={{ min: { value: 1, message: "Must be at least 1 second" } }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <Input
                                                id="imageDuration"
                                                type="number"
                                                min="1"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                            />
                                            {fieldState.error && (
                                                <p className="text-sm text-red-600">{fieldState.error.message}</p>
                                            )}
                                        </>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium text-gray-700">Estimated Length</Label>
                            <div className="flex items-center justify-center h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4 mr-2" />
                                <span>{formatDuration(totalDuration)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-medium text-gray-700">Processing Device</Label>
                            <Controller
                                name="processingDevice"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        className="flex gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="cpu" id="cpu" />
                                            <Label htmlFor="cpu">CPU</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="gpu" id="gpu" />
                                            <Label htmlFor="gpu">GPU (NVIDIA NVENC)</Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-center">
                                <Label className="font-medium text-blue-900">Processing Status</Label>
                                <span className="text-sm font-semibold text-blue-700">
                                    {progress.progress.toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-3">
                                <div
                                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${progress.progress}%` }}
                                />
                            </div>
                            <p className="text-sm font-medium text-blue-800">{progress.message}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                    Stage: {progress.stage.replace(/-/g, " ")}
                                </span>
                                {progress.stage === "complete" && progress.outputDir && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleOpenOutputDirectory}
                                        className="bg-white hover:bg-blue-50 border-blue-300"
                                    >
                                        <FolderOpen className="w-4 h-4 mr-2" />
                                        Open Output Folder
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            size="lg"
                            className="flex-1 font-semibold"
                            disabled={isProcessing || !hasImages || !hasAudio || !isElectron}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <Film className="w-5 h-5 mr-2" />
                            )}
                            {isProcessing ? "Processing..." : "Generate Video"}
                        </Button>

                        {!isElectron && (
                            <div className="flex-1 flex items-center justify-center text-sm text-gray-500 bg-gray-100 rounded-md px-4">
                                Desktop app required for processing
                            </div>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
