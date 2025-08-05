"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Music } from "lucide-react"
import type { FileItem } from "@/types"

interface SongsListProps {
    audioFiles: FileItem[]
}

export function SongsList({ audioFiles }: SongsListProps) {
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const getSongEntries = () => {
        let currentTime = 0
        return audioFiles.map((audio, index) => {
            const startTime = currentTime
            const filename = audio.name.replace(/\.[^/.]+$/, "")
            const entry = {
                number: index + 1,
                filename,
                startTime: formatTime(startTime)
            }
            currentTime += audio.duration || 0
            return entry
        })
    }

    if (audioFiles.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        Songs List
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">
                        No audio files uploaded yet. Add some songs to see the playlist.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const songEntries = getSongEntries()

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Songs List
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {songEntries.map((song) => (
                        <div key={song.number} className="text-sm font-mono">
                            {song.number}. {song.filename} ({song.startTime})
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
