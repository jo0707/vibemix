"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Music } from "lucide-react"
import type { FileItem } from "@/types"

interface SongsListProps {
    audioFiles: FileItem[]
}

export function SongsList({ audioFiles }: SongsListProps) {
    const [showTimestamp, setShowTimestamp] = useState(true)
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    }

    const getSongEntries = () => {
        let currentTime = 0
        return audioFiles.map((audio, index) => {
            const startTime = currentTime
            const filename = audio.name.replace(/\.[^/.]+$/, "")
            const entry = {
                number: index + 1,
                filename,
                startTime: formatTime(startTime),
            }
            currentTime += audio.duration || 0
            return entry
        })
    }

    if (audioFiles.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">Songs List</CardTitle>
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
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xl">Songs List</div>
                    <div className="flex items-center space-x-2">
                        <Switch id="timestamp-toggle" checked={showTimestamp} onCheckedChange={setShowTimestamp} />
                        <Label htmlFor="timestamp-toggle" className="text-sm font-normal">
                            Show timestamps
                        </Label>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {songEntries.map((song) => (
                        <div key={song.number} className="text-sm font-mono">
                            {song.number}. {song.filename}
                            {showTimestamp && ` (${song.startTime})`}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
