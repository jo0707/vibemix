'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileImage, Music, Trash2, Pencil, Check, Shuffle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import type { FileItem } from '@/app/page';

interface FileUploadComponentProps {
  onFileChange: (images: FileItem[], audio: FileItem[]) => void;
  images: FileItem[];
  audio: FileItem[];
}

const getFileBaseName = (filename: string) => filename.substring(0, filename.lastIndexOf('.')) || filename;
const getFileExtension = (filename: string) => filename.substring(filename.lastIndexOf('.'));

async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      window.URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    };
    audio.src = window.URL.createObjectURL(file);
  });
}

export function FileUploadComponent({ onFileChange, images, audio }: FileUploadComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editingImageName, setEditingImageName] = useState('');
  const [editingAudioIndex, setEditingAudioIndex] = useState<number | null>(null);
  const [editingAudioName, setEditingAudioName] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const processFiles = async (files: File[]) => {
    const newImageFiles = files.filter(file => file.type.startsWith('image/'));
    const newAudioFiles = files.filter(file => file.type.startsWith('audio/'));

    const newImages: FileItem[] = newImageFiles.map(file => ({ file, name: file.name, duration: 3 }));

    const newAudios: FileItem[] = await Promise.all(newAudioFiles.map(async file => {
      const duration = await getAudioDuration(file);
      return { file, name: file.name, duration };
    }));

    onFileChange([...images, ...newImages], [...audio, ...newAudios]);
    
    if (newImages.length > 0) {
      toast({ title: "Images added", description: `${newImages.length} image(s) have been successfully added.` });
    }
    if (newAudios.length > 0) {
      toast({ title: "Soundtracks added", description: `${newAudios.length} soundtrack(s) have been successfully added.` });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []));
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const removedImage = newImages.splice(index, 1);
    onFileChange(newImages, audio);
    toast({ title: "Image removed", description: `"${removedImage[0].name}" has been removed.` });
  };

  const removeAudio = (index: number) => {
    const newAudio = [...audio];
    const removedAudio = newAudio.splice(index, 1);
    onFileChange(images, newAudio);
    if(removedAudio.length > 0) {
      toast({ title: "Soundtrack removed", description: `"${removedAudio[0].name}" has been removed.` });
    }
  };

  const handleRename = (index: number, type: 'image' | 'audio') => {
    if (type === 'image') {
      setEditingImageIndex(index);
      setEditingImageName(getFileBaseName(images[index].name));
    } else {
      setEditingAudioIndex(index);
      setEditingAudioName(getFileBaseName(audio[index].name));
    }
  };

  const handleSaveName = (index: number, type: 'image' | 'audio') => {
    if (type === 'image') {
      const newImages = [...images];
      const originalName = newImages[index].name;
      const extension = getFileExtension(originalName);
      newImages[index].name = editingImageName.trim() ? `${editingImageName}${extension}` : originalName;
      onFileChange(newImages, audio);
      setEditingImageIndex(null);
      toast({ title: "Image renamed", description: `Image has been renamed to "${newImages[index].name}".` });
    } else {
      const newAudio = [...audio];
      const originalName = newAudio[index].name;
      const extension = getFileExtension(originalName);
      newAudio[index].name = editingAudioName.trim() ? `${editingAudioName}${extension}` : originalName;
      onFileChange(images, newAudio);
      setEditingAudioIndex(null);
      toast({ title: "Soundtrack renamed", description: `Soundtrack has been renamed to "${newAudio[index].name}".` });
    }
  };
  
  const randomizeImages = () => {
    onFileChange([...images].sort(() => Math.random() - 0.5), audio);
  }

  const randomizeAudio = () => {
    onFileChange(images, [...audio].sort(() => Math.random() - 0.5));
  }

  const DropZone = ({ onSelect, accept, children, inputRef, multiple=false }: { onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void, accept: string, children: React.ReactNode, inputRef: React.RefObject<HTMLInputElement>, multiple?: boolean }) => (
    <div
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        isDragging ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary/50 hover:bg-gray-100"
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
  );

  const FileList = ({ files, editingIndex, editingName, setEditingName, onRename, onSave, onRemove, icon: Icon, type }: {
    files: FileItem[],
    editingIndex: number | null,
    editingName: string,
    setEditingName: (name: string) => void,
    onRename: (index: number) => void,
    onSave: (index: number) => void,
    onRemove: (index: number) => void,
    icon: React.ElementType,
    type: 'image' | 'audio'
  }) => (
    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
      {files.map((file, index) => (
        <div key={index} className="flex items-center justify-between p-2 rounded-md bg-gray-100">
          {editingIndex === index ? (
            <div className="flex items-center gap-2 w-full">
              <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="h-8"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && onSave(index)}
              />
              <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => onSave(index)}>
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
                <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0 text-gray-500 hover:text-gray-800" onClick={() => onRename(index)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0 text-gray-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); onRemove(index); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );


  return (
    <Card onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className="h-full shadow-md border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
          <span>1. Upload Files</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <h3 className="mb-2 font-medium text-gray-700">Images</h3>
          <DropZone onSelect={handleFileSelect} accept="image/*,audio/*" inputRef={imageInputRef} multiple={true}>
            <UploadCloud className="w-10 h-10 mb-2 text-gray-400" />
            <p className="font-semibold text-primary">Click to upload</p>
            <p className="text-sm text-muted-foreground">or drag and drop</p>
          </DropZone>
          {images.length > 0 && (
             <FileList
              files={images}
              editingIndex={editingImageIndex}
              editingName={editingImageName}
              setEditingName={setEditingImageName}
              onRename={(index) => handleRename(index, 'image')}
              onSave={(index) => handleSaveName(index, 'image')}
              onRemove={removeImage}
              icon={FileImage}
              type="image"
            />
          )}
          {images.length > 1 && (
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={randomizeImages}>
              <Shuffle className="w-4 h-4 mr-2" />
              Randomize Order
            </Button>
          )}
        </div>
        <div>
          <h3 className="mb-2 font-medium text-gray-700">Soundtracks</h3>
           <DropZone onSelect={handleFileSelect} accept="image/*,audio/*" inputRef={audioInputRef} multiple={true}>
            <Music className="w-10 h-10 mb-2 text-gray-400" />
            <p className="font-semibold text-primary">Upload audio files</p>
            <p className="text-sm text-muted-foreground">or drop them here</p>
          </DropZone>
           {audio.length > 0 && (
            <FileList
              files={audio}
              editingIndex={editingAudioIndex}
              editingName={editingAudioName}
              setEditingName={setEditingAudioName}
              onRename={(index) => handleRename(index, 'audio')}
              onSave={(index) => handleSaveName(index, 'audio')}
              onRemove={removeAudio}
              icon={Music}
              type="audio"
            />
          )}
           {audio.length > 1 && (
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={randomizeAudio}>
              <Shuffle className="w-4 h-4 mr-2" />
              Randomize Order
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
