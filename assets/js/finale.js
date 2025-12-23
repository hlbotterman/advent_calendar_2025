/**
 * finale.js - Animated Map Journey Finale
 */

(function() {
    'use strict';

    const finale = {
        overlay: null,
        closeBtn: null,
        map: null,
        markers: [],
        polyline: null,

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
                <div id="finaleMap" class="finale-map"></div>
                
                <div class="day-counter">
                    <span class="counter-text">Jour <span id="currentDay">0</span>/24</span>
                </div>
                
                <div class="finale-dialogue">
                    <div class="avatars-container">
                        <div class="avatar-section avatar-a-section">
                            <img src="assets/img/avatars/avatarA.png" class="finale-avatar" alt="Avatar A">
                            <div class="speech-bubble bubble-a">
                                <p>J'espère que cela t'a plu ! Je te souhaite un joyeux Noël et de bonnes fêtes de fin d'année !</p>
                                <p class="emoji-line">🎄😘</p>
                            </div>
                        </div>
                        
                        <div class="avatar-section avatar-b-section">
                            <img src="assets/img/avatars/avatarB.png" class="finale-avatar" alt="Avatar B">
                            <div class="speech-bubble bubble-b">
                                <textarea 
                                    id="avatarBResponse" 
                                    placeholder="Écris ta réponse ici..."
                                    rows="3"
                                ></textarea>
                            </div>
                        </div>
                    </div>
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
            
            const locations = locationsData || [];
            
            // Initialize map
            setTimeout(() => {
                this.initMap(locations);
            }, 300);
        },

        initMap: function(locations) {
            // Create map
            this.map = L.map('finaleMap', {
                zoomControl: false,
                scrollWheelZoom: false,
                dragging: false,
                doubleClickZoom: false
            }).setView([20, 0], 2);

            // Add tile layer
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                maxZoom: 18
            }).addTo(this.map);

            // Sort locations by day
            const sortedLocations = locations.sort((a, b) => a.day - b.day);

            // Collect coordinates for path
            const coordinates = sortedLocations.map(loc => [loc.lat, loc.lng]);

            // Create polyline (initially empty)
            this.polyline = L.polyline([], {
                color: '#e74c3c',
                weight: 3,
                opacity: 0.8,
                smoothFactor: 1
            }).addTo(this.map);

            // Animate path drawing
            this.animatePath(coordinates, sortedLocations);
        },

        animatePath: function(coordinates, locations) {
            let index = 0;
            const pathCoords = [];

            const drawInterval = setInterval(() => {
                if (index < coordinates.length) {
                    pathCoords.push(coordinates[index]);
                    this.polyline.setLatLngs(pathCoords);

                    // Update counter
                    this.updateCounter(locations[index].day);

                    // Add marker with popup
                    this.addMarker(locations[index]);

                    index++;
                } else {
                    clearInterval(drawInterval);
                    // Show final message
                    setTimeout(() => {
                        this.showFinalMessage();
                    }, 1000);
                }
            }, 500); // 500ms between each point
        },

        updateCounter: function(day) {
            const counterEl = document.getElementById('currentDay');
            if (counterEl) {
                counterEl.textContent = day;
            }
        },

        addMarker: function(location) {
            const marker = L.circleMarker([location.lat, location.lng], {
                radius: 8,
                fillColor: '#e74c3c',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.map);

            // Create popup with thumbnail
            const thumbnail = location.thumbnail || (location.images && location.images[0]) || location.image || '';
            const popupContent = `
                <div class="map-popup">
                    ${thumbnail ? `<img src="${thumbnail}" alt="${location.title}" class="popup-image">` : ''}
                    <div class="popup-title">${location.title}</div>
                    <div class="popup-day">Jour ${location.day}</div>
                </div>
            `;
            
            marker.bindPopup(popupContent, {
                closeButton: false,
                className: 'custom-popup'
            });
            
            // Open popup immediately
            marker.openPopup();
            
            // Close popup after 3 seconds
            setTimeout(() => {
                marker.closePopup();
            }, 3000);

            // Add pulse effect
            const pulseCircle = L.circle([location.lat, location.lng], {
                radius: 50000, // meters
                color: '#e74c3c',
                fillColor: '#e74c3c',
                fillOpacity: 0,
                weight: 2,
                opacity: 0
            }).addTo(this.map);

            // Animate pulse
            setTimeout(() => {
                pulseCircle.setStyle({
                    opacity: 0.6,
                    fillOpacity: 0.2
                });
                setTimeout(() => {
                    pulseCircle.setStyle({
                        opacity: 0,
                        fillOpacity: 0
                    });
                }, 500);
            }, 50);

            this.markers.push(marker);
        },

        showFinalMessage: function() {
            const dialogue = this.overlay.querySelector('.finale-dialogue');
            if (dialogue) {
                dialogue.classList.add('visible');
            }
            
            const closeBtn = this.overlay.querySelector('.finale-close');
            if (closeBtn) {
                closeBtn.classList.add('visible');
            }
        },

        closeFinale: function() {
            if (this.overlay) {
                this.overlay.classList.remove('active');
                
                // Clean up map
                if (this.map) {
                    this.map.remove();
                    this.map = null;
                }
                this.markers = [];
                this.polyline = null;
                
                // Reset
                setTimeout(() => {
                    this.overlay.querySelectorAll('.visible').forEach(el => {
                        el.classList.remove('visible');
                    });
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
