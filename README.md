# VibeMix

A desktop application for creating video slideshows from images with synchronized audio tracks.

## Overview

VibeMix is a Next.js-based desktop application built with Electron that converts your images and audio files into professional video slideshows. The app uses FFmpeg for video processing and provides both CPU and GPU acceleration options.

## Key Features

### Video Creation

-   Combines multiple images into a video slideshow
-   Synchronizes multiple audio tracks with video content
-   Configurable image duration and loop count
-   Support for 1920x1080 HD output with automatic scaling and padding

### Processing Options

-   **CPU Mode**: Single-command processing using libx264 codec
-   **GPU Mode**: Two-step processing with NVIDIA hardware acceleration (h264_nvenc)
-   Real-time progress monitoring via separate terminal windows
-   Automatic cleanup of temporary files

### Desktop Integration

-   Persistent output directory selection with localStorage
-   Direct file system access for reading/writing media files
-   Terminal command execution for FFmpeg processing
-   Native file explorer integration

### User Interface

-   Drag-and-drop file upload for images and audio
-   Real-time duration calculation and preview
-   Progress tracking with visual indicators
-   Tabbed interface with video creator and desktop features

## Technical Stack

-   **Frontend**: Next.js 14 with React 18
-   **Desktop**: Electron with secure context isolation
-   **Styling**: Tailwind CSS with Shadcn/UI components
-   **Package Manager**: Bun
-   **Video Processing**: FFmpeg with CPU/GPU acceleration
-   **File Handling**: Native file system APIs via Electron

## Installation

### Prerequisites

-   Node.js 18 or higher
-   Bun package manager
-   FFmpeg (automatically checked and guided installation)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd vidyslides

# Install dependencies
bun install

# Start development server
bun run electron:dev

# Build for production
bun run electron:build-win
```

## FFmpeg Installation

The application automatically checks for FFmpeg on startup. If not installed:

1. Navigate to Desktop Features tab
2. Click "Install FFmpeg" button
3. Follow the automated installation process using Windows Package Manager

Manual installation:

```bash
winget install -e --id Gyan.FFmpeg
```

## Usage

### Basic Workflow

1. Launch the desktop application
2. Select or confirm output directory (saved automatically)
3. Upload image files (PNG, JPG, JPEG)
4. Upload audio files (WAV, MP3)
5. Configure project settings (title, duration, loops, processing device)
6. Click "Generate Video" to start processing
7. Monitor progress in separate terminal window
8. Access completed video via "Open Output Directory" button

### Processing Modes

**CPU Processing**

-   Uses libx264 codec for maximum compatibility
-   Single FFmpeg command execution
-   Suitable for most hardware configurations

**GPU Processing**

-   Utilizes NVIDIA hardware acceleration (h264_nvenc)
-   Two-step process: video creation then audio mixing
-   Faster processing on compatible hardware

## File Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── types/              # TypeScript definitions

electron/
├── main.ts             # Electron main process
├── preload.ts          # Secure context bridge
└── tsconfig.json       # Electron TypeScript config

types/
└── electron.d.ts       # Electron API type definitions
```

## Configuration

The application uses several configuration files:

-   `next.config.ts` - Next.js configuration with static export
-   `electron-builder.json` - Desktop app packaging configuration
-   `package.json` - Dependencies and build scripts

## Development Scripts

-   `bun run dev` - Start Next.js development server
-   `bun run build` - Build Next.js application
-   `bun run electron:dev` - Start Electron development mode
-   `bun run electron:build` - Build Electron application
-   `bun run electron:build-win` - Build Windows executable

## Security

The application implements Electron security best practices:

-   Context isolation enabled
-   Node integration disabled in renderer
-   Secure preload scripts for IPC communication
-   Restricted access to system APIs through controlled interfaces
