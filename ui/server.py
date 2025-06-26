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
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import re

# Add parent directory to path to import yt_dlp
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__, static_folder='.', template_folder='.')
CORS(app)

# Global variables for download progress
download_progress = {}
active_downloads = {}

class DownloadProgress:
    def __init__(self):
        self.progress = 0
        self.status = "waiting"
        self.speed = "0 MB/s"
        self.size = "0 MB"
        self.eta = "00:00"
        self.filename = ""

def progress_hook(d):
    """Progress hook for yt-dlp"""
    download_id = d.get('info_dict', {}).get('id', 'unknown')

    if download_id not in download_progress:
        download_progress[download_id] = DownloadProgress()

    progress = download_progress[download_id]

    if d['status'] == 'downloading':
        progress.status = "downloading"
        progress.filename = d.get('filename', '')

        # Calculate progress percentage
        if 'total_bytes' in d:
            progress.progress = (d['downloaded_bytes'] / d['total_bytes']) * 100
        elif 'total_bytes_estimate' in d:
            progress.progress = (d['downloaded_bytes'] / d['total_bytes_estimate']) * 100

        # Format speed
        speed = d.get('speed', 0)
        if speed:
            if speed > 1024 * 1024:
                progress.speed = f"{speed / (1024 * 1024):.1f} MB/s"
            else:
                progress.speed = f"{speed / 1024:.1f} KB/s"

        # Format ETA
        eta = d.get('eta', 0)
        if eta:
            minutes = eta // 60
            seconds = eta % 60
            progress.eta = f"{minutes:02d}:{seconds:02d}"

        # Format size
        downloaded = d.get('downloaded_bytes', 0)
        total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
        if total:
            progress.size = f"{downloaded / (1024*1024):.1f} / {total / (1024*1024):.1f} MB"

    elif d['status'] == 'finished':
        progress.status = "finished"
        progress.progress = 100
        progress.filename = d.get('filename', '')

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

        # Use yt-dlp to extract video info
        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--no-check-certificate',
            '--dump-json',
            '--no-download',
            url
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, cwd='..')

        if result.returncode != 0:
            return jsonify({'error': 'Failed to analyze video'}), 400

        # Parse the JSON output
        video_info = json.loads(result.stdout)

        # Extract relevant information
        info = {
            'title': video_info.get('title', 'Unknown Title'),
            'channel': video_info.get('uploader', 'Unknown Channel'),
            'duration': format_duration(video_info.get('duration', 0)),
            'view_count': format_number(video_info.get('view_count', 0)),
            'upload_date': format_date(video_info.get('upload_date', '')),
            'thumbnail': video_info.get('thumbnail', ''),
            'formats': extract_formats(video_info.get('formats', []))
        }

        return jsonify({'success': True, 'info': info})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download', methods=['POST'])
def start_download():
    """Start video download"""
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

        # Build yt-dlp command
        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--no-check-certificate',
            '-f', format_selector,
            '--output', output_template
        ]

        # Add optional flags
        if options.get('subtitles'):
            cmd.extend(['--write-subs', '--sub-langs', 'en'])

        if options.get('thumbnail'):
            cmd.append('--write-thumbnail')

        if options.get('extract_audio'):
            cmd.extend(['-x', '--audio-format', 'mp3'])

        cmd.append(url)

        # Start download in background thread
        def run_download():
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, cwd='..')
                if result.returncode == 0:
                    download_progress[download_id] = {
                        'status': 'completed',
                        'progress': 100,
                        'message': 'Download completed successfully!'
                    }
                else:
                    download_progress[download_id] = {
                        'status': 'error',
                        'progress': 0,
                        'message': f'Download failed: {result.stderr}'
                    }
            except Exception as e:
                download_progress[download_id] = {
                    'status': 'error',
                    'progress': 0,
                    'message': f'Download failed: {str(e)}'
                }

        # Initialize progress
        download_progress[download_id] = {
            'status': 'starting',
            'progress': 0,
            'message': 'Preparing download...'
        }

        # Start download thread
        thread = threading.Thread(target=run_download)
        thread.daemon = True
        thread.start()

        return jsonify({'success': True, 'download_id': download_id})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/progress/<download_id>')
def get_progress(download_id):
    """Get download progress"""
    progress = download_progress.get(download_id, {
        'status': 'not_found',
        'progress': 0,
        'message': 'Download not found'
    })
    return jsonify(progress)

@app.route('/api/default-folder', methods=['GET'])
def get_default_folder():
    """Get the default download folder path"""
    try:
        home_dir = os.path.expanduser('~')
        default_folder = os.path.join(home_dir, 'Downloads', 'YT-dlp')
        return jsonify({'success': True, 'folder': default_folder})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/open-folder', methods=['POST'])
def open_folder():
    """Open the download folder in file explorer"""
    try:
        data = request.get_json()
        folder = data.get('folder', '').strip()

        # Determine the folder path
        if folder:
            if os.path.isabs(folder):
                folder_path = folder
            else:
                folder_path = os.path.join('..', folder)
        else:
            # Use default Downloads/YT-dlp directory
            home_dir = os.path.expanduser('~')
            folder_path = os.path.join(home_dir, 'Downloads', 'YT-dlp')

        # Convert to absolute path
        folder_path = os.path.abspath(folder_path)

        # Check if folder exists
        if not os.path.exists(folder_path):
            return jsonify({'error': 'Folder does not exist'}), 400

        # Open folder based on OS
        import platform
        system = platform.system()

        try:
            if system == 'Windows':
                os.startfile(folder_path)
            elif system == 'Darwin':  # macOS
                subprocess.run(['open', folder_path])
            else:  # Linux and others
                subprocess.run(['xdg-open', folder_path])

            return jsonify({'success': True, 'message': f'Opened folder: {folder_path}'})

        except Exception as e:
            return jsonify({'error': f'Could not open folder: {str(e)}'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/formats', methods=['POST'])
def get_formats():
    """Get available formats for a video"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()

        if not url:
            return jsonify({'error': 'URL is required'}), 400

        cmd = [
            sys.executable, '-m', 'yt_dlp',
            '--no-check-certificate',
            '--list-formats',
            '--dump-json',
            url
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, cwd='..')

        if result.returncode != 0:
            return jsonify({'error': 'Failed to get formats'}), 400

        # Parse formats from output
        formats = parse_formats_output(result.stdout)

        return jsonify({'success': True, 'formats': formats})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/folders', methods=['POST'])
def list_folders():
    """List folders in a directory for folder browser"""
    try:
        data = request.get_json()
        path = data.get('path', '').strip()

        # If no path provided, start from user's home directory
        if not path:
            path = os.path.expanduser('~')

        # Convert to absolute path and normalize
        path = os.path.abspath(path)

        # Security check - ensure path exists and is a directory
        if not os.path.exists(path) or not os.path.isdir(path):
            return jsonify({'error': 'Directory does not exist'}), 400

        folders = []
        files = []

        try:
            # Get directory contents
            for item in os.listdir(path):
                item_path = os.path.join(path, item)

                # Skip hidden files/folders on Windows and Unix
                if item.startswith('.'):
                    continue

                if os.path.isdir(item_path):
                    folders.append({
                        'name': item,
                        'path': item_path,
                        'type': 'folder'
                    })
                else:
                    files.append({
                        'name': item,
                        'path': item_path,
                        'type': 'file'
                    })

        except PermissionError:
            return jsonify({'error': 'Permission denied to access this directory'}), 403

        # Sort folders and files alphabetically
        folders.sort(key=lambda x: x['name'].lower())
        files.sort(key=lambda x: x['name'].lower())

        # Get parent directory
        parent_path = os.path.dirname(path) if path != os.path.dirname(path) else None

        # Get common folders for quick access
        common_folders = []
        try:
            home_dir = os.path.expanduser('~')
            common_folders = [
                {'name': 'Home', 'path': home_dir},
                {'name': 'Desktop', 'path': os.path.join(home_dir, 'Desktop')},
                {'name': 'Downloads', 'path': os.path.join(home_dir, 'Downloads')},
                {'name': 'Documents', 'path': os.path.join(home_dir, 'Documents')},
                {'name': 'Videos', 'path': os.path.join(home_dir, 'Videos')},
            ]
            # Filter out folders that don't exist
            common_folders = [f for f in common_folders if os.path.exists(f['path'])]
        except:
            pass

        return jsonify({
            'success': True,
            'current_path': path,
            'parent_path': parent_path,
            'folders': folders,
            'files': files[:10],  # Limit files shown for performance
            'common_folders': common_folders
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/create-folder', methods=['POST'])
def create_folder():
    """Create a new folder"""
    try:
        data = request.get_json()
        parent_path = data.get('parent_path', '').strip()
        folder_name = data.get('folder_name', '').strip()

        if not parent_path or not folder_name:
            return jsonify({'error': 'Parent path and folder name are required'}), 400

        # Validate folder name
        if not folder_name or '/' in folder_name or '\\' in folder_name or folder_name in ['.', '..']:
            return jsonify({'error': 'Invalid folder name'}), 400

        # Create the full path
        new_folder_path = os.path.join(parent_path, folder_name)

        # Check if folder already exists
        if os.path.exists(new_folder_path):
            return jsonify({'error': 'Folder already exists'}), 400

        # Create the folder
        os.makedirs(new_folder_path, exist_ok=True)

        return jsonify({
            'success': True,
            'message': f'Folder "{folder_name}" created successfully',
            'folder_path': new_folder_path
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def format_duration(seconds):
    """Format duration in seconds to MM:SS or HH:MM:SS"""
    if not seconds:
        return "0:00"

    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    seconds = seconds % 60

    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes}:{seconds:02d}"

def format_number(num):
    """Format large numbers with commas"""
    if not num:
        return "0"
    return f"{num:,}"

def format_date(date_str):
    """Format upload date"""
    if not date_str or len(date_str) < 8:
        return "Unknown date"

    try:
        year = date_str[:4]
        month = date_str[4:6]
        day = date_str[6:8]
        return f"{month}/{day}/{year}"
    except:
        return "Unknown date"

def extract_formats(formats):
    """Extract and organize available formats"""
    video_formats = []
    audio_formats = []

    for fmt in formats:
        if fmt.get('vcodec') != 'none' and fmt.get('acodec') != 'none':
            # Combined format
            video_formats.append({
                'format_id': fmt.get('format_id'),
                'ext': fmt.get('ext'),
                'resolution': fmt.get('resolution', 'unknown'),
                'filesize': fmt.get('filesize', 0),
                'type': 'video+audio'
            })
        elif fmt.get('vcodec') != 'none':
            # Video only
            video_formats.append({
                'format_id': fmt.get('format_id'),
                'ext': fmt.get('ext'),
                'resolution': fmt.get('resolution', 'unknown'),
                'filesize': fmt.get('filesize', 0),
                'type': 'video'
            })
        elif fmt.get('acodec') != 'none':
            # Audio only
            audio_formats.append({
                'format_id': fmt.get('format_id'),
                'ext': fmt.get('ext'),
                'abr': fmt.get('abr', 0),
                'filesize': fmt.get('filesize', 0),
                'type': 'audio'
            })

    return {
        'video': video_formats[:10],  # Limit to top 10
        'audio': audio_formats[:5]    # Limit to top 5
    }

def parse_formats_output(output):
    """Parse yt-dlp formats output"""
    # This is a simplified parser - in production you'd want more robust parsing
    formats = []
    lines = output.split('\n')

    for line in lines:
        if line.strip() and not line.startswith('[') and '│' in line:
            parts = line.split('│')
            if len(parts) >= 3:
                format_info = parts[0].strip().split()
                if len(format_info) >= 2:
                    formats.append({
                        'format_id': format_info[0],
                        'ext': format_info[1],
                        'description': line.strip()
                    })

    return formats

if __name__ == '__main__':
    print("🚀 Starting YouTube Downloader Pro Server...")
    print("📱 Open your browser and go to: http://localhost:5000")
    print("🎬 Ready to download videos!")
    print()

    app.run(debug=True, host='0.0.0.0', port=5000)
