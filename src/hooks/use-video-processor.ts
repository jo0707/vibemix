import { useState, useCallback, useRef } from "react"
import { useElectron } from "./use-electron"
import { sanitizeFilename, extractFFmpegProgress } from "@/lib/file-utils"
import type { VideoConfig, FileItem, ProcessingStatus } from "@/types"

export const useVideoProcessor = () => {
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState<ProcessingStatus>({
        stage: "idle",
        progress: 0,
        message: "Ready to process",
    })
    const { isElectron, executeCommand, selectDirectory, writeFile } = useElectron()
    const abortControllerRef = useRef<AbortController | null>(null)
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
                setProgress({
                    stage: "preparing",
                    progress: 10,
                    message: "Creating temporary files...",
                })
                await executeCommand(`mkdir "${tempDir}"`, outputDir)
                for (let i = 0; i < images.length; i++) {
                    const imageData = await images[i].file.arrayBuffer()
                    const imageBlob = new Blob([imageData])
                    const imageBase64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader()
                        reader.onload = () => resolve(reader.result as string)
                        reader.readAsDataURL(imageBlob)
                    })
                    const base64Data = imageBase64.split(",")[1]
                    const imagePath = `${tempDir}\\${i}.png`
                    await writeFile(imagePath, base64Data, "base64")
                }
                for (let i = 0; i < audio.length; i++) {
                    const audioData = await audio[i].file.arrayBuffer()
                    const audioBlob = new Blob([audioData])
                    const audioBase64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader()
                        reader.onload = () => resolve(reader.result as string)
                        reader.readAsDataURL(audioBlob)
                    })
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
                if (config.processingDevice === "amd-gpu") {
                    setProgress({
                        stage: "processing-video",
                        progress: 25,
                        message: "Creating video segment with AMD GPU acceleration...",
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
                    const amdCommand1 = `ffmpeg -y ${imageInputs} -filter_complex "${videoFilter}; ${concatFilter}" -map "[v]" -c:v h264_amf -quality quality -rc cqp -qp_i 18 -qp_p 18 -an "${segmentPath}"`
                    const terminalCommand1 = `start "VibeMix AMD GPU Processing - Step 1" cmd /c "echo Starting AMD GPU video processing... && cd /d "${tempDir}" && ${amdCommand1} && echo. && echo Video segment created successfully! && timeout /t 3 /nobreak >nul"`
                    const result1 = await executeCommand(terminalCommand1, tempDir)
                    await new Promise((resolve) => setTimeout(resolve, 2000))
                    setProgress({
                        stage: "processing-audio",
                        progress: 60,
                        message: "Adding audio track... (check terminal window)",
                    })
                    const audioInputs = audio.map((_, i) => `-i "${tempDir}\\${i}.wav"`).join(" ")
                    const audioConcat = `[${audio.map((_, i) => `${i + 1}:a`).join("][")}]concat=n=${
                        audio.length
                    }:v=0:a=1[a]`
                    const amdCommand2 = `ffmpeg -y -stream_loop -1 -i "${segmentPath}" ${audioInputs} -filter_complex "${audioConcat}" -map 0:v -map "[a]" -c:v copy -c:a aac -shortest "${outputVideoPath}"`
                    const terminalCommand2 = `start "VibeMix AMD GPU Processing - Step 2" cmd /c "echo Adding audio to video... && cd /d "${tempDir}" && ${amdCommand2} && echo. && echo Final video created successfully at: ${outputVideoPath} && echo. && echo Terminal will close in 5 seconds... && timeout /t 5 /nobreak >nul"`
                    const result2 = await executeCommand(terminalCommand2, tempDir)
                } else if (config.processingDevice === "gpu") {
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
                    const terminalCommand1 = `start "VibeMix GPU Processing - Step 1" cmd /c "echo Starting GPU video processing... && cd /d "${tempDir}" && ${gpuCommand1} && echo. && echo Video segment created successfully! && timeout /t 3 /nobreak >nul"`
                    const result1 = await executeCommand(terminalCommand1, tempDir)
                    await new Promise((resolve) => setTimeout(resolve, 2000))
                    setProgress({
                        stage: "processing-audio",
                        progress: 60,
                        message: "Adding audio track... (check terminal window)",
                    })
                    const audioInputs = audio.map((_, i) => `-i "${tempDir}\\${i}.wav"`).join(" ")
                    const audioConcat = `[${audio.map((_, i) => `${i + 1}:a`).join("][")}]concat=n=${
                        audio.length
                    }:v=0:a=1[a]`
                    const gpuCommand2 = `ffmpeg -y -stream_loop -1 -i "${segmentPath}" ${audioInputs} -filter_complex "${audioConcat}" -map 0:v -map "[a]" -c:v copy -c:a aac -shortest "${outputVideoPath}"`
                    const terminalCommand2 = `start "VibeMix GPU Processing - Step 2" cmd /c "echo Adding audio to video... && cd /d "${tempDir}" && ${gpuCommand2} && echo. && echo Final video created successfully at: ${outputVideoPath} && echo. && echo Terminal will close in 5 seconds... && timeout /t 5 /nobreak >nul"`
                    const result2 = await executeCommand(terminalCommand2, tempDir)
                } else {
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
                    }:v=1:a=0[segment]`
                    const videoLoop = `[segment]fps=25,loop=loop=-1:size=${
                        config.imageDuration * 25 * images.length
                    }[v]`
                    const audioConcat = `[${audio.map((_, i) => `${images.length + i}:a`).join("][")}]concat=n=${
                        audio.length
                    }:v=0:a=1[a]`
                    const cpuCommand = `ffmpeg -y ${imageInputs} ${audioInputs} -filter_complex "${videoFilter}; ${videoConcat}; ${videoLoop}; ${audioConcat}" -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -shortest "${outputVideoPath}"`
                    const terminalCommand = `start "VibeMix CPU Processing" cmd /c "echo Starting CPU video processing... && echo This may take several minutes depending on your hardware && echo. && cd /d "${tempDir}" && ${cpuCommand} && echo. && echo Video created successfully at: ${outputVideoPath} && echo. && echo Terminal will close in 5 seconds... && timeout /t 5 /nobreak >nul"`
                    const result = await executeCommand(terminalCommand, tempDir)
                }
                setProgress({
                    stage: "finalizing",
                    progress: 80,
                    message: "Waiting for processing to complete... (monitor the terminal window)",
                })
                const maxWaitTime = 10 * 1000
                const pollInterval = 2000
                let waitTime = 0
                let outputExists = false
                while (waitTime < maxWaitTime && !outputExists) {
                    try {
                        const fileName = outputVideoPath.split("\\").pop() || ""
                        const checkResult = await executeCommand(`dir "${outputVideoPath}"`, finalOutputDir)
                        if (checkResult.success && checkResult.stdout && checkResult.stdout.includes(fileName)) {
                            await new Promise((resolve) => setTimeout(resolve, 2000))
                            const checkResult2 = await executeCommand(`dir "${outputVideoPath}"`, finalOutputDir)
                            if (checkResult2.success && checkResult2.stdout === checkResult.stdout) {
                                outputExists = true
                                break
                            }
                        }
                    } catch (error) {}
                    await new Promise((resolve) => setTimeout(resolve, pollInterval))
                    waitTime += pollInterval
                    const progressPercent = 80 + (waitTime / maxWaitTime) * 15
                    setProgress({
                        stage: "finalizing",
                        progress: Math.min(progressPercent, 95),
                        message: `Waiting for processing... (${Math.floor(waitTime / 1000)}s elapsed)`,
                    })
                }
                if (outputExists && config.cutEnabled && config.cutInterval && config.cutInterval > 0) {
                    setProgress({
                        stage: "finalizing",
                        progress: 95,
                        message: `Cutting video into ${config.cutInterval}-minute segments...`,
                    })
                    const segmentsDir = `${finalOutputDir}\\${projectName}_segments`
                    await executeCommand(`mkdir "${segmentsDir}"`, finalOutputDir)
                    const segmentTimeInSeconds = config.cutInterval * 60
                    const segmentOutputPath = `${segmentsDir}\\${projectName}_part_%03d.mp4`
                    const cutCommand = `ffmpeg -i "${outputVideoPath}" -c copy -map 0 -segment_time ${segmentTimeInSeconds} -f segment -reset_timestamps 1 "${segmentOutputPath}"`
                    const terminalCommand = `start "VibeMix Video Cutting" cmd /c "echo Starting video cutting... && cd /d "${finalOutputDir}" && ${cutCommand} && echo. && echo Video segments created in: ${segmentsDir} && echo. && echo Terminal will close in 5 seconds... && timeout /t 5 /nobreak >nul"`
                    await executeCommand(terminalCommand, finalOutputDir)
                    await new Promise((resolve) => setTimeout(resolve, 5000))
                }
                setProgress({
                    stage: "finalizing",
                    progress: 98,
                    message: "Cleaning up temporary files...",
                })
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
