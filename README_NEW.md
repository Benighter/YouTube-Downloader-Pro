<div align="center">

# 🎬 YouTube Downloader Pro

### *Professional Video Downloader with Modern Web Interface*

[![GitHub Stars](https://img.shields.io/github/stars/Benighter/YouTube-Downloader-Pro?style=for-the-badge&logo=github&color=blue)](https://github.com/Benighter/YouTube-Downloader-Pro)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg?style=for-the-badge&logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-2.0+-red.svg?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg?style=for-the-badge)](https://github.com/Benighter/YouTube-Downloader-Pro)

**Created by [Bennet Nkolele](https://github.com/Benighter)**  
*Professional Software Developer & Tech Innovator*

---

### 🌟 **A Modern, User-Friendly Video Downloader**

YouTube Downloader Pro is a sophisticated web-based video downloading application that combines the power of yt-dlp with an intuitive, professional user interface. Built with modern web technologies and designed for both casual users and power users alike.

</div>

---

## 📋 **Table of Contents**

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [💻 Installation](#-installation)
- [🎯 Usage Guide](#-usage-guide)
- [🛠️ Technical Details](#️-technical-details)
- [🤝 Contributing](#-contributing)
- [🙏 Acknowledgments](#-acknowledgments)
- [📄 License](#-license)
- [👨‍💻 About the Creator](#-about-the-creator)

---

## ✨ **Features**

### 🎨 **Modern User Interface**
- **Clean, Professional Design** - Neutral color scheme with intuitive navigation
- **Responsive Layout** - Works perfectly on desktop, tablet, and mobile devices
- **Real-time Progress Tracking** - Live download progress with speed and ETA
- **Interactive Folder Browser** - Visual folder selection with breadcrumb navigation

### 🔧 **Powerful Functionality**
- **Multi-Platform Support** - YouTube, Vimeo, TikTok, Instagram, Twitter, and 1000+ sites
- **Format Selection** - Choose from available video/audio qualities and formats
- **Batch Downloads** - Queue multiple videos for sequential downloading
- **Custom Download Locations** - Choose and remember your preferred download folders

### 🚀 **Advanced Features**
- **Video Analysis** - Preview thumbnails, titles, duration, and metadata
- **Progress Monitoring** - Real-time download speed, file size, and completion status
- **Error Handling** - Comprehensive error reporting and recovery suggestions
- **Cross-Platform** - Runs on Windows, macOS, and Linux

### 🎯 **User Experience**
- **One-Click Downloads** - Simply paste URL and click download
- **Smart Suggestions** - Quick access to popular platforms
- **Folder Management** - Create new folders and organize downloads
- **Download History** - Track your download activity and results

---

## 🚀 **Quick Start**

### **Method 1: Direct Launch (Recommended)**
```bash
# Clone the repository
git clone https://github.com/Benighter/YouTube-Downloader-Pro.git
cd YouTube-Downloader-Pro

# Install dependencies
pip install -r requirements.txt

# Launch the application
python ui/server.py
```

### **Method 2: Using Batch Files (Windows)**
```bash
# Double-click launch_ui.bat or run:
launch_ui.bat
```

### **Method 3: Using Shell Scripts (macOS/Linux)**
```bash
# Make executable and run:
chmod +x yt-dlp.sh
./yt-dlp.sh
```

**🌐 Open your browser and navigate to:** `http://localhost:5000`

---

## 💻 **Installation**

### **Prerequisites**
- **Python 3.8+** - [Download Python](https://python.org/downloads/)
- **pip** - Python package installer (included with Python)
- **Git** - [Download Git](https://git-scm.com/downloads) (optional, for cloning)

### **Step-by-Step Installation**

#### **1. Clone or Download**
```bash
# Option A: Clone with Git
git clone https://github.com/Benighter/YouTube-Downloader-Pro.git
cd YouTube-Downloader-Pro

# Option B: Download ZIP
# Download from GitHub and extract to your desired location
```

#### **2. Install Dependencies**
```bash
# Install required Python packages
pip install flask yt-dlp requests

# Or install from requirements file (if available)
pip install -r requirements.txt
```

#### **3. Launch Application**
```bash
# Start the Flask server
python ui/server.py

# Alternative: Use provided launchers
# Windows: launch_ui.bat
# macOS/Linux: ./yt-dlp.sh
```

#### **4. Access Web Interface**
- Open your web browser
- Navigate to `http://localhost:5000`
- Start downloading videos!

### **System Requirements**
- **Operating System:** Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **RAM:** 2GB minimum, 4GB recommended
- **Storage:** 100MB for application, additional space for downloads
- **Network:** Internet connection required for downloading

---

## 🎯 **Usage Guide**

### **Basic Usage**

#### **Single Video Download**
1. **Launch the Application** - Run `python ui/server.py`
2. **Open Web Interface** - Go to `http://localhost:5000`
3. **Paste Video URL** - Enter the URL of the video you want to download
4. **Click Analyze** - The app will fetch video information and available formats
5. **Choose Format** - Select your preferred video quality and format
6. **Select Folder** - Choose where to save the downloaded file
7. **Start Download** - Click download and monitor progress in real-time

#### **Playlist Download** 🆕
1. **Paste Playlist URL** - Enter a YouTube playlist URL or any supported playlist link
2. **Click Analyze** - The app will detect it's a playlist and show playlist information
3. **Choose Download Type**:
   - **Individual Files** - Downloads each video as separate files in organized folders
   - **ZIP Archive** - Downloads all videos and compresses them into a single ZIP file
4. **Select Quality** - Choose your preferred video quality for all videos in the playlist
5. **Select Folder** - Choose where to save the downloaded files/ZIP
6. **Start Download** - Monitor progress as each video downloads

### **Advanced Features**

#### **📁 Folder Management**
- **Visual Folder Browser** - Navigate through your file system with an intuitive interface
- **Create New Folders** - Organize your downloads by creating custom folders
- **Remember Preferences** - The app remembers your last selected download location
- **Quick Access** - Shortcuts to common folders (Downloads, Documents, Desktop, Videos)

#### **🎬 Video Analysis**
- **Thumbnail Preview** - See video thumbnails before downloading
- **Metadata Display** - View title, duration, uploader, and view count
- **Format Selection** - Choose from all available video and audio qualities
- **File Size Information** - Know the download size before starting
- **Playlist Detection** 🆕 - Automatically detects and displays playlist information
- **Video Count Display** 🆕 - Shows total number of videos in playlists

#### **📦 Playlist Downloads** 🆕
- **Individual File Downloads** - Each video saved as separate file in organized folders
- **ZIP Archive Creation** - All playlist videos compressed into single ZIP file
- **Smart Organization** - Playlist videos organized by playlist name and numbered
- **Flexible Format Selection** - Apply same quality settings to all playlist videos
- **Progress Tracking** - Monitor download progress across entire playlist

#### **📊 Progress Monitoring & Control** 🆕
- **Real-time Progress** - Live progress bar with percentage completion
- **Download Speed** - Current download speed in MB/s
- **ETA Calculation** - Estimated time remaining for completion
- **File Size Tracking** - Current downloaded size vs. total file size
- **Storage Size Preview** 🆕 - See exact file sizes before downloading
- **Playlist Size Estimation** 🆕 - Total storage space needed for entire playlists
- **Pause/Resume Downloads** 🆕 - Pause and resume active downloads
- **Stop/Cancel Downloads** 🆕 - Cancel downloads with confirmation dialog

### **Supported Platforms**
- **YouTube** - All video types, playlists, and live streams
- **Vimeo** - Public and private videos (with access)
- **TikTok** - Individual videos and user profiles
- **Instagram** - Posts, stories, and IGTV
- **Twitter** - Video tweets and embedded content
- **Facebook** - Public videos and posts
- **And 1000+ more sites** - Powered by yt-dlp's extensive extractor library

---

## 🛠️ **Technical Details**

### **Architecture**
- **Backend:** Flask web server with Python 3.8+
- **Frontend:** Modern HTML5, CSS3, and vanilla JavaScript
- **Core Engine:** yt-dlp for video extraction and downloading
- **UI Framework:** Responsive design with CSS Grid and Flexbox
- **File Management:** Server-side folder browsing and creation

### **Project Structure**
```
YouTube-Downloader-Pro/
├── ui/                          # Web interface files
│   ├── server.py               # Flask backend server
│   ├── index.html              # Main web interface
│   ├── style.css               # Modern styling
│   ├── script.js               # Frontend functionality
│   └── README.md               # UI documentation
├── yt_dlp/                     # Core yt-dlp library
├── launch_ui.bat               # Windows launcher
├── launch_ui.py                # Python launcher
├── yt-dlp.sh                   # Unix/Linux launcher
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

### **API Endpoints**
- `GET /` - Main web interface
- `POST /api/analyze` - Video/Playlist URL analysis with size estimation 🆕
- `POST /api/download` - Start single video download
- `POST /api/download-playlist` - Start playlist download 🆕
- `GET /api/progress/<task_id>` - Download progress tracking
- `POST /api/pause/<task_id>` - Pause active download 🆕
- `POST /api/resume/<task_id>` - Resume paused download 🆕
- `POST /api/stop/<task_id>` - Stop/cancel active download 🆕
- `GET /api/folders` - Browse filesystem
- `POST /api/create-folder` - Create new folder
- `POST /api/open-folder` - Open download folder in file explorer

### **Configuration**
The application can be configured through environment variables:
- `PORT` - Server port (default: 5000)
- `HOST` - Server host (default: 0.0.0.0)
- `DEBUG` - Debug mode (default: True)

---

## 🤝 **Contributing**

We welcome contributions from the community! Here's how you can help:

### **Ways to Contribute**
- 🐛 **Report Bugs** - Found an issue? Let us know!
- 💡 **Suggest Features** - Have ideas for improvements?
- 🔧 **Submit Code** - Fix bugs or add new features
- 📖 **Improve Documentation** - Help make our docs better
- 🎨 **Design Improvements** - Enhance the user interface

### **Development Setup**
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/Benighter/YouTube-Downloader-Pro.git
cd YouTube-Downloader-Pro

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -r requirements.txt

# Make your changes and test
python ui/server.py

# Submit a pull request
```

### **Code Style**
- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comments for complex logic
- Test your changes thoroughly

---

## 🙏 **Acknowledgments**

This project stands on the shoulders of giants. We extend our deepest gratitude to:

### **🎯 Core Technology Providers**

#### **yt-dlp Team**
- **Primary Tribute:** The incredible [yt-dlp project](https://github.com/yt-dlp/yt-dlp) and its dedicated team of developers
- **What they provide:** The powerful core engine that makes video downloading possible from 1000+ websites
- **Why they're essential:** Without yt-dlp, this project wouldn't exist. Their continuous work on extractors, bug fixes, and new site support is the foundation of our application
- **Recognition:** All video downloading capabilities are powered by their exceptional work

#### **youtube-dl Legacy**
- **Historical Foundation:** The original [youtube-dl project](https://github.com/ytdl-org/youtube-dl) by Ricardo Garcia and contributors
- **Legacy Impact:** Pioneered the concept of universal video downloading
- **Continued Influence:** Many concepts and approaches originated from this groundbreaking project

#### **Flask Framework**
- **Web Framework:** [Flask](https://flask.palletsprojects.com/) by Armin Ronacher and the Pallets team
- **Contribution:** Provides the lightweight, flexible web framework that powers our user interface
- **Why it matters:** Enables the seamless web-based experience that makes video downloading accessible to everyone

### **🌟 Open Source Community**
- **Python Community:** For creating and maintaining the incredible Python ecosystem
- **Web Standards:** W3C and browser vendors for modern web technologies
- **GitHub:** For providing the platform that enables open source collaboration
- **Stack Overflow:** For the countless solutions and community support

### **💡 Inspiration and Resources**
- **UI/UX Inspiration:** Modern web design principles and accessibility guidelines
- **Icon Libraries:** Font Awesome and other icon providers
- **Color Schemes:** Professional design systems and accessibility standards
- **Documentation:** Best practices from leading open source projects

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **License Summary**
- ✅ **Commercial Use** - Use in commercial projects
- ✅ **Modification** - Modify and adapt the code
- ✅ **Distribution** - Share and distribute freely
- ✅ **Private Use** - Use for personal projects
- ❗ **Attribution Required** - Credit the original creator

### **Third-Party Licenses**
- **yt-dlp:** Licensed under The Unlicense
- **Flask:** Licensed under BSD-3-Clause License
- **Other dependencies:** Various open source licenses (see individual packages)

---

## 👨‍💻 **About the Creator**

### **Bennet Nkolele** - *Creator & Lead Developer*

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-Benighter-blue?style=for-the-badge&logo=github)](https://github.com/Benighter)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Bennet%20Nkolele-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/bennet-nkolele)
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit%20Site-green?style=for-the-badge&logo=react)](https://react-personal-portfolio-alpha.vercel.app/)

</div>

**Professional Software Developer** with expertise in:
- **Full-Stack Development** - Python, JavaScript, React, Flask, Node.js
- **Web Technologies** - Modern HTML5, CSS3, responsive design
- **UI/UX Design** - User-centered design principles and accessibility
- **Open Source** - Contributing to and maintaining open source projects
- **Problem Solving** - Creating elegant solutions to complex challenges

### **🚀 Project Vision**
*"Making video downloading accessible to everyone through beautiful, intuitive design while respecting the incredible work of the open source community."*

### **🎯 Why This Project?**
YouTube Downloader Pro was created to bridge the gap between powerful command-line tools and user-friendly interfaces. While yt-dlp provides incredible functionality, many users need a more accessible way to download videos. This project combines the best of both worlds - the power of yt-dlp with a modern, professional web interface.

### **🌟 Other Projects**
- **Personal Portfolio** - [React-based portfolio website](https://react-personal-portfolio-alpha.vercel.app/)
- **Open Source Contributions** - Various projects on [GitHub](https://github.com/Benighter)
- **Professional Work** - Enterprise applications and web solutions

### **📞 Connect & Collaborate**
- **GitHub:** [@Benighter](https://github.com/Benighter) - Follow for more projects
- **LinkedIn:** [Bennet Nkolele](https://www.linkedin.com/in/bennet-nkolele) - Professional networking
- **Portfolio:** [Visit Website](https://react-personal-portfolio-alpha.vercel.app/) - See more work

---

<div align="center">

### **⭐ If you find this project useful, please give it a star! ⭐**

**Made with ❤️ by [Bennet Nkolele](https://github.com/Benighter)**

*Powered by the amazing [yt-dlp](https://github.com/yt-dlp/yt-dlp) project*

---

**© 2025 Bennet Nkolele. Licensed under MIT License.**

</div>
