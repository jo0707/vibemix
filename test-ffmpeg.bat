@echo off
echo Testing FFmpeg Installation...
echo.

ffmpeg -version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: FFmpeg is not installed or not in PATH!
    echo Please install FFmpeg from https://ffmpeg.org/download.html
    echo and add it to your system PATH.
    echo.
    pause
    exit /b 1
)

echo.
echo FFmpeg is installed and working!
echo.
echo You can now use the desktop app to process videos.
echo The processing will show in separate terminal windows.
echo.
pause
