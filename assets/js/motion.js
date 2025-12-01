/**
 * motion.js - Avatar animation utility for smooth marker movement
 * Handles segment-by-segment animation along polylines with pause at stops
 */

(function(root, factory) {
    // UMD pattern for compatibility
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('leaflet'));
    } else {
        root.AvatarMotion = factory(root.L);
    }
}(typeof self !== 'undefined' ? self : this, function(L) {
    'use strict';

    /**
     * AvatarMotion class
     * Animates a Leaflet marker along a path with configurable speed and pauses
     */
    class AvatarMotion {
        constructor(marker, options = {}) {
            this.marker = marker;
            this.path = [];
            this.currentSegment = 0;
            this.isAnimating = false;
            this.isPaused = false;
            this.animationFrame = null;
            this.timeoutId = null;

            // Configuration
            this.config = {
                speed: options.speed || 300, // ms per segment
                pauseAtStop: options.pauseAtStop || 1000, // ms to pause at each stop
                onSegmentStart: options.onSegmentStart || null,
                onSegmentComplete: options.onSegmentComplete || null,
                onPauseStart: options.onPauseStart || null,
                onComplete: options.onComplete || null,
                easing: options.easing || this.easeInOutQuad
            };
        }

        /**
         * Easing function for smooth animation
         */
        easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }

        /**
         * Set the path for the avatar to follow
         * @param {Array} path - Array of [lat, lng] coordinates
         */
        setPath(path) {
            this.path = path.map(coord => L.latLng(coord[0], coord[1]));
            this.currentSegment = 0;
        }

        /**
         * Start the animation
         */
        start() {
            if (this.path.length < 2) {
                console.warn('Path must have at least 2 points');
                return;
            }

            if (this.isAnimating) {
                this.stop();
            }

            this.isAnimating = true;
            this.currentSegment = 0;

            // Move to start position
            this.marker.setLatLng(this.path[0]);

            // Start first segment
            this.animateSegment();
        }

        /**
         * Animate a single segment
         */
        animateSegment() {
            if (!this.isAnimating || this.currentSegment >= this.path.length - 1) {
                this.complete();
                return;
            }

            const startLatLng = this.path[this.currentSegment];
            const endLatLng = this.path[this.currentSegment + 1];
            const startTime = Date.now();
            const duration = this.config.speed;

            // Callback for segment start
            if (this.config.onSegmentStart) {
                this.config.onSegmentStart(this.currentSegment, startLatLng, endLatLng);
            }

            const animate = () => {
                if (!this.isAnimating) return;

                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = this.config.easing(progress);

                // Interpolate position
                const lat = startLatLng.lat + (endLatLng.lat - startLatLng.lat) * easedProgress;
                const lng = startLatLng.lng + (endLatLng.lng - startLatLng.lng) * easedProgress;

                this.marker.setLatLng([lat, lng]);

                if (progress < 1) {
                    this.animationFrame = requestAnimationFrame(animate);
                } else {
                    // Segment complete
                    this.marker.setLatLng(endLatLng);

                    if (this.config.onSegmentComplete) {
                        this.config.onSegmentComplete(this.currentSegment, endLatLng);
                    }

                    this.currentSegment++;

                    // Pause before next segment
                    if (this.currentSegment < this.path.length - 1) {
                        if (this.config.onPauseStart) {
                            this.config.onPauseStart(this.currentSegment, endLatLng);
                        }

                        this.timeoutId = setTimeout(() => {
                            this.animateSegment();
                        }, this.config.pauseAtStop);
                    } else {
                        this.complete();
                    }
                }
            };

            this.animationFrame = requestAnimationFrame(animate);
        }

        /**
         * Stop the animation
         */
        stop() {
            this.isAnimating = false;

            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }

            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
            }
        }

        /**
         * Pause the animation
         */
        pause() {
            this.isPaused = true;
            this.stop();
        }

        /**
         * Resume the animation
         */
        resume() {
            if (this.isPaused) {
                this.isPaused = false;
                this.isAnimating = true;
                this.animateSegment();
            }
        }

        /**
         * Seek to a specific day/segment
         * @param {number} segmentIndex - Index to seek to
         */
        seekTo(segmentIndex) {
            if (segmentIndex < 0 || segmentIndex >= this.path.length) {
                console.warn('Invalid segment index');
                return;
            }

            this.stop();
            this.currentSegment = segmentIndex;
            this.marker.setLatLng(this.path[segmentIndex]);
        }

        /**
         * Complete the animation
         */
        complete() {
            this.isAnimating = false;

            if (this.config.onComplete) {
                this.config.onComplete();
            }
        }

        /**
         * Get current progress (0-1)
         */
        getProgress() {
            if (this.path.length === 0) return 0;
            return this.currentSegment / (this.path.length - 1);
        }

        /**
         * Check if animation is running
         */
        isRunning() {
            return this.isAnimating;
        }
    }

    /**
     * Helper function to create halo effect element
     */
    AvatarMotion.createHalo = function(avatarClass) {
        const halo = document.createElement('div');
        halo.className = `avatar-halo ${avatarClass}-halo`;
        return halo;
    };

    /**
     * Helper function to show halo at marker position
     */
    AvatarMotion.showHalo = function(marker, avatarClass) {
        const icon = marker.getElement();
        if (!icon) return;

        const halo = AvatarMotion.createHalo(avatarClass);
        icon.appendChild(halo);

        // Remove after animation completes
        setTimeout(() => {
            if (halo.parentElement) {
                halo.parentElement.removeChild(halo);
            }
        }, 1200);
    };

    return AvatarMotion;
}));
