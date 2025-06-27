#!/usr/bin/env python3
"""
YouTube Downloader Pro - Backend Server
A Flask server to handle yt-dlp operations with a beautiful web UI
"""

import os
import sys
import json
import subprocess
import threading
import time
import zipfile
import tempfile
import shutil
import sqlite3
import psutil  # For disk space information
import datetime
import urllib.request
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import re
import io
from urllib.parse import quote

# Add parent directory to path to import yt_dlp
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__, static_folder='.', template_folder='.')
CORS(app)

# Global variables for download progress
download_progress = {}
active_downloads = {}
download_processes = {}  # Store subprocess objects for pause/stop functionality

# Storage management configuration
STORAGE_DB_PATH = 'storage_history.db'
DEFAULT_STORAGE_PATHS = {
    'windows': ['C:', 'D:', 'E:'],
    'darwin': ['/Users', '/Applications', '/System/Volumes/Data'],
    'linux': ['/', '/home', '/var', '/usr']
}

def init_storage_db():
    """Initialize the storage history database"""
    conn = sqlite3.connect(STORAGE_DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS download_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_url TEXT NOT NULL,
            video_title TEXT,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            storage_location TEXT,
            format_info TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS storage_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT UNIQUE NOT NULL,
            alias TEXT,
            is_default INTEGER DEFAULT 0,
            created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()

def get_disk_usage(path):
    """Get disk usage information for a given path"""
    try:
        usage = psutil.disk_usage(path)
        return {
            'total': usage.total,
            'used': usage.used,
            'free': usage.free,
            'percent': (usage.used / usage.total) * 100
        }
    except Exception as e:
        print(f"Error getting disk usage for {path}: {e}")
        return None

def format_file_size(size_bytes):
    """Format file size in bytes to human readable format"""
    if size_bytes == 0:
        return "Unknown size"

    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} PB"

def add_to_download_history(video_url, video_title, file_path, file_size, storage_location, format_info=''):
    """Add a completed download to the history database"""
    try:
        conn = sqlite3.connect(STORAGE_DB_PATH)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO download_history
            (video_url, video_title, file_path, file_size, storage_location, format_info)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (video_url, video_title, file_path, file_size, storage_location, format_info))

        conn.commit()
        conn.close()

    except Exception as e:
        print(f"Error adding to download history: {e}")

def update_storage_location_usage(path):
    """Update the last used timestamp for a storage location"""
    try:
        conn = sqlite3.connect(STORAGE_DB_PATH)
        cursor = conn.cursor()

        # Insert or update storage location
        cursor.execute('''
            INSERT OR REPLACE INTO storage_locations (path, last_used)
            VALUES (?, CURRENT_TIMESTAMP)
        ''', (path,))

        conn.commit()
        conn.close()

    except Exception as e:
        print(f"Error updating storage location usage: {e}")

# Initialize storage database on startup
init_storage_db()

class DownloadProgress:
    def __init__(self):
        self.progress = 0
        self.status = "waiting"
        self.speed = "0 MB/s"
        self.size = "0 MB"
        self.eta = "00:00"
        self.filename = ""
        self.last_update = 0
        self.download_rate_history = []
        self.expected_size = 0
        self.storage_info = None
        self.remaining_space = 0

def progress_hook_wrapper(d, download_id, expected_size, storage_info):
    """Wrapper for progress hook to include storage tracking"""
    # Call the original progress hook
    progress_hook(d)

    # Add storage information to the progress data
    if download_id in download_progress:
        progress_obj = download_progress[download_id]

        # Add storage info if available
        if storage_info and isinstance(progress_obj, DownloadProgress):
            # Calculate remaining space after download
            downloaded_bytes = d.get('downloaded_bytes', 0)
            remaining_download = max(0, expected_size - downloaded_bytes) if expected_size > 0 else 0

            # Update storage tracking
            progress_obj.remaining_space = storage_info['free_space'] - remaining_download
            progress_obj.expected_size = expected_size
            progress_obj.storage_info = storage_info

def progress_hook(d):
    """Enhanced progress hook for yt-dlp with more frequent updates"""
    download_id = d.get('info_dict', {}).get('id', 'unknown')
    current_time = time.time()

    if download_id not in download_progress:
        download_progress[download_id] = DownloadProgress()

    progress = download_progress[download_id]

    if d['status'] == 'downloading':
        progress.status = "downloading"
        progress.filename = d.get('filename', '')
        progress.last_update = current_time

        # Calculate progress percentage with higher precision
        downloaded_bytes = d.get('downloaded_bytes', 0)
        total_bytes = d.get('total_bytes') or d.get('total_bytes_estimate', 0)

        if total_bytes > 0:
            # Use higher precision for smoother progress updates
            progress.progress = min(100, (downloaded_bytes / total_bytes) * 100)
        else:
            # If no total size, show indeterminate progress based on downloaded amount
            progress.progress = min(99, (downloaded_bytes / (1024 * 1024)) * 2)  # Rough estimate

        # Enhanced speed calculation with smoothing
        speed = d.get('speed', 0)
        if speed:
            # Add to history for smoothing
            progress.download_rate_history.append(speed)
            if len(progress.download_rate_history) > 10:  # Keep last 10 measurements
                progress.download_rate_history.pop(0)

            # Calculate average speed for smoother display
            avg_speed = sum(progress.download_rate_history) / len(progress.download_rate_history)

            if avg_speed > 1024 * 1024:
                progress.speed = f"{avg_speed / (1024 * 1024):.2f} MB/s"
            elif avg_speed > 1024:
                progress.speed = f"{avg_speed / 1024:.1f} KB/s"
            else:
                progress.speed = f"{avg_speed:.0f} B/s"
        else:
            progress.speed = "0 MB/s"

        # Enhanced ETA calculation
        eta = d.get('eta', 0)
        if eta and eta > 0:
            if eta < 60:
                progress.eta = f"00:{eta:02.0f}"
            else:
                minutes = int(eta // 60)
                seconds = int(eta % 60)
                if minutes < 60:
                    progress.eta = f"{minutes:02d}:{seconds:02d}"
                else:
                    hours = minutes // 60
                    minutes = minutes % 60
                    progress.eta = f"{hours}:{minutes:02d}:{seconds:02d}"
        else:
            progress.eta = "--:--"

        # Enhanced size formatting
        if total_bytes > 0:
            if total_bytes > 1024 * 1024 * 1024:  # GB
                progress.size = f"{downloaded_bytes / (1024**3):.2f} / {total_bytes / (1024**3):.2f} GB"
            else:  # MB
                progress.size = f"{downloaded_bytes / (1024**2):.1f} / {total_bytes / (1024**2):.1f} MB"
        else:
            if downloaded_bytes > 1024 * 1024 * 1024:  # GB
                progress.size = f"{downloaded_bytes / (1024**3):.2f} GB"
            else:  # MB
                progress.size = f"{downloaded_bytes / (1024**2):.1f} MB"

    elif d['status'] == 'finished':
        progress.status = "completed"
        progress.progress = 100
        progress.filename = d.get('filename', '')
        progress.speed = "0 MB/s"
        progress.eta = "00:00"

    elif d['status'] == 'error':
        progress.status = "error"
        progress.speed = "0 MB/s"
        progress.eta = "00:00"

def get_enhanced_video_size(url, format_selector='best[height<=720]'):
    """Enhanced video size detection using multiple methods"""
    print(f"Getting enhanced size for URL: {url} with format: {format_selector}")

    # Method 1: Try to get size from format listing with specific format
    try:
        print("Method 1: Trying format-specific size detection...")
        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--no-check-certificate',
            '--dump-json',
            '--no-download',
            '--format', format_selector,
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            '--extractor-retries', '3',
            url
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, cwd='..')

        if result.returncode == 0:
            try:
                video_info = json.loads(result.stdout)
                # Check for direct file size
                size = video_info.get('filesize') or video_info.get('filesize_approx')
                if size and size > 0:
                    print(f"Method 1 success: Found size {size} bytes")
                    return size

                # Check for format-specific sizes
                if 'requested_formats' in video_info:
                    total_size = 0
                    for fmt in video_info['requested_formats']:
                        fmt_size = fmt.get('filesize') or fmt.get('filesize_approx', 0)
                        total_size += fmt_size
                    if total_size > 0:
                        print(f"Method 1 success: Combined format size {total_size} bytes")
                        return total_size

            except json.JSONDecodeError:
                print("Method 1 failed: JSON decode error")
                pass
        else:
            print(f"Method 1 failed: Command returned {result.returncode}")
    except Exception as e:
        print(f"Method 1 failed: {e}")

    print("All methods failed, returning 0")
    return 0

@app.route('/')
def index():
    """Serve the main UI"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('.', filename)

@app.route('/api/analyze', methods=['POST'])
def analyze_video():
    """Analyze video URL and return metadata"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()

        if not url:
            return jsonify({'error': 'URL is required'}), 400

        # First check if it's a playlist
        playlist_cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--no-check-certificate',
            '--dump-json',
            '--no-download',
            '--flat-playlist',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            '--extractor-retries', '3',
            url
        ]

        playlist_result = subprocess.run(playlist_cmd, capture_output=True, text=True, cwd='..')

        # Check if it's a playlist by counting entries
        is_playlist = False
        playlist_info = None
        video_count = 0

        if playlist_result.returncode == 0:
            try:
                lines = [line.strip() for line in playlist_result.stdout.strip().split('\n') if line.strip()]
                video_count = len(lines)
                
                if video_count > 1:
                    is_playlist = True
                    
                    # Get playlist metadata
                    try:
                        first_entry = json.loads(lines[0]) if lines else {}
                        playlist_title = first_entry.get('playlist_title', 'Unknown Playlist')
                        playlist_uploader = first_entry.get('playlist_uploader', 'Unknown')
                        
                        # Try to get a thumbnail from the first video
                        playlist_thumbnail = first_entry.get('thumbnail', '')
                        
                        playlist_info = {
                            'title': playlist_title,
                            'uploader': playlist_uploader,
                            'thumbnail': playlist_thumbnail,
                            'video_count': video_count,
                            'description': f'Playlist with {video_count} videos'
                        }
                    except (json.JSONDecodeError, IndexError):
                        playlist_info = {
                            'title': 'Unknown Playlist',
                            'uploader': 'Unknown',
                            'thumbnail': '',
                            'video_count': video_count,
                            'description': f'Playlist with {video_count} videos'
                        }
            except Exception as e:
                print(f"Error parsing playlist info: {e}")

        if is_playlist:
            return jsonify({
                'success': True, 
                'is_playlist': True, 
                'playlist_info': playlist_info
            })

        # Single video analysis
        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--no-check-certificate',
            '--dump-json',
            '--no-download',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            '--extractor-retries', '3',
            url
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, cwd='..')

        if result.returncode != 0:
            return jsonify({'error': 'Failed to analyze video. Please check the URL and try again.'}), 400

        try:
            video_info = json.loads(result.stdout)
        except json.JSONDecodeError:
            return jsonify({'error': 'Failed to parse video information'}), 400

        # Extract video information
        info = {
            'title': video_info.get('title', 'Unknown Title'),
            'thumbnail': video_info.get('thumbnail', ''),
            'uploader': video_info.get('uploader', 'Unknown'),
            'duration': video_info.get('duration', 0),
            'view_count': video_info.get('view_count', 0),
            'upload_date': video_info.get('upload_date', ''),
            'description': video_info.get('description', ''),
            'formats': []
        }

        return jsonify({'success': True, 'is_playlist': False, 'info': info})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-formats', methods=['POST'])
def analyze_formats():
    """Analyze video formats and provide size estimates with storage information"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        download_path = data.get('download_path', '').strip()

        if not url:
            return jsonify({'error': 'URL is required'}), 400

        # Get video info with all formats
        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--no-check-certificate',
            '--dump-json',
            '--no-download',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            '--extractor-retries', '3',
            url
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, cwd='..')

        if result.returncode != 0:
            return jsonify({'error': 'Failed to analyze video formats'}), 400

        try:
            video_info = json.loads(result.stdout)
        except json.JSONDecodeError:
            return jsonify({'error': 'Failed to parse video information'}), 400

        # Define format selectors we want to analyze
        format_selectors = [
            ('best', 'Best Quality'),
            ('best[height<=1080]', '1080p HD'),
            ('best[height<=720]', '720p HD'),
            ('best[height<=480]', '480p'),
            ('bestaudio', 'Audio Only'),
            ('140', 'MP4 Audio')
        ]

        format_analysis = []

        for selector, display_name in format_selectors:
            # Get size for this specific format
            size_bytes = get_enhanced_video_size(url, selector)

            # Determine confidence level
            confidence = 'high' if size_bytes > 0 else 'low'

            # Format size display
            if size_bytes > 0:
                size_display = format_file_size(size_bytes)
            else:
                size_display = "Unknown"
                size_bytes = 0

            format_analysis.append({
                'selector': selector,
                'display_name': display_name,
                'size_bytes': size_bytes,
                'size_display': size_display,
                'confidence': confidence,
                'estimated': confidence != 'high'
            })

        # Get storage information for the download path
        storage_info = None
        if download_path:
            try:
                # Determine the actual path to check
                if os.path.isabs(download_path):
                    check_path = download_path
                else:
                    # Relative path - check from parent directory
                    check_path = os.path.join('..', download_path)

                # Get the drive/mount point for the path
                if os.name == 'nt':  # Windows
                    drive = os.path.splitdrive(os.path.abspath(check_path))[0]
                    if not drive:
                        drive = 'C:'  # Fallback to C: drive
                else:  # Unix-like
                    drive = '/'

                disk_usage = get_disk_usage(drive)
                if disk_usage:
                    storage_info = {
                        'drive': drive,
                        'total_space': disk_usage['total'],
                        'free_space': disk_usage['free'],
                        'used_space': disk_usage['used'],
                        'total_formatted': format_file_size(disk_usage['total']),
                        'free_formatted': format_file_size(disk_usage['free']),
                        'used_formatted': format_file_size(disk_usage['used']),
                        'usage_percent': disk_usage['percent']
                    }
            except Exception as e:
                print(f"Error getting storage info for {download_path}: {e}")

        # If no download path provided, get default storage info
        if not storage_info:
            try:
                home_dir = os.path.expanduser('~')
                default_path = os.path.join(home_dir, 'Downloads', 'YT-dlp')

                if os.name == 'nt':  # Windows
                    drive = os.path.splitdrive(home_dir)[0]
                    if not drive:
                        drive = 'C:'
                else:  # Unix-like
                    drive = '/'

                disk_usage = get_disk_usage(drive)
                if disk_usage:
                    storage_info = {
                        'drive': drive,
                        'total_space': disk_usage['total'],
                        'free_space': disk_usage['free'],
                        'used_space': disk_usage['used'],
                        'total_formatted': format_file_size(disk_usage['total']),
                        'free_formatted': format_file_size(disk_usage['free']),
                        'used_formatted': format_file_size(disk_usage['used']),
                        'usage_percent': disk_usage['percent']
                    }
            except Exception as e:
                print(f"Error getting default storage info: {e}")

        return jsonify({
            'success': True,
            'formats': format_analysis,
            'storage_info': storage_info,
            'video_duration': video_info.get('duration', 0)
        })

    except Exception as e:
        print(f"Error in analyze_formats: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/download', methods=['POST'])
def start_download():
    """Start video download with real-time progress tracking"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        format_selector = data.get('format', 'best[height<=720]')
        options = data.get('options', {})
        folder = data.get('folder', '').strip()

        if not url:
            return jsonify({'error': 'URL is required'}), 400

        # Generate download ID
        download_id = str(int(time.time()))

        # Determine download directory
        if folder:
            # Check if it's an absolute path or relative path
            if os.path.isabs(folder):
                # Absolute path - use as is
                download_dir = folder
                output_template = os.path.join(download_dir, '%(title)s.%(ext)s')
            else:
                # Relative path - relative to parent directory
                download_dir = os.path.join('..', folder)
                output_template = os.path.join(download_dir, '%(title)s.%(ext)s')
        else:
            # Use default Downloads/YT-dlp directory
            home_dir = os.path.expanduser('~')
            download_dir = os.path.join(home_dir, 'Downloads', 'YT-dlp')
            output_template = os.path.join(download_dir, '%(title)s.%(ext)s')

        # Ensure download directory exists
        try:
            os.makedirs(download_dir, exist_ok=True)
        except Exception as e:
            return jsonify({'error': f'Cannot create directory: {str(e)}'}), 400

        # Get expected file size for storage tracking
        expected_size = get_enhanced_video_size(url, format_selector)

        # Get storage info for the download location
        storage_info = None
        try:
            if os.name == 'nt':  # Windows
                drive = os.path.splitdrive(os.path.abspath(download_dir))[0]
                if not drive:
                    drive = 'C:'
            else:  # Unix-like
                drive = '/'

            disk_usage = get_disk_usage(drive)
            if disk_usage:
                storage_info = {
                    'free_space': disk_usage['free'],
                    'total_space': disk_usage['total'],
                    'used_space': disk_usage['used']
                }
        except Exception as e:
            print(f"Error getting storage info: {e}")

        # Start download in background thread
        def run_download():
            try:
                import yt_dlp

                # Set up yt-dlp options with progress hook
                ydl_opts = {
                    'format': format_selector,
                    'outtmpl': output_template,
                    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'extractor_retries': 3,
                    'no_check_certificate': True,
                    'progress_hooks': [lambda d: progress_hook_wrapper(d, download_id, expected_size, storage_info)]
                }

                # Add optional flags
                if options.get('subtitles'):
                    ydl_opts['writesubtitles'] = True
                    ydl_opts['subtitleslangs'] = ['en']

                if options.get('thumbnail'):
                    ydl_opts['writethumbnail'] = True

                if options.get('extract_audio'):
                    ydl_opts['format'] = 'bestaudio/best'
                    ydl_opts['postprocessors'] = [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': '192',
                    }]

                # Store download info for cancellation
                download_processes[download_id] = {'ydl': None, 'cancelled': False}

                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    download_processes[download_id]['ydl'] = ydl

                    # Start download
                    ydl.download([url])

                # Clean up process reference
                if download_id in download_processes:
                    del download_processes[download_id]

                # Check if download was cancelled
                if download_progress.get(download_id, {}).get('status') == 'cancelled':
                    return

                # Download completed successfully
                download_progress[download_id] = DownloadProgress()
                download_progress[download_id].status = 'completed'
                download_progress[download_id].progress = 100
                download_progress[download_id].speed = '0 MB/s'
                download_progress[download_id].eta = '00:00'

                # Add to storage history
                try:
                    # Try to find the downloaded file and get its size
                    downloaded_files = []
                    if os.path.exists(download_dir):
                        for file in os.listdir(download_dir):
                            file_path = os.path.join(download_dir, file)
                            if os.path.isfile(file_path):
                                # Check if file was created recently (within last 5 minutes)
                                file_mtime = os.path.getmtime(file_path)
                                if time.time() - file_mtime < 300:  # 5 minutes
                                    downloaded_files.append((file_path, os.path.getsize(file_path)))

                    # Add the largest/most recent file to history
                    if downloaded_files:
                        latest_file = max(downloaded_files, key=lambda x: os.path.getmtime(x[0]))
                        file_path, file_size = latest_file

                        # Extract video title from filename
                        video_title = "Downloaded Video"
                        try:
                            filename = os.path.basename(file_path)
                            video_title = os.path.splitext(filename)[0]
                        except:
                            pass

                        add_to_download_history(
                            video_url=url,
                            video_title=video_title,
                            file_path=file_path,
                            file_size=file_size,
                            storage_location=download_dir,
                            format_info=format_selector
                        )

                        # Update storage location usage
                        update_storage_location_usage(download_dir)

                except Exception as storage_error:
                    print(f"Error updating storage history: {storage_error}")

            except Exception as e:
                # Clean up process reference
                if download_id in download_processes:
                    del download_processes[download_id]

                # Check if it was cancelled
                if download_progress.get(download_id, {}).get('status') == 'cancelled':
                    return

                download_progress[download_id] = DownloadProgress()
                download_progress[download_id].status = 'error'
                download_progress[download_id].progress = 0
                download_progress[download_id].speed = '0 MB/s'
                download_progress[download_id].eta = '00:00'

                # Better error messages
                error_msg = str(e)
                if 'Failed to extract any player response' in error_msg:
                    error_msg = 'This video may be unavailable, private, or region-blocked. Please try a different video.'
                elif 'Video unavailable' in error_msg:
                    error_msg = 'This video is unavailable. It may have been deleted or made private.'

        # Initialize progress
        download_progress[download_id] = DownloadProgress()
        download_progress[download_id].status = 'starting'
        download_progress[download_id].progress = 0

        # Start download thread
        thread = threading.Thread(target=run_download)
        thread.daemon = True
        thread.start()

        return jsonify({
            'success': True,
            'download_id': download_id,
            'expected_size': expected_size,
            'expected_size_formatted': format_file_size(expected_size) if expected_size > 0 else 'Unknown',
            'storage_info': storage_info
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download-playlist', methods=['POST'])
def start_playlist_download():
    """Start playlist download"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        format_selector = data.get('format', 'best[height<=720]')
        options = data.get('options', {})
        folder = data.get('folder', '').strip()
        download_type = data.get('download_type', 'individual')  # 'individual' or 'zip'

        if not url:
            return jsonify({'error': 'URL is required'}), 400

        # Generate download ID
        download_id = str(int(time.time()))

        # Determine download directory
        if folder:
            if os.path.isabs(folder):
                download_dir = folder
            else:
                download_dir = os.path.join('..', folder)
        else:
            home_dir = os.path.expanduser('~')
            download_dir = os.path.join(home_dir, 'Downloads', 'YT-dlp')

        # Ensure download directory exists
        try:
            os.makedirs(download_dir, exist_ok=True)
        except Exception as e:
            return jsonify({'error': f'Cannot create directory: {str(e)}'}), 400

        def run_playlist_download():
            try:
                if download_type == 'zip':
                    # Download to temporary directory first, then zip
                    with tempfile.TemporaryDirectory() as temp_dir:
                        temp_output = os.path.join(temp_dir, '%(playlist)s', '%(playlist_index)s - %(title)s.%(ext)s')
                        
                        # Build yt-dlp command for temporary download
                        cmd = [
                            sys.executable, '-m', 'yt_dlp',
                            '--no-check-certificate',
                            '-f', format_selector,
                            '--output', temp_output,
                            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            '--extractor-retries', '3'
                        ]
                        
                        # Add optional flags
                        if options.get('subtitles'):
                            cmd.extend(['--write-subs', '--sub-langs', 'en'])
                        if options.get('thumbnail'):
                            cmd.append('--write-thumbnail')
                        if options.get('extract_audio'):
                            cmd.extend(['-x', '--audio-format', 'mp3'])
                        
                        cmd.append(url)
                        
                        # Update progress
                        download_progress[download_id] = {
                            'status': 'downloading',
                            'progress': 0,
                            'message': 'Downloading playlist videos...'
                        }
                        
                        # Run download
                        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd='..')
                        download_processes[download_id] = process
                        
                        stdout, stderr = process.communicate()
                        
                        if process.returncode == 0:
                            # Create ZIP file
                            download_progress[download_id] = {
                                'status': 'downloading',
                                'progress': 50,
                                'message': 'Creating ZIP archive...'
                            }
                            
                            # Get playlist name for ZIP file
                            playlist_name = "playlist"
                            try:
                                playlist_cmd = [sys.executable, '-m', 'yt_dlp', '--dump-json', '--flat-playlist', url]
                                playlist_result = subprocess.run(playlist_cmd, capture_output=True, text=True, cwd='..')
                                if playlist_result.returncode == 0:
                                    lines = playlist_result.stdout.strip().split('\n')
                                    if lines:
                                        first_entry = json.loads(lines[0])
                                        playlist_name = first_entry.get('playlist_title', 'playlist')
                            except:
                                pass
                            
                            # Clean playlist name for filename
                            safe_name = re.sub(r'[<>:"/\\|?*]', '_', playlist_name)
                            zip_filename = f"{safe_name}.zip"
                            zip_path = os.path.join(download_dir, zip_filename)
                            
                            # Create ZIP
                            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                                for root, dirs, files in os.walk(temp_dir):
                                    for file in files:
                                        file_path = os.path.join(root, file)
                                        arcname = os.path.relpath(file_path, temp_dir)
                                        zipf.write(file_path, arcname)
                            

                            download_progress[download_id] = {
                                'status': 'completed',
                                'progress': 100,
                                'message': f'Playlist downloaded and zipped as {zip_filename}'
                            }
                        else:
                            download_progress[download_id] = {
                                'status': 'error',
                                'progress': 0,
                                'message': 'Failed to download playlist'
                            }
                else:
                    # Individual files download
                    output_template = os.path.join(download_dir, '%(playlist)s', '%(playlist_index)s - %(title)s.%(ext)s')
                    
                    cmd = [
                        sys.executable, '-m', 'yt_dlp',
                        '--no-check-certificate',
                        '-f', format_selector,
                        '--output', output_template,
                        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        '--extractor-retries', '3'
                    ]
                    
                    # Add optional flags
                    if options.get('subtitles'):
                        cmd.extend(['--write-subs', '--sub-langs', 'en'])
                    if options.get('thumbnail'):
                        cmd.append('--write-thumbnail')
                    if options.get('extract_audio'):
                        cmd.extend(['-x', '--audio-format', 'mp3'])
                    
                    cmd.append(url)
                    
                    # Update progress
                    download_progress[download_id] = {
                        'status': 'downloading',
                        'progress': 0,
                        'message': 'Downloading playlist...'
                    }
                    
                    # Run download
                    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd='..')
                    download_processes[download_id] = process
                    
                    stdout, stderr = process.communicate()
                    
                    if process.returncode == 0:
                        download_progress[download_id] = {
                            'status': 'completed',
                            'progress': 100,
                            'message': 'Playlist download completed!'
                        }
                    else:
                        download_progress[download_id] = {
                            'status': 'error',
                            'progress': 0,
                            'message': f'Playlist download failed: {stderr}'
                        }

                # Clean up process reference
                if download_id in download_processes:
                    del download_processes[download_id]

            except Exception as e:
                download_progress[download_id] = {
                    'status': 'error',
                    'progress': 0,
                    'message': f'Playlist download failed: {str(e)}'
                }
                
                if download_id in download_processes:
                    del download_processes[download_id]

        # Initialize progress
        download_progress[download_id] = {
            'status': 'starting',
            'progress': 0,
            'message': 'Preparing playlist download...'
        }

        # Start download thread
        thread = threading.Thread(target=run_playlist_download)
        thread.daemon = True
        thread.start()

        return jsonify({'success': True, 'download_id': download_id})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/progress/<download_id>')
def get_progress(download_id):
    """Get download progress"""
    progress_obj = download_progress.get(download_id)

    if progress_obj is None:
        return jsonify({
            'status': 'not_found',
            'progress': 0,
            'message': 'Download not found',
            'speed': '0 MB/s',
            'size': '0 MB',
            'eta': '--:--'
        })

    # Handle DownloadProgress objects
    if isinstance(progress_obj, DownloadProgress):
        # Convert DownloadProgress object to dictionary
        progress_data = {
            'status': progress_obj.status,
            'progress': progress_obj.progress,
            'message': f'Downloading: {os.path.basename(progress_obj.filename)}' if progress_obj.filename else 'Downloading...',
            'speed': progress_obj.speed,
            'size': progress_obj.size,
            'eta': progress_obj.eta,
            'filename': progress_obj.filename
        }

        # Add storage information if available
        if progress_obj.storage_info:
            progress_data['storage_info'] = {
                'expected_size': progress_obj.expected_size,
                'expected_size_formatted': format_file_size(progress_obj.expected_size) if progress_obj.expected_size > 0 else 'Unknown',
                'remaining_space': progress_obj.remaining_space,
                'remaining_space_formatted': format_file_size(progress_obj.remaining_space) if progress_obj.remaining_space > 0 else 'Unknown',
                'free_space': progress_obj.storage_info['free_space'],
                'free_space_formatted': format_file_size(progress_obj.storage_info['free_space'])
            }
    else:
        # Already a dictionary (for playlist downloads, etc.)
        progress_data = progress_obj.copy()

        # Ensure all required fields are present
        if 'speed' not in progress_data:
            progress_data['speed'] = '0 MB/s'
        if 'size' not in progress_data:
            progress_data['size'] = '0 MB'
        if 'eta' not in progress_data:
            progress_data['eta'] = '--:--'

    return jsonify(progress_data)

@app.route('/api/stop/<download_id>', methods=['POST'])
def stop_download(download_id):
    """Stop/cancel download"""
    try:
        if download_id in download_processes:
            process_info = download_processes[download_id]

            # Mark as cancelled
            download_progress[download_id] = DownloadProgress()
            download_progress[download_id].status = 'cancelled'
            download_progress[download_id].progress = 0
            download_progress[download_id].speed = '0 MB/s'
            download_progress[download_id].eta = '00:00'

            # Set cancellation flag
            process_info['cancelled'] = True

            # Try to interrupt yt-dlp if available
            if process_info.get('ydl'):
                try:
                    # yt-dlp doesn't have a direct cancel method, but we can mark it as cancelled
                    pass
                except:
                    pass

            # Clean up
            del download_processes[download_id]

            return jsonify({'success': True, 'message': 'Download cancelled'})
        else:
            return jsonify({'error': 'Download not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/storage-info')
def get_storage_info():
    """Get storage information for download location"""
    try:
        path = request.args.get('path', '')

        if not path:
            # Get default download location
            home_dir = os.path.expanduser('~')
            path = os.path.join(home_dir, 'Downloads', 'YT-dlp')

        # Determine drive/mount point
        if os.name == 'nt':  # Windows
            drive = os.path.splitdrive(os.path.abspath(path))[0]
            if not drive:
                drive = 'C:'
        else:  # Unix-like
            drive = '/'

        usage = get_disk_usage(drive)
        if not usage:
            return jsonify({'error': 'Unable to get storage information'}), 400

        return jsonify({
            'success': True,
            'path': path,
            'drive': drive,
            'total_space': usage['total'],
            'free_space': usage['free'],
            'used_space': usage['used'],
            'total_formatted': format_file_size(usage['total']),
            'free_formatted': format_file_size(usage['free']),
            'used_formatted': format_file_size(usage['used']),
            'usage_percent': usage['percent']
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/default-folder')
def get_default_folder():
    """Get the default download folder"""
    try:
        home_dir = os.path.expanduser('~')
        default_folder = os.path.join(home_dir, 'Downloads', 'YT-dlp')

        # Get storage info for the default folder
        storage_info = None
        try:
            if os.name == 'nt':  # Windows
                drive = os.path.splitdrive(home_dir)[0]
                if not drive:
                    drive = 'C:'
            else:  # Unix-like
                drive = '/'

            usage = get_disk_usage(drive)
            if usage:
                storage_info = {
                    'total_space': usage['total'],
                    'free_space': usage['free'],
                    'used_space': usage['used'],
                    'total_formatted': format_file_size(usage['total']),
                    'free_formatted': format_file_size(usage['free']),
                    'used_formatted': format_file_size(usage['used']),
                    'usage_percent': usage['percent']
                }
        except Exception as e:
            print(f"Error getting storage info for default folder: {e}")

        return jsonify({
            'success': True,
            'folder': default_folder,
            'display': f'Default: {os.path.basename(default_folder)}',
            'storage_info': storage_info
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/browse-folder', methods=['POST'])
def browse_folder():
    """Browse folders for folder selection"""
    try:
        data = request.get_json()
        path = data.get('path', '')

        if not path:
            # Return drives/root directories
            if os.name == 'nt':  # Windows
                import string
                drives = []
                for letter in string.ascii_uppercase:
                    drive_path = f"{letter}:\\"
                    if os.path.exists(drive_path):
                        try:
                            usage = get_disk_usage(drive_path)
                            drives.append({
                                'name': f"{letter}: Drive",
                                'path': drive_path,
                                'type': 'drive',
                                'size': format_file_size(usage['total']) if usage else 'Unknown',
                                'free': format_file_size(usage['free']) if usage else 'Unknown'
                            })
                        except:
                            drives.append({
                                'name': f"{letter}: Drive",
                                'path': drive_path,
                                'type': 'drive',
                                'size': 'Unknown',
                                'free': 'Unknown'
                            })
                return jsonify({'success': True, 'items': drives, 'current_path': ''})
            else:  # Unix-like
                try:
                    items = []
                    for item in sorted(os.listdir('/')):
                        item_path = os.path.join('/', item)
                        if os.path.isdir(item_path):
                            items.append({
                                'name': item,
                                'path': item_path,
                                'type': 'folder'
                            })
                    return jsonify({'success': True, 'items': items, 'current_path': '/'})
                except:
                    return jsonify({'success': True, 'items': [], 'current_path': '/'})

        # Browse specific path
        if not os.path.exists(path) or not os.path.isdir(path):
            return jsonify({'error': 'Path does not exist or is not a directory'}), 400

        items = []
        try:
            for item in sorted(os.listdir(path)):
                item_path = os.path.join(path, item)
                if os.path.isdir(item_path):
                    items.append({
                        'name': item,
                        'path': item_path,
                        'type': 'folder'
                    })
        except PermissionError:
            return jsonify({'error': 'Permission denied'}), 403
        except Exception as e:
            return jsonify({'error': str(e)}), 500

        return jsonify({
            'success': True,
            'items': items,
            'current_path': path,
            'parent_path': os.path.dirname(path) if path != os.path.dirname(path) else None
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/create-folder', methods=['POST'])
def create_folder():
    """Create a new folder"""
    try:
        data = request.get_json()
        parent_path = data.get('parent_path', '')
        folder_name = data.get('folder_name', '').strip()

        if not parent_path or not folder_name:
            return jsonify({'error': 'Parent path and folder name are required'}), 400

        # Validate folder name
        invalid_chars = '<>:"/\\|?*'
        if any(char in folder_name for char in invalid_chars):
            return jsonify({'error': 'Folder name contains invalid characters'}), 400

        new_folder_path = os.path.join(parent_path, folder_name)

        if os.path.exists(new_folder_path):
            return jsonify({'error': 'Folder already exists'}), 400

        try:
            os.makedirs(new_folder_path, exist_ok=True)
            return jsonify({
                'success': True,
                'folder_path': new_folder_path,
                'message': f'Folder "{folder_name}" created successfully'
            })
        except PermissionError:
            return jsonify({'error': 'Permission denied'}), 403
        except Exception as e:
            return jsonify({'error': f'Failed to create folder: {str(e)}'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/validate-path', methods=['POST'])
def validate_path():
    """Validate if a path exists and is writable"""
    try:
        data = request.get_json()
        path = data.get('path', '').strip()

        if not path:
            return jsonify({'error': 'Path is required'}), 400

        # Check if path is absolute
        if not os.path.isabs(path):
            # Make it relative to parent directory
            path = os.path.join('..', path)

        # Check if path exists
        path_exists = os.path.exists(path)
        is_directory = os.path.isdir(path) if path_exists else False

        # Try to create the directory if it doesn't exist
        writable = False
        if not path_exists:
            try:
                os.makedirs(path, exist_ok=True)
                path_exists = True
                is_directory = True
                writable = True
            except:
                pass

        # Test write permission
        if path_exists and is_directory and not writable:
            try:
                test_file = os.path.join(path, 'test_write.tmp')
                with open(test_file, 'w') as f:
                    f.write('test')
                os.remove(test_file)
                writable = True
            except:
                pass

        # Get storage info
        storage_info = None
        if path_exists and is_directory:
            try:
                if os.name == 'nt':  # Windows
                    drive = os.path.splitdrive(os.path.abspath(path))[0]
                    if not drive:
                        drive = 'C:'
                else:  # Unix-like
                    drive = '/'

                usage = get_disk_usage(drive)
                if usage:
                    storage_info = {
                        'total_space': usage['total'],
                        'free_space': usage['free'],
                        'used_space': usage['used'],
                        'total_formatted': format_file_size(usage['total']),
                        'free_formatted': format_file_size(usage['free']),
                        'used_formatted': format_file_size(usage['used']),
                        'usage_percent': usage['percent']
                    }
            except Exception as e:
                print(f"Error getting storage info: {e}")

        return jsonify({
            'success': True,
            'path': path,
            'exists': path_exists,
            'is_directory': is_directory,
            'writable': writable,
            'storage_info': storage_info
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stream-download', methods=['POST'])
def stream_download():
    """Stream download for browser download"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        format_selector = data.get('format', 'best[height<=720]')
        options = data.get('options', {})

        if not url:
            return jsonify({'error': 'URL is required'}), 400

        # Get video info first
        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--no-check-certificate',
            '--dump-json',
            '--no-download',
            '--format', format_selector,
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            '--extractor-retries', '3',
            url
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, cwd='..')

        if result.returncode != 0:
            return jsonify({'error': 'Failed to get video information'}), 400

        try:
            video_info = json.loads(result.stdout)
        except json.JSONDecodeError:
            return jsonify({'error': 'Failed to parse video information'}), 400

        # Get the direct video URL
        video_url = video_info.get('url')
        title = video_info.get('title', 'video')
        ext = video_info.get('ext', 'mp4')

        if not video_url:
            return jsonify({'error': 'Could not get direct video URL'}), 400

        # Clean title for filename
        safe_title = re.sub(r'[<>:"/\\|?*]', '_', title)
        filename = f"{safe_title}.{ext}"

        return jsonify({
            'success': True,
            'download_url': video_url,
            'filename': filename,
            'title': title,
            'size': video_info.get('filesize') or video_info.get('filesize_approx', 0)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stream-playlist-download', methods=['POST'])
def stream_playlist_download():
    """Stream playlist download for browser download"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        format_selector = data.get('format', 'best[height<=720]')
        options = data.get('options', {})

        if not url:
            return jsonify({'error': 'URL is required'}), 400

        # Get playlist info first
        playlist_cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--no-check-certificate',
            '--dump-json',
            '--no-download',
            '--flat-playlist',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            '--extractor-retries', '3',
            url
        ]

        playlist_result = subprocess.run(playlist_cmd, capture_output=True, text=True, cwd='..')

        if playlist_result.returncode != 0:
            return jsonify({'error': 'Failed to get playlist information'}), 400

        try:
            lines = [line.strip() for line in playlist_result.stdout.strip().split('\n') if line.strip()]
            video_count = len(lines)
            
            if video_count == 0:
                return jsonify({'error': 'No videos found in playlist'}), 400

            # Get playlist title
            playlist_title = "playlist"
            try:
                first_entry = json.loads(lines[0]) if lines else {}
                playlist_title = first_entry.get('playlist_title', 'playlist')
            except:
                pass

            # Clean playlist name for filename
            safe_title = re.sub(r'[<>:"/\\|?*]', '_', playlist_title)
            
            return jsonify({
                'success': True,
                'message': f'Playlist "{playlist_title}" contains {video_count} videos. Browser download is not recommended for playlists. Please use the server download option for better performance.',
                'video_count': video_count,
                'playlist_title': playlist_title,
                'recommend_server_download': True
            })

        except Exception as e:
            return jsonify({'error': f'Failed to parse playlist information: {str(e)}'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting YouTube Downloader Pro Server...")
    print("Access the interface at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
