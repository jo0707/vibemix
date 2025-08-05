import { useState, useCallback, useRef } from "react"
import { useElectron } from "./use-electron"

export interface VideoConfig {
    title: string
    loopCount: number
    imageDuration: number
    processingDevice: "cpu" | "gpu"
}

export interface FileItem {
    file: File
    name: string
    duration?: number
}

export interface ProcessingProgress {
    stage: "preparing" | "processing-video" | "processing-audio" | "finalizing" | "complete" | "error"
    progress: number
    message: string
    outputPath?: string
    outputDir?: string
}

export const useVideoProcessor = () => {
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState<ProcessingProgress>({
        stage: "preparing",
        progress: 0,
        message: "Ready to process",
    })

    const { isElectron, executeCommand, selectDirectory, writeFile } = useElectron()
    const abortControllerRef = useRef<AbortController | null>(null)

    const sanitizeFilename = (filename: string): string => {
        return filename.replace(/[^a-z0-9.-]/gi, "_").toLowerCase()
    }

    const extractProgress = (output: string): number => {
        // Parse FFmpeg progress from output
        const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/)
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/)

        if (timeMatch && durationMatch) {
            const currentTime =
                parseFloat(timeMatch[1]) * 3600 + parseFloat(timeMatch[2]) * 60 + parseFloat(timeMatch[3])
            const totalTime =
                parseFloat(durationMatch[1]) * 3600 + parseFloat(durationMatch[2]) * 60 + parseFloat(durationMatch[3])
            return Math.min((currentTime / totalTime) * 100, 100)
        }

        return 0
    }

    const generateVideo = useCallback(
        async (
            config: VideoConfig,
            images: FileItem[],
            audio: FileItem[],
            outputDir?: string
        ): Promise<{ success: boolean; outputPath?: string; outputDir?: string; error?: string }> => {
            if (!isElectron) {
                return { success: false, error: "Electron environment required for video processing" }
            }

            if (images.length === 0) {
                return { success: false, error: "No images provided" }
            }

            if (audio.length === 0) {
                return { success: false, error: "No audio files provided" }
            }

            try {
                setIsProcessing(true)
                abortControllerRef.current = new AbortController()

                // Step 1: Use provided output directory or select one
                setProgress({
                    stage: "preparing",
                    progress: 5,
                    message: outputDir ? "Using saved output directory..." : "Selecting output directory...",
                })

                let finalOutputDir = outputDir
                if (!finalOutputDir) {
                    const dirResult = await selectDirectory()
                    if (!dirResult.success || !dirResult.path) {
                        return { success: false, error: "No output directory selected" }
                    }
                    finalOutputDir = dirResult.path
                }

                const projectName = sanitizeFilename(config.title || "video_project")
                const tempDir = `${finalOutputDir}\\${projectName}_temp`

                // Step 2: Create temp directory and save files
                setProgress({
                    stage: "preparing",
                    progress: 10,
                    message: "Creating temporary files...",
                })

                await executeCommand(`mkdir "${tempDir}"`, outputDir)

                // Save image files
                for (let i = 0; i < images.length; i++) {
                    const imageData = await images[i].file.arrayBuffer()
                    const imageBlob = new Blob([imageData])
                    const imageBase64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader()
                        reader.onload = () => resolve(reader.result as string)
                        reader.readAsDataURL(imageBlob)
                    })

                    // Remove data URL prefix and save
                    const base64Data = imageBase64.split(",")[1]
                    const imagePath = `${tempDir}\\${i}.png`
                    await writeFile(imagePath, base64Data, "base64")
                }

                // Save audio files
                for (let i = 0; i < audio.length; i++) {
                    const audioData = await audio[i].file.arrayBuffer()
                    const audioBlob = new Blob([audioData])
                    const audioBase64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader()
                        reader.onload = () => resolve(reader.result as string)
                        reader.readAsDataURL(audioBlob)
                    })

                    // Remove data URL prefix and save
                    const base64Data = audioBase64.split(",")[1]
                    const audioPath = `${tempDir}\\${i}.wav`
                    await writeFile(audioPath, base64Data, "base64")
                }

                setProgress({
                    stage: "preparing",
                    progress: 20,
                    message: "Files prepared, starting video processing...",
                })

                const outputVideoPath = `${finalOutputDir}\\${projectName}.mp4`
                if (config.processingDevice === "gpu") {
                    // GPU Processing - Two-step process

                    // Step 1: Create video segment
                    setProgress({
                        stage: "processing-video",
                        progress: 25,
                        message: "Creating video segment with GPU acceleration...",
                    })

                    const imageInputs = images
                        .map((_, i) => `-loop 1 -t ${config.imageDuration} -i "${tempDir}\\${i}.png"`)
                        .join(" ")
                    const videoFilter = images
                        .map(
                            (_, i) =>
                                `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[v${i}]`
                        )
                        .join("; ")
                    const concatFilter = `[${images.map((_, i) => `v${i}`).join("][")}]concat=n=${
                        images.length
                    }:v=1:a=0,fps=25[v]`

                    const segmentPath = `${tempDir}\\slideshow_segment.mp4`
                    const gpuCommand1 = `ffmpeg -y ${imageInputs} -filter_complex "${videoFilter}; ${concatFilter}" -map "[v]" -c:v h264_nvenc -preset p7 -cq 18 -an "${segmentPath}"`

                    // Open separate terminal for GPU processing step 1
                    const terminalCommand1 = `start "VibeMix GPU Processing - Step 1" cmd /c "echo Starting GPU video processing... && cd /d "${tempDir}" && ${gpuCommand1} && echo. && echo Video segment created successfully! && timeout /t 3 /nobreak >nul"`
                    const result1 = await executeCommand(terminalCommand1, tempDir)

                    // Wait a bit for the process to start
                    await new Promise((resolve) => setTimeout(resolve, 2000))

                    setProgress({
                        stage: "processing-audio",
                        progress: 60,
                        message: "Adding audio track... (check terminal window)",
                    })

                    // Step 2: Add audio
                    const audioInputs = audio.map((_, i) => `-i "${tempDir}\\${i}.wav"`).join(" ")
                    const audioConcat = `[${audio.map((_, i) => `${i + 1}:a`).join("][")}]concat=n=${
                        audio.length
                    }:v=0:a=1[a]`

                    const gpuCommand2 = `ffmpeg -y -stream_loop -1 -i "${segmentPath}" ${audioInputs} -filter_complex "${audioConcat}" -map 0:v -map "[a]" -c:v copy -c:a aac -shortest "${outputVideoPath}"`

                    // Open separate terminal for GPU processing step 2
                    const terminalCommand2 = `start "VibeMix GPU Processing - Step 2" cmd /c "echo Adding audio to video... && cd /d "${tempDir}" && ${gpuCommand2} && echo. && echo Final video created successfully at: ${outputVideoPath} && echo. && echo Terminal will close in 5 seconds... && timeout /t 5 /nobreak >nul"`
                    const result2 = await executeCommand(terminalCommand2, tempDir)
                } else {
                    // CPU Processing - Single command
                    setProgress({
                        stage: "processing-video",
                        progress: 25,
                        message: "Processing video with CPU... (check terminal window)",
                    })

                    const imageInputs = images
                        .map((_, i) => `-loop 1 -t ${config.imageDuration} -i "${tempDir}\\${i}.png"`)
                        .join(" ")
                    const audioInputs = audio.map((_, i) => `-i "${tempDir}\\${i}.wav"`).join(" ")

                    const videoFilter = images
                        .map(
                            (_, i) =>
                                `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[v${i}]`
                        )
                        .join("; ")

                    const videoConcat = `[${images.map((_, i) => `v${i}`).join("][")}]concat=n=${
                        images.length
                    }:v=1:a=0[v]`
                    const audioConcat = `[${audio.map((_, i) => `${images.length + i}:a`).join("][")}]concat=n=${
                        audio.length
                    }:v=0:a=1[a_cat]`
                    const audioLoop = `[a_cat]aloop=loop=${config.loopCount - 1}:size=220500000[a]`

                    const cpuCommand = `ffmpeg ${imageInputs} ${audioInputs} -filter_complex "${videoFilter}; ${videoConcat}; ${audioConcat}; ${audioLoop}" -map "[v]" -map "[a]" -c:v libx264 -c:a aac -shortest "${outputVideoPath}"`

                    // Open separate terminal for CPU processing
                    const terminalCommand = `start "VibeMix CPU Processing" cmd /c "echo Starting CPU video processing... && echo This may take several minutes depending on your hardware && echo. && cd /d "${tempDir}" && ${cpuCommand} && echo. && echo Video created successfully at: ${outputVideoPath} && echo. && echo Terminal will close in 5 seconds... && timeout /t 5 /nobreak >nul"`
                    const result = await executeCommand(terminalCommand, tempDir)
                }

                // Wait for processing to complete by checking if output file exists
                setProgress({
                    stage: "finalizing",
                    progress: 80,
                    message: "Waiting for processing to complete... (monitor the terminal window)",
                })

                // Poll for the output file (wait up to 10 minutes)
                const maxWaitTime = 10 * 60 * 1000 // 10 minutes
                const pollInterval = 5000 // 5 seconds
                let waitTime = 0
                let outputExists = false

                while (waitTime < maxWaitTime && !outputExists) {
                    try {
                        // Try to read the file to check if it exists and is complete
                        const fileName = outputVideoPath.split("\\").pop() || ""
                        const checkResult = await executeCommand(`dir "${outputVideoPath}"`, finalOutputDir)
                        if (checkResult.success && checkResult.stdout && checkResult.stdout.includes(fileName)) {
                            // File exists, let's check if it's not being written to (size stable)
                            await new Promise((resolve) => setTimeout(resolve, 2000))
                            const checkResult2 = await executeCommand(`dir "${outputVideoPath}"`, finalOutputDir)
                            if (checkResult2.success && checkResult2.stdout === checkResult.stdout) {
                                outputExists = true
                                break
                            }
                        }
                    } catch (error) {
                        // File doesn't exist yet, continue waiting
                    }

                    await new Promise((resolve) => setTimeout(resolve, pollInterval))
                    waitTime += pollInterval

                    // Update progress
                    const progressPercent = 80 + (waitTime / maxWaitTime) * 15
                    setProgress({
                        stage: "finalizing",
                        progress: Math.min(progressPercent, 95),
                        message: `Waiting for processing... (${Math.floor(waitTime / 1000)}s elapsed)`,
                    })
                }

                if (!outputExists) {
                    throw new Error("Processing timed out. Please check the terminal window for any errors.")
                }

                setProgress({
                    stage: "finalizing",
                    progress: 90,
                    message: "Cleaning up temporary files...",
                })

                // Clean up temp directory
                await executeCommand(`rmdir /s /q "${tempDir}"`, finalOutputDir)

                setProgress({
                    stage: "complete",
                    progress: 100,
                    message: "Video generation complete!",
                    outputPath: outputVideoPath,
                    outputDir: finalOutputDir,
                })

                return {
                    success: true,
                    outputPath: outputVideoPath,
                    outputDir: finalOutputDir,
                }
            } catch (error) {
                setProgress({
                    stage: "error",
                    progress: 0,
                    message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
                })

                return {
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                }
            } finally {
                setIsProcessing(false)
                abortControllerRef.current = null
            }
        },
        [isElectron, executeCommand, selectDirectory, writeFile]
    )

    const cancelProcessing = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            setIsProcessing(false)
            setProgress({
                stage: "error",
                progress: 0,
                message: "Processing cancelled by user",
            })
        }
    }, [])

    return {
        generateVideo,
        cancelProcessing,
        isProcessing,
        progress,
        isElectron,
    }
}
