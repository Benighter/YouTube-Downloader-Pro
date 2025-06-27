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

        // Add these properties to the constructor
        this.currentVideoInfo = null;
        this.formatSizes = {};
        this.currentStorageInfo = null;

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
            openFolder: document.getElementById('openFolder'),

            // Storage elements
            storageInfoPanel: document.getElementById('storageInfoPanel'),
            refreshStorageBtn: document.getElementById('refreshStorageBtn'),
            availableSpace: document.getElementById('availableSpace'),
            totalSpace: document.getElementById('totalSpace'),
            storageUsage: document.getElementById('storageUsage'),
            storageBarFill: document.getElementById('storageBarFill'),
            viewStorageHistoryBtn: document.getElementById('viewStorageHistoryBtn'),
            manageStorageBtn: document.getElementById('manageStorageBtn'),

            // Storage History Modal
            storageHistoryModal: document.getElementById('storageHistoryModal'),
            closeStorageHistoryModal: document.getElementById('closeStorageHistoryModal'),
            totalDownloads: document.getElementById('totalDownloads'),
            totalStorageUsed: document.getElementById('totalStorageUsed'),
            storageLocationsCount: document.getElementById('storageLocationsCount'),
            recentDownloadsList: document.getElementById('recentDownloadsList'),
            storageLocationsList: document.getElementById('storageLocationsList'),

            // Storage Management Modal
            storageManagementModal: document.getElementById('storageManagementModal'),
            closeStorageManagementModal: document.getElementById('closeStorageManagementModal'),
            drivesList: document.getElementById('drivesList'),
            favoriteLocationsList: document.getElementById('favoriteLocationsList'),
            newLocationPath: document.getElementById('newLocationPath'),
            newLocationAlias: document.getElementById('newLocationAlias'),
            browseNewLocationBtn: document.getElementById('browseNewLocationBtn'),
            addLocationBtn: document.getElementById('addLocationBtn')
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

        // Storage events
        this.elements.refreshStorageBtn?.addEventListener('click', () => this.refreshStorageInfo());
        this.elements.viewStorageHistoryBtn?.addEventListener('click', () => this.openStorageHistory());
        this.elements.manageStorageBtn?.addEventListener('click', () => this.openStorageManagement());

        // Storage modal events
        this.elements.closeStorageHistoryModal?.addEventListener('click', () => this.closeStorageHistory());
        this.elements.closeStorageManagementModal?.addEventListener('click', () => this.closeStorageManagement());
        this.elements.addLocationBtn?.addEventListener('click', () => this.addStorageLocation());
        this.elements.browseNewLocationBtn?.addEventListener('click', () => this.browseNewLocation());

        // Close storage modals when clicking outside
        this.elements.storageHistoryModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.storageHistoryModal) {
                this.closeStorageHistory();
            }
        });

        this.elements.storageManagementModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.storageManagementModal) {
                this.closeStorageManagement();
            }
        });
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
        if (!url) {
            this.showError('Please enter a YouTube URL');
            return;
        }

        this.currentUrl = url;
        this.showLoading('Analyzing video...');

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (data.success) {
                if (data.is_playlist) {
                    this.currentPlaylistInfo = data.playlist_info;
                    this.showPlaylistInfo(data.playlist_info);
                } else {
                    this.currentVideoInfo = data.info;
                    this.showVideoInfo(data.info);
                }
                
                this.hideLoading();
                this.showDownloadOptions();
                
                // Automatically analyze formats and get storage info
                this.analyzeFormatsAndStorage();
            } else {
                this.hideLoading();
                this.showError(data.error || 'Failed to analyze video');
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Network error. Please check your connection and try again.');
            console.error('Analysis error:', error);
        }
    }

    async analyzeFormatsAndStorage() {
        try {
            // Get current download path
            const downloadPath = this.selectedFolder || '';
            
            const response = await fetch('/api/analyze-formats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    url: this.currentUrl,
                    download_path: downloadPath
                })
            });

            const data = await response.json();

            if (data.success) {
                // Store format sizes
                this.formatSizes = {};
                data.formats.forEach(format => {
                    this.formatSizes[format.selector] = {
                        size_bytes: format.size_bytes,
                        size_display: format.size_display,
                        confidence: format.confidence,
                        estimated: format.estimated
                    };
                });

                // Store storage info
                this.currentStorageInfo = data.storage_info;

                // Update format buttons with size information
                this.updateFormatButtonsWithSizes();
                
                // Show storage information
                this.showStorageInfo();
            }
        } catch (error) {
            console.error('Error analyzing formats:', error);
        }
    }

    updateFormatButtonsWithSizes() {
        this.elements.presetBtns.forEach(btn => {
            const formatSelector = btn.dataset.format;
            const sizeInfo = this.formatSizes[formatSelector];
            
            if (sizeInfo) {
                // Find or create size display element
                let sizeElement = btn.querySelector('.format-size');
                if (!sizeElement) {
                    sizeElement = document.createElement('small');
                    sizeElement.className = 'format-size';
                    btn.appendChild(sizeElement);
                }
                
                // Update size display with confidence indicator
                const confidenceIcon = sizeInfo.confidence === 'high' ? '✓' : 
                                      sizeInfo.confidence === 'medium' ? '~' : '?';
                sizeElement.textContent = `${confidenceIcon} ${sizeInfo.size_display}`;
                sizeElement.className = `format-size confidence-${sizeInfo.confidence}`;
                
                // Add tooltip for estimated sizes
                if (sizeInfo.estimated) {
                    btn.title = `Estimated size: ${sizeInfo.size_display}`;
                }
            }
        });
    }

    showStorageInfo() {
        if (!this.currentStorageInfo) return;

        const storagePanel = this.elements.storageInfoPanel;
        if (storagePanel) {
            storagePanel.style.display = 'block';
            
            // Update storage display elements
            if (this.elements.availableSpace) {
                this.elements.availableSpace.textContent = this.currentStorageInfo.free_formatted;
            }
            if (this.elements.totalSpace) {
                this.elements.totalSpace.textContent = this.currentStorageInfo.total_formatted;
            }
            if (this.elements.storageUsage) {
                const usagePercent = this.currentStorageInfo.usage_percent || this.currentStorageInfo.percent;
                if (usagePercent !== undefined && usagePercent !== null) {
                    this.elements.storageUsage.textContent = `${usagePercent.toFixed(1)}% used`;
                } else {
                    this.elements.storageUsage.textContent = 'Unknown usage';
                }
            }
            if (this.elements.storageBarFill) {
                const usagePercent = this.currentStorageInfo.usage_percent || this.currentStorageInfo.percent;
                if (usagePercent !== undefined && usagePercent !== null) {
                    this.elements.storageBarFill.style.width = `${usagePercent}%`;
                } else {
                    this.elements.storageBarFill.style.width = '0%';
                }
            }
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
        
        // Enhanced size display with confidence indicators and method info
        const sizeText = info.estimated_size_formatted || 'Size unknown';
        const sizeValue = info.estimated_size || 0;
        const sizeMethod = info.size_method || 'unknown';
        const sizeConfidence = info.size_confidence || 'unknown';
        
        // Always show refresh button for better user control
        const refreshButton = '<button class="size-refresh-btn" onclick="app.refreshVideoSize()" title="Refresh size estimate"><i class="fas fa-sync-alt"></i></button>';
        
        // Add size confidence indicator with better logic
        let confidenceIndicator = '';
        let confidenceClass = '';
        let confidenceTitle = '';
        
        if (sizeValue > 0) {
            switch(sizeConfidence) {
                case 'high':
                    confidenceClass = 'high';
                    confidenceTitle = `Exact size detected (${sizeMethod})`;
                    break;
                case 'medium':
                    confidenceClass = 'medium';
                    confidenceTitle = `Good size estimate (${sizeMethod})`;
                    break;
                case 'low':
                    confidenceClass = 'low';
                    confidenceTitle = `Rough size estimate (${sizeMethod})`;
                    break;
                default:
                    confidenceClass = 'unknown';
                    confidenceTitle = 'Size estimation method unknown';
            }
        } else {
            confidenceClass = 'unknown';
            confidenceTitle = 'Size could not be determined';
        }
        
        confidenceIndicator = `<span class="size-confidence ${confidenceClass}" title="${confidenceTitle}">●</span>`;

        this.elements.videoSize.innerHTML = `<i class="fas fa-hdd"></i> ${sizeText} ${confidenceIndicator} ${refreshButton}`;

        // Store current URL and video info for size refresh
        this.currentVideoUrl = this.elements.videoUrl.value.trim();
        this.currentVideoInfo = info;
        this.elements.duration.textContent = info.duration;

        // Hide playlist info and show video info
        this.elements.playlistInfo.style.display = 'none';
        this.elements.videoInfo.style.display = 'block';
        this.elements.videoInfo.classList.add('fade-in');
    }

    showPlaylistInfo(info) {
        this.elements.playlistThumbnail.src = info.thumbnail || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'320\' height=\'180\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%23f1f5f9\'/%3E%3C/svg%3E';
        this.elements.playlistTitle.textContent = info.title || 'Unknown Playlist';
        this.elements.playlistUploader.textContent = info.uploader || 'Unknown';
        this.elements.playlistSize.innerHTML = `<i class="fas fa-hdd"></i> ${info.estimated_total_size_formatted || 'Calculating size...'}`;
        this.elements.videoCount.textContent = `${info.video_count || 0} videos`;

        // Hide video info and show playlist info
        this.elements.videoInfo.style.display = 'none';
        this.elements.playlistInfo.style.display = 'block';
        this.elements.playlistInfo.classList.add('fade-in');

        // Store current URL for potential size refresh
        this.currentVideoUrl = this.elements.videoUrl.value.trim();
    }

    async refreshVideoSize() {
        if (!this.currentVideoUrl) {
            this.showError('No video URL available for size refresh');
            return;
        }

        // Show loading state
        this.elements.videoSize.innerHTML = '<i class="fas fa-hdd"></i> <i class="fas fa-spinner fa-spin"></i> Refreshing size...';

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: this.currentVideoUrl,
                    refresh_size: true  // Flag to indicate we want fresh size calculation
                })
            });

            const data = await response.json();

            if (data.success && !data.is_playlist) {
                // Update size information with enhanced display
                const info = data.info;
                const sizeText = info.estimated_size_formatted || 'Size unknown';
                const sizeValue = info.estimated_size || 0;
                
                // Always show refresh button
                const refreshButton = '<button class="size-refresh-btn" onclick="app.refreshVideoSize()" title="Refresh size estimate"><i class="fas fa-sync-alt"></i></button>';
                
                // Add confidence indicator
                let confidenceIndicator = '';
                if (sizeValue > 0) {
                    if (info.size_sources) {
                        if (info.size_sources.filesize > 0) {
                            confidenceIndicator = '<span class="size-confidence high" title="Exact size from source">●</span>';
                        } else if (info.size_sources.filesize_approx > 0) {
                            confidenceIndicator = '<span class="size-confidence medium" title="Approximate size from source">●</span>';
                        } else {
                            confidenceIndicator = '<span class="size-confidence low" title="Estimated size">●</span>';
                        }
                    }
                } else {
                    confidenceIndicator = '<span class="size-confidence unknown" title="Size unknown">●</span>';
                }

                this.elements.videoSize.innerHTML = `<i class="fas fa-hdd"></i> ${sizeText} ${confidenceIndicator} ${refreshButton}`;

                // Update stored info
                this.currentVideoInfo = info;

                // Show success feedback
                if (sizeValue > 0) {
                    this.showNotification(`Video size refreshed: ${sizeText}`, 'success');
                } else {
                    this.showNotification('Size could not be determined accurately', 'warning');
                }
            } else {
                throw new Error(data.error || 'Failed to refresh video size');
            }
        } catch (error) {
            console.error('Size refresh error:', error);
            this.elements.videoSize.innerHTML = '<i class="fas fa-hdd"></i> Size refresh failed <button class="size-refresh-btn" onclick="app.refreshVideoSize()" title="Try again"><i class="fas fa-sync-alt"></i></button>';
            this.showError('Failed to refresh video size: ' + error.message);
        }
    }

    showDownloadOptions(isPlaylist = false) {
        // Show/hide playlist-specific options
        if (this.elements.playlistDownloadType) {
            this.elements.playlistDownloadType.style.display = isPlaylist ? 'block' : 'none';
        }

        this.elements.downloadOptions.style.display = 'block';
        this.elements.downloadOptions.classList.add('fade-in');
        this.elements.downloadBtn.disabled = false;

        // Show storage info panel automatically
        if (this.elements.storageInfoPanel) {
            this.elements.storageInfoPanel.style.display = 'block';
        }

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
        
        // Show storage requirement for selected format
        this.showSelectedFormatStorage();
        
        // Enable download button
        this.elements.downloadBtn.disabled = false;
        
        // Update download button text
        const formatText = btn.querySelector('span').textContent;
        this.elements.downloadBtn.innerHTML = `<i class="fas fa-download"></i> Download ${formatText}`;
    }

    showSelectedFormatStorage() {
        if (!this.formatSizes || !this.selectedFormat) return;

        const formatSize = this.formatSizes[this.selectedFormat];
        if (!formatSize) return;

        // Create or update selected format info
        let selectedFormatInfo = document.querySelector('.selected-format-info');
        if (!selectedFormatInfo) {
            selectedFormatInfo = document.createElement('div');
            selectedFormatInfo.className = 'selected-format-info';
            
            // Insert after quality presets
            const qualityPresets = document.querySelector('.quality-presets');
            if (qualityPresets) {
                qualityPresets.parentNode.insertBefore(selectedFormatInfo, qualityPresets.nextSibling);
            }
        }

        let content = `<div class="format-info-header">
            <h4><i class="fas fa-info-circle"></i> Selected Format</h4>
        </div>
        <div class="format-details">
            <div class="format-item">
                <span class="format-label">Format:</span>
                <span class="format-value">${this.selectedFormat}</span>
            </div>
            <div class="format-item">
                <span class="format-label">Expected Size:</span>
                <span class="format-value ${formatSize.confidence === 'high' ? 'high-confidence' : formatSize.confidence === 'medium' ? 'medium-confidence' : 'low-confidence'}">
                    ${formatSize.size_display}
                    ${formatSize.estimated ? ' (estimated)' : ''}
                </span>
            </div>
        </div>`;

        // Add storage check if available
        if (this.currentStorageInfo && formatSize.size_bytes > 0) {
            const availableSpace = this.currentStorageInfo.free_space;
            const requiredSpace = formatSize.size_bytes;
            const spaceAfterDownload = availableSpace - requiredSpace;
            
            if (spaceAfterDownload < 0) {
                content += `<div class="storage-warning error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Insufficient disk space! Need ${formatSize.size_display}, only ${this.currentStorageInfo.free_formatted} available.
                </div>`;
            } else if (spaceAfterDownload < 1024 * 1024 * 100) { // Less than 100MB remaining
                content += `<div class="storage-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Low disk space after download (${this.formatFileSize(spaceAfterDownload)} remaining).
                </div>`;
            } else {
                content += `<div class="storage-info">
                    <i class="fas fa-check-circle"></i>
                    Space after download: ${this.formatFileSize(spaceAfterDownload)}
                </div>`;
            }
        }

        selectedFormatInfo.innerHTML = content;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
            
            // Refresh storage information for the new folder
            this.refreshStorageForCurrentFolder();
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
        
        // Refresh storage information for the default folder
        this.refreshStorageForCurrentFolder();
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

            // Check if this is a playlist download
            const isPlaylist = this.elements.playlistInfo.style.display !== 'none';
            const downloadType = this.selectedDownloadType || 'individual';

            if (isPlaylist) {
                // Handle playlist downloads (will implement in next step)
                await this.startPlaylistDownload(format, options, downloadType);
            } else {
                // Handle single video download with browser-native download
                await this.startBrowserDownload(format, options);
            }

        } catch (error) {
            console.error('Download error:', error);
            this.showError('Download failed. Please try again.');
        } finally {
            this.isDownloading = false;
        }
    }

    async startBrowserDownload(format, options) {
        try {
            // Show preparing message
            this.updateProgressDisplay({
                status: 'preparing',
                progress: 0,
                message: 'Preparing download...'
            });

            // Create request body
            const requestBody = {
                url: this.currentUrl,
                format: format,
                options: options
            };

            // Update UI to show download starting
            this.updateProgressDisplay({
                status: 'downloading',
                progress: 0,
                message: 'Starting download... Check your browser\'s download manager for progress.'
            });

            // Make fetch request to streaming endpoint
            const response = await fetch('/api/stream-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Download failed');
            }

            // Get the JSON response with download info
            const downloadData = await response.json();

            if (!downloadData.success) {
                throw new Error(downloadData.error || 'Download failed');
            }

            // Create download link using the direct URL
            const a = document.createElement('a');
            a.href = downloadData.download_url;
            a.download = downloadData.filename;
            a.style.display = 'none';

            document.body.appendChild(a);
            a.click();

            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
            }, 1000);

            // Show success message
            this.showBrowserDownloadSuccess();

        } catch (error) {
            throw new Error(`Browser download failed: ${error.message}`);
        }
    }

    async startPlaylistDownload(format, options, downloadType) {
        try {
            // Show preparing message
            this.updateProgressDisplay({
                status: 'preparing',
                progress: 0,
                message: 'Preparing playlist download...'
            });

            // Create request body
            const requestBody = {
                url: this.currentUrl,
                format: format,
                options: options,
                download_type: downloadType
            };

            // Update UI to show download starting
            this.updateProgressDisplay({
                status: 'downloading',
                progress: 0,
                message: 'Downloading playlist... This may take a while. Check your browser\'s download manager for progress.'
            });

            // Make fetch request to streaming playlist endpoint
            const response = await fetch('/api/stream-playlist-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            // Parse JSON response
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Playlist download failed');
            }

            // Check if it recommends server download
            if (responseData.recommend_server_download) {
                // Show message recommending server download
                this.updateProgressDisplay({
                    status: 'info',
                    progress: 0,
                    message: responseData.message || 'Browser download not recommended for playlists'
                });

                // Ask user if they want to use server download instead
                const useServerDownload = confirm(
                    `${responseData.message}\n\nWould you like to use server download instead? This will download to your selected folder.`
                );

                if (useServerDownload) {
                    // Switch to server download
                    await this.startServerPlaylistDownload(format, options, downloadType);
                    return;
                } else {
                    // User chose to continue with browser download, but warn them
                    this.updateProgressDisplay({
                        status: 'warning',
                        progress: 0,
                        message: `Proceeding with browser download of ${responseData.video_count} videos. This may take a very long time.`
                    });
                    
                    // For now, show a message that browser playlist download is not fully implemented
                    setTimeout(() => {
                        this.showError('Browser playlist download is not yet fully implemented. Please use server download for playlists.');
                    }, 2000);
                    return;
                }
            }

            // If we get here, it means the server sent a file blob (not currently implemented)
            // This would be for when we implement actual playlist ZIP streaming
            this.showBrowserDownloadSuccess();

        } catch (error) {
            throw new Error(`Playlist download failed: ${error.message}`);
        }
    }

    async startServerPlaylistDownload(format, options, downloadType) {
        try {
            // Show progress section
            this.elements.progressSection.style.display = 'block';

            // Create request body
            const requestBody = {
                url: this.currentUrl,
                format: format,
                options: options,
                download_type: downloadType,
                folder: this.selectedFolder
            };

            // Make fetch request to server playlist download endpoint
            const response = await fetch('/api/download-playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Playlist download failed');
            }

            if (data.success && data.download_id) {
                // Start monitoring download progress
                this.isDownloading = true;
                this.monitorDownload(data.download_id);
            } else {
                throw new Error('Failed to start playlist download');
            }

        } catch (error) {
            this.showError(`Playlist download failed: ${error.message}`);
            this.hideProgressSection();
        }
    }

    showBrowserDownloadSuccess() {
        this.hideAllSections();
        this.elements.resultsSection.style.display = 'block';
        this.elements.resultsCard.className = 'results-card success';

        // Update result content
        this.elements.resultsCard.querySelector('.result-icon').innerHTML = '<i class="fas fa-check-circle"></i>';
        this.elements.resultsCard.querySelector('h3').textContent = 'Download Started!';
        this.elements.resultsCard.querySelector('p').innerHTML =
            'Your download has been started and should appear in your browser\'s download manager.<br>' +
            'You can monitor the progress using your browser\'s built-in download progress bar.';

        // Reset interface after showing success
        setTimeout(() => {
            this.resetInterface();
        }, 5000);
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
        // Progressive polling: faster updates during active downloading
        let pollInterval = 250; // Start with 250ms for responsive updates
        let consecutiveNoProgress = 0;
        let lastProgress = 0;

        while (this.isDownloading) {
            try {
                const response = await fetch(`/api/progress/${downloadId}`);
                const progress = await response.json();

                // Update progress display with smooth animations
                this.updateProgressDisplay(progress);

                // Adaptive polling based on progress activity
                const currentProgress = progress.progress || 0;
                if (Math.abs(currentProgress - lastProgress) < 0.1) {
                    consecutiveNoProgress++;
                    // Slow down polling if no progress for a while
                    if (consecutiveNoProgress > 8) {
                        pollInterval = Math.min(1000, pollInterval + 100);
                    }
                } else {
                    consecutiveNoProgress = 0;
                    // Speed up polling during active downloading
                    pollInterval = progress.status === 'downloading' ? 250 : 500;
                }
                lastProgress = currentProgress;

                // Debug logging with better formatting
                console.log('Progress update:', {
                    status: progress.status,
                    progress: `${Math.round(progress.progress || 0)}%`,
                    speed: progress.speed || 'N/A',
                    size: progress.size || 'N/A',
                    eta: progress.eta || 'N/A',
                    message: progress.message || 'No message',
                    pollInterval: `${pollInterval}ms`
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
                // Use longer interval on error
                await new Promise(resolve => setTimeout(resolve, Math.max(pollInterval, 1000)));
            }
        }
    }

    updateProgressDisplay(progress) {
        const progressValue = Math.max(0, Math.min(100, progress.progress || 0));
        const roundedProgress = Math.round(progressValue);

        // Update text elements with better fallbacks
        const statusMessage = progress.message ||
                            (progress.status === 'downloading' ? 'Downloading...' :
                             progress.status === 'starting' ? 'Preparing download...' :
                             progress.status === 'completed' ? 'Download completed!' :
                             progress.status === 'error' ? 'Download failed' :
                             'Processing...');

        this.elements.progressText.textContent = statusMessage;
        this.elements.progressPercent.textContent = `${roundedProgress}%`;

        // Smooth progress bar animation
        this.animateProgressBar(progressValue);

        // Update download stats with enhanced formatting and validation
        const speed = progress.speed && progress.speed !== 'undefined' ? progress.speed : '0 MB/s';
        const size = progress.size && progress.size !== 'undefined' ? progress.size : '0 MB';
        const eta = progress.eta && progress.eta !== 'undefined' ? progress.eta : '--:--';

        this.elements.downloadSpeed.textContent = `Speed: ${speed}`;
        this.elements.downloadSize.textContent = `Size: ${size}`;
        this.elements.timeRemaining.textContent = `ETA: ${eta}`;

        // Update storage information during download
        this.updateStorageDisplayDuringDownload(progress);

        // Add visual feedback for different states
        this.updateProgressBarState(progress.status, progressValue);
    }

    updateStorageDisplayDuringDownload(progress) {
        // Show storage info for the selected format
        if (this.formatSizes && this.selectedFormat) {
            const formatSize = this.formatSizes[this.selectedFormat];
            if (formatSize) {
                // Create or update download storage info section
                let storageDownloadInfo = document.querySelector('.download-storage-info');
                if (!storageDownloadInfo) {
                    storageDownloadInfo = document.createElement('div');
                    storageDownloadInfo.className = 'download-storage-info';
                    
                    // Insert after progress info
                    const progressInfo = document.querySelector('.progress-info');
                    if (progressInfo) {
                        progressInfo.parentNode.insertBefore(storageDownloadInfo, progressInfo.nextSibling);
                    }
                }

                // Update storage info content
                let content = `<div class="storage-item">
                    <span class="storage-label">Expected Size:</span>
                    <span class="storage-value">${formatSize.size_display}</span>
                </div>`;

                // Add remaining space info if available from progress
                if (progress.storage_info) {
                    const remainingSpace = progress.storage_info.remaining_space_formatted || 'Calculating...';
                    content += `<div class="storage-item">
                        <span class="storage-label">Space After Download:</span>
                        <span class="storage-value">${remainingSpace}</span>
                    </div>`;

                    // Warn if running low on space
                    if (progress.storage_info.remaining_space < 1024 * 1024 * 100) { // Less than 100MB
                        content += `<div class="storage-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            Low disk space remaining!
                        </div>`;
                    }
                }

                storageDownloadInfo.innerHTML = content;
            }
        }
    }

    animateProgressBar(targetProgress) {
        const progressFill = this.elements.progressFill;
        const currentWidth = parseFloat(progressFill.style.width) || 0;

        // Only animate if there's a significant change
        if (Math.abs(targetProgress - currentWidth) > 0.1) {
            // Add smooth transition
            progressFill.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            progressFill.style.width = `${targetProgress}%`;

            // Add pulse effect for active downloading
            if (targetProgress > currentWidth && targetProgress < 100) {
                progressFill.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
                setTimeout(() => {
                    progressFill.style.boxShadow = '';
                }, 300);
            }
        }
    }

    updateProgressBarState(status, progress) {
        const progressFill = this.elements.progressFill;
        const progressBar = progressFill.parentElement;

        // Remove existing state classes
        progressBar.classList.remove('progress-downloading', 'progress-paused', 'progress-error');

        // Add appropriate state class
        switch (status) {
            case 'downloading':
                progressBar.classList.add('progress-downloading');
                break;
            case 'paused':
                progressBar.classList.add('progress-paused');
                break;
            case 'error':
                progressBar.classList.add('progress-error');
                break;
        }

        // Add completion effect
        if (progress >= 100) {
            progressFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
            progressBar.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
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

    hideProgressSection() {
        if (this.elements.progressSection) {
            this.elements.progressSection.style.display = 'none';
        }
        this.isDownloading = false;
    }

    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
        }

        // Set message and type
        notification.textContent = message;
        notification.className = `notification notification-${type} show`;

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
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

    showLoading(message = 'Analyzing video...') {
        if (this.elements && this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'flex';
            
            // Update loading message
            const loadingMessage = this.elements.loadingOverlay.querySelector('p');
            if (loadingMessage) {
                loadingMessage.textContent = message;
            }
        } else {
            console.error('loadingOverlay element not found or elements not initialized');
        }
    }

    hideLoading() {
        if (this.elements && this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'none';
        } else {
            console.error('loadingOverlay element not found or elements not initialized');
        }
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
            
            // Refresh storage information for the new folder
            this.refreshStorageForCurrentFolder();
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

    // Storage Management Methods
    async loadDefaultFolderInfo() {
        try {
            const response = await fetch('/api/default-folder');
            const data = await response.json();

            if (data.success && data.storage_info) {
                this.updateStorageInfo(data.storage_info);
                this.showStoragePanel();
            }
        } catch (error) {
            console.error('Error loading default folder info:', error);
        }
    }

    updateStorageInfo(storageInfo) {
        if (!this.elements.availableSpace) return;

        // Handle both old and new property names for compatibility
        const freeSpace = storageInfo.free_space || storageInfo.free;
        const totalSpace = storageInfo.total_space || storageInfo.total;
        const usagePercent = storageInfo.usage_percent || storageInfo.percent;

        // Use formatted values if available, otherwise format the raw values
        this.elements.availableSpace.textContent = storageInfo.free_formatted || formatFileSize(freeSpace);
        this.elements.totalSpace.textContent = storageInfo.total_formatted || formatFileSize(totalSpace);

        // Ensure usagePercent is defined before calling toFixed
        if (usagePercent !== undefined && usagePercent !== null) {
            this.elements.storageUsage.textContent = `${usagePercent.toFixed(1)}%`;

            // Update storage bar
            this.elements.storageBarFill.style.width = `${usagePercent}%`;

            // Update bar color based on usage
            if (usagePercent < 70) {
                this.elements.storageBarFill.style.background = 'linear-gradient(90deg, #4ade80, #22c55e)';
            } else if (usagePercent < 90) {
                this.elements.storageBarFill.style.background = 'linear-gradient(90deg, #fbbf24, #f59e0b)';
            } else {
                this.elements.storageBarFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
            }
        } else {
            // Fallback if percentage is not available
            this.elements.storageUsage.textContent = 'Unknown';
            this.elements.storageBarFill.style.width = '0%';
            this.elements.storageBarFill.style.background = 'linear-gradient(90deg, #cbd5e1, #94a3b8)';
        }
    }

    showStoragePanel() {
        if (this.elements.storageInfoPanel) {
            this.elements.storageInfoPanel.style.display = 'block';
        }
    }

    async refreshStorageInfo() {
        try {
            // Show loading state
            if (this.elements.refreshStorageBtn) {
                this.elements.refreshStorageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }

            // Use the new refreshStorageForCurrentFolder method
            await this.refreshStorageForCurrentFolder();
            
        } catch (error) {
            console.error('Error refreshing storage info:', error);
            this.showError('Failed to refresh storage information');
        } finally {
            // Restore button
            if (this.elements.refreshStorageBtn) {
                this.elements.refreshStorageBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }
        }
    }

    async openStorageHistory() {
        if (!this.elements.storageHistoryModal) return;

        this.elements.storageHistoryModal.style.display = 'flex';
        
        try {
            const response = await fetch('/api/storage-analytics');
            const data = await response.json();

            if (data.success) {
                this.updateStorageAnalytics(data.analytics);
                this.updateDrivesList(data.drives);
            }
        } catch (error) {
            console.error('Error loading storage analytics:', error);
        }
    }

    updateStorageAnalytics(analytics) {
        if (this.elements.totalDownloads) {
            this.elements.totalDownloads.textContent = analytics.total_downloads;
        }
        if (this.elements.totalStorageUsed) {
            this.elements.totalStorageUsed.textContent = analytics.total_size_formatted;
        }
        if (this.elements.storageLocationsCount) {
            this.elements.storageLocationsCount.textContent = analytics.by_location.length;
        }

        // Update recent downloads
        this.updateRecentDownloads(analytics.recent_downloads);
        
        // Update storage by location
        this.updateStorageByLocation(analytics.by_location);
    }

    updateRecentDownloads(downloads) {
        if (!this.elements.recentDownloadsList) return;

        if (downloads.length === 0) {
            this.elements.recentDownloadsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-download"></i>
                    <h5>No downloads yet</h5>
                    <p>Your recent downloads will appear here</p>
                </div>
            `;
            return;
        }

        this.elements.recentDownloadsList.innerHTML = downloads.map(download => `
            <div class="download-item">
                <div class="download-info">
                    <div class="download-title">${escapeHtml(download.title)}</div>
                    <div class="download-meta">
                        <span><i class="fas fa-hdd"></i> ${download.size_formatted}</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(download.date)}</span>
                        <span><i class="fas fa-folder"></i> ${escapeHtml(download.location)}</span>
                    </div>
                </div>
                <div class="download-actions">
                    <button class="action-btn" onclick="app.openFileLocation('${escapeHtml(download.path)}')" title="Open file location">
                        <i class="fas fa-folder-open"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStorageByLocation(locations) {
        if (!this.elements.storageLocationsList) return;

        if (locations.length === 0) {
            this.elements.storageLocationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-marker-alt"></i>
                    <h5>No storage locations</h5>
                    <p>Download files to see storage usage by location</p>
                </div>
            `;
            return;
        }

        this.elements.storageLocationsList.innerHTML = locations.map(location => `
            <div class="location-item">
                <div class="location-info">
                    <div class="location-path">${escapeHtml(location.location)}</div>
                    <div class="location-meta">
                        <span><i class="fas fa-download"></i> ${location.count} downloads</span>
                        <span><i class="fas fa-hdd"></i> ${location.size_formatted}</span>
                    </div>
                </div>
                <div class="location-actions">
                    <button class="action-btn" onclick="app.openFileLocation('${escapeHtml(location.location)}')" title="Open location">
                        <i class="fas fa-folder-open"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async openStorageManagement() {
        if (!this.elements.storageManagementModal) return;

        this.elements.storageManagementModal.style.display = 'flex';
        
        try {
            const response = await fetch('/api/storage-info');
            const data = await response.json();

            if (data.success) {
                this.updateDrivesList(data.drives);
                this.loadFavoriteLocations();
            }
        } catch (error) {
            console.error('Error loading storage management:', error);
        }
    }

    updateDrivesList(drives) {
        if (!this.elements.drivesList) return;

        if (drives.length === 0) {
            this.elements.drivesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-hard-drive"></i>
                    <h5>No drives found</h5>
                    <p>Unable to detect storage drives</p>
                </div>
            `;
            return;
        }

        this.elements.drivesList.innerHTML = drives.map(drive => {
            const usageClass = drive.usage_percent < 70 ? 'low' : drive.usage_percent < 90 ? 'medium' : 'high';
            
            return `
                <div class="drive-item">
                    <div class="drive-info">
                        <div class="drive-name">
                            <i class="fas fa-hard-drive"></i>
                            ${escapeHtml(drive.path)} (${escapeHtml(drive.fstype)})
                        </div>
                        <div class="drive-meta">
                            <span>${drive.free_formatted} free of ${drive.total_formatted}</span>
                            <span>${drive.usage_percent ? drive.usage_percent.toFixed(1) : '0'}% used</span>
                        </div>
                        <div class="drive-usage">
                            <div class="drive-usage-bar">
                                <div class="drive-usage-fill ${usageClass}" style="width: ${drive.usage_percent}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadFavoriteLocations() {
        try {
            const response = await fetch('/api/storage-locations');
            const data = await response.json();

            if (data.success) {
                this.updateFavoriteLocations(data.locations);
            }
        } catch (error) {
            console.error('Error loading favorite locations:', error);
        }
    }

    updateFavoriteLocations(locations) {
        if (!this.elements.favoriteLocationsList) return;

        if (locations.length === 0) {
            this.elements.favoriteLocationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <h5>No favorite locations</h5>
                    <p>Add frequently used download locations here</p>
                </div>
            `;
            return;
        }

        this.elements.favoriteLocationsList.innerHTML = locations.map(location => `
            <div class="favorite-item">
                <div class="favorite-info">
                    <div class="favorite-path">
                        ${location.is_default ? '<i class="fas fa-star" style="color: #fbbf24;"></i>' : '<i class="fas fa-folder"></i>'}
                        ${escapeHtml(location.alias || location.path)}
                    </div>
                    <div class="favorite-meta">
                        <span>${escapeHtml(location.path)}</span>
                        ${location.free_formatted ? `<span>${location.free_formatted} free</span>` : ''}
                        <span>Last used: ${formatDate(location.last_used)}</span>
                    </div>
                </div>
                <div class="favorite-actions">
                    ${!location.is_default ? `
                        <button class="action-btn primary" onclick="app.setDefaultLocation(${location.id})" title="Set as default">
                            <i class="fas fa-star"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn" onclick="app.openFileLocation('${escapeHtml(location.path)}')" title="Open location">
                        <i class="fas fa-folder-open"></i>
                    </button>
                    <button class="action-btn danger" onclick="app.removeLocation(${location.id})" title="Remove location">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    closeStorageHistory() {
        if (this.elements.storageHistoryModal) {
            this.elements.storageHistoryModal.style.display = 'none';
        }
    }

    closeStorageManagement() {
        if (this.elements.storageManagementModal) {
            this.elements.storageManagementModal.style.display = 'none';
        }
    }

    async addStorageLocation() {
        const path = this.elements.newLocationPath?.value.trim();
        const alias = this.elements.newLocationAlias?.value.trim();

        if (!path) {
            this.showError('Please enter a folder path');
            return;
        }

        try {
            const response = await fetch('/api/storage-locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'add',
                    path: path,
                    alias: alias
                })
            });

            const data = await response.json();

            if (data.success) {
                this.elements.newLocationPath.value = '';
                this.elements.newLocationAlias.value = '';
                this.loadFavoriteLocations();
                this.showSuccess('Storage location added successfully');
            } else {
                this.showError(data.error || 'Failed to add storage location');
            }
        } catch (error) {
            console.error('Error adding storage location:', error);
            this.showError('Failed to add storage location');
        }
    }

    browseNewLocation() {
        // Open folder browser for new location
        this.openFolderBrowser();
        
        // When a folder is selected, update the new location path
        const originalConfirm = this.confirmFolderSelection.bind(this);
        this.confirmFolderSelection = () => {
            if (this.elements.newLocationPath) {
                this.elements.newLocationPath.value = this.selectedFolderForModal;
            }
            this.closeFolderBrowser();
            this.confirmFolderSelection = originalConfirm;
        };
    }

    async setDefaultLocation(locationId) {
        try {
            const response = await fetch('/api/storage-locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'set_default',
                    id: locationId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.loadFavoriteLocations();
                this.showSuccess('Default storage location updated');
            } else {
                this.showError(data.error || 'Failed to update default location');
            }
        } catch (error) {
            console.error('Error setting default location:', error);
            this.showError('Failed to update default location');
        }
    }

    async removeLocation(locationId) {
        if (!confirm('Are you sure you want to remove this storage location?')) {
            return;
        }

        try {
            const response = await fetch('/api/storage-locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'remove',
                    id: locationId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.loadFavoriteLocations();
                this.showSuccess('Storage location removed');
            } else {
                this.showError(data.error || 'Failed to remove storage location');
            }
        } catch (error) {
            console.error('Error removing storage location:', error);
            this.showError('Failed to remove storage location');
        }
    }

    async openFileLocation(path) {
        try {
            const response = await fetch('/api/open-folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ folder: path })
            });

            const data = await response.json();

            if (!data.success) {
                this.showError(data.error || 'Failed to open folder');
            }
        } catch (error) {
            console.error('Error opening folder:', error);
            this.showError('Failed to open folder');
        }
    }

    // Initialize storage features
    initializeStorage() {
        this.loadDefaultFolderInfo();
    }

    async refreshStorageForCurrentFolder() {
        if (!this.currentUrl) return;

        try {
            // Get current download path
            const downloadPath = this.selectedFolder || '';
            
            const response = await fetch('/api/analyze-formats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    url: this.currentUrl,
                    download_path: downloadPath
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update storage info
                this.currentStorageInfo = data.storage_info;

                // Show updated storage information
                this.showStorageInfo();
                
                // Update selected format storage if a format is already selected
                if (this.selectedFormat) {
                    this.showSelectedFormatStorage();
                }
            }
        } catch (error) {
            console.error('Error refreshing storage info:', error);
        }
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
    const app = new YouTubeDownloader();
    
    // Make app globally accessible for storage functions
    window.app = app;
    
    // Initialize storage features
    app.initializeStorage();

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

// Helper functions for storage
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
