/**
 * finale.js - Mosaic of Memories Finale
 */

(function() {
    'use strict';

    const finale = {
        overlay: null,
        closeBtn: null,
        hasTriggered: false,

        init: function() {
            // Create overlay if it doesn't exist
            if (!document.querySelector('.finale-overlay')) {
                this.createOverlay();
            }
            
            this.overlay = document.querySelector('.finale-overlay');
            this.closeBtn = document.querySelector('.finale-close');

            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.closeFinale());
            }

            // Check if finale has already been shown - REMOVED to allow multiple triggers
            // const finaleShown = localStorage.getItem('advent_finale_shown');
            // if (finaleShown === 'true') {
            //     this.hasTriggered = true;
            // }
        },

        createOverlay: function() {
            const overlay = document.createElement('div');
            overlay.className = 'finale-overlay';
            overlay.innerHTML = `
                <div class="finale-container"></div>
                <div class="finale-message">
                    <h1 class="finale-title">Joyeux Noël</h1>
                    <div class="finale-subtitle">Passe de bonnes vacances !</div>
                </div>
                <button class="finale-close">Fermer</button>
            `;
            document.body.appendChild(overlay);
        },

        /**
         * Check if day 24 was just closed (should trigger finale)
         */
        checkDay24Closed: function(dayNumber, locations) {
            // Trigger for day 24 every time it's closed
            if (dayNumber === 24) {
                // Wait a bit before starting the finale
                setTimeout(() => {
                    this.startFinale(locations);
                }, 500);
            }
        },

        /**
         * Start the finale sequence
         */
        startFinale: async function(locationsData) {
            if (!this.overlay) return;

            // Show overlay
            this.overlay.classList.add('active');
            
            // Get all locations with images
            const locations = locationsData || [];
            const container = this.overlay.querySelector('.finale-container');
            container.innerHTML = ''; // Clear previous

            // Collect all images from all locations
            const allImages = [];
            locations.forEach(loc => {
                if (loc.images && loc.images.length > 0) {
                    loc.images.forEach(img => {
                        allImages.push({ src: img, title: loc.title });
                    });
                } else if (loc.image) {
                    allImages.push({ src: loc.image, title: loc.title });
                } else if (loc.thumbnail) {
                     allImages.push({ src: loc.thumbnail, title: loc.title });
                }
            });
            
            // Create polaroids for all images
            const polaroids = [];
            allImages.forEach((item, index) => {
                const polaroid = document.createElement('div');
                polaroid.className = 'polaroid';
                
                polaroid.innerHTML = `
                    <img src="${item.src}" alt="${item.title}">
                    <div class="polaroid-caption">${item.title}</div>
                `;
                
                // Random initial position (scattered off-screen or edges)
                const randomX = (Math.random() - 0.5) * 150; // %
                const randomY = (Math.random() - 0.5) * 150; // %
                const randomRot = (Math.random() - 0.5) * 60; // deg
                
                polaroid.style.left = '50%';
                polaroid.style.top = '50%';
                polaroid.style.transform = `translate(-50%, -50%) translate(${randomX}vw, ${randomY}vh) rotate(${randomRot}deg) scale(0.5)`;
                
                container.appendChild(polaroid);
                polaroids.push(polaroid);
            });

            // Phase 1: Scatter onto screen (Pile effect)
            await this.wait(100);
            
            polaroids.forEach((p, i) => {
                setTimeout(() => {
                    p.style.opacity = '1';
                    // Move to a random position within the screen
                    const x = (Math.random() - 0.5) * 80; // vw
                    const y = (Math.random() - 0.5) * 80; // vh
                    const rot = (Math.random() - 0.5) * 40; // deg
                    p.style.transform = `translate(-50%, -50%) translate(${x}vw, ${y}vh) rotate(${rot}deg) scale(0.8)`;
                }, i * 100); // Staggered appearance
            });

            // Phase 2: Form Heart Shape
            await this.wait(3000 + (polaroids.length * 100));
            
            this.arrangeInHeart(polaroids);

            // Phase 3: Show Message
            await this.wait(2000);
            const message = this.overlay.querySelector('.finale-message');
            message.classList.add('visible');
            
            const closeBtn = this.overlay.querySelector('.finale-close');
            closeBtn.classList.add('visible');
        },

        /**
         * Arrange elements in a heart shape
         */
        arrangeInHeart: function(elements) {
            const total = elements.length;
            const centerX = 50; // vw
            const centerY = 40; // vh - moved up slightly to make room for text
            const scale = 12; // Scale of the heart
            
            elements.forEach((el, i) => {
                // Parametric equation for heart
                // t goes from 0 to 2*PI
                const t = (i / total) * 2 * Math.PI;
                
                // Heart formula:
                // x = 16 * sin(t)^3
                // y = 13 * cos(t) - 5 * cos(2*t) - 2 * cos(3*t) - cos(4*t)
                // We invert y because screen coordinates go down
                
                const x = 16 * Math.pow(Math.sin(t), 3);
                const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
                
                const finalX = x * 1.2; // Widen slightly
                const finalY = y * 1.2;
                
                el.style.transition = 'all 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                el.style.left = `calc(50% + ${finalX * 1.5}vmin)`; // Use vmin for responsiveness
                el.style.top = `calc(40% + ${finalY * 1.5}vmin)`;
                el.style.transform = `translate(-50%, -50%) rotate(0deg) scale(1)`;
                el.style.zIndex = i + 10;
            });
        },

        closeFinale: function() {
            if (this.overlay) {
                this.overlay.classList.remove('active');
                // Reset for next time (optional)
                setTimeout(() => {
                    this.overlay.querySelector('.finale-container').innerHTML = '';
                    this.overlay.querySelector('.finale-message').classList.remove('visible');
                    this.overlay.querySelector('.finale-close').classList.remove('visible');
                }, 500);
            }
        },

        wait: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        reset: function() {
            localStorage.removeItem('advent_finale_shown');
            this.hasTriggered = false;
            console.log('Finale reset.');
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => finale.init());
    } else {
        finale.init();
    }

    // Make global
    window.AdventFinale = finale;

    // Expose reset function for testing
    window.resetFinale = function() {
        finale.reset();
    };

})();
