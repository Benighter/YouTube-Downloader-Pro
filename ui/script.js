// YouTube Downloader Pro - JavaScript
class YouTubeDownloader {
    constructor() {
        this.selectedFormat = 'best[height<=720]';
        this.selectedType = 'video';
        this.currentUrl = '';
        this.isDownloading = false;
        this.selectedFolder = '';

        this.initializeElements();
        this.bindEvents();
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
            duration: document.getElementById('duration'),
            
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
            
            // Progress elements
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            progressPercent: document.getElementById('progressPercent'),
            downloadSpeed: document.getElementById('downloadSpeed'),
            downloadSize: document.getElementById('downloadSize'),
            timeRemaining: document.getElementById('timeRemaining'),
            
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

        // Enter key support for custom path
        this.elements.customPath.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.useCustomPath();
            }
        });

        // Download button
        this.elements.downloadBtn.addEventListener('click', () => this.startDownload());

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
                this.showVideoInfo({
                    title: data.info.title,
                    channel: data.info.channel,
                    views: data.info.view_count + ' views',
                    date: data.info.upload_date,
                    duration: data.info.duration,
                    thumbnail: data.info.thumbnail || "https://via.placeholder.com/200x112/667eea/ffffff?text=Video+Thumbnail"
                });

                this.showDownloadOptions();
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
        this.elements.duration.textContent = info.duration;

        this.elements.videoInfo.style.display = 'block';
        this.elements.videoInfo.classList.add('fade-in');
    }

    showDownloadOptions() {
        this.elements.downloadOptions.style.display = 'block';
        this.elements.downloadOptions.classList.add('fade-in');
        this.elements.downloadBtn.disabled = false;
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
        this.selectedFolder = '';
        this.selectedFolderPath = '';
        this.elements.selectedFolderDisplay.textContent = 'Default: yt-dlp folder';
        this.updateFolderDisplay(false);
        this.elements.customPath.value = '';
        this.elements.folderPathInput.style.display = 'none';
        this.elements.togglePathInput.style.display = 'block';
        this.elements.togglePathInput.textContent = '⌨️ Enter path manually';
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

            // Start download via API
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: this.currentUrl,
                    format: format,
                    options: options,
                    folder: this.selectedFolder
                })
            });

            const data = await response.json();

            if (data.success) {
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
                if (progress.speed) {
                    this.elements.downloadSpeed.textContent = `Speed: ${progress.speed}`;
                }
                if (progress.size) {
                    this.elements.downloadSize.textContent = `Size: ${progress.size}`;
                }
                if (progress.eta) {
                    this.elements.timeRemaining.textContent = `ETA: ${progress.eta}`;
                }

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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new YouTubeDownloader();
    
    // Add some nice entrance animations
    setTimeout(() => {
        document.querySelector('.header').style.animation = 'slideInUp 0.8s ease';
        document.querySelector('.url-section').style.animation = 'slideInUp 0.8s ease 0.2s both';
    }, 100);
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
