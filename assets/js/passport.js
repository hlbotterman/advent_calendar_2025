/**
 * passport.js - Passport feature for Advent World Postcards
 */

class Passport {
    constructor() {
        this.modal = null;
        this.grid = null;
        this.stamps = {}; // day -> stampData
        this.init();
    }

    init() {
        // Create modal structure if it doesn't exist
        if (!document.getElementById('passportModal')) {
            this.createModal();
        }

        this.modal = document.getElementById('passportModal');
        this.grid = document.getElementById('passportGrid');

        // Close button listener
        const closeBtn = document.getElementById('passportClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Close on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Load existing stamps
        this.loadStamps();
    }

    createModal() {
        const modalHTML = `
            <div id="passportModal" class="passport-modal">
                <div class="passport-book">
                    <button id="passportClose" class="passport-close">&times;</button>
                    
                    <!-- Left Page: Identity -->
                    <div class="passport-page left">
                        <div class="passport-header">
                            <div class="passport-title">PASSPORT</div>
                        </div>
                        <div class="passport-identity">
                            <div class="passport-photo-frame">
                                <img src="assets/img/avatars/avatarA.png" alt="Traveler" class="passport-avatar">
                                <img src="assets/img/avatars/avatarB.png" alt="Traveler" class="passport-avatar">
                            </div>
                            <div class="passport-details">
                                <div class="detail-row">
                                    <span class="detail-label">Name:</span>
                                    <span>Advent Travelers</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Origin:</span>
                                    <span>World Citizen</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Issued:</span>
                                    <span>Dec 2025</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Valid until:</span>
                                    <span>Forever</span>
                                </div>
                            </div>
                        </div>
                        <div style="margin-top: auto; text-align: center; font-size: 12px; color: #7f8c8d;">
                            <p>"Une fois par an, allez dans un endroit où vous n'êtes jamais allé auparavant." - Dalai Lama</p>
                        </div>
                    </div>

                    <!-- Right Page: Stamps -->
                    <div class="passport-page right">
                        <div class="passport-header">
                            <div class="passport-title">VISAS</div>
                        </div>
                        <div id="passportGrid" class="stamps-grid">
                            <!-- Slots 1-24 -->
                            ${Array.from({length: 24}, (_, i) => `<div class="stamp-slot" data-day="${i+1}"></div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    open() {
        this.modal.classList.add('active');
        // Refresh stamps in case of new ones
        this.refreshGrid();
    }

    close() {
        this.modal.classList.remove('active');
    }

    addStamp(day, location) {
        // Check if already stamped
        if (this.stamps[day]) return;

        // Generate stamp data
        const stampData = this.generateStamp(day, location);
        this.stamps[day] = stampData;

        // Save to storage (optional, but good for persistence if we want more than just openedDays)
        // Actually, we can just regenerate them on load based on openedDays to save space,
        // but saving them keeps the random rotation/color consistent.
        this.saveStamps();

        // Update grid
        this.renderStamp(day);
        
        // Show notification (optional)
        // console.log(`Stamp added for day ${day}: ${location.title}`);
    }

    generateStamp(day, location) {
        // Colors: Red, Blue, Green, Purple, Black (Ink colors)
        const colors = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#2c3e50'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Shapes: Circle, Rectangle, Hexagon
        const shapes = ['circle', 'rect', 'hex'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        // Rotation: Random between -20 and 20 degrees
        const rotation = Math.floor(Math.random() * 40) - 20;

        // Date formatting - Use day number directly to avoid timezone issues
        // Assumes Dec 2025
        const dateStr = `${day}/12/25`;

        return {
            day,
            title: location.title.split(',')[0], // Just city name
            date: dateStr,
            color,
            shape,
            rotation
        };
    }

    renderStamp(day) {
        const slot = this.grid.querySelector(`.stamp-slot[data-day="${day}"]`);
        if (!slot || !this.stamps[day]) return;

        const data = this.stamps[day];
        const svg = this.createStampSVG(data);

        slot.innerHTML = svg;
        slot.classList.add('filled');
        
        // Add click handler to jump to postcard
        slot.onclick = () => {
            this.close();
            // Small delay to allow modal to close smoothly
            setTimeout(() => {
                if (window.openPostcard) {
                    window.openPostcard(day);
                } else {
                    // Fallback if window.openPostcard is not exposed directly
                    // Dispatch custom event
                    const event = new CustomEvent('openPostcardRequest', { detail: { day } });
                    document.dispatchEvent(event);
                }
            }, 300);
        };
    }

    createStampSVG(data) {
        const { title, date, color, shape, rotation } = data;
        let shapePath = '';
        let textPath = '';

        // SVG Size 100x100
        if (shape === 'circle') {
            shapePath = `<circle cx="50" cy="50" r="45" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="100 5" />
                         <circle cx="50" cy="50" r="35" fill="none" stroke="${color}" stroke-width="1" />`;
        } else if (shape === 'rect') {
            shapePath = `<rect x="5" y="15" width="90" height="70" rx="5" fill="none" stroke="${color}" stroke-width="3" />
                         <rect x="10" y="20" width="80" height="60" rx="2" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="5 5" />`;
        } else if (shape === 'hex') {
            // Hexagon points
            shapePath = `<path d="M50 5 L95 27.5 L95 72.5 L50 95 L5 72.5 L5 27.5 Z" fill="none" stroke="${color}" stroke-width="3" />
                         <path d="M50 12 L88 31 L88 69 L50 88 L12 69 L12 31 Z" fill="none" stroke="${color}" stroke-width="1" />`;
        }

        return `
            <div class="passport-stamp" style="transform: rotate(${rotation}deg);" title="${title}">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    ${shapePath}
                    <text x="50" y="45" font-family="Courier New, monospace" font-weight="bold" font-size="12" text-anchor="middle" fill="${color}" style="text-transform: uppercase;">
                        ${title}
                    </text>
                    <text x="50" y="65" font-family="Courier New, monospace" font-size="10" text-anchor="middle" fill="${color}">
                        ${date}
                    </text>
                    <!-- Ink texture overlay -->
                    <filter id="noise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
                    </filter>
                </svg>
            </div>
        `;
    }

    loadStamps() {
        const saved = localStorage.getItem('passportStamps');
        if (saved) {
            this.stamps = JSON.parse(saved);
        }
    }

    saveStamps() {
        localStorage.setItem('passportStamps', JSON.stringify(this.stamps));
    }

    refreshGrid() {
        // Sync with openedDays from app
        const openedDays = JSON.parse(localStorage.getItem('openedDays') || '[]');
        
        // Ensure we have stamps for all opened days
        // Note: We need location data for this. We'll assume app.js calls addStamp when opening.
        // But for initial load, we might miss some if we just rely on openedDays without location data.
        // The app.js integration will handle the sync on init.
        
        Object.keys(this.stamps).forEach(day => {
            this.renderStamp(day);
        });
    }
    
    // Helper to sync with app data
    syncWithApp(locations, openedDays) {
        openedDays.forEach(day => {
            if (!this.stamps[day]) {
                const location = locations.find(l => l.day === day);
                if (location) {
                    this.addStamp(day, location);
                }
            }
        });
        this.refreshGrid();
    }

    reset() {
        this.stamps = {};
        this.saveStamps();
        
        // Clear grid
        const slots = this.grid.querySelectorAll('.stamp-slot');
        slots.forEach(slot => {
            slot.innerHTML = '';
            slot.classList.remove('filled');
            slot.onclick = null;
        });
    }
}

// Export for use in app.js
window.Passport = Passport;
