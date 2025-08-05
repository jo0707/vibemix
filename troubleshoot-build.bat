@echo off
echo VibeMix Build Troubleshooting
echo ==============================
echo.

echo Checking build artifacts...
echo.

if not exist "out" (
    echo ERROR: 'out' folder not found. Run 'bun run build' first.
    goto :end
)

if not exist "dist-electron" (
    echo ERROR: 'dist-electron' folder not found. Run 'bun run build:electron' first.
    goto :end
)

echo Checking critical files...
if exist "out/index.html" (
    echo ✓ index.html found
) else (
    echo ✗ index.html missing
)

if exist "out/_next/static" (
    echo ✓ Static assets folder found
) else (
    echo ✗ Static assets folder missing
)

echo.
echo Checking CSS files...
for /r "out\_next\static" %%f in (*.css) do (
    echo ✓ Found CSS: %%~nxf
)

echo.
echo Checking JS files...
for /r "out\_next\static" %%f in (*.js) do (
    echo ✓ Found JS: %%~nxf
)

echo.
echo =================================
echo RECOMMENDED FIXES FOR CSS ISSUES:
echo =================================
echo.
echo 1. Clean rebuild:
echo    - Delete 'out' and 'dist-electron' folders
echo    - Run: bun run build
echo    - Run: bun run build:electron
echo    - Run: bun run electron:build-win
echo.
echo 2. If CSS still not loading in built app:
echo    - The app has been configured with webSecurity: false
echo    - The assetPrefix is set to "./"
echo    - Static files should load properly
echo.
echo 3. Test the built application:
echo    - Check electron-dist folder for the .exe file
echo    - Run the .exe and check if styles load
echo.

:end
pause
