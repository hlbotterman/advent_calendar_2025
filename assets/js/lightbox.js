/**
 * lightbox.js - Image lightbox functionality
 */

(function() {
    'use strict';

    const lightbox = {
        element: null,
        image: null,
        closeBtn: null,
        prevBtn: null,
        nextBtn: null,
        counter: null,
        currentImages: [],
        currentIndex: 0,

        init: function() {
            // Get DOM elements
            this.element = document.getElementById('imageLightbox');
            this.image = document.getElementById('lightboxImage');
            this.closeBtn = document.getElementById('lightboxClose');
            this.prevBtn = document.getElementById('lightboxPrev');
            this.nextBtn = document.getElementById('lightboxNext');
            this.counter = document.getElementById('lightboxCounter');

            // Setup event listeners
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            // Close button
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.close());
            }

            // Click on background to close
            this.element.addEventListener('click', (e) => {
                if (e.target === this.element) {
                    this.close();
                }
            });

            // Click on image to close
            this.image.addEventListener('click', () => this.close());

            // Navigation buttons
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', () => this.showPrevious());
            }
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => this.showNext());
            }

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (!this.element.classList.contains('active')) return;

                switch(e.key) {
                    case 'Escape':
                        this.close();
                        break;
                    case 'ArrowLeft':
                        this.showPrevious();
                        break;
                    case 'ArrowRight':
                        this.showNext();
                        break;
                }
            });
        },

        open: function(images, startIndex = 0) {
            this.currentImages = images;
            this.currentIndex = startIndex;
            this.showImage();
            this.element.classList.add('active');
            this.element.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        },

        close: function() {
            this.element.classList.remove('active');
            this.element.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = ''; // Restore body scroll
        },

        showImage: function() {
            if (this.currentImages.length === 0) return;

            const currentImage = this.currentImages[this.currentIndex];
            this.image.src = currentImage;
            this.image.alt = `Image ${this.currentIndex + 1}`;

            // Update counter
            this.counter.textContent = `${this.currentIndex + 1} / ${this.currentImages.length}`;

            // Update navigation buttons
            this.prevBtn.disabled = (this.currentIndex === 0);
            this.nextBtn.disabled = (this.currentIndex === this.currentImages.length - 1);

            // Hide navigation if only one image
            if (this.currentImages.length === 1) {
                this.prevBtn.style.display = 'none';
                this.nextBtn.style.display = 'none';
                this.counter.style.display = 'none';
            } else {
                this.prevBtn.style.display = 'flex';
                this.nextBtn.style.display = 'flex';
                this.counter.style.display = 'block';
            }
        },

        showPrevious: function() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.showImage();
            }
        },

        showNext: function() {
            if (this.currentIndex < this.currentImages.length - 1) {
                this.currentIndex++;
                this.showImage();
            }
        }
    };

    // Initialize lightbox when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => lightbox.init());
    } else {
        lightbox.init();
    }

    // Make lightbox available globally
    window.Lightbox = lightbox;

})();
