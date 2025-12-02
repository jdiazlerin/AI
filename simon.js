/**
 * SimonGame Class - Main game logic for the Simon memory game
 * 
 * Features:
 * - Progressive difficulty with sequence memory challenge
 * - Audio feedback with Web Audio API
 * - Multiple difficulty levels (easy, normal, hard)
 * - Keyboard and touch controls
 * - High score persistence
 * - Accessibility features
 * - Dynamic color theme system
 */
class SimonGame {
    constructor() {
        // Game state variables
        this.sequence = [];           // The sequence of buttons to remember
        this.playerSequence = [];     // Player's input sequence
        this.level = 1;              // Current game level
        this.isPlaying = false;      // Whether game is in progress
        this.isShowingSequence = false; // Whether sequence is being displayed
        this.currentStep = 0;        // Current step in player input
        this.soundEnabled = true;    // Audio on/off toggle
        this.difficulty = 'normal';  // Current difficulty level
        
        // Theme system
        this.currentTheme = localStorage.getItem('simonTheme') || 'classic';
        this.availableThemes = ['classic', 'cyberpunk', 'synthwave', 'high-contrast', 'colorblind'];
        
        // Weather functionality
        this.weatherData = null;     // Cached weather data
        this.weatherLocation = 'London, UK'; // Default weather location
        this.weatherCoords = { lat: 51.5074, lon: -0.1278 }; // London coordinates (default)
        this.userLocation = null;    // User's current location if available
        this.useUserLocation = false; // Whether to use user's location
        
        // Load high score from localStorage or default to 0
        this.highScore = parseInt(localStorage.getItem('simonHighScore')) || 0;
        
        // Game state management enum
        this.gameStates = {
            START: 'start',
            PLAYING: 'playing',
            GAME_OVER: 'gameOver'
        };
        this.currentState = this.gameStates.START;
        
        // Difficulty settings affect timing and player reaction time
        this.difficultySettings = {
            easy: { sequenceDelay: 800, inputTimeout: 8000, gapDelay: 300 },
            normal: { sequenceDelay: 600, inputTimeout: 5000, gapDelay: 200 },
            hard: { sequenceDelay: 400, inputTimeout: 3000, gapDelay: 100 }
        };
        
        // Musical frequencies for each button (C4, E4, G4, A4 notes)
        this.buttonFrequencies = [261.63, 329.63, 392.00, 440.00];
        this.audioContext = null; // Web Audio API context
        
        this.init();
    }
    
    /**
     * Initialize the game - set up audio, events, and initial display
     */
    init() {
        this.initAudio();
        this.initTheme();
        this.bindEvents();
        this.updateDisplay();
        this.updateHighScore();
        
        // Set up global keyboard listener for accessibility
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }
    
    /**
     * Initialize theme system - load saved theme or detect system preference
     */
    initTheme() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('simonTheme');
        
        if (savedTheme && this.availableThemes.includes(savedTheme)) {
            this.setTheme(savedTheme);
        } else {
            // Check system preference for high contrast
            if (window.matchMedia('(prefers-contrast: high)').matches) {
                this.setTheme('high-contrast');
            } else {
                this.setTheme('classic');
            }
        }
        
        // Update theme selector to show current theme
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = this.currentTheme;
        }
        
        // Listen for system preference changes
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            if (e.matches && this.currentTheme === 'classic') {
                this.setTheme('high-contrast');
            }
        });
    }
    
    /**
     * Set the current theme and persist to localStorage
     * @param {string} themeName - Name of the theme to apply
     */
    setTheme(themeName) {
        if (!this.availableThemes.includes(themeName)) {
            console.warn(`Theme "${themeName}" not found. Using classic theme.`);
            themeName = 'classic';
        }
        
        this.currentTheme = themeName;
        
        // Apply theme to document
        if (themeName === 'classic') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', themeName);
        }
        
        // Persist theme preference
        localStorage.setItem('simonTheme', themeName);
        
        // Update theme selector UI if it exists
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect && themeSelect.value !== themeName) {
            themeSelect.value = themeName;
        }
    }
    
    /**
     * Handle theme selection change from dropdown
     * @param {Event} e - Change event from theme selector
     */
    handleThemeChange(e) {
        const newTheme = e.target.value;
        this.setTheme(newTheme);
    }
    
    /**
     * Initialize Web Audio API context for sound effects
     */
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    /**
     * Bind all event listeners for user interactions
     */
    bindEvents() {
        // Game button click and touch events
        const buttons = document.querySelectorAll('.game-button');
        buttons.forEach((button, index) => {
            button.addEventListener('click', () => this.handleButtonClick(index));
            // Prevent default touch behavior to avoid double-firing
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleButtonClick(index);
            });
        });
        
        // Control panel events
        document.getElementById('volume-btn').addEventListener('click', this.toggleSound.bind(this));
        document.getElementById('difficulty').addEventListener('change', this.changeDifficulty.bind(this));
        
        // Theme selector event
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', this.handleThemeChange.bind(this));
        }
        
        // Weather button and modal events
        document.getElementById('weather-btn').addEventListener('click', this.showWeatherModal.bind(this));
        document.getElementById('weather-close-btn').addEventListener('click', this.hideWeatherModal.bind(this));
        document.getElementById('weather-modal').addEventListener('click', (e) => {
            if (e.target.id === 'weather-modal') {
                this.hideWeatherModal();
            }
        });
        
        // Keyboard controls (Q, W, A, S keys map to buttons 0, 1, 2, 3)
        document.addEventListener('keydown', (e) => {
            if (this.currentState === this.gameStates.PLAYING && !this.isShowingSequence) {
                const keyMap = { 'q': 0, 'w': 1, 'a': 2, 's': 3 };
                if (keyMap.hasOwnProperty(e.key.toLowerCase())) {
                    this.handleButtonClick(keyMap[e.key.toLowerCase()]);
                }
            }
            
            // Escape key closes weather modal
            if (e.key === 'Escape') {
                this.hideWeatherModal();
            }
        });
    }
    
    /**
     * Handle global key press events for game start/restart
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleKeyPress(e) {
        // Any key starts the game when in start or game over state
        if (this.currentState === this.gameStates.START || this.currentState === this.gameStates.GAME_OVER) {
            this.startGame();
        }
    }
    
    /**
     * Start a new game - reset all variables and begin first level
     */
    startGame() {
        this.sequence = [];
        this.level = 1;
        this.currentState = this.gameStates.PLAYING;
        this.updateDisplay();
        this.nextLevel();
    }
    
    /**
     * Advance to the next level - add new button to sequence and play it
     */
    nextLevel() {
        this.playerSequence = [];
        this.currentStep = 0;
        this.addToSequence();
        this.showMessage(`Level ${this.level}`, 1000);
        // Delay before showing sequence for player readiness
        setTimeout(() => this.playSequence(), 1000);
    }
    
    /**
     * Add a random button (0-3) to the current sequence
     */
    addToSequence() {
        const randomButton = Math.floor(Math.random() * 4);
        this.sequence.push(randomButton);
    }
    
    /**
     * Play the current sequence to the player with visual and audio cues
     */
    async playSequence() {
        this.isShowingSequence = true;
        this.disableButtons(); // Prevent player input during sequence
        
        const settings = this.difficultySettings[this.difficulty];
        
        // Show each button in sequence with appropriate timing
        for (let i = 0; i < this.sequence.length; i++) {
            await this.delay(settings.gapDelay);
            await this.highlightButton(this.sequence[i], settings.sequenceDelay);
        }
        
        // Brief pause before allowing player input
        await this.delay(500);
        this.isShowingSequence = false;
        this.enableButtons();
        this.showMessage('Repeat the sequence...');
    }
    
    /**
     * Highlight a button with visual and audio feedback
     * @param {number} buttonIndex - Index of button to highlight (0-3)
     * @param {number} duration - How long to highlight in milliseconds
     */
    async highlightButton(buttonIndex, duration) {
        const button = document.getElementById(`btn-${buttonIndex}`);
        button.classList.add('active'); // Add CSS class for visual highlight
        this.playSound(buttonIndex);    // Play corresponding sound
        
        await this.delay(duration);
        button.classList.remove('active'); // Remove highlight
    }
    
    /**
     * Handle player button clicks/taps
     * @param {number} buttonIndex - Index of clicked button (0-3)
     */
    handleButtonClick(buttonIndex) {
        // Ignore clicks during sequence display or wrong game state
        if (this.isShowingSequence || this.currentState !== this.gameStates.PLAYING) return;
        
        // Provide immediate visual/audio feedback
        this.highlightButton(buttonIndex, 200);
        this.playerSequence.push(buttonIndex);
        
        // Check if current input matches expected sequence
        if (this.playerSequence[this.currentStep] !== this.sequence[this.currentStep]) {
            this.gameOver();
            return;
        }
        
        this.currentStep++;
        
        // If player completed the sequence, advance to next level
        if (this.currentStep === this.sequence.length) {
            this.level++;
            this.updateHighScore();
            setTimeout(() => this.nextLevel(), 1000);
        }
    }
    
    /**
     * Handle game over - show error feedback and prepare for restart
     */
    gameOver() {
        this.currentState = this.gameStates.GAME_OVER;
        this.playErrorSound();    // Play error sound
        this.flashError();        // Flash screen red
        this.showMessage('Game Over! Press Any Key to Restart');
        this.disableButtons();    // Prevent further input
    }
    
    /**
     * Play a musical tone for a specific button using Web Audio API
     * @param {number} buttonIndex - Index of button (0-3) to play sound for
     */
    playSound(buttonIndex) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        // Create oscillator for tone generation
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Connect audio nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Set frequency and waveform
        oscillator.frequency.setValueAtTime(this.buttonFrequencies[buttonIndex], this.audioContext.currentTime);
        oscillator.type = 'sine'; // Smooth sine wave
        
        // Configure volume envelope (attack and decay)
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        // Play the tone for 0.3 seconds
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    /**
     * Play error sound effect using sawtooth wave for harsh tone
     */
    playErrorSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Low frequency sawtooth wave for unpleasant error sound
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    /**
     * Flash the entire screen red briefly to indicate error
     */
    flashError() {
        document.body.classList.add('error-flash');
        setTimeout(() => document.body.classList.remove('error-flash'), 500);
    }
    
    /**
     * Enable all game buttons for player interaction
     */
    enableButtons() {
        const buttons = document.querySelectorAll('.game-button');
        buttons.forEach(button => {
            button.disabled = false;
            button.classList.remove('dimmed');
        });
    }
    
    /**
     * Disable all game buttons (during sequence display)
     */
    disableButtons() {
        const buttons = document.querySelectorAll('.game-button');
        buttons.forEach(button => {
            button.disabled = true;
            button.classList.add('dimmed'); // Visual indication they're disabled
        });
    }
    
    /**
     * Display a message to the player
     * @param {string} text - Message to display
     * @param {number|null} duration - Auto-clear after milliseconds (null = permanent)
     */
    showMessage(text, duration = null) {
        const messageElement = document.getElementById('message-text');
        messageElement.textContent = text;
        
        // Auto-clear message after specified duration
        if (duration) {
            setTimeout(() => messageElement.textContent = '', duration);
        }
    }
    
    /**
     * Update the UI display based on current game state
     */
    updateDisplay() {
        const messageElement = document.getElementById('message-text');
        switch (this.currentState) {
            case this.gameStates.START:
                messageElement.textContent = 'Press Any Key to Start';
                break;
            case this.gameStates.PLAYING:
                messageElement.textContent = '';
                break;
            case this.gameStates.GAME_OVER:
                messageElement.textContent = 'Game Over! Press Any Key to Restart';
                break;
        }
    }
    
    /**
     * Update high score if current level exceeds previous best
     */
    updateHighScore() {
        if (this.level - 1 > this.highScore) {
            this.highScore = this.level - 1;
            // Persist high score in browser localStorage
            localStorage.setItem('simonHighScore', this.highScore.toString());
            document.getElementById('high-score').textContent = this.highScore;
        }
    }
    
    /**
     * Toggle sound effects on/off and update UI button
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        // Update button emoji to reflect current state
        document.getElementById('volume-btn').textContent = this.soundEnabled ? '🔊' : '🔇';
    }
    
    /**
     * Change game difficulty level
     * @param {Event} e - Select change event
     */
    changeDifficulty(e) {
        this.difficulty = e.target.value;
    }
    
    /**
     * Show weather modal and fetch current weather data
     * First attempts to get user's current location, falls back to London, UK
     */
    async showWeatherModal() {
        const modal = document.getElementById('weather-modal');
        const weatherInfo = document.getElementById('weather-info');
        const weatherTitle = document.getElementById('weather-title');
        
        modal.classList.add('show');
        
        // Show loading state
        weatherInfo.innerHTML = '<div class="weather-loading">Getting your location...</div>';
        weatherTitle.textContent = 'WEATHER';
        
        try {
            // Try to get user's current location first
            await this.getCurrentLocation();
            
            // Update loading message
            weatherInfo.innerHTML = '<div class="weather-loading">Loading weather data...</div>';
            
            // Fetch weather data for determined location
            await this.fetchWeatherData();
            this.displayWeatherData();
        } catch (error) {
            console.error('Weather fetch error:', error);
            weatherInfo.innerHTML = '<div class="weather-error">Unable to fetch weather data. Please try again later.</div>';
        }
    }
    
    /**
     * Hide weather modal
     */
    hideWeatherModal() {
        const modal = document.getElementById('weather-modal');
        modal.classList.remove('show');
    }
    
    /**
     * Get user's current location using Geolocation API
     * Falls back to London, UK if geolocation fails or is denied
     */
    async getCurrentLocation() {
        return new Promise((resolve) => {
            // Check if geolocation is supported
            if (!navigator.geolocation) {
                console.log('Geolocation not supported, using London as default');
                this.setDefaultLocation();
                resolve();
                return;
            }
            
            // Set timeout for geolocation request
            const timeoutId = setTimeout(() => {
                console.log('Geolocation timeout, using London as default');
                this.setDefaultLocation();
                resolve();
            }, 5000); // 5 second timeout
            
            // Request current position
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(timeoutId);
                    // Successfully got user's location
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    };
                    this.weatherCoords = this.userLocation;
                    this.useUserLocation = true;
                    this.weatherLocation = 'Your Location';
                    console.log('Using user location:', this.userLocation);
                    resolve();
                },
                (error) => {
                    clearTimeout(timeoutId);
                    // Geolocation failed or denied
                    console.log('Geolocation error:', error.message, '- using London as default');
                    this.setDefaultLocation();
                    resolve();
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 300000 // Cache location for 5 minutes
                }
            );
        });
    }
    
    /**
     * Set default location to London, UK
     */
    setDefaultLocation() {
        this.weatherCoords = { lat: 51.5074, lon: -0.1278 }; // London coordinates
        this.weatherLocation = 'London, UK';
        this.useUserLocation = false;
        this.userLocation = null;
    }
    
    /**
     * Fetch weather data from OpenWeatherMap API (free tier)
     * Uses either user's current location or London, UK as fallback
     */
    async fetchWeatherData() {
        // Using OpenWeatherMap free API - no API key required for basic current weather
        // Note: For production, you should get an API key from openweathermap.org
        // Uses either user's current location or London, UK as fallback
        const { lat, lon } = this.weatherCoords;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=demo`;
        
        try {
            // Try the demo API first, fallback to a mock response if it fails
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            this.weatherData = await response.json();
        } catch (error) {
            // Fallback to mock weather data for demonstration
            console.warn('Using mock weather data');
            this.weatherData = this.getMockWeatherData();
        }
    }
    
    /**
     * Generate mock weather data for demonstration purposes
     * @returns {Object} Mock weather data object
     */
    getMockWeatherData() {
        const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Overcast'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        const temperature = Math.round(Math.random() * 20 + 2); // 2-22°C range for UK winter
        
        return {
            name: this.useUserLocation ? 'Your Location' : 'London',
            sys: { country: this.useUserLocation ? '??' : 'GB' },
            main: {
                temp: temperature,
                feels_like: temperature - 2,
                humidity: Math.round(Math.random() * 40 + 60), // 60-100% humidity
                pressure: Math.round(Math.random() * 30 + 1000) // 1000-1030 hPa
            },
            weather: [{
                main: randomCondition,
                description: randomCondition.toLowerCase(),
                icon: '01d'
            }],
            wind: {
                speed: Math.round(Math.random() * 15 + 5), // 5-20 km/h
                deg: Math.round(Math.random() * 360)
            },
            visibility: Math.round(Math.random() * 5000 + 5000), // 5-10km
            dt: Date.now() / 1000
        };
    }
    
    /**
     * Display fetched weather data in the modal
     */
    displayWeatherData() {
        const weatherInfo = document.getElementById('weather-info');
        const weatherTitle = document.getElementById('weather-title');
        
        if (!this.weatherData) {
            weatherInfo.innerHTML = '<div class="weather-error">No weather data available</div>';
            return;
        }
        
        const { main, weather, wind, name, sys } = this.weatherData;
        const condition = weather[0];
        
        // Update modal title based on location type
        if (this.useUserLocation) {
            weatherTitle.textContent = 'YOUR LOCATION';
        } else {
            weatherTitle.textContent = 'LONDON WEATHER';
        }
        
        // Format wind direction
        const getWindDirection = (degrees) => {
            const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            return directions[Math.round(degrees / 22.5) % 16];
        };
        
        weatherInfo.innerHTML = `
            <div class="weather-location">${name}, ${sys.country}</div>
            
            <div class="weather-current">
                <div class="weather-main">
                    <div class="weather-temp">${Math.round(main.temp)}°C</div>
                    <div class="weather-description">${condition.description}</div>
                </div>
                
                <div class="weather-details">
                    <div class="weather-detail-item">
                        <span class="weather-detail-label">Feels like:</span>
                        <span class="weather-detail-value">${Math.round(main.feels_like)}°C</span>
                    </div>
                    <div class="weather-detail-item">
                        <span class="weather-detail-label">Humidity:</span>
                        <span class="weather-detail-value">${main.humidity}%</span>
                    </div>
                    <div class="weather-detail-item">
                        <span class="weather-detail-label">Pressure:</span>
                        <span class="weather-detail-value">${main.pressure} hPa</span>
                    </div>
                    <div class="weather-detail-item">
                        <span class="weather-detail-label">Wind:</span>
                        <span class="weather-detail-value">${wind.speed} m/s ${getWindDirection(wind.deg)}</span>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 15px; font-size: 0.5rem; color: #666;">
                Updated: ${new Date().toLocaleTimeString()}
            </div>
        `;
    }
    
    /**
     * Utility function to create delays in async functions
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after specified time
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game when DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Resume audio context on first user interaction (browser requirement)
    document.addEventListener('click', () => {
        if (window.game && window.game.audioContext && window.game.audioContext.state === 'suspended') {
            window.game.audioContext.resume();
        }
    }, { once: true }); // Only run once
    
    // Create global game instance
    window.game = new SimonGame();
});
