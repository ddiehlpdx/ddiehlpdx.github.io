/**
 * WallAudio — Faint tones for each name scrolled past
 * Web Audio API. Pitch derived from name hash.
 * G# Harmonic Minor across 2 octaves — degrades with depth.
 *
 * TOP:   Pure harmonic minor, sine waves
 * MID:   Slight detuning (±15 cents), occasional beating
 * DEEP:  Heavy detuning (±50-100 cents), harsher waveforms, dissonant doubles
 * ABYSS: Extreme detuning (±200+ cents), distorted, the scale is destroyed
 */

class WallAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.initialized = false;
        this.lastToneTime = 0;
        this.minToneInterval = 0.05; // seconds
    }

    /**
     * Initialize audio context. Must be called from a user gesture handler.
     */
    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.04;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('[wall audio] could not initialize:', e);
        }
    }

    /**
     * Deterministic pseudo-random values from a hash.
     * Returns an array of floats in [0,1).
     */
    seededRandom(hash, count) {
        var rng = PRNG.mulberry32(Math.abs(hash));
        var vals = [];
        for (var i = 0; i < count; i++) vals.push(rng());
        return vals;
    }

    /**
     * Convert cents offset to frequency multiplier.
     */
    centsToRatio(cents) {
        return Math.pow(2, cents / 1200);
    }

    /**
     * Play a faint tone derived from a name hash.
     * Degrades with depth: detuning, harsher waveforms, dissonant doubles.
     */
    playTone(nameHash, entryIndex) {
        if (!this.initialized || !this.ctx) return;

        var now = this.ctx.currentTime;
        if (now - this.lastToneTime < this.minToneInterval) return;
        this.lastToneTime = now;

        var absHash = Math.abs(nameHash);
        var freq = WallAudio.FREQUENCIES[absHash % WallAudio.FREQUENCIES.length];
        var r = this.seededRandom(nameHash, 6);
        var index = entryIndex || 0;

        // ── TOP (0-60): Pure harmonic minor ──
        if (index < 60) {
            this.emitTone(freq, 'sine', 1.5, now);
            return;
        }

        // ── MID (60-625): Slight detuning, occasional beating ──
        if (index < 625) {
            var cents = (r[0] - 0.5) * 30; // ±15 cents
            var detuned = freq * this.centsToRatio(cents);
            this.emitTone(detuned, 'sine', 1.5, now);

            // ~20% chance of a second tone slightly off, creating a slow beat
            if (r[1] < 0.20) {
                var beatCents = (r[2] - 0.5) * 16; // ±8 cents from the first
                this.emitTone(detuned * this.centsToRatio(beatCents), 'sine', 1.5, now, 0.06);
            }
            return;
        }

        // ── DEEP (625-6250): Heavy detuning, harsh timbres, dissonant doubles ──
        if (index < 6250) {
            // Detuning increases with depth through the tier
            var depthRatio = (index - 625) / 5625; // 0 at start, 1 at end
            var maxCents = 50 + depthRatio * 100; // 50-150 cents
            var cents = (r[0] - 0.5) * maxCents * 2;
            var detuned = freq * this.centsToRatio(cents);

            // Waveform degrades
            var waveform = r[1] < (0.3 + depthRatio * 0.4) ? 'triangle' : 'sine';

            // Shorter, more abrupt envelope
            var duration = 1.5 - depthRatio * 0.5; // 1.5 → 1.0
            this.emitTone(detuned, waveform, duration, now);

            // ~40% chance of dissonant second tone (tritone or minor 2nd away)
            if (r[2] < 0.40) {
                var dissonantIntervals = [100, -100, 600, -600, 50, -50]; // cents: minor 2nd, tritone, quarter-tone
                var interval = dissonantIntervals[Math.floor(r[3] * dissonantIntervals.length)];
                this.emitTone(detuned * this.centsToRatio(interval), waveform, duration * 0.7, now, 0.08);
            }
            return;
        }

        // ── ABYSS (6250+): The scale is destroyed ──
        var cents = (r[0] - 0.5) * 600; // ±300 cents — nearly 3 semitones off
        var detuned = freq * this.centsToRatio(cents);

        var waveforms = ['sine', 'triangle', 'sawtooth', 'square'];
        var waveform = waveforms[Math.floor(r[1] * waveforms.length)];

        // Very short, clipped tones
        var duration = 0.4 + r[2] * 0.6; // 0.4-1.0s
        this.emitTone(detuned, waveform, duration, now);

        // ~60% chance of second dissonant tone
        if (r[3] < 0.60) {
            var interval = (r[4] - 0.5) * 800; // ±400 cents — completely random
            var waveform2 = waveforms[Math.floor(r[5] * waveforms.length)];
            this.emitTone(detuned * this.centsToRatio(interval), waveform2, duration * 0.5, now, 0.10);
        }
    }

    /**
     * Emit a single oscillator tone with envelope.
     * @param {number} freq - Frequency in Hz
     * @param {string} waveform - 'sine', 'triangle', 'sawtooth', 'square'
     * @param {number} duration - Total tone duration in seconds
     * @param {number} now - AudioContext currentTime
     * @param {number} [peakGain=0.15] - Peak gain of envelope
     */
    emitTone(freq, waveform, duration, now, peakGain) {
        if (typeof peakGain === 'undefined') peakGain = 0.15;

        var osc = this.ctx.createOscillator();
        osc.type = waveform;
        osc.frequency.value = freq;

        var env = this.ctx.createGain();
        var attack = Math.min(0.01, duration * 0.05);
        var decayEnd = Math.min(duration * 0.35, 0.5);
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(peakGain, now + attack);
        env.gain.exponentialRampToValueAtTime(0.01, now + decayEnd);
        env.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(env);
        env.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);

        osc.onended = function () {
            osc.disconnect();
            env.disconnect();
        };
    }

    /**
     * Simple djb2 string hash -> integer
     */
    static hashName(name) {
        var hash = 5381;
        for (var i = 0; i < name.length; i++) {
            hash = ((hash << 5) + hash) + name.charCodeAt(i);
            hash = hash & hash;
        }
        return hash;
    }

    destroy() {
        if (this.ctx) {
            this.ctx.close();
        }
    }
}

// G# Harmonic Minor: G# A# B C# D# E G across 2 octaves
WallAudio.FREQUENCIES = [
    207.65, 233.08, 246.94, 277.18, 311.13, 329.63, 392.00,
    415.30, 466.16, 493.88, 554.37, 622.25, 659.26, 783.99
];
