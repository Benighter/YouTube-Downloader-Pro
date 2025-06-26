#!/usr/bin/env python3
"""
Easy YouTube Downloader using yt-dlp
A simple wrapper script for yt-dlp with common options
"""

import sys
import subprocess
import os

def print_banner():
    print("=" * 50)
    print("     Easy YouTube Downloader (yt-dlp)")
    print("=" * 50)
    print()

def print_usage():
    print("Usage: python easy_download.py [URL] [optional: quality]")
    print()
    print("Quality options:")
    print("  1 - Best quality (default)")
    print("  2 - 720p max")
    print("  3 - 480p max")
    print("  4 - 360p max")
    print("  5 - Audio only (best)")
    print("  6 - Audio only (mp3)")
    print()
    print("Examples:")
    print('  python easy_download.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ"')
    print('  python easy_download.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 2')
    print()

def get_format_string(quality_choice):
    formats = {
        "1": "best",
        "2": "best[height<=720]",
        "3": "best[height<=480]",
        "4": "best[height<=360]",
        "5": "bestaudio",
        "6": "bestaudio[ext=m4a]/bestaudio"
    }
    return formats.get(quality_choice, "best[height<=720]")

def download_video(url, format_string):
    """Download video using yt-dlp"""
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "--no-check-certificate",
        "-f", format_string,
        "--output", "%(title)s.%(ext)s",
        url
    ]
    
    print(f"Downloading from: {url}")
    print(f"Format: {format_string}")
    print()
    
    try:
        result = subprocess.run(cmd, check=True)
        print()
        print("=" * 50)
        print("     Download completed successfully!")
        print("=" * 50)
        return True
    except subprocess.CalledProcessError as e:
        print()
        print("=" * 50)
        print(f"     Download failed! Error code: {e.returncode}")
        print("=" * 50)
        return False

def list_formats(url):
    """List available formats for a URL"""
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "--no-check-certificate",
        "--list-formats",
        url
    ]
    
    try:
        subprocess.run(cmd, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to list formats! Error code: {e.returncode}")
        return False

def main():
    print_banner()
    
    if len(sys.argv) < 2:
        print_usage()
        return 1
    
    url = sys.argv[1]
    
    # Special command to list formats
    if url.lower() == "--list" and len(sys.argv) > 2:
        return 0 if list_formats(sys.argv[2]) else 1
    
    # Get quality choice
    quality_choice = sys.argv[2] if len(sys.argv) > 2 else "2"  # Default to 720p
    format_string = get_format_string(quality_choice)
    
    # Download the video
    success = download_video(url, format_string)
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
