export const sanitizeFilename = (filename: string): string => filename.replace(/[^a-z0-9.-]/gi, "_").toLowerCase()

export const getFileBaseName = (filename: string) => filename.substring(0, filename.lastIndexOf(".")) || filename

export const getFileExtension = (filename: string) => filename.substring(filename.lastIndexOf("."))

export const formatDuration = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00"
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export const getAudioDuration = (file: File): Promise<number> =>
    new Promise((resolve) => {
        const audio = document.createElement("audio")
        audio.preload = "metadata"
        audio.onloadedmetadata = () => {
            window.URL.revokeObjectURL(audio.src)
            resolve(audio.duration)
        }
        audio.src = window.URL.createObjectURL(file)
    })

export const extractFFmpegProgress = (output: string): number => {
    const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/)
    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/)
    if (timeMatch && durationMatch) {
        const currentTime = parseFloat(timeMatch[1]) * 3600 + parseFloat(timeMatch[2]) * 60 + parseFloat(timeMatch[3])
        const totalTime =
            parseFloat(durationMatch[1]) * 3600 + parseFloat(durationMatch[2]) * 60 + parseFloat(durationMatch[3])
        return Math.min((currentTime / totalTime) * 100, 100)
    }
    return 0
}
