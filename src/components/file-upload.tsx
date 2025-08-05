"use client"
import React, { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UploadCloud, FileImage, Music, Trash2, Pencil, Check, Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getFileBaseName, getFileExtension, getAudioDuration } from "@/lib/file-utils"
import type { FileItem } from "@/types"
interface Props {
    onFileChange: (images: FileItem[], audio: FileItem[]) => void
    images: FileItem[]
    audio: FileItem[]
}
export function FileUploadComponent({ onFileChange, images, audio }: Props) {
    const [isDragging, setIsDragging] = useState(false)
    const [editingImage, setEditingImage] = useState<{ index: number; name: string } | null>(null)
    const [editingAudio, setEditingAudio] = useState<{ index: number; name: string } | null>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const audioInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(e.type === "dragenter" || e.type === "dragover")
    }
    const processFiles = async (files: File[]) => {
        const newImageFiles = files.filter((file) => file.type.startsWith("image/"))
        const newAudioFiles = files.filter((file) => file.type.startsWith("audio/"))
        const newImages: FileItem[] = newImageFiles.map((file) => ({ file, name: file.name, duration: 3 }))
        const newAudios: FileItem[] = await Promise.all(
            newAudioFiles.map(async (file) => ({
                file,
                name: file.name,
                duration: await getAudioDuration(file),
            }))
        )
        onFileChange([...images, ...newImages], [...audio, ...newAudios])
        if (newImages.length > 0) {
            toast({ title: "Images added", description: `${newImages.length} image(s) added.` })
        }
        if (newAudios.length > 0) {
            toast({ title: "Audio added", description: `${newAudios.length} audio file(s) added.` })
        }
    }
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        processFiles(Array.from(e.dataTransfer.files))
    }
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(Array.from(e.target.files || []))
    }
    const removeFile = (index: number, type: "image" | "audio") => {
        if (type === "image") {
            const newImages = [...images]
            const removed = newImages.splice(index, 1)[0]
            onFileChange(newImages, audio)
            toast({ title: "Image removed", description: `"${removed.name}" removed.` })
        } else {
            const newAudio = [...audio]
            const removed = newAudio.splice(index, 1)[0]
            onFileChange(images, newAudio)
            toast({ title: "Audio removed", description: `"${removed.name}" removed.` })
        }
    }
    const startRename = (index: number, type: "image" | "audio") => {
        const file = type === "image" ? images[index] : audio[index]
        const editState = { index, name: getFileBaseName(file.name) }
        if (type === "image") {
            setEditingImage(editState)
        } else {
            setEditingAudio(editState)
        }
    }
    const saveRename = (type: "image" | "audio") => {
        const editState = type === "image" ? editingImage : editingAudio
        if (!editState) return
        const files = type === "image" ? [...images] : [...audio]
        const originalName = files[editState.index].name
        const extension = getFileExtension(originalName)
        files[editState.index].name = editState.name.trim() ? `${editState.name}${extension}` : originalName
        if (type === "image") {
            onFileChange(files as FileItem[], audio)
            setEditingImage(null)
        } else {
            onFileChange(images, files as FileItem[])
            setEditingAudio(null)
        }
        toast({ title: "File renamed", description: `Renamed to "${files[editState.index].name}".` })
    }
    const randomize = (type: "image" | "audio") => {
        if (type === "image") {
            onFileChange(
                [...images].sort(() => Math.random() - 0.5),
                audio
            )
        } else {
            onFileChange(
                images,
                [...audio].sort(() => Math.random() - 0.5)
            )
        }
    }
    const DropZone = ({
        onSelect,
        accept,
        children,
        inputRef,
        multiple = false,
    }: {
        onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
        accept: string
        children: React.ReactNode
        inputRef: React.RefObject<HTMLInputElement>
        multiple?: boolean
    }) => (
        <div
            onClick={() => inputRef.current?.click()}
            className={cn(
                "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                isDragging
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 hover:border-primary/50 hover:bg-gray-100"
            )}
        >
            {children}
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                multiple={multiple}
                accept={accept}
                onChange={onSelect}
            />
        </div>
    )
    const FileList = ({
        files,
        editingState,
        onEdit,
        onSave,
        onRemove,
        icon: Icon,
        type,
    }: {
        files: FileItem[]
        editingState: { index: number; name: string } | null
        onEdit: (index: number) => void
        onSave: () => void
        onRemove: (index: number) => void
        icon: React.ElementType
        type: "image" | "audio"
    }) => (
        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
            {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-md bg-gray-100">
                    {editingState?.index === index ? (
                        <div className="flex items-center gap-2 w-full">
                            <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
                            <Input
                                value={editingState.name}
                                onChange={(e) => {
                                    const newState = { ...editingState, name: e.target.value }
                                    if (type === "image") setEditingImage(newState)
                                    else setEditingAudio(newState)
                                }}
                                className="h-8"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && onSave()}
                            />
                            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={onSave}>
                                <Check className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 overflow-hidden w-full">
                                <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
                                <Icon className="w-5 h-5 text-primary shrink-0" />
                                <span className="text-sm truncate text-gray-800 flex-grow">{file.name}</span>
                            </div>
                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-6 h-6 shrink-0 text-gray-500 hover:text-gray-800"
                                    onClick={() => onEdit(index)}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-6 h-6 shrink-0 text-gray-500 hover:text-red-600"
                                    onClick={() => onRemove(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    )
    return (
        <Card
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className="h-full shadow-md border-gray-200"
        >
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <span>1. Upload Files</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
                <div>
                    <h3 className="mb-2 font-medium text-gray-700">Images</h3>
                    <DropZone
                        onSelect={handleFileSelect}
                        accept="image/*,audio/*"
                        inputRef={imageInputRef}
                        multiple={true}
                    >
                        <UploadCloud className="w-10 h-10 mb-2 text-gray-400" />
                        <p className="font-semibold text-primary">Click to upload</p>
                        <p className="text-sm text-muted-foreground">or drag and drop</p>
                    </DropZone>
                    {images.length > 0 && (
                        <FileList
                            files={images}
                            editingState={editingImage}
                            onEdit={(index) => startRename(index, "image")}
                            onSave={() => saveRename("image")}
                            onRemove={(index) => removeFile(index, "image")}
                            icon={FileImage}
                            type="image"
                        />
                    )}
                    {images.length > 1 && (
                        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => randomize("image")}>
                            <Shuffle className="w-4 h-4 mr-2" />
                            Randomize Order
                        </Button>
                    )}
                </div>
                <div>
                    <h3 className="mb-2 font-medium text-gray-700">Soundtracks</h3>
                    <DropZone
                        onSelect={handleFileSelect}
                        accept="image/*,audio/*"
                        inputRef={audioInputRef}
                        multiple={true}
                    >
                        <Music className="w-10 h-10 mb-2 text-gray-400" />
                        <p className="font-semibold text-primary">Upload audio files</p>
                        <p className="text-sm text-muted-foreground">or drop them here</p>
                    </DropZone>
                    {audio.length > 0 && (
                        <FileList
                            files={audio}
                            editingState={editingAudio}
                            onEdit={(index) => startRename(index, "audio")}
                            onSave={() => saveRename("audio")}
                            onRemove={(index) => removeFile(index, "audio")}
                            icon={Music}
                            type="audio"
                        />
                    )}
                    {audio.length > 1 && (
                        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => randomize("audio")}>
                            <Shuffle className="w-4 h-4 mr-2" />
                            Randomize Order
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
