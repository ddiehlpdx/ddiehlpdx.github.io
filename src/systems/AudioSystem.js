/**
 * AudioSystem - Ambient soundscape using Tone.js
 * Creates unsettling atmosphere that intensifies with descent
 */

class AudioSystem {
    constructor() {
        this.initialized = false;
        this.baseDroneFrequency = 55; // A1 - low rumble

        // Audio components
        this.baseDrone = null;
        this.noiseDrone = null;
        this.glitchSynth = null;
        this.reverb = null;
        this.filter = null;
        this.masterVolume = null;

        // State
        this.intensity = 0;
        this.isMuted = false;
        this.lastGlitchTime = 0; // Track last scheduled glitch time

        console.log('AudioSystem created - waiting for user interaction to initialize');
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    async init() {
        if (this.initialized) return;

        console.log('Initializing AudioSystem with Tone.js...');

        try {
            // Start Tone.js audio context
            await Tone.start();
            console.log('Tone.js started');

            // Create master volume control
            this.masterVolume = new Tone.Volume(-12).toDestination();

            // Create reverb for atmosphere
            this.reverb = new Tone.Reverb({
                decay: 8,
                wet: 0.4
            }).connect(this.masterVolume);

            // Create filter for tonal shaping
            this.filter = new Tone.Filter({
                type: 'lowpass',
                frequency: 800,
                rolloff: -24
            }).connect(this.reverb);

            // Create base drone - very low oscillator
            this.baseDrone = new Tone.Synth({
                oscillator: {
                    type: 'triangle',
                    partials: [1, 0.5, 0.3, 0.1]
                },
                envelope: {
                    attack: 4,
                    decay: 0,
                    sustain: 1,
                    release: 4
                },
                volume: -18
            }).connect(this.filter);

            // Create noise layer for texture
            this.noiseDrone = new Tone.Noise({
                type: 'pink',
                volume: -28
            }).connect(this.filter);

            // Create glitch synth for events
            this.glitchSynth = new Tone.MetalSynth({
                frequency: 200,
                envelope: {
                    attack: 0.001,
                    decay: 0.1,
                    release: 0.01
                },
                harmonicity: 5.1,
                modulationIndex: 32,
                resonance: 4000,
                octaves: 1.5,
                volume: -20
            }).connect(this.masterVolume);

            // Start continuous sounds
            this.baseDrone.triggerAttack(this.baseDroneFrequency);
            this.noiseDrone.start();

            this.initialized = true;
            console.log('AudioSystem initialized successfully');

            // Listen for events
            this.setupEventListeners();

        } catch (error) {
            console.error('Failed to initialize AudioSystem:', error);
        }
    }

    /**
     * Setup event listeners for stage changes and interactions
     */
    setupEventListeners() {
        // Stage changes
        window.addEventListener('stageChange', (e) => {
            this.onStageChange(e.detail);
        });

        // Stage transitions (bigger glitch)
        window.addEventListener('stageTransition', () => {
            this.triggerGlitch(0.8);
        });

        // Scroll attempts (subtle glitch)
        window.addEventListener('scrollAttempt', (e) => {
            if (Math.random() < 0.2) { // Only 20% of scroll attempts
                this.triggerGlitch(e.detail.intensity * 0.3);
            }
        });
    }

    /**
     * Handle stage change - adjust ambient characteristics
     */
    onStageChange(detail) {
        if (!this.initialized) return;

        const { stage } = detail;

        // Intensity increases with stage depth
        this.intensity = Math.min(stage.id / 10, 1.0);

        // Lower the drone frequency as you descend (gets more ominous)
        const targetFrequency = this.baseDroneFrequency * (1 - this.intensity * 0.3);
        this.baseDrone.frequency.rampTo(targetFrequency, 2);

        // Increase noise volume
        const noiseVolume = -28 + (this.intensity * 8); // -28 to -20
        this.noiseDrone.volume.rampTo(noiseVolume, 2);

        // Adjust filter cutoff (gets darker/muddier)
        const filterFreq = 800 - (this.intensity * 300); // 800 to 500 Hz
        this.filter.frequency.rampTo(filterFreq, 2);

        // Increase reverb wetness (more atmospheric)
        const reverbWet = 0.4 + (this.intensity * 0.3); // 0.4 to 0.7
        this.reverb.wet.rampTo(reverbWet, 2);

        // Adjust master volume based on stage characteristics
        const stageVolume = stage.characteristics.audioVolume || 0.5;
        const targetVolume = -12 + (stageVolume * -6); // -12 to -18 dB
        this.masterVolume.volume.rampTo(targetVolume, 2);

        console.log(`AudioSystem: Stage ${stage.id}, intensity: ${this.intensity.toFixed(2)}, freq: ${targetFrequency.toFixed(1)}Hz`);
    }

    /**
     * Trigger glitch sound effect
     */
    triggerGlitch(intensity = 0.5) {
        if (!this.initialized || this.isMuted) return;

        // Calculate next available time slot (at least 0.02s after last glitch)
        const now = Tone.now();
        const nextAvailable = Math.max(now + 0.01, this.lastGlitchTime + 0.02);
        this.lastGlitchTime = nextAvailable;

        // Randomize glitch frequency
        const freq = 150 + Math.random() * 300;
        this.glitchSynth.frequency.setValueAtTime(freq, nextAvailable);

        // Adjust volume based on intensity
        const glitchVolume = -20 + (intensity * 8); // -20 to -12 dB
        this.glitchSynth.volume.setValueAtTime(glitchVolume, nextAvailable);

        // Trigger the sound at the calculated time with error handling
        try {
            this.glitchSynth.triggerAttackRelease('16n', nextAvailable);
        } catch (e) {
            // Suppress timing errors during rapid triggering
            if (!e.message.includes('Start time must be strictly greater')) {
                console.warn('Glitch trigger error:', e);
            }
        }
    }

    /**
     * Trigger mechanical/digital sound
     */
    triggerMechanical() {
        if (!this.initialized || this.isMuted) return;

        // Calculate next available time slot (at least 0.02s after last glitch)
        const now = Tone.now();
        const nextAvailable = Math.max(now + 0.01, this.lastGlitchTime + 0.02);
        this.lastGlitchTime = nextAvailable;

        // Sharp, metallic click
        this.glitchSynth.frequency.setValueAtTime(800, nextAvailable);
        this.glitchSynth.harmonicity = 12;

        // Trigger the sound with error handling
        try {
            this.glitchSynth.triggerAttackRelease('32n', nextAvailable);
        } catch (e) {
            // Suppress timing errors during rapid triggering
            if (!e.message.includes('Start time must be strictly greater')) {
                console.warn('Mechanical trigger error:', e);
            }
        }

        // Reset harmonicity after the sound
        setTimeout(() => {
            this.glitchSynth.harmonicity = 5.1;
        }, 100);
    }

    /**
     * Mute/unmute audio
     */
    toggleMute() {
        this.isMuted = !this.isMuted;

        if (this.initialized) {
            if (this.isMuted) {
                this.masterVolume.volume.rampTo(-Infinity, 0.1);
            } else {
                this.masterVolume.volume.rampTo(-12, 0.1);
            }
        }

        return this.isMuted;
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.baseDrone) this.baseDrone.dispose();
        if (this.noiseDrone) this.noiseDrone.dispose();
        if (this.glitchSynth) this.glitchSynth.dispose();
        if (this.reverb) this.reverb.dispose();
        if (this.filter) this.filter.dispose();
        if (this.masterVolume) this.masterVolume.dispose();
    }
}

// Create global instance (will be initialized after user interaction)
let audioSystem = null;
