// YouTube Downloader Pro - JavaScript
class YouTubeDownloader {
    constructor() {
        this.selectedFormat = 'best[height<=720]';
        this.selectedType = 'video';
        this.currentUrl = '';
        this.isDownloading = false;
        this.selectedFolder = '';

        // Folder browser properties
        this.currentPath = '';
        this.selectedFolderForModal = '';
        this.folderHistory = [];

        this.initializeElements();
        this.bindEvents();
        this.loadSavedFolder();
        this.setDefaultFolder();
    }

    initializeElements() {
        // Get DOM elements
        this.elements = {
            videoUrl: document.getElementById('videoUrl'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            videoInfo: document.getElementById('videoInfo'),
            downloadOptions: document.getElementById('downloadOptions'),
            progressSection: document.getElementById('progressSection'),
            resultsSection: document.getElementById('resultsSection'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            
            // Video info elements
            thumbnail: document.getElementById('thumbnail'),
            videoTitle: document.getElementById('videoTitle'),
            videoChannel: document.getElementById('videoChannel'),
            videoViews: document.getElementById('videoViews'),
            videoDate: document.getElementById('videoDate'),
            videoSize: document.getElementById('videoSize'),
            duration: document.getElementById('duration'),

            // Playlist info elements
            playlistInfo: document.getElementById('playlistInfo'),
            playlistThumbnail: document.getElementById('playlistThumbnail'),
            playlistTitle: document.getElementById('playlistTitle'),
            playlistUploader: document.getElementById('playlistUploader'),
            playlistSize: document.getElementById('playlistSize'),
            videoCount: document.getElementById('videoCount'),
            playlistDownloadType: document.getElementById('playlistDownloadType'),
            
            // Download elements
            downloadBtn: document.getElementById('downloadBtn'),
            presetBtns: document.querySelectorAll('.preset-btn'),
            toggleAdvanced: document.getElementById('toggleAdvanced'),
            advancedContent: document.getElementById('advancedContent'),

            // Folder selection elements
            resetFolderBtn: document.getElementById('resetFolderBtn'),
            selectedFolderDisplay: document.getElementById('selectedFolder'),
            folderPathInput: document.querySelector('.folder-path-input'),
            customPath: document.getElementById('customPath'),
            useCustomPath: document.getElementById('useCustomPath'),
            browseFolderBtn: document.getElementById('browseFolderBtn'),

            // Folder modal elements
            folderModal: document.getElementById('folderModal'),
            closeFolderModal: document.getElementById('closeFolderModal'),
            folderBreadcrumb: document.getElementById('folderBreadcrumb'),
            folderQuickAccess: document.getElementById('folderQuickAccess'),
            currentFolderPath: document.getElementById('currentFolderPath'),
            folderList: document.getElementById('folderList'),
            showNewFolderBtn: document.getElementById('showNewFolderBtn'),
            newFolderInput: document.getElementById('newFolderInput'),
            newFolderName: document.getElementById('newFolderName'),
            createFolderBtn: document.getElementById('createFolderBtn'),
            cancelNewFolderBtn: document.getElementById('cancelNewFolderBtn'),
            selectedFolderPath: document.getElementById('selectedFolderPath'),
            cancelFolderSelection: document.getElementById('cancelFolderSelection'),
            confirmFolderSelection: document.getElementById('confirmFolderSelection'),
            
            // Progress elements
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            progressPercent: document.getElementById('progressPercent'),
            downloadSpeed: document.getElementById('downloadSpeed'),
            downloadSize: document.getElementById('downloadSize'),
            timeRemaining: document.getElementById('timeRemaining'),
            pauseBtn: document.getElementById('pauseBtn'),
            stopBtn: document.getElementById('stopBtn'),
            
            // Results elements
            resultsCard: document.getElementById('resultsCard'),
            resultMessage: document.getElementById('resultMessage'),
            downloadAnother: document.getElementById('downloadAnother'),
            openFolder: document.getElementById('openFolder')
        };
    }

    bindEvents() {
        // URL input and analyze
        this.elements.analyzeBtn.addEventListener('click', () => this.analyzeVideo());
        this.elements.videoUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.analyzeVideo();
        });

        // Preset buttons
        this.elements.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectPreset(btn));
        });

        // Advanced options toggle
        this.elements.toggleAdvanced.addEventListener('click', () => this.toggleAdvancedOptions());

        // Folder selection
        this.elements.resetFolderBtn.addEventListener('click', () => this.resetFolder());
        this.elements.useCustomPath.addEventListener('click', () => this.useCustomPath());
        this.elements.browseFolderBtn.addEventListener('click', () => this.openFolderBrowser());

        // Enter key support for custom path
        this.elements.customPath.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.useCustomPath();
            }
        });

        // Folder modal events
        this.elements.closeFolderModal.addEventListener('click', () => this.closeFolderBrowser());
        this.elements.cancelFolderSelection.addEventListener('click', () => this.closeFolderBrowser());
        this.elements.confirmFolderSelection.addEventListener('click', () => this.confirmFolderSelection());
        this.elements.showNewFolderBtn.addEventListener('click', () => this.showNewFolderInput());
        this.elements.createFolderBtn.addEventListener('click', () => this.createNewFolder());
        this.elements.cancelNewFolderBtn.addEventListener('click', () => this.hideNewFolderInput());

        // Enter key support for new folder name
        this.elements.newFolderName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createNewFolder();
            }
        });

        // Close modal when clicking outside
        this.elements.folderModal.addEventListener('click', (e) => {
            if (e.target === this.elements.folderModal) {
                this.closeFolderBrowser();
            }
        });

        // Download button
        this.elements.downloadBtn.addEventListener('click', () => this.startDownload());

        // Download control buttons
        this.elements.pauseBtn.addEventListener('click', () => this.pauseDownload());
        this.elements.stopBtn.addEventListener('click', () => this.stopDownload());

        // Result actions
        this.elements.downloadAnother.addEventListener('click', () => this.resetInterface());
        this.elements.openFolder.addEventListener('click', () => this.openDownloadFolder());

        // Auto-resize URL input
        this.elements.videoUrl.addEventListener('input', () => this.validateUrl());
    }

    validateUrl() {
        const url = this.elements.videoUrl.value.trim();
        const isValid = this.isValidUrl(url);
        
        this.elements.analyzeBtn.disabled = !isValid;
        
        if (isValid) {
            this.elements.analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze';
        } else {
            this.elements.analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze';
        }
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return url.includes('youtube.com') || url.includes('youtu.be') || url.length > 10;
        } catch {
            return false;
        }
    }

    async analyzeVideo() {
        const url = this.elements.videoUrl.value.trim();
        if (!this.isValidUrl(url)) {
            this.showError('Please enter a valid URL');
            return;
        }

        this.currentUrl = url;
        this.showLoading(true);

        try {
            // Call backend API to analyze video
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();

            if (data.success) {
                if (data.is_playlist) {
                    // Handle playlist
                    this.showPlaylistInfo({
                        title: data.playlist_info.title,
                        uploader: data.playlist_info.uploader,
                        videoCount: data.playlist_info.video_count,
                        thumbnail: data.playlist_info.thumbnail || "https://via.placeholder.com/200x112/667eea/ffffff?text=Playlist+Thumbnail"
                    });
                    this.showDownloadOptions(true); // true indicates playlist mode
                } else {
                    // Handle single video
                    this.showVideoInfo({
                        title: data.info.title,
                        channel: data.info.channel,
                        views: data.info.view_count + ' views',
                        date: data.info.upload_date,
                        duration: data.info.duration,
                        thumbnail: data.info.thumbnail || "https://via.placeholder.com/200x112/667eea/ffffff?text=Video+Thumbnail"
                    });
                    this.showDownloadOptions(false); // false indicates single video mode
                }
            } else {
                this.showError(data.error || 'Failed to analyze video');
            }

        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Failed to analyze video. Please check the URL and try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async simulateAnalysis() {
        // Simulate network delay
        return new Promise(resolve => setTimeout(resolve, 2000));
    }

    showVideoInfo(info) {
        this.elements.thumbnail.src = info.thumbnail;
        this.elements.videoTitle.textContent = info.title;
        this.elements.videoChannel.textContent = info.channel;
        this.elements.videoViews.innerHTML = `<i class="fas fa-eye"></i> ${info.views}`;
        this.elements.videoDate.innerHTML = `<i class="fas fa-calendar"></i> ${info.date}`;
        this.elements.videoSize.innerHTML = `<i class="fas fa-hdd"></i> ${info.estimated_size_formatted || 'Size unknown'}`;
        this.elements.duration.textContent = info.duration;

        // Hide playlist info and show video info
        this.elements.playlistInfo.style.display = 'none';
        this.elements.videoInfo.style.display = 'block';
        this.elements.videoInfo.classList.add('fade-in');
    }

    showPlaylistInfo(info) {
        this.elements.playlistThumbnail.src = info.thumbnail;
        this.elements.playlistTitle.textContent = info.title;
        this.elements.playlistUploader.textContent = info.uploader;
        this.elements.playlistSize.innerHTML = `<i class="fas fa-hdd"></i> ${info.estimated_total_size_formatted || 'Calculating size...'}`;
        this.elements.videoCount.textContent = `${info.videoCount} videos`;

        // Hide video info and show playlist info
        this.elements.videoInfo.style.display = 'none';
        this.elements.playlistInfo.style.display = 'block';
        this.elements.playlistInfo.classList.add('fade-in');
    }

    showDownloadOptions(isPlaylist = false) {
        // Show/hide playlist-specific options
        if (this.elements.playlistDownloadType) {
            this.elements.playlistDownloadType.style.display = isPlaylist ? 'block' : 'none';
        }

        this.elements.downloadOptions.style.display = 'block';
        this.elements.downloadOptions.classList.add('fade-in');
        this.elements.downloadBtn.disabled = false;

        // Initialize playlist download type selection if it's a playlist
        if (isPlaylist) {
            this.initializePlaylistDownloadType();
        }
    }

    initializePlaylistDownloadType() {
        // Set default selection to individual files
        this.selectedDownloadType = 'individual';

        // Add event listeners for download type selection
        const downloadTypeOptions = document.querySelectorAll('.download-type-option');
        downloadTypeOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all options
                downloadTypeOptions.forEach(opt => opt.classList.remove('active'));
                // Add active class to selected option
                option.classList.add('active');
                // Update selected type
                this.selectedDownloadType = option.dataset.type;
            });
        });

        // Set initial active state
        const defaultOption = document.querySelector('.download-type-option[data-type="individual"]');
        if (defaultOption) {
            defaultOption.classList.add('active');
        }
    }

    selectPreset(btn) {
        // Remove previous selection
        this.elements.presetBtns.forEach(b => b.classList.remove('selected'));
        
        // Select current button
        btn.classList.add('selected');
        
        // Store format and type
        this.selectedFormat = btn.dataset.format;
        this.selectedType = btn.dataset.type;
        
        // Enable download button
        this.elements.downloadBtn.disabled = false;
        
        // Update download button text
        const formatText = btn.querySelector('span').textContent;
        this.elements.downloadBtn.innerHTML = `<i class="fas fa-download"></i> Download ${formatText}`;
    }

    toggleAdvancedOptions() {
        const content = this.elements.advancedContent;
        const isOpen = content.classList.contains('open');

        if (isOpen) {
            content.classList.remove('open');
            this.elements.toggleAdvanced.querySelector('.fa-chevron-down').style.transform = 'rotate(0deg)';
        } else {
            content.classList.add('open');
            this.elements.toggleAdvanced.querySelector('.fa-chevron-down').style.transform = 'rotate(180deg)';
        }
    }







    useCustomPath() {
        const path = this.elements.customPath.value.trim();
        if (path) {
            this.selectedFolder = path;
            this.selectedFolderPath = path;

            // Update the display
            this.elements.selectedFolderDisplay.textContent = `Custom path: ${path}`;
            this.updateFolderDisplay(true);

            // Hide path input
            this.elements.folderPathInput.style.display = 'none';
            this.elements.togglePathInput.style.display = 'block';
            this.elements.togglePathInput.textContent = '⌨️ Enter path manually';

            // Show success feedback
            this.showFolderSelectionSuccess(path);
        } else {
            alert('Please enter a valid folder path');
        }
    }

    resetFolder() {
        // Reset to default Downloads/YT-dlp folder
        this.setDefaultFolder();
        this.elements.customPath.value = '';
        this.elements.folderPathInput.style.display = 'none';
        // Remove saved preference
        localStorage.removeItem('ytdl_selected_folder');
    }

    updateFolderDisplay(isSelected) {
        const folderDisplay = this.elements.selectedFolderDisplay.parentElement;
        const resetBtn = this.elements.resetFolderBtn;

        if (isSelected) {
            folderDisplay.style.borderColor = '#2ed573';
            folderDisplay.style.background = '#f0fff4';
            resetBtn.style.display = 'flex';
        } else {
            folderDisplay.style.borderColor = '#e1e8ed';
            folderDisplay.style.background = 'white';
            resetBtn.style.display = 'none';
        }
    }

    showFolderSelectionSuccess(folderName) {
        // Create a temporary success message
        const successMsg = document.createElement('div');
        successMsg.className = 'folder-success-msg';
        successMsg.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Folder "${folderName}" selected successfully!</span>
        `;
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #2ed573, #26d467);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(46, 213, 115, 0.3);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            animation: slideInRight 0.5s ease;
        `;

        document.body.appendChild(successMsg);

        // Remove after 3 seconds
        setTimeout(() => {
            successMsg.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => {
                if (successMsg.parentNode) {
                    successMsg.parentNode.removeChild(successMsg);
                }
            }, 500);
        }, 3000);
    }

    async startDownload() {
        if (this.isDownloading) return;

        // Check if folder is selected
        if (!this.selectedFolder || this.selectedFolder.trim() === '') {
            this.showError('Please select a download folder first!');
            this.openFolderBrowser();
            return;
        }

        this.isDownloading = true;
        this.hideAllSections();
        this.elements.progressSection.style.display = 'block';

        try {
            // Get advanced options
            const options = {
                subtitles: document.getElementById('downloadSubs')?.checked || false,
                thumbnail: document.getElementById('downloadThumbnail')?.checked || false,
                extract_audio: document.getElementById('extractAudio')?.checked || false
            };

            // Get custom format if specified
            const customFormat = document.getElementById('customFormat')?.value.trim();
            const format = customFormat || this.selectedFormat;

            // Check if this is a playlist download
            const isPlaylist = this.elements.playlistInfo.style.display !== 'none';
            const downloadType = this.selectedDownloadType || 'individual';

            // Choose the appropriate API endpoint
            const endpoint = isPlaylist ? '/api/download-playlist' : '/api/download';
            const requestBody = {
                url: this.currentUrl,
                format: format,
                options: options,
                folder: this.selectedFolder
            };

            // Add playlist-specific options
            if (isPlaylist) {
                requestBody.download_type = downloadType;
            }

            // Start download via API
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.success) {
                // Store download ID for pause/stop functionality
                this.currentDownloadId = data.download_id;

                // Monitor download progress
                await this.monitorDownload(data.download_id);
            } else {
                this.showError(data.error || 'Failed to start download');
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Download failed. Please try again.');
        } finally {
            this.isDownloading = false;
        }
    }

    async pauseDownload() {
        if (!this.currentDownloadId) return;

        try {
            const response = await fetch(`/api/pause/${this.currentDownloadId}`, {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                // Update button states
                this.elements.pauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Resume</span>';
                this.elements.pauseBtn.onclick = () => this.resumeDownload();
                this.isPaused = true;
            } else {
                console.error('Failed to pause download:', data.error);
            }
        } catch (error) {
            console.error('Error pausing download:', error);
        }
    }

    async resumeDownload() {
        if (!this.currentDownloadId) return;

        try {
            const response = await fetch(`/api/resume/${this.currentDownloadId}`, {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                // Update button states
                this.elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
                this.elements.pauseBtn.onclick = () => this.pauseDownload();
                this.isPaused = false;
            } else {
                console.error('Failed to resume download:', data.error);
            }
        } catch (error) {
            console.error('Error resuming download:', error);
        }
    }

    async stopDownload() {
        if (!this.currentDownloadId) return;

        if (confirm('Are you sure you want to stop the download? This will cancel the current download.')) {
            try {
                const response = await fetch(`/api/stop/${this.currentDownloadId}`, {
                    method: 'POST'
                });

                const data = await response.json();
                if (data.success) {
                    // Reset interface
                    this.resetInterface();
                } else {
                    console.error('Failed to stop download:', data.error);
                }
            } catch (error) {
                console.error('Error stopping download:', error);
            }
        }
    }

    async monitorDownload(downloadId) {
        const pollInterval = 1000; // Poll every second

        while (this.isDownloading) {
            try {
                const response = await fetch(`/api/progress/${downloadId}`);
                const progress = await response.json();

                // Update progress display
                this.elements.progressText.textContent = progress.message || 'Downloading...';
                this.elements.progressPercent.textContent = `${Math.round(progress.progress || 0)}%`;
                this.elements.progressFill.style.width = `${progress.progress || 0}%`;

                // Update download stats if available
                this.elements.downloadSpeed.textContent = `Speed: ${progress.speed || '0 MB/s'}`;
                this.elements.downloadSize.textContent = `Size: ${progress.size || '0 MB'}`;
                this.elements.timeRemaining.textContent = `ETA: ${progress.eta || '--:--'}`;

                // Debug logging
                console.log('Progress update:', {
                    status: progress.status,
                    progress: progress.progress,
                    speed: progress.speed,
                    size: progress.size,
                    eta: progress.eta,
                    message: progress.message
                });

                // Check if download is complete
                if (progress.status === 'completed') {
                    this.showSuccess();
                    break;
                } else if (progress.status === 'error') {
                    this.showError(progress.message || 'Download failed');
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, pollInterval));

            } catch (error) {
                console.error('Progress polling error:', error);
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }
    }

    showSuccess() {
        this.hideAllSections();
        this.elements.resultsSection.style.display = 'block';
        this.elements.resultsCard.className = 'results-card success';

        const location = this.selectedFolder ? `the "${this.selectedFolder}" folder` : 'the yt-dlp folder';
        this.elements.resultMessage.textContent = `Your video has been downloaded successfully to ${location}!`;
    }

    showError(message) {
        this.hideAllSections();
        this.elements.resultsSection.style.display = 'block';
        this.elements.resultsCard.className = 'results-card error';
        this.elements.resultsCard.querySelector('.result-icon').innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        this.elements.resultsCard.querySelector('h3').textContent = 'Download Failed';
        this.elements.resultMessage.textContent = message;
    }

    hideAllSections() {
        this.elements.videoInfo.style.display = 'none';
        this.elements.downloadOptions.style.display = 'none';
        this.elements.progressSection.style.display = 'none';
        this.elements.resultsSection.style.display = 'none';
    }

    resetInterface() {
        this.hideAllSections();
        this.elements.videoUrl.value = '';
        this.elements.analyzeBtn.disabled = true;
        this.elements.downloadBtn.disabled = true;
        this.elements.presetBtns.forEach(btn => btn.classList.remove('selected'));
        this.currentUrl = '';
        this.isDownloading = false;

        // Reset folder selection
        this.resetFolder();

        // Reset download button text
        this.elements.downloadBtn.innerHTML = '<i class="fas fa-download"></i> Start Download';
    }

    async openDownloadFolder() {
        try {
            const response = await fetch('/api/open-folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    folder: this.selectedFolder
                })
            });

            const data = await response.json();

            if (data.success) {
                // Show success message
                this.showTemporaryMessage('Folder opened successfully!', 'success');
            } else {
                // Fallback: show folder path
                const folderPath = this.selectedFolder || 'yt-dlp directory';
                alert(`Could not open folder automatically.\n\nDownload location: ${folderPath}\n\nError: ${data.error}`);
            }
        } catch (error) {
            console.error('Error opening folder:', error);
            // Fallback: show folder path
            const folderPath = this.selectedFolder || 'yt-dlp directory';
            alert(`Could not open folder automatically.\n\nDownload location: ${folderPath}`);
        }
    }

    showTemporaryMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `temp-message ${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'linear-gradient(45deg, #2ed573, #26d467)' : 'linear-gradient(45deg, #667eea, #764ba2)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            animation: slideInRight 0.5s ease;
        `;

        document.body.appendChild(messageEl);

        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 500);
        }, 3000);
    }

    showLoading(show) {
        this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    // Folder Browser Methods
    async setDefaultFolder() {
        // Only set default if no folder is already selected
        if (!this.selectedFolder) {
            // Get the default Downloads/YT-dlp folder from server
            try {
                const response = await fetch('/api/default-folder', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();
                if (data.success) {
                    this.selectedFolder = data.folder;
                    this.elements.selectedFolderDisplay.textContent = `Default: Downloads/YT-dlp`;
                    this.updateFolderDisplay(true);
                    console.log('Set default folder:', data.folder);
                } else {
                    // Fallback to generic default
                    this.selectedFolder = 'Downloads/YT-dlp';
                    this.elements.selectedFolderDisplay.textContent = `Default: Downloads/YT-dlp`;
                    this.updateFolderDisplay(true);
                }
            } catch (error) {
                console.error('Error getting default folder:', error);
                // Fallback to generic default
                this.selectedFolder = 'Downloads/YT-dlp';
                this.elements.selectedFolderDisplay.textContent = `Default: Downloads/YT-dlp`;
                this.updateFolderDisplay(true);
            }
        }
    }

    loadSavedFolder() {
        const savedFolder = localStorage.getItem('ytdl_selected_folder');
        if (savedFolder) {
            console.log('Loading saved folder:', savedFolder);
            this.selectedFolder = savedFolder;
            this.elements.selectedFolderDisplay.textContent = `Saved: ${savedFolder}`;
            this.updateFolderDisplay(true);
        }
    }

    getHomeDirectory() {
        // In browser environment, we'll use a generic path that the server will resolve
        if (this.isWindows()) {
            return 'C:\\Users\\' + (window.navigator.userAgent.includes('Windows') ? 'User' : 'User');
        } else {
            return '/home/user';
        }
    }

    isWindows() {
        return window.navigator.userAgent.includes('Windows');
    }

    saveFolderPreference(folderPath) {
        localStorage.setItem('ytdl_selected_folder', folderPath);
    }

    async openFolderBrowser() {
        console.log('Opening folder browser...');
        this.elements.folderModal.style.display = 'block';
        this.selectedFolderForModal = '';
        this.elements.confirmFolderSelection.disabled = true;
        this.elements.selectedFolderPath.textContent = 'No folder selected';

        // Start from saved folder or home directory
        const startPath = this.selectedFolder || '';
        console.log('Starting path:', startPath);
        await this.loadFolderContents(startPath);
    }

    closeFolderBrowser() {
        this.elements.folderModal.style.display = 'none';
        this.hideNewFolderInput();
    }

    async loadFolderContents(path = '') {
        try {
            this.elements.folderList.innerHTML = `
                <div class="folder-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading folders...</span>
                </div>
            `;

            const response = await fetch('/api/folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: path })
            });

            const data = await response.json();

            if (data.success) {
                this.currentPath = data.current_path;
                this.renderFolderContents(data);
            } else {
                this.showFolderError(data.error || 'Failed to load folders');
            }
        } catch (error) {
            console.error('Error loading folders:', error);
            this.showFolderError('Failed to load folders');
        }
    }

    renderFolderContents(data) {
        // Update current path display
        this.elements.currentFolderPath.textContent = data.current_path;

        // Update breadcrumb
        this.renderBreadcrumb(data.current_path);

        // Update quick access buttons
        this.renderQuickAccess(data.common_folders);

        // Render folder list
        let folderListHTML = '';

        // Add parent folder if available
        if (data.parent_path) {
            folderListHTML += `
                <div class="folder-item parent-folder" data-path="${data.parent_path}">
                    <i class="fas fa-level-up-alt"></i>
                    <span class="folder-name">.. (Go up)</span>
                </div>
            `;
        }

        // Add folders
        data.folders.forEach(folder => {
            folderListHTML += `
                <div class="folder-item" data-path="${folder.path}">
                    <i class="fas fa-folder"></i>
                    <span class="folder-name">${folder.name}</span>
                </div>
            `;
        });

        if (data.folders.length === 0 && !data.parent_path) {
            folderListHTML = `
                <div class="folder-loading">
                    <i class="fas fa-folder-open"></i>
                    <span>No folders found</span>
                </div>
            `;
        }

        this.elements.folderList.innerHTML = folderListHTML;

        // Add click handlers to folder items
        this.elements.folderList.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', () => this.handleFolderClick(item));
            item.addEventListener('dblclick', () => this.handleFolderDoubleClick(item));
        });
    }

    renderBreadcrumb(currentPath) {
        const pathParts = currentPath.split(/[/\\]/).filter(part => part);
        let breadcrumbHTML = '';
        let buildPath = '';

        // Add root/drive
        const isWindows = currentPath.includes('\\') || currentPath.match(/^[A-Z]:/);
        if (isWindows) {
            const drive = currentPath.split('\\')[0];
            breadcrumbHTML += `<span class="breadcrumb-item" data-path="${drive}\\">${drive}</span>`;
            buildPath = drive + '\\';
        } else {
            breadcrumbHTML += `<span class="breadcrumb-item" data-path="/">/</span>`;
            buildPath = '/';
        }

        // Add path parts
        pathParts.forEach((part, index) => {
            if (part && part !== pathParts[0]) {
                buildPath += (isWindows ? '\\' : '/') + part;
                breadcrumbHTML += `<span class="breadcrumb-separator">/</span>`;
                breadcrumbHTML += `<span class="breadcrumb-item" data-path="${buildPath}">${part}</span>`;
            }
        });

        this.elements.folderBreadcrumb.innerHTML = breadcrumbHTML;

        // Add click handlers to breadcrumb items
        this.elements.folderBreadcrumb.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.getAttribute('data-path');
                this.loadFolderContents(path);
            });
        });
    }

    renderQuickAccess(commonFolders) {
        let quickAccessHTML = '';

        commonFolders.forEach(folder => {
            quickAccessHTML += `
                <button class="folder-quick-btn" data-path="${folder.path}">
                    <i class="fas fa-folder"></i>
                    ${folder.name}
                </button>
            `;
        });

        this.elements.folderQuickAccess.innerHTML = quickAccessHTML;

        // Add click handlers
        this.elements.folderQuickAccess.querySelectorAll('.folder-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const path = btn.getAttribute('data-path');
                this.loadFolderContents(path);
            });
        });
    }

    handleFolderClick(folderItem) {
        // Remove previous selection
        this.elements.folderList.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Select current folder
        folderItem.classList.add('selected');
        const folderPath = folderItem.getAttribute('data-path');

        // Don't select parent folder for confirmation
        if (!folderItem.classList.contains('parent-folder')) {
            this.selectedFolderForModal = folderPath;
            this.elements.selectedFolderPath.textContent = folderPath;
            this.elements.confirmFolderSelection.disabled = false;
        } else {
            this.selectedFolderForModal = '';
            this.elements.selectedFolderPath.textContent = 'No folder selected';
            this.elements.confirmFolderSelection.disabled = true;
        }
    }

    handleFolderDoubleClick(folderItem) {
        const folderPath = folderItem.getAttribute('data-path');
        this.loadFolderContents(folderPath);
    }

    confirmFolderSelection() {
        if (this.selectedFolderForModal) {
            this.selectedFolder = this.selectedFolderForModal;
            this.elements.selectedFolderDisplay.textContent = `Selected: ${this.selectedFolderForModal}`;
            this.updateFolderDisplay(true);
            this.saveFolderPreference(this.selectedFolderForModal);
            this.showFolderSelectionSuccess(this.selectedFolderForModal);
            this.closeFolderBrowser();
        }
    }

    showNewFolderInput() {
        this.elements.newFolderInput.style.display = 'flex';
        this.elements.showNewFolderBtn.style.display = 'none';
        this.elements.newFolderName.focus();
    }

    hideNewFolderInput() {
        this.elements.newFolderInput.style.display = 'none';
        this.elements.showNewFolderBtn.style.display = 'block';
        this.elements.newFolderName.value = '';
    }

    async createNewFolder() {
        const folderName = this.elements.newFolderName.value.trim();

        if (!folderName) {
            alert('Please enter a folder name');
            return;
        }

        try {
            const response = await fetch('/api/create-folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    parent_path: this.currentPath,
                    folder_name: folderName
                })
            });

            const data = await response.json();

            if (data.success) {
                this.hideNewFolderInput();
                // Reload current directory to show new folder
                await this.loadFolderContents(this.currentPath);
                // Show success message
                this.showTemporaryMessage(`Folder "${folderName}" created successfully!`, 'success');
            } else {
                alert(data.error || 'Failed to create folder');
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            alert('Failed to create folder');
        }
    }

    showFolderError(message) {
        this.elements.folderList.innerHTML = `
            <div class="folder-loading">
                <i class="fas fa-exclamation-triangle" style="color: #ff4757;"></i>
                <span style="color: #ff4757;">${message}</span>
            </div>
        `;
    }

    showTemporaryMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `temp-message temp-message-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        const colors = {
            success: '#2ed573',
            error: '#ff4757',
            info: '#667eea'
        };

        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            z-index: 1001;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            animation: slideInRight 0.5s ease;
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideOutRight 0.5s ease forwards';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 500);
        }, 3000);
    }
}

// Navigation functionality
class Navigation {
    constructor() {
        this.currentSection = 'home';
        this.init();
    }

    init() {
        // Get navigation elements
        this.navLinks = document.querySelectorAll('.nav-link, .nav-footer-link');
        this.sections = {
            home: document.querySelector('.main-content'),
            about: document.getElementById('about'),
            contact: document.getElementById('contact')
        };

        // Bind events
        this.bindEvents();

        // Show home section by default
        this.showSection('home');
    }

    bindEvents() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const section = e.state?.section || 'home';
            this.showSection(section, false);
        });
    }

    showSection(sectionName, updateHistory = true) {
        // Hide all sections
        Object.values(this.sections).forEach(section => {
            if (section) {
                section.style.display = 'none';
            }
        });

        // Show target section
        if (this.sections[sectionName]) {
            this.sections[sectionName].style.display = 'block';

            // Add entrance animation
            this.sections[sectionName].style.animation = 'sectionSlideIn 0.8s ease-out';
        }

        // Update active nav link
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionName) {
                link.classList.add('active');
            }
        });

        // Update browser history
        if (updateHistory) {
            const url = sectionName === 'home' ? '/' : `/#${sectionName}`;
            history.pushState({ section: sectionName }, '', url);
        }

        this.currentSection = sectionName;
    }
}

// Enhanced animations and interactions
class AnimationController {
    constructor() {
        this.init();
    }

    init() {
        this.addScrollAnimations();
        this.addHoverEffects();
        this.addRippleEffects();
        this.addParallaxEffect();
    }

    addScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'sectionSlideIn 0.8s ease-out';
                }
            });
        }, observerOptions);

        // Observe sections
        document.querySelectorAll('.url-section, .about-section, .contact-section').forEach(section => {
            observer.observe(section);
        });
    }

    addHoverEffects() {
        // Add hover effects to cards
        document.querySelectorAll('.about-card, .contact-link').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    addRippleEffects() {
        // Add ripple effect to buttons
        document.querySelectorAll('.analyze-btn, .contact-link').forEach(button => {
            button.addEventListener('click', (e) => {
                const ripple = document.createElement('div');
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                `;

                button.style.position = 'relative';
                button.style.overflow = 'hidden';
                button.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    addParallaxEffect() {
        // Add subtle parallax to floating shapes
        window.addEventListener('mousemove', (e) => {
            const shapes = document.querySelectorAll('.shape');
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;

            shapes.forEach((shape, index) => {
                const speed = (index + 1) * 0.5;
                const xPos = (x - 0.5) * speed * 20;
                const yPos = (y - 0.5) * speed * 20;

                shape.style.transform = `translate(${xPos}px, ${yPos}px)`;
            });
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main downloader functionality
    new YouTubeDownloader();

    // Initialize navigation
    new Navigation();

    // Initialize animations
    new AnimationController();

    // Add entrance animations
    setTimeout(() => {
        document.querySelector('.header').style.animation = 'slideInUp 0.8s ease';
        document.querySelector('.url-section').style.animation = 'slideInUp 0.8s ease 0.2s both';
    }, 100);

    // Add CSS animations for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }

        @keyframes sectionSlideIn {
            0% {
                opacity: 0;
                transform: translateY(30px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
});

// Add some interactive effects
document.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('.cursor');
    if (!cursor) {
        const newCursor = document.createElement('div');
        newCursor.className = 'cursor';
        newCursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: rgba(102, 126, 234, 0.3);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.1s ease;
        `;
        document.body.appendChild(newCursor);
    }
    
    const cursorElement = document.querySelector('.cursor');
    cursorElement.style.left = e.clientX - 10 + 'px';
    cursorElement.style.top = e.clientY - 10 + 'px';
});
