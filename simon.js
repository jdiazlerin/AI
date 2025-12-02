/**
 * AudioManager Class - Advanced audio system with sound packs and customization
 * 
 * Features:
 * - Multiple sound packs (Classic, 8-Bit, Nature, Sci-Fi, Percussion, Musical)
 * - Individual volume controls
 * - Tempo adjustment
 * - Real-time audio visualization
 * - Visual indicators for accessibility
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.masterGain = null;
        this.currentPack = 'classic';
        this.masterVolume = 0.7;
        this.effectsVolume = 0.8;
        this.tempo = 1.0; // 1.0 = normal speed
        this.visualizationEnabled = true;
        this.visualIndicatorsEnabled = true;
        
        // Sound pack definitions
        this.soundPacks = {
            classic: {
                name: 'Classic Tones',
                description: 'Pure sine wave musical notes',
                sounds: [261.63, 329.63, 392.00, 440.00], // C4, E4, G4, A4
                type: 'generated',
                waveform: 'sine',
                colors: ['#4CAF50', '#F44336', '#FFEB3B', '#2196F3']
            },
            retro8bit: {
                name: '8-Bit Retro',
                description: 'Square wave chip-tune sounds',
                sounds: [262, 330, 392, 440],
                type: 'generated',
                waveform: 'square',
                colors: ['#00ff00', '#ff0000', '#ffff00', '#00ffff']
            },
            nature: {
                name: 'Nature Sounds',
                description: 'Natural frequency tones',
                sounds: [196.00, 246.94, 293.66, 349.23], // G3, B3, D4, F4
                type: 'generated',
                waveform: 'triangle',
                colors: ['#228B22', '#8B4513', '#87CEEB', '#FFD700']
            },
            scifi: {
                name: 'Sci-Fi',
                description: 'Futuristic space sounds',
                sounds: [523.25, 659.25, 783.99, 880.00], // C5, E5, G5, A5
                type: 'generated',
                waveform: 'sawtooth',
                colors: ['#00CED1', '#FF1493', '#7CFC00', '#FF6347']
            },
            percussion: {
                name: 'Percussion',
                description: 'Drum-like percussive sounds',
                sounds: [80, 120, 200, 300], // Low frequencies for drum sounds
                type: 'percussion',
                waveform: 'triangle',
                colors: ['#8B4513', '#CD853F', '#D2691E', '#A0522D']
            },
            musical: {
                name: 'Musical',
                description: 'Piano-like musical tones',
                sounds: [293.66, 369.99, 440.00, 523.25], // D4, F#4, A4, C5
                type: 'generated',
                waveform: 'sine',
                colors: ['#9932CC', '#FF69B4', '#00FA9A', '#FFD700']
            }
        };
        
        this.init();
        this.loadSettings();
    }
    
    /**
     * Initialize Web Audio API components
     */
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node for volume control
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume * this.effectsVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // Create analyser for visualization
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.connect(this.masterGain);
            
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }
    
    /**
     * Load audio settings from localStorage
     */
    loadSettings() {
        const savedSettings = localStorage.getItem('simonAudioSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.currentPack = settings.currentPack || 'classic';
                this.masterVolume = settings.masterVolume ?? 0.7;
                this.effectsVolume = settings.effectsVolume ?? 0.8;
                this.tempo = settings.tempo ?? 1.0;
                this.visualizationEnabled = settings.visualizationEnabled ?? true;
                this.visualIndicatorsEnabled = settings.visualIndicatorsEnabled ?? true;
                this.updateGain();
            } catch (e) {
                console.warn('Error loading audio settings:', e);
            }
        }
    }
    
    /**
     * Save audio settings to localStorage
     */
    saveSettings() {
        const settings = {
            currentPack: this.currentPack,
            masterVolume: this.masterVolume,
            effectsVolume: this.effectsVolume,
            tempo: this.tempo,
            visualizationEnabled: this.visualizationEnabled,
            visualIndicatorsEnabled: this.visualIndicatorsEnabled
        };
        localStorage.setItem('simonAudioSettings', JSON.stringify(settings));
    }
    
    /**
     * Update master gain node with current volume settings
     */
    updateGain() {
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume * this.effectsVolume;
        }
    }
    
    /**
     * Set the current sound pack
     * @param {string} packName - Name of the sound pack to use
     */
    setSoundPack(packName) {
        if (this.soundPacks[packName]) {
            this.currentPack = packName;
            this.saveSettings();
        }
    }
    
    /**
     * Set master volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateGain();
        this.saveSettings();
    }
    
    /**
     * Set effects volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setEffectsVolume(volume) {
        this.effectsVolume = Math.max(0, Math.min(1, volume));
        this.updateGain();
        this.saveSettings();
    }
    
    /**
     * Set tempo multiplier
     * @param {number} tempo - Tempo multiplier (0.5 to 2.0)
     */
    setTempo(tempo) {
        this.tempo = Math.max(0.5, Math.min(2.0, tempo));
        this.saveSettings();
    }
    
    /**
     * Toggle audio visualization
     * @param {boolean} enabled - Whether visualization is enabled
     */
    setVisualization(enabled) {
        this.visualizationEnabled = enabled;
        this.saveSettings();
    }
    
    /**
     * Toggle visual indicators for accessibility
     * @param {boolean} enabled - Whether visual indicators are enabled
     */
    setVisualIndicators(enabled) {
        this.visualIndicatorsEnabled = enabled;
        this.saveSettings();
    }
    
    /**
     * Get current sound pack configuration
     * @returns {Object} Current sound pack object
     */
    getCurrentPack() {
        return this.soundPacks[this.currentPack];
    }
    
    /**
     * Get all available sound packs
     * @returns {Object} All sound packs
     */
    getAllPacks() {
        return this.soundPacks;
    }
    
    /**
     * Play a sound for a specific button
     * @param {number} buttonIndex - Index of the button (0-3)
     * @param {number} duration - Duration of sound in seconds
     */
    playSound(buttonIndex, duration = 0.3) {
        if (!this.audioContext || this.masterVolume === 0) return;
        
        // Resume audio context if suspended (browser requirement)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const pack = this.getCurrentPack();
        const frequency = pack.sounds[buttonIndex];
        
        if (pack.type === 'percussion') {
            this.playPercussionSound(frequency, duration);
        } else {
            this.playToneSound(frequency, pack.waveform, duration);
        }
    }
    
    /**
     * Play a generated tone sound
     * @param {number} frequency - Frequency in Hz
     * @param {string} waveform - Waveform type (sine, square, triangle, sawtooth)
     * @param {number} duration - Duration in seconds
     */
    playToneSound(frequency, waveform, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.analyser);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = waveform;
        
        // Configure ADSR envelope
        const attackTime = 0.01;
        const decayTime = 0.1;
        const sustainLevel = 0.6;
        const releaseTime = duration - attackTime - decayTime;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.8, this.audioContext.currentTime + attackTime);
        gainNode.gain.linearRampToValueAtTime(sustainLevel, this.audioContext.currentTime + attackTime + decayTime);
        gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    /**
     * Play a percussion-style sound
     * @param {number} frequency - Base frequency in Hz
     * @param {number} duration - Duration in seconds
     */
    playPercussionSound(frequency, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.analyser);
        
        // Percussion uses frequency sweep
        oscillator.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency, this.audioContext.currentTime + 0.1);
        oscillator.type = 'triangle';
        
        // Low-pass filter for warmer sound
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;
        
        // Quick attack, fast decay for percussion
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.005);
        gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + duration * 0.8);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    /**
     * Play error sound
     */
    playErrorSound() {
        if (!this.audioContext || this.masterVolume === 0) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.analyser);
        
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    /**
     * Get frequency data for visualization
     * @returns {Uint8Array} Frequency data array
     */
    getFrequencyData() {
        if (!this.analyser) return new Uint8Array(0);
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }
    
    /**
     * Get adjusted delay based on tempo
     * @param {number} baseDelay - Base delay in milliseconds
     * @returns {number} Adjusted delay
     */
    getTempoAdjustedDelay(baseDelay) {
        return baseDelay / this.tempo;
    }
}

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
 * - Advanced audio system with sound packs
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
        
        // Musical frequencies for each button (C4, E4, G4, A4 notes) - legacy fallback
        this.buttonFrequencies = [261.63, 329.63, 392.00, 440.00];
        this.audioContext = null; // Web Audio API context (legacy)
        
        // Initialize advanced audio manager
        this.audioManager = new AudioManager();
        
        // Audio visualization
        this.visualizationCanvas = null;
        this.visualizationCtx = null;
        this.animationFrameId = null;
        
        this.init();
    }
    
    /**
     * Initialize the game - set up audio, events, and initial display
     */
    init() {
        this.initAudio();
        this.bindEvents();
        this.updateDisplay();
        this.updateHighScore();
        this.initAudioSettingsModal();
        this.initVisualization();
        
        // Set up global keyboard listener for accessibility
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }
    
    /**
     * Initialize Web Audio API context for sound effects (legacy fallback)
     */
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    /**
     * Initialize audio settings modal
     */
    initAudioSettingsModal() {
        // Set initial UI values from audio manager
        const packSelect = document.getElementById('sound-pack-select');
        const masterVolume = document.getElementById('master-volume');
        const effectsVolume = document.getElementById('effects-volume');
        const tempoSlider = document.getElementById('tempo-slider');
        const visualToggle = document.getElementById('visual-indicators-toggle');
        
        if (packSelect) {
            packSelect.value = this.audioManager.currentPack;
            this.updateSoundPackDescription(this.audioManager.currentPack);
        }
        if (masterVolume) {
            masterVolume.value = this.audioManager.masterVolume * 100;
            this.updateVolumeLabel('master-volume-label', this.audioManager.masterVolume * 100);
        }
        if (effectsVolume) {
            effectsVolume.value = this.audioManager.effectsVolume * 100;
            this.updateVolumeLabel('effects-volume-label', this.audioManager.effectsVolume * 100);
        }
        if (tempoSlider) {
            tempoSlider.value = this.audioManager.tempo * 100;
            this.updateTempoLabel(this.audioManager.tempo * 100);
        }
        if (visualToggle) {
            visualToggle.checked = this.audioManager.visualIndicatorsEnabled;
        }
    }
    
    /**
     * Initialize audio visualization canvas
     */
    initVisualization() {
        this.visualizationCanvas = document.getElementById('audio-visualization');
        if (this.visualizationCanvas) {
            this.visualizationCtx = this.visualizationCanvas.getContext('2d');
            // Set canvas size
            this.visualizationCanvas.width = 300;
            this.visualizationCanvas.height = 60;
        }
    }
    
    /**
     * Update volume label display
     * @param {string} labelId - ID of the label element
     * @param {number} value - Volume value (0-100)
     */
    updateVolumeLabel(labelId, value) {
        const label = document.getElementById(labelId);
        if (label) {
            label.textContent = `${Math.round(value)}%`;
        }
    }
    
    /**
     * Update tempo label display
     * @param {number} value - Tempo value (50-200)
     */
    updateTempoLabel(value) {
        const label = document.getElementById('tempo-label');
        if (label) {
            const tempoValue = value / 100;
            label.textContent = `${tempoValue.toFixed(1)}x`;
        }
    }
    
    /**
     * Update sound pack description display
     * @param {string} packName - Name of the selected sound pack
     */
    updateSoundPackDescription(packName) {
        const description = document.getElementById('sound-pack-description');
        if (description && this.audioManager.soundPacks[packName]) {
            description.textContent = this.audioManager.soundPacks[packName].description;
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
        
        // Weather button and modal events
        document.getElementById('weather-btn').addEventListener('click', this.showWeatherModal.bind(this));
        document.getElementById('weather-close-btn').addEventListener('click', this.hideWeatherModal.bind(this));
        document.getElementById('weather-modal').addEventListener('click', (e) => {
            if (e.target.id === 'weather-modal') {
                this.hideWeatherModal();
            }
        });
        
        // Audio settings button and modal events
        const audioSettingsBtn = document.getElementById('audio-settings-btn');
        const audioSettingsModal = document.getElementById('audio-settings-modal');
        const audioSettingsCloseBtn = document.getElementById('audio-settings-close-btn');
        
        if (audioSettingsBtn) {
            audioSettingsBtn.addEventListener('click', this.showAudioSettingsModal.bind(this));
        }
        if (audioSettingsCloseBtn) {
            audioSettingsCloseBtn.addEventListener('click', this.hideAudioSettingsModal.bind(this));
        }
        if (audioSettingsModal) {
            audioSettingsModal.addEventListener('click', (e) => {
                if (e.target.id === 'audio-settings-modal') {
                    this.hideAudioSettingsModal();
                }
            });
        }
        
        // Sound pack selector
        const packSelect = document.getElementById('sound-pack-select');
        if (packSelect) {
            packSelect.addEventListener('change', (e) => {
                this.audioManager.setSoundPack(e.target.value);
                this.updateSoundPackDescription(e.target.value);
                this.playPreviewSound();
            });
        }
        
        // Volume sliders
        const masterVolume = document.getElementById('master-volume');
        if (masterVolume) {
            masterVolume.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.audioManager.setMasterVolume(value / 100);
                this.updateVolumeLabel('master-volume-label', value);
            });
            masterVolume.addEventListener('change', () => this.playPreviewSound());
        }
        
        const effectsVolume = document.getElementById('effects-volume');
        if (effectsVolume) {
            effectsVolume.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.audioManager.setEffectsVolume(value / 100);
                this.updateVolumeLabel('effects-volume-label', value);
            });
            effectsVolume.addEventListener('change', () => this.playPreviewSound());
        }
        
        // Tempo slider
        const tempoSlider = document.getElementById('tempo-slider');
        if (tempoSlider) {
            tempoSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.audioManager.setTempo(value / 100);
                this.updateTempoLabel(value);
            });
        }
        
        // Visual indicators toggle
        const visualToggle = document.getElementById('visual-indicators-toggle');
        if (visualToggle) {
            visualToggle.addEventListener('change', (e) => {
                this.audioManager.setVisualIndicators(e.target.checked);
            });
        }
        
        // Preview sound button
        const previewBtn = document.getElementById('preview-sound-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.playPreviewSequence());
        }
        
        // Keyboard controls (Q, W, A, S keys map to buttons 0, 1, 2, 3)
        document.addEventListener('keydown', (e) => {
            if (this.currentState === this.gameStates.PLAYING && !this.isShowingSequence) {
                const keyMap = { 'q': 0, 'w': 1, 'a': 2, 's': 3 };
                if (keyMap.hasOwnProperty(e.key.toLowerCase())) {
                    this.handleButtonClick(keyMap[e.key.toLowerCase()]);
                }
            }
            
            // Escape key closes modals
            if (e.key === 'Escape') {
                this.hideWeatherModal();
                this.hideAudioSettingsModal();
            }
        });
    }
    
    /**
     * Show audio settings modal
     */
    showAudioSettingsModal() {
        const modal = document.getElementById('audio-settings-modal');
        if (modal) {
            modal.classList.add('show');
            this.startVisualization();
        }
    }
    
    /**
     * Hide audio settings modal
     */
    hideAudioSettingsModal() {
        const modal = document.getElementById('audio-settings-modal');
        if (modal) {
            modal.classList.remove('show');
            this.stopVisualization();
        }
    }
    
    /**
     * Play a preview sound to test current settings
     */
    playPreviewSound() {
        if (this.soundEnabled) {
            this.audioManager.playSound(0, 0.3);
        }
    }
    
    /**
     * Play a preview sequence of all buttons
     */
    async playPreviewSequence() {
        if (!this.soundEnabled) return;
        
        for (let i = 0; i < 4; i++) {
            this.audioManager.playSound(i, 0.3);
            this.showVisualIndicator(i, 200);
            await this.delay(300);
        }
    }
    
    /**
     * Show visual indicator for a button (accessibility feature)
     * @param {number} buttonIndex - Index of the button
     * @param {number} duration - Duration of indicator in milliseconds
     */
    showVisualIndicator(buttonIndex, duration) {
        if (!this.audioManager.visualIndicatorsEnabled) return;
        
        const indicator = document.getElementById(`visual-indicator-${buttonIndex}`);
        if (indicator) {
            indicator.classList.add('active');
            setTimeout(() => {
                indicator.classList.remove('active');
            }, duration);
        }
    }
    
    /**
     * Start audio visualization animation
     */
    startVisualization() {
        if (!this.visualizationCanvas || !this.audioManager.visualizationEnabled) return;
        
        const draw = () => {
            this.animationFrameId = requestAnimationFrame(draw);
            this.drawVisualization();
        };
        draw();
    }
    
    /**
     * Stop audio visualization animation
     */
    stopVisualization() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        // Clear canvas
        if (this.visualizationCtx) {
            this.visualizationCtx.fillStyle = 'rgba(26, 26, 46, 1)';
            this.visualizationCtx.fillRect(0, 0, this.visualizationCanvas.width, this.visualizationCanvas.height);
        }
    }
    
    /**
     * Draw audio visualization on canvas
     */
    drawVisualization() {
        if (!this.visualizationCtx || !this.audioManager) return;
        
        const canvas = this.visualizationCanvas;
        const ctx = this.visualizationCtx;
        const frequencyData = this.audioManager.getFrequencyData();
        
        // Clear canvas with semi-transparent background for trailing effect
        ctx.fillStyle = 'rgba(26, 26, 46, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw frequency bars
        const barWidth = canvas.width / frequencyData.length * 2;
        let x = 0;
        
        for (let i = 0; i < frequencyData.length / 2; i++) {
            const barHeight = (frequencyData[i] / 255) * canvas.height;
            
            // Color gradient based on frequency
            const hue = (i / (frequencyData.length / 2)) * 120 + 120; // Green to cyan
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
            x += barWidth;
        }
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
        
        // Get tempo-adjusted delays
        const sequenceDelay = this.audioManager.getTempoAdjustedDelay(settings.sequenceDelay);
        const gapDelay = this.audioManager.getTempoAdjustedDelay(settings.gapDelay);
        
        // Show each button in sequence with appropriate timing
        for (let i = 0; i < this.sequence.length; i++) {
            await this.delay(gapDelay);
            await this.highlightButton(this.sequence[i], sequenceDelay);
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
        this.showVisualIndicator(buttonIndex, duration); // Show visual indicator for accessibility
        
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
     * Play a musical tone for a specific button using the AudioManager
     * @param {number} buttonIndex - Index of button (0-3) to play sound for
     */
    playSound(buttonIndex) {
        if (!this.soundEnabled) return;
        
        // Use the new AudioManager for advanced sound playback
        this.audioManager.playSound(buttonIndex, 0.3);
    }
    
    /**
     * Play error sound effect using the AudioManager
     */
    playErrorSound() {
        if (!this.soundEnabled) return;
        
        this.audioManager.playErrorSound();
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
        if (window.game) {
            // Resume legacy audio context
            if (window.game.audioContext && window.game.audioContext.state === 'suspended') {
                window.game.audioContext.resume();
            }
            // Resume AudioManager audio context
            if (window.game.audioManager && window.game.audioManager.audioContext && 
                window.game.audioManager.audioContext.state === 'suspended') {
                window.game.audioManager.audioContext.resume();
            }
        }
    }, { once: true }); // Only run once
    
    // Create global game instance
    window.game = new SimonGame();
});
