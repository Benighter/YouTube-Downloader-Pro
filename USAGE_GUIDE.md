# YouTube Video Downloader - Usage Guide

This is **yt-dlp**, the best and most popular YouTube video downloader available on GitHub with 116k+ stars. It's a feature-rich command-line audio/video downloader that supports thousands of sites.

## What is yt-dlp?

yt-dlp is a fork of the popular youtube-dl project with many improvements and active maintenance. It supports:
- YouTube (including live streams, playlists, channels)
- Thousands of other video sites
- Multiple video/audio formats
- Subtitle downloads
- Playlist downloads
- And much more!

## Quick Start

### Method 1: Using the Easy Python Script
```bash
# Download video in 720p quality (default)
python easy_download.py "https://www.youtube.com/watch?v=VIDEO_ID"

# Download audio only
python easy_download.py "https://www.youtube.com/watch?v=VIDEO_ID" 5

# Download in 480p
python easy_download.py "https://www.youtube.com/watch?v=VIDEO_ID" 3
```

### Method 2: Using the Batch File (Windows)
```cmd
# Download with default settings (720p max)
download_video.bat "https://www.youtube.com/watch?v=VIDEO_ID"

# Download with custom format
download_video.bat "https://www.youtube.com/watch?v=VIDEO_ID" "best[height<=480]"

# Download audio only
download_video.bat "https://www.youtube.com/watch?v=VIDEO_ID" "140"
```

### Method 3: Direct yt-dlp Commands
```bash
# Basic download
python -m yt_dlp --no-check-certificate "https://www.youtube.com/watch?v=VIDEO_ID"

# List available formats
python -m yt_dlp --no-check-certificate --list-formats "https://www.youtube.com/watch?v=VIDEO_ID"

# Download specific format
python -m yt_dlp --no-check-certificate -f "best[height<=720]" "https://www.youtube.com/watch?v=VIDEO_ID"

# Download audio only
python -m yt_dlp --no-check-certificate -f "bestaudio" "https://www.youtube.com/watch?v=VIDEO_ID"

# Download with custom filename
python -m yt_dlp --no-check-certificate -o "%(title)s.%(ext)s" "https://www.youtube.com/watch?v=VIDEO_ID"
```

## Quality Options

| Option | Description | Format Code |
|--------|-------------|-------------|
| 1 | Best quality available | `best` |
| 2 | 720p maximum | `best[height<=720]` |
| 3 | 480p maximum | `best[height<=480]` |
| 4 | 360p maximum | `best[height<=360]` |
| 5 | Audio only (best) | `bestaudio` |
| 6 | Audio only (mp3) | `bestaudio[ext=m4a]/bestaudio` |

## Common Use Cases

### Download Entire Playlist
```bash
python -m yt_dlp --no-check-certificate "https://www.youtube.com/playlist?list=PLAYLIST_ID"
```

### Download with Subtitles
```bash
python -m yt_dlp --no-check-certificate --write-subs --sub-langs "en" "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Download Audio and Convert to MP3
```bash
python -m yt_dlp --no-check-certificate -x --audio-format mp3 "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Download Video with Thumbnail
```bash
python -m yt_dlp --no-check-certificate --write-thumbnail "https://www.youtube.com/watch?v=VIDEO_ID"
```

## Advanced Options

### Custom Output Template
```bash
python -m yt_dlp --no-check-certificate -o "%(uploader)s - %(title)s.%(ext)s" "URL"
```

### Download Age-Restricted Videos
```bash
python -m yt_dlp --no-check-certificate --cookies-from-browser chrome "URL"
```

### Limit Download Speed
```bash
python -m yt_dlp --no-check-certificate --limit-rate 1M "URL"
```

## Troubleshooting

### SSL Certificate Issues
If you encounter SSL certificate errors, use the `--no-check-certificate` flag (already included in our scripts).

### Video Not Available
Some videos may be geo-restricted or require authentication. Try:
```bash
python -m yt_dlp --no-check-certificate --geo-bypass "URL"
```

### Format Not Available
List available formats first:
```bash
python -m yt_dlp --no-check-certificate --list-formats "URL"
```

## Files in This Directory

- `easy_download.py` - Simple Python script with quality presets
- `download_video.bat` - Windows batch file for easy downloading
- `USAGE_GUIDE.md` - This guide
- `yt_dlp/` - The main yt-dlp source code

## Requirements

- Python 3.9+ (already installed on your system)
- Internet connection
- Optional: ffmpeg for video processing (for advanced features)

## Support

For more advanced usage, check the official yt-dlp documentation:
https://github.com/yt-dlp/yt-dlp#readme

## Legal Notice

Please respect copyright laws and terms of service of the platforms you're downloading from. This tool is for personal use and educational purposes.
