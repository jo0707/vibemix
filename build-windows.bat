@echo off
echo Building VibeMix for Windows...
echo.

echo Step 1: Building Next.js application...
call bun run build
if %errorlevel% neq 0 (
    echo ERROR: Next.js build failed
    pause
    exit /b 1
)

echo.
echo Step 2: Building Electron application...
call bun run build:electron
if %errorlevel% neq 0 (
    echo ERROR: Electron build failed
    pause
    exit /b 1
)

echo.
echo Step 3: Creating Windows executable...
call bun run electron:build-win
if %errorlevel% neq 0 (
    echo ERROR: Windows build failed
    pause
    exit /b 1
)

echo.
echo ===================================
echo BUILD COMPLETED SUCCESSFULLY!
echo ===================================
echo.
echo Your VibeMix Windows app is ready in the 'electron-dist' folder.
echo You can now run the .exe file to test the application.
echo.
pause
