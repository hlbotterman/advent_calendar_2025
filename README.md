# Advent World Postcards

A static website that displays 24 geolocated "postcards" from around the world on an interactive map. Two avatars travel between locations, creating a visual journey through December.

## Features

- **Interactive World Map**: Built with Leaflet.js and OpenStreetMap tiles
- **24 Numbered Postcards**: Each marker shows its day number (1-24) when unlocked, or a lock icon when locked
- **Two Traveling Avatars**: Avatar A (red) and Avatar B (blue), each following their own journey
- **Animated Journey Replay**: Watch both avatars travel through their assigned locations with smooth animations and halo effects
- **Advent Calendar Locking**: Postcards unlock day by day, like a traditional advent calendar
- **Test Mode**: A handy slider to test all 24 days during development (automatically hidden in production)
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Zero Backend**: Pure static HTML/CSS/JS - host anywhere

## Quick Start

### Option 1: Local Development

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. That's it! No build process required.

### Option 2: Local Server

For better performance and to avoid CORS issues:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: GitHub Pages

1. Push this repository to GitHub
2. Go to repository Settings > Pages
3. Set Source to "main" branch, root folder
4. Your site will be available at `https://username.github.io/repository-name/`

## Project Structure

```
advent_calendar_2025/
├── index.html                      # Main HTML file
├── assets/
│   ├── css/
│   │   └── styles.css             # All styles and animations
│   ├── js/
│   │   ├── app.js                 # Main application logic
│   │   └── motion.js              # Avatar animation utility
│   ├── img/
│   │   ├── avatars/
│   │   │   ├── avatarA.png        # Avatar A icon
│   │   │   └── avatarB.png        # Avatar B icon
│   │   └── postcards/
│   │       ├── 01.jpg             # Postcard images (24 total)
│   │       └── ...
│   └── data/
│       └── locations.json         # All postcard data
└── README.md
```

## Configuration

### Test Mode

By default, test mode is enabled, allowing you to test all 24 days. A yellow slider in the toolbar lets you control which days are unlocked (0-24).

To enable production mode with real date-based locking:

**Edit `assets/js/app.js` line 34:**

```javascript
testMode: false // Change from true to false
```

When `testMode: false`, postcards unlock based on their `locked_until` dates in `locations.json`.

### Customizing Locations

Edit `assets/data/locations.json`. Each postcard requires:

```json
{
  "day": 1,
  "title": "Tokyo, Shinjuku",
  "lat": 35.6895,
  "lng": 139.6917,
  "image": "assets/img/postcards/01.jpg",
  "text": "Your two-sentence description here.",
  "avatar": "A",
  "locked_until": "2025-12-01"
}
```

Fields:
- `day`: Integer 1-24
- `title`: Location name
- `lat`, `lng`: Coordinates (decimal degrees)
- `image`: Relative path to image
- `text`: Short description (240 chars max, two sentences)
- `avatar`: "A" or "B"
- `locked_until`: ISO date string (YYYY-MM-DD)

### Customizing Avatars

Replace `assets/img/avatars/avatarA.png` and `avatarB.png` with your own 32x32px images.

To change avatar colors, edit `assets/css/styles.css`:

```css
:root {
    --avatar-a-color: #e74c3c;  /* Red for Avatar A */
    --avatar-b-color: #3498db;  /* Blue for Avatar B */
}
```

### Animation Settings

Edit `assets/js/app.js` (lines 23-27):

```javascript
animation: {
    speed: 400,          // ms per segment (lower = faster)
    pauseAtStop: 900,    // ms to pause at each location
    staggerDelay: 600    // ms delay between avatar starts
}
```

### Replacing Postcard Images

1. Add your images to `assets/img/postcards/`
2. Name them `01.jpg`, `02.jpg`, etc. (or update paths in `locations.json`)
3. Recommended size: 800x600px or similar aspect ratio
4. Optimize images to ~150-250 KB for fast loading

## Features in Detail

### Map Controls

- **Replay Journey**: Animates both avatars along their routes with halo effects at each stop
- **Show only unlocked**: Hides locked postcards from the map
- **Progress**: Shows how many days have been unlocked

### Postcard Panel

- Opens when clicking any marker
- Shows image, title, description, and day number
- Previous/Next buttons to navigate between postcards
- Locked postcards show unlock date instead of content
- Close with X button or ESC key

### Keyboard Navigation

- `ESC`: Close panel
- `←` Left arrow: Previous postcard
- `→` Right arrow: Next postcard

### Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Focus visible states
- Alt text on images
- Screen reader friendly

## Browser Support

Works on all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization Ideas

1. **Theme Colors**: Edit CSS variables in `styles.css`
2. **Map Style**: Change tile provider in `app.js` (see [Leaflet providers](https://leaflet-extras.github.io/leaflet-providers/preview/))
3. **Animation Style**: Modify easing functions in `motion.js`
4. **Layout**: Adjust panel width, map height in `styles.css`
5. **Marker Icons**: Customize location marker appearance in `app.js` `createLocationIcon()`

## Troubleshooting

### Images not loading

- Check image paths in `locations.json` match actual file names
- Ensure images are in `assets/img/postcards/`
- Use relative paths starting with `assets/`

### Map not displaying

- Check browser console for errors
- Verify internet connection (map tiles load from OpenStreetMap)
- Try opening in a different browser

### Animation not smooth

- Reduce `speed` value in animation config
- Ensure images are optimized (not too large)
- Close other browser tabs to free memory

### Locked postcards showing when they shouldn't

- Verify `demoMode: false` in `app.js`
- Check `locked_until` dates in `locations.json`
- Ensure dates are in ISO format (YYYY-MM-DD)

## Technologies Used

- [Leaflet.js](https://leafletjs.com/) - Interactive maps
- [OpenStreetMap](https://www.openstreetmap.org/) - Map tiles
- Vanilla JavaScript (ES6+)
- CSS3 with custom properties
- HTML5

## License

This project is open source. Feel free to use, modify, and distribute as needed.

## Credits

- Map data from OpenStreetMap contributors
- Leaflet.js library
- Location data and descriptions are examples only

## Future Enhancements

Possible additions:
- Share specific postcard via URL
- localStorage to remember last viewed
- Multiple journeys/themes
- Sound effects on animations
- Print/export postcard feature
- Custom map markers per location
- User authentication for private calendars

## Support

For issues or questions:
1. Check this README first
2. Review browser console for error messages
3. Verify all file paths are correct
4. Ensure you're using a modern browser

---

**Happy Journey!** 🌍✈️
