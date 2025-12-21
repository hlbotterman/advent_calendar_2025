/**
 * finale.js - Rapid Slideshow Finale
 */

(function() {
    'use strict';

    const finale = {
        overlay: null,
        closeBtn: null,
        currentIndex: 0,
        images: [],
        intervalId: null,

        init: function() {
            if (!document.querySelector('.finale-overlay')) {
                this.createOverlay();
            }
            
            this.overlay = document.querySelector('.finale-overlay');
            this.closeBtn = document.querySelector('.finale-close');

            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.closeFinale());
            }
        },

        createOverlay: function() {
            const overlay = document.createElement('div');
            overlay.className = 'finale-overlay';
            overlay.innerHTML = `
                <div class="slideshow-container">
                    <img id="slideshowImage" class="slideshow-image" src="" alt="">
                    <div class="slideshow-caption"></div>
                </div>
                
                <div class="finale-message">
                    <h1 class="finale-title">Merci d'avoir suivi ces aventures ! 🌍</h1>
                    <p class="finale-subtitle">Joyeux Noël et joyeuses fêtes de fin d'année !</p>
                </div>

                <button class="finale-close">Fermer</button>
            `;
            document.body.appendChild(overlay);
        },

        checkDay24Closed: function(dayNumber, locations) {
            if (dayNumber === 24) {
                setTimeout(() => {
                    this.startFinale(locations);
                }, 500);
            }
        },

        startFinale: function(locationsData) {
            if (!this.overlay) return;

            this.overlay.classList.add('active');
            
            // Collect ALL images from all locations
            this.images = [];
            const locations = locationsData || [];
            
            locations.forEach(loc => {
                if (loc.images && loc.images.length > 0) {
                    // Add ALL images from this location
                    loc.images.forEach(img => {
                        this.images.push({
                            src: img,
                            title: loc.title
                        });
                    });
                } else if (loc.image) {
                    this.images.push({
                        src: loc.image,
                        title: loc.title
                    });
                } else if (loc.thumbnail) {
                    this.images.push({
                        src: loc.thumbnail,
                        title: loc.title
                    });
                }
            });

            // Start slideshow
            this.currentIndex = 0;
            this.showNextImage();
            
            // Slideshow (400ms per image)
            this.intervalId = setInterval(() => {
                this.currentIndex++;
                if (this.currentIndex < this.images.length) {
                    this.showNextImage();
                } else {
                    // End of slideshow
                    clearInterval(this.intervalId);
                    this.showFinalMessage();
                }
            }, 400); // 400ms per image
        },

        showNextImage: function() {
            const img = document.getElementById('slideshowImage');
            const caption = this.overlay.querySelector('.slideshow-caption');
            const currentImage = this.images[this.currentIndex];
            
            if (img && currentImage) {
                img.src = currentImage.src;
                img.alt = currentImage.title;
                caption.textContent = currentImage.title;
                
                // Flash effect
                img.classList.remove('flash');
                void img.offsetWidth; // Force reflow
                img.classList.add('flash');
            }
        },

        showFinalMessage: function() {
            // Hide slideshow
            const container = this.overlay.querySelector('.slideshow-container');
            if (container) {
                container.classList.add('fade-out');
            }
            
            // Show final message
            setTimeout(() => {
                const message = this.overlay.querySelector('.finale-message');
                if (message) {
                    message.classList.add('visible');
                }
                
                const closeBtn = this.overlay.querySelector('.finale-close');
                if (closeBtn) {
                    closeBtn.classList.add('visible');
                }
            }, 500);
        },

        closeFinale: function() {
            if (this.overlay) {
                // Stop slideshow if running
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                }
                
                this.overlay.classList.remove('active');
                
                // Reset
                setTimeout(() => {
                    this.overlay.querySelectorAll('.visible, .fade-out, .flash').forEach(el => {
                        el.classList.remove('visible', 'fade-out', 'flash');
                    });
                    this.currentIndex = 0;
                }, 500);
            }
        }
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => finale.init());
    } else {
        finale.init();
    }

    window.AdventFinale = finale;

})();
