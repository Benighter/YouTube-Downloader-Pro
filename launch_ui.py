#!/usr/bin/env python3
"""
YouTube Downloader Pro - UI Launcher
Launch the web UI with automatic browser opening
"""

import os
import sys
import time
import webbrowser
import subprocess
from threading import Timer

def print_banner():
    print("=" * 50)
    print("    YouTube Downloader Pro - UI Launcher")
    print("=" * 50)
    print()

def open_browser():
    """Open browser after a short delay"""
    time.sleep(2)  # Wait for server to start
    try:
        webbrowser.open('http://localhost:5000')
        print("🌐 Browser opened automatically!")
    except Exception as e:
        print(f"⚠️  Could not open browser automatically: {e}")
        print("📱 Please open your browser and go to: http://localhost:5000")

def check_dependencies():
    """Check if required dependencies are available"""
    try:
        import flask
        print("✅ Flask is available")
    except ImportError:
        print("❌ Flask is not installed. Installing...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'flask', 'flask-cors'])
        print("✅ Flask installed successfully")

def main():
    print_banner()
    
    print("🔍 Checking dependencies...")
    check_dependencies()
    
    print("🚀 Starting YouTube Downloader Pro...")
    print("📱 Server will start at: http://localhost:5000")
    print("🎬 Ready to download videos with beautiful UI!")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    print()
    
    # Start browser opening timer
    Timer(2.0, open_browser).start()
    
    # Change to UI directory and start server
    ui_dir = os.path.join(os.path.dirname(__file__), 'ui')
    os.chdir(ui_dir)
    
    try:
        # Import and run the server
        from server import app
        app.run(debug=False, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print("\n💡 Try running manually:")
        print("   cd ui")
        print("   python server.py")
    
    print("\n👋 Thanks for using YouTube Downloader Pro!")

if __name__ == '__main__':
    main()
