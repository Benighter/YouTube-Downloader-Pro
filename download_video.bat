@echo off
echo ========================================
echo        YouTube Video Downloader
echo        Using yt-dlp (Best Available)
echo ========================================
echo.

if "%~1"=="" (
    echo Usage: download_video.bat [URL] [optional: format]
    echo.
    echo Examples:
    echo   download_video.bat "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    echo   download_video.bat "https://www.youtube.com/watch?v=dQw4w9WgXcQ" "best[height<=720]"
    echo   download_video.bat "https://www.youtube.com/watch?v=dQw4w9WgXcQ" "140" (audio only)
    echo.
    echo Common format options:
    echo   - best                    : Best quality available
    echo   - best[height<=720]       : Best quality up to 720p
    echo   - best[height<=480]       : Best quality up to 480p
    echo   - 140                     : Audio only (m4a)
    echo   - bestaudio               : Best audio quality
    echo.
    pause
    exit /b 1
)

set URL=%~1
set FORMAT=%~2

if "%FORMAT%"=="" (
    set FORMAT=best[height<=720]
    echo No format specified, using default: %FORMAT%
) else (
    echo Using format: %FORMAT%
)

echo.
echo Downloading from: %URL%
echo Format: %FORMAT%
echo.

python -m yt_dlp --no-check-certificate -f "%FORMAT%" --output "%%(title)s.%%(ext)s" "%URL%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo     Download completed successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo       Download failed! Error: %ERRORLEVEL%
    echo ========================================
)

echo.
pause
