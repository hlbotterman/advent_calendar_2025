/**
 * app.js - Main application logic for Advent World Postcards
 */

(function() {
    'use strict';

    // Configuration
    // Available tile options (change tileURL and attribution):
    // 1. OpenStreetMap Standard (current, free)
    // 2. CartoDB Voyager (beautiful, light colored map)
    //    tileURL: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    //    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    // 3. CartoDB Positron (clean, minimal light map)
    //    tileURL: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    //    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    // 4. Esri WorldImagery (satellite imagery)
    //    tileURL: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    //    attribution: 'Tiles &copy; Esri'

    const CONFIG = {
        tileURL: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
        initialView: {
            lat: 20,
            lng: 0,
            zoom: 2
        },
        testMode: false, // Set to false for production (enables real date locking)
        testModeUnlockDay: 24 // In test mode, unlock up to this day (1-24)
    };

    // Global state
    const state = {
        map: null,
        locations: [],
        markers: {},
        currentPostcard: null,
        unlockedOnly: !CONFIG.testMode, // Show all in test mode, only unlocked in production
        currentImages: [],
        currentImageIndex: 0,
        passport: null // Store passport instance
    };

    // DOM elements (will be initialized when needed)
    const elements = {};

    /**
     * Setup welcome screen
     * Note: Password handling is now done by auth.js
     */
    function setupWelcomeScreen() {
        // Listen for the custom event triggered after successful authentication
        document.addEventListener('calendarReady', () => {
            initCalendar();
        });
    }

    /**
     * Initialize DOM elements
     */
    function initElements() {
        elements.map = document.getElementById('map');
        elements.panel = document.getElementById('postcardPanel');
        elements.closeBtn = document.getElementById('closeBtn');
        elements.postcardTitle = document.getElementById('postcardTitle');
        elements.postcardDay = document.getElementById('postcardDay');
        elements.postcardImage = document.getElementById('postcardImage');
        elements.postcardText = document.getElementById('postcardText');
        elements.postcardContent = document.querySelector('.postcard-content');
        elements.lockedContent = document.getElementById('lockedContent');
        elements.unlockDate = document.getElementById('unlockDate');
        elements.prevBtn = document.getElementById('prevBtn');
        elements.nextBtn = document.getElementById('nextBtn');
        elements.testDaySlider = document.getElementById('testDaySlider');
        elements.testDayValue = document.getElementById('testDayValue');
        elements.testModeControl = document.getElementById('testModeControl');
        elements.emojiReactionsDisplay = document.getElementById('emojiReactionsDisplay');
        elements.resetBtn = document.getElementById('resetBtn');
        elements.galleryPrevBtn = document.getElementById('galleryPrevBtn');
        elements.galleryNextBtn = document.getElementById('galleryNextBtn');
        elements.galleryIndicator = document.getElementById('galleryIndicator');
        elements.currentImageIndex = document.getElementById('currentImageIndex');
        elements.totalImages = document.getElementById('totalImages');
        elements.passportBtn = document.getElementById('passportBtn');
    }

    /**
     * Initialize the calendar application
     */
    async function initCalendar() {
        try {
            // Wait for CryptoJS to be loaded
            await waitForCryptoJS();

            // Initialize DOM elements first
            initElements();

            // Load location data
            state.locations = await loadLocations();

            // Initialize map
            initMap();

            // Create markers for all locations
            createMarkers();

            // Avatars removed - only day markers on the map

            // Setup event listeners
            setupEventListeners();

            // Update progress
            updateProgress();
            
            // Initialize Passport
            initPassport();
            
            // Hide test mode control in production
            if (!CONFIG.testMode && elements.testModeControl) {
                elements.testModeControl.style.display = 'none';
            }

            // Setup real-time Firebase listeners
            setupRealtimeListeners();


        } catch (error) {
            console.error('Failed to initialize application:', error);
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
            alert('Failed to load postcards: ' + error.message + '\n\nPlease check the console for details.');
        }
    }

    /**
     * Setup real-time Firebase listeners
     */
    function setupRealtimeListeners() {
        // Listen to emoji reactions changes
        window.FirebaseDB.onEmojiReactionsChange(() => {
            // Only update if a postcard is currently open
            if (state.currentPostcard) {
                displayEmojiReactions(state.currentPostcard);
            }
        });


    }

    /**
     * Initialize the application (entry point)
     */
    function init() {
        // Setup welcome screen button
        setupWelcomeScreen();
    }

    /**
     * Wait for CryptoJS to be loaded
     */
    function waitForCryptoJS() {
        return new Promise((resolve) => {
            if (typeof CryptoJS !== 'undefined') {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (typeof CryptoJS !== 'undefined') {
                        clearInterval(checkInterval);

                        resolve();
                    }
                }, 50);

                // Timeout after 5 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.error('CryptoJS failed to load after 5 seconds');
                    resolve();
                }, 5000);
            }
        });
    }

    /**
     * Decrypt text using password
     */
    function decryptText(encryptedText, password) {
        if (!encryptedText || !password) return '';

        if (typeof CryptoJS === 'undefined') {
            console.error('CryptoJS is not loaded!');
            return encryptedText;
        }

        try {
            const bytes = CryptoJS.AES.decrypt(encryptedText, password);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            return decrypted || encryptedText; // Return original if decryption fails
        } catch (error) {
            console.error('Decryption error:', error);
            return encryptedText; // Return original text if error
        }
    }

    /**
     * Load locations from JSON and decrypt texts
     */
    async function loadLocations() {
        // Add timestamp to prevent caching issues during development
        const cacheBuster = `?t=${Date.now()}`;
        const response = await fetch(`assets/data/locations.json${cacheBuster}`);
        if (!response.ok) {
            throw new Error('Failed to load locations data');
        }
        const locations = await response.json();

        // Get decryption key from auth
        const password = window.getDecryptionKey && window.getDecryptionKey();


        // Decrypt texts if password is available
        if (password) {

            return locations.map(location => ({
                ...location,
                text: location.text ? decryptText(location.text, password) : ''
            }));
        }

        console.warn('No decryption password found, returning encrypted texts');
        return locations;
    }

    /**
     * Initialize Leaflet map
     */
    function initMap() {
        // Check if map container exists
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('Map container not found');
            return;
        }

        state.map = L.map('map', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView(
            [CONFIG.initialView.lat, CONFIG.initialView.lng],
            CONFIG.initialView.zoom
        );

        L.tileLayer(CONFIG.tileURL, {
            attribution: CONFIG.attribution,
            maxZoom: 18,
            minZoom: 2
        }).addTo(state.map);

        // Force map to recalculate size
        setTimeout(() => {
            state.map.invalidateSize();
        }, 100);
    }

    /**
     * Create markers for all postcard locations
     */
    function createMarkers() {
        state.locations.forEach(location => {
            const isLocked = !isUnlocked(location);

            // Skip locked markers if unlockedOnly is true
            if (state.unlockedOnly && isLocked) {
                return;
            }

            const icon = createLocationIcon(isLocked, location.day);

            const marker = L.marker([location.lat, location.lng], {
                icon: icon,
                title: location.title,
                riseOnHover: true
            }).addTo(state.map);

            // Store reference
            state.markers[location.day] = {
                marker: marker,
                location: location,
                isLocked: isLocked
            };

            // Click handler
            marker.on('click', () => {
                openPostcard(location.day);
            });

            // Tooltip
            if (isLocked) {
                marker.bindTooltip(`${location.title}<br>Opens on ${formatDate(location.locked_until)}`, {
                    direction: 'top',
                    opacity: 0.9,
                    className: 'custom-tooltip'
                });
            } else {
                // Unlocked: show image in tooltip (use thumbnail if available, fallback to first image)
                const thumbnailImage = location.thumbnail || (location.images ? location.images[0] : location.image);
                const tooltipContent = `
                    <div class="tooltip-with-image">
                        <img src="${thumbnailImage}" alt="${location.title}" class="tooltip-image">
                        <div class="tooltip-title">${location.title}</div>
                    </div>
                `;
                marker.bindTooltip(tooltipContent, {
                    direction: 'top',
                    opacity: 0.9,
                    className: 'custom-tooltip-with-image'
                });
            }

            // Don't add to bounds - we want to keep the world view
            // bounds.push([location.lat, location.lng]);
        });

        // Keep the initial world view - don't auto-zoom to markers
        // The map will stay at the configured initial view (lat: 20, lng: 0, zoom: 2)
    }

    /**
     * Check if a day has been opened
     */
    function isDayOpened(day) {
        const openedDays = JSON.parse(localStorage.getItem('openedDays') || '[]');
        return openedDays.includes(day);
    }

    /**
     * Mark a day as opened
     */
    function markDayAsOpened(day) {
        const openedDays = JSON.parse(localStorage.getItem('openedDays') || '[]');
        if (!openedDays.includes(day)) {
            openedDays.push(day);
            localStorage.setItem('openedDays', JSON.stringify(openedDays));
        }
    }

    /**
     * Reset all opened days (clear the opened status)
     */
    function resetOpenedDays() {
        // Confirm with user
        if (!confirm('Are you sure you want to reset all opened days? This will change all red markers back to blue (but won\'t affect locked/unlocked status).')) {
            return;
        }

        // Clear opened days from localStorage
        localStorage.removeItem('openedDays');

        // Reset Passport
        if (state.passport) {
            state.passport.reset();
        }

        // Refresh all markers to update colors
        refreshMarkers();

        // Update progress counter
        updateProgress();

        // Show feedback
        const btn = elements.resetBtn;
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Reset!';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);


    }

    /**
     * Create location marker icon with day number
     */
    function createLocationIcon(isLocked, day) {
        let color;
        let opacity = 1;

        if (isLocked) {
            // Locked days: gray
            color = '#95a5a6';
            opacity = 0.4;
        } else if (isDayOpened(day)) {
            // Opened days: red
            color = '#e74c3c';
        } else {
            // Unlocked but not opened: blue
            color = '#5a92bbff';
        }

        const lockIcon = isLocked ? '🔒' : '';

        return L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-inner" style="
                width: 36px;
                height: 36px;
                background-color: ${color};
                border: 3px solid white;
                border-radius: 50%;
                opacity: ${opacity};
                box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                color: white;
                transition: transform 0.2s ease;
                ${isLocked ? 'filter: grayscale(100%);' : ''}
            ">${isLocked ? lockIcon : day}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });
    }

    // Avatar markers and motion removed - only day markers on map now

    /**
     * Initialize Info Modal
     */
    function initInfoModal() {
        const infoBtn = document.getElementById('infoBtn');
        const infoModal = document.getElementById('infoModal');
        const closeInfoBtn = document.getElementById('closeInfoBtn');



        if (!infoBtn || !infoModal) {
            console.error('Info Modal elements not found!');
            return;
        }

        // Open
        infoBtn.addEventListener('click', () => {

            infoModal.style.display = 'flex'; // Ensure flex for centering
            // Small delay for transition
            setTimeout(() => {
                infoModal.classList.add('active');
                infoModal.setAttribute('aria-hidden', 'false');
            }, 10);
        });

        // Close
        const closeInfo = () => {
            infoModal.classList.remove('active');
            infoModal.setAttribute('aria-hidden', 'true');
            setTimeout(() => {
                infoModal.style.display = 'none';
            }, 300); // Match CSS transition
        };

        if (closeInfoBtn) {
            closeInfoBtn.addEventListener('click', closeInfo);
        }

        // Close on background click
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) {
                closeInfo();
            }
        });
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Close panel
        if (elements.closeBtn) {
            elements.closeBtn.addEventListener('click', closePanel);
        }

        // Close panel from bottom buttons (mobile)
        const closeBtnBottom = document.getElementById('closeBtnBottom');
        const closeBtnBottomLocked = document.getElementById('closeBtnBottomLocked');
        if (closeBtnBottom) {
            closeBtnBottom.addEventListener('click', closePanel);
        }
        if (closeBtnBottomLocked) {
            closeBtnBottomLocked.addEventListener('click', closePanel);
        }

        // Navigation buttons
        if (elements.prevBtn) {
            elements.prevBtn.addEventListener('click', showPreviousPostcard);
        }
        if (elements.nextBtn) {
            elements.nextBtn.addEventListener('click', showNextPostcard);
        }

        // Test mode slider
        if (CONFIG.testMode && elements.testDaySlider) {
            elements.testDaySlider.addEventListener('input', handleTestDayChange);
        }

        // Emoji reaction buttons
        const emojiButtons = document.querySelectorAll('.emoji-btn');
        emojiButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.currentTarget.getAttribute('data-emoji');
                const button = e.currentTarget;

                // Add immediate visual feedback
                button.style.animation = 'none';
                setTimeout(() => {
                    button.style.animation = '';
                }, 10);

                toggleEmojiReaction(emoji);
            });
        });

        // Reset button
        if (elements.resetBtn) {
            elements.resetBtn.addEventListener('click', resetOpenedDays);
        }

        // Gallery navigation buttons
        if (elements.galleryPrevBtn) {
            elements.galleryPrevBtn.addEventListener('click', showPreviousImage);
        }
        if (elements.galleryNextBtn) {
            elements.galleryNextBtn.addEventListener('click', showNextImage);
        }

        // Lightbox - Click on image to zoom
        if (elements.postcardImage) {
            elements.postcardImage.addEventListener('click', openLightbox);
        }

        // Keyboard navigation
        document.addEventListener('keydown', handleKeyboard);
        
        // Passport button
        if (elements.passportBtn) {
            elements.passportBtn.addEventListener('click', () => {
                if (state.passport) {
                    state.passport.open();
                }
            });
        }
        // Info Modal
        try {
            initInfoModal();
        } catch (e) {
            console.error('Error initializing Info Modal:', e);
        }

        initTheme();

        // Finish Journey Button (Day 24) - New placement in nav
        const finishBtn = document.getElementById('finishBtn');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                // Close panel
                closePanel();
                // Finale is triggered automatically by closePanel when day 24 is closed
            });
        }
    }

    /**
     * Load Avatar B's message - Empty function (feature removed)
     */
    async function loadAvatarBMessage(day) {
        // Avatar B messages feature has been removed
        // This function is kept for compatibility but does nothing
        return;
    }

    /**
     * Get all emoji reactions from Firebase
     */
    async function getEmojiReactions() {
        return await window.FirebaseDB.getEmojiReactions();
    }

    /**
     * Save emoji reactions to Firebase
     */
    async function saveEmojiReactions(reactions) {
        await window.FirebaseDB.saveEmojiReactions(reactions);
    }

    /**
     * Toggle emoji reaction for current day
     */
    async function toggleEmojiReaction(emoji) {
        const day = state.currentPostcard;
        if (!day) return;

        try {
            // Get current button to provide immediate feedback
            const emojiButton = document.querySelector(`.emoji-btn[data-emoji="${emoji}"]`);

            const reactions = await getEmojiReactions();

            // Initialize reactions array for this day if it doesn't exist
            if (!reactions[day]) {
                reactions[day] = [];
            }

            // Check if emoji already exists
            const index = reactions[day].indexOf(emoji);

            if (index > -1) {
                // Remove emoji if it already exists
                reactions[day].splice(index, 1);
                // Immediate visual feedback
                if (emojiButton) {
                    emojiButton.classList.remove('selected');
                }
            } else {
                // Add emoji
                reactions[day].push(emoji);
                // Immediate visual feedback
                if (emojiButton) {
                    emojiButton.classList.add('selected');
                }
            }

            // Save to Firebase
            await saveEmojiReactions(reactions);

            // Update display
            await displayEmojiReactions(day);
        } catch (error) {
            console.error('Error toggling emoji reaction:', error);
        }
    }

    /**
     * Display emoji reactions for a specific day
     */
    async function displayEmojiReactions(day) {
        const reactions = await getEmojiReactions();
        const dayReactions = reactions[day] || [];
        const display = elements.emojiReactionsDisplay;

        if (!display) return;

        // Clear existing reactions
        display.innerHTML = '';

        // Display each reaction
        dayReactions.forEach(emoji => {
            const reactionItem = document.createElement('div');
            reactionItem.className = 'emoji-reaction-item';
            reactionItem.innerHTML = `
                <span class="emoji-char">${emoji}</span>
                <button class="emoji-remove" title="Remove reaction" data-emoji="${emoji}">×</button>
            `;

            // Add remove button listener
            const removeBtn = reactionItem.querySelector('.emoji-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const emojiToRemove = e.currentTarget.getAttribute('data-emoji');
                toggleEmojiReaction(emojiToRemove);
            });

            display.appendChild(reactionItem);
        });

        // Update emoji button states
        updateEmojiButtonStates(dayReactions);
    }

    /**
     * Update visual state of emoji buttons based on current reactions
     */
    function updateEmojiButtonStates(activeReactions) {
        const emojiButtons = document.querySelectorAll('.emoji-btn');
        emojiButtons.forEach(btn => {
            const emoji = btn.getAttribute('data-emoji');
            
            // Reset inline styles that might have been set previously
            btn.style.background = '';
            btn.style.borderColor = '';
            
            if (activeReactions.includes(emoji)) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    /**
     * Handle test day slider change
     */
    function handleTestDayChange(e) {
        const day = parseInt(e.target.value);
        elements.testDayValue.textContent = day;
        CONFIG.testModeUnlockDay = day;

        // Refresh the map
        refreshMarkers();
        updateProgress();
    }

    /**
     * Refresh all markers with new lock states
     */
    function refreshMarkers() {
        // Remove all existing markers
        Object.values(state.markers).forEach(({ marker }) => {
            state.map.removeLayer(marker);
        });

        // Clear markers object
        state.markers = {};

        // Recreate all markers
        createMarkers();
    }

    /**
     * Handle keyboard events
     */
    function handleKeyboard(e) {
        if (!elements.panel.classList.contains('open')) return;

        switch(e.key) {
            case 'Escape':
                closePanel();
                break;
            case 'ArrowLeft':
                showPreviousPostcard();
                break;
            case 'ArrowRight':
                showNextPostcard();
                break;
        }
    }

    /**
     * Check if a location is unlocked
     */
    function isUnlocked(location) {
        // Test mode: unlock up to specified day
        if (CONFIG.testMode) {
            return location.day <= CONFIG.testModeUnlockDay;
        }

        // Production mode: check actual date in user's local timezone
        // Parse the unlock date as a local date (midnight in user's timezone)
        const unlockDate = new Date(location.locked_until + 'T00:00:00');

        // Get today's date at midnight in user's local timezone
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return today >= unlockDate;
    }

    /**
     * Open postcard panel
     */
    function openPostcard(day) {
        const postcardData = state.markers[day];
        if (!postcardData) return;

        const { location, isLocked, marker } = postcardData;
        state.currentPostcard = day;

        if (isLocked) {
            showLockedContent(location);
        } else {
            showPostcardContent(location);

            // Mark day as opened and update marker color
            if (!isDayOpened(day)) {
                markDayAsOpened(day);
                // Update the marker icon to red
                const newIcon = createLocationIcon(false, day);
                marker.setIcon(newIcon);
                // Update progress stats
                updateProgress();
                
                // Add stamp to passport
                if (state.passport) {
                    state.passport.addStamp(day, location);
                }
            }
        }

        elements.panel.classList.add('open');
        elements.panel.setAttribute('aria-hidden', 'false');

        // Map stays in place - no auto-pan on day selection

        // Update navigation buttons
        updateNavigationButtons();
    }

    // Expose openPostcard globally for Passport
    window.openPostcard = openPostcard;

    /**
     * Show postcard content
     */
    function showPostcardContent(location) {
        elements.postcardTitle.textContent = location.title;
        elements.postcardDay.textContent = `Day ${location.day}`;
        elements.postcardText.textContent = location.text;

        // Setup image gallery
        setupImageGallery(location);

        // Load Avatar B's message for this day
        loadAvatarBMessage(location.day);

        // Load emoji reactions for this day
        displayEmojiReactions(location.day);

        elements.postcardContent.classList.add('active');
        elements.lockedContent.classList.remove('active');

        // Day 24 Special Handling: Hide top close button
        const closeBtn = document.getElementById('closeBtn');
        
        if (location.day === 24) {
            // Hide standard close button to force using the bottom button
            if (closeBtn) closeBtn.style.display = 'none';
        } else {
            // Show standard close button
            if (closeBtn) closeBtn.style.display = 'flex';
        }
    }

    /**
     * Setup image gallery for a location
     */
    function setupImageGallery(location) {
        // Support both old format (image) and new format (images array)
        const images = location.images || [location.image];

        state.currentImages = images;
        state.currentImageIndex = 0;

        // Show first image
        displayCurrentImage();

        // Show/hide navigation controls
        if (images.length > 1) {
            elements.galleryPrevBtn.style.display = 'flex';
            elements.galleryNextBtn.style.display = 'flex';
            elements.galleryIndicator.style.display = 'block';
            elements.totalImages.textContent = images.length;
            updateGalleryButtons();
        } else {
            elements.galleryPrevBtn.style.display = 'none';
            elements.galleryNextBtn.style.display = 'none';
            elements.galleryIndicator.style.display = 'none';
        }
    }

    /**
     * Display current image in gallery
     */
    function displayCurrentImage() {
        if (state.currentImages.length === 0) return;

        const currentImage = state.currentImages[state.currentImageIndex];
        elements.postcardImage.src = currentImage;
        elements.postcardImage.alt = elements.postcardTitle.textContent;
        elements.currentImageIndex.textContent = state.currentImageIndex + 1;
    }

    /**
     * Show previous image in gallery
     */
    function showPreviousImage() {
        if (state.currentImageIndex > 0) {
            state.currentImageIndex--;
            displayCurrentImage();
            updateGalleryButtons();
        }
    }

    /**
     * Show next image in gallery
     */
    function showNextImage() {
        if (state.currentImageIndex < state.currentImages.length - 1) {
            state.currentImageIndex++;
            displayCurrentImage();
            updateGalleryButtons();
        }
    }

    /**
     * Update gallery navigation button states
     */
    function updateGalleryButtons() {
        // Disable prev button if at first image
        elements.galleryPrevBtn.disabled = (state.currentImageIndex === 0);

        // Disable next button if at last image
        elements.galleryNextBtn.disabled = (state.currentImageIndex === state.currentImages.length - 1);
    }

    /**
     * Show locked content
     */
    function showLockedContent(location) {
        elements.unlockDate.textContent = formatDate(location.locked_until);

        elements.postcardContent.classList.remove('active');
        elements.lockedContent.classList.add('active');
    }

    /**
     * Close panel
     */
    function closePanel() {
        const closingDay = state.currentPostcard;

        elements.panel.classList.remove('open');
        elements.panel.setAttribute('aria-hidden', 'true');
        state.currentPostcard = null;

        // Check if we just closed day 24 (trigger finale)
        if (window.AdventFinale && parseInt(closingDay) === 24) {
            window.AdventFinale.checkDay24Closed(parseInt(closingDay), state.locations);
        }
    }

    /**
     * Show previous postcard
     */
    function showPreviousPostcard() {
        if (!state.currentPostcard) return;

        let prevDay = state.currentPostcard - 1;
        while (prevDay >= 1) {
            const postcardData = state.markers[prevDay];
            if (postcardData && (!state.unlockedOnly || !postcardData.isLocked)) {
                openPostcard(prevDay);
                return;
            }
            prevDay--;
        }
    }

    /**
     * Show next postcard
     */
    function showNextPostcard() {
        if (!state.currentPostcard) return;

        let nextDay = state.currentPostcard + 1;
        while (nextDay <= 24) {
            const postcardData = state.markers[nextDay];
            if (postcardData && (!state.unlockedOnly || !postcardData.isLocked)) {
                openPostcard(nextDay);
                return;
            }
            nextDay++;
        }
    }

    /**
     * Update navigation buttons state
     */
    function updateNavigationButtons() {
        if (!state.currentPostcard) return;

        // Check for previous
        let hasPrev = false;
        for (let i = state.currentPostcard - 1; i >= 1; i--) {
            const postcardData = state.markers[i];
            if (postcardData && (!state.unlockedOnly || !postcardData.isLocked)) {
                hasPrev = true;
                break;
            }
        }

        // Check for next
        let hasNext = false;
        for (let i = state.currentPostcard + 1; i <= 24; i++) {
            const postcardData = state.markers[i];
            if (postcardData && (!state.unlockedOnly || !postcardData.isLocked)) {
                hasNext = true;
                break;
            }
        }

        elements.prevBtn.disabled = !hasPrev;
    
    // Day 24 Special Handling: Replace Next with Finish
    const finishBtn = document.getElementById('finishBtn');
    
    if (state.currentPostcard === 24) {
        // Hide Next, Show Finish
        elements.nextBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'block';
    } else {
        // Show Next (if applicable), Hide Finish
        elements.nextBtn.style.display = 'block';
        elements.nextBtn.disabled = !hasNext;
        if (finishBtn) finishBtn.style.display = 'none';
    }
}

    // Replay journey removed - no more avatars on map

    /**
     * Update progress display - Removed (progress stats no longer displayed)
     */
    function updateProgress() {
        // Function kept for compatibility but does nothing
        // Progress stats have been removed from the interface
    }

    /**
     * Format date for display
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }

    /**
     * Open lightbox with current gallery images
     */
    function openLightbox() {
        if (window.Lightbox && state.currentImages.length > 0) {
            window.Lightbox.open(state.currentImages, state.currentImageIndex);
        }
    }

    /**
     * Initialize Passport
     */
    function initPassport() {
        if (typeof Passport !== 'undefined') {
            state.passport = new Passport();
            
            // Sync with existing progress
            const openedDays = JSON.parse(localStorage.getItem('openedDays') || '[]');
            state.passport.syncWithApp(state.locations, openedDays);
        }
    }

    /**
     * Initialize Theme
     */
    function initTheme() {
        const themeBtn = document.getElementById('themeToggleBtn');
        if (!themeBtn) return;

        // Check for saved preference or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
            document.body.setAttribute('data-theme', 'dark');
            themeBtn.textContent = '☀️';
        } else {
            document.body.removeAttribute('data-theme');
            themeBtn.textContent = '🌙';
        }

        // Toggle listener
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                themeBtn.textContent = '🌙';
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeBtn.textContent = '☀️';
            }
        });
    }



    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
