/**
 * TextCorruption - Character degradation algorithms
 * Multiple patterns that can be applied to corrupt text over time
 */

const CorruptionPatterns = {
    /**
     * Replace characters with similar-looking glyphs
     */
    glyphSubstitution: (text, intensity) => {
        const glyphMap = {
            'a': ['@', '4', 'Δ', 'λ', 'α'],
            'e': ['3', 'ε', '€', 'ə', 'ɛ'],
            'i': ['1', '!', '|', 'í', 'ɪ'],
            'o': ['0', 'ø', 'Ω', 'ο', 'σ'],
            't': ['†', '+', '7', 'τ', '†'],
            's': ['$', '5', 'ş', 'ș', '§'],
            'n': ['ñ', 'η', 'π', 'ń', 'ň'],
            'm': ['₥', 'ɱ', 'м', 'ḿ', 'ṁ'],
            'd': ['ð', 'δ', 'ď', 'đ', 'ḋ'],
            'g': ['ğ', 'ġ', 'ǵ', 'ǧ', 'ģ'],
            'c': ['¢', 'ç', 'ć', 'č', 'ċ'],
            'p': ['þ', 'ρ', 'ṕ', 'ṗ', 'φ'],
            'u': ['ü', 'û', 'μ', 'ù', 'ú'],
            'l': ['ł', '|', '1', 'ĺ', 'ļ'],
            'k': ['ķ', 'ǩ', 'κ', 'ḱ', 'ḳ'],
            'w': ['ω', 'ŵ', 'ẁ', 'ẃ', 'ẅ'],
            'r': ['ř', 'ŕ', 'ŗ', 'ṙ', 'ṛ']
        };

        return text.split('').map(char => {
            const lowerChar = char.toLowerCase();
            if (Math.random() < intensity && glyphMap[lowerChar]) {
                const options = glyphMap[lowerChar];
                return options[Math.floor(Math.random() * options.length)];
            }
            return char;
        }).join('');
    },

    /**
     * Shift characters into weird unicode ranges
     */
    unicodeShift: (text, intensity) => {
        return text.split('').map(char => {
            if (Math.random() < intensity && char !== ' ') {
                const code = char.charCodeAt(0);
                // Shift into combining marks, mathematical alphanumeric, etc.
                const shifts = [
                    0x0300, // Combining diacritical marks
                    0x20D0, // Combining marks for symbols
                    100,    // Nearby unicode
                    -100
                ];
                const shift = shifts[Math.floor(Math.random() * shifts.length)];
                return String.fromCharCode(code + shift);
            }
            return char;
        }).join('');
    },

    /**
     * Random character deletion
     */
    deletion: (text, intensity) => {
        return text.split('').map(char => {
            if (Math.random() < intensity && char !== ' ') {
                return '';
            }
            return char;
        }).join('');
    },

    /**
     * Character repetition stutter
     */
    stutter: (text, intensity) => {
        return text.split('').map(char => {
            if (Math.random() < intensity && char !== ' ') {
                const repeats = Math.floor(Math.random() * 5) + 1;
                return char.repeat(repeats);
            }
            return char;
        }).join('');
    },

    /**
     * Random case changes
     */
    caseCorruption: (text, intensity) => {
        return text.split('').map(char => {
            if (Math.random() < intensity) {
                return Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase();
            }
            return char;
        }).join('');
    },

    /**
     * Insert random special characters
     */
    insertion: (text, intensity) => {
        const specialChars = ['█', '▓', '▒', '░', '■', '□', '▪', '▫', '●', '○', '◆', '◇', '★', '☆'];

        return text.split('').map(char => {
            if (Math.random() < intensity / 2) { // Less frequent
                const randomChar = specialChars[Math.floor(Math.random() * specialChars.length)];
                return char + randomChar;
            }
            return char;
        }).join('');
    },

    /**
     * Strikethrough effect using combining characters
     */
    strikethrough: (text, intensity) => {
        return text.split('').map(char => {
            if (Math.random() < intensity && char !== ' ') {
                return char + '\u0336'; // Combining long stroke overlay
            }
            return char;
        }).join('');
    }
};

/**
 * TextDegradation - Manages the lifecycle and corruption of a single text instance
 */
class TextDegradation {
    constructor(text, position) {
        this.originalText = text;
        this.currentText = text;
        this.position = position;
        this.age = 0;
        this.degradationSpeed = Math.random() * 0.15 + 0.05; // Slower corruption rate
        this.opacity = 0; // Start invisible
        this.scale = 0.8; // Start smaller
        this.rotation = (Math.random() - 0.5) * 0.1; // Slight random rotation

        // Randomly select 2-3 corruption patterns for this text instance
        this.patterns = this.selectPatterns(2, 3);

        // Lifecycle phases
        this.phase = 'spawning'; // spawning, stable, degrading, dying
        this.phaseTime = 0;

        // Phase durations (ms) - slowed down significantly
        this.spawnDuration = 500;
        this.stableDuration = 1000 + Math.random() * 2000; // 1-3 seconds stable
        this.degradeDuration = 4000 + Math.random() * 4000; // 4-8 seconds degrading
        this.dieDuration = 800;
    }

    /**
     * Update text state - returns true if text should be removed
     */
    update(deltaTime) {
        this.age += deltaTime;
        this.phaseTime += deltaTime;

        // Phase transitions
        if (this.phase === 'spawning' && this.phaseTime > this.spawnDuration) {
            this.phase = 'stable';
            this.phaseTime = 0;
            this.opacity = 1;
            this.scale = 1;
        } else if (this.phase === 'stable' && this.phaseTime > this.stableDuration) {
            this.phase = 'degrading';
            this.phaseTime = 0;
        } else if (this.phase === 'degrading' && this.phaseTime > this.degradeDuration) {
            this.phase = 'dying';
            this.phaseTime = 0;
        } else if (this.phase === 'dying' && this.phaseTime > this.dieDuration) {
            return true; // Signal for removal
        }

        // Update based on phase
        if (this.phase === 'spawning') {
            this.opacity = this.phaseTime / this.spawnDuration;
            this.scale = 0.8 + (0.2 * this.opacity);
        } else if (this.phase === 'degrading') {
            // Calculate corruption intensity (0 to 1)
            const intensity = Math.min(this.phaseTime / this.degradeDuration, 1);

            // Apply corruption patterns
            let corrupted = this.originalText;
            this.patterns.forEach(pattern => {
                corrupted = CorruptionPatterns[pattern](corrupted, intensity * this.degradationSpeed);
            });

            this.currentText = corrupted;
        } else if (this.phase === 'dying') {
            this.opacity = 1 - (this.phaseTime / this.dieDuration);
            this.scale = 1 + (0.2 * (this.phaseTime / this.dieDuration));
        }

        return false; // Keep alive
    }

    /**
     * Select random corruption patterns
     */
    selectPatterns(min, max) {
        const available = Object.keys(CorruptionPatterns);
        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        return this.shuffle(available).slice(0, count);
    }

    /**
     * Shuffle array
     */
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Get render properties
     */
    getRenderProps() {
        return {
            text: this.currentText,
            position: this.position,
            opacity: this.opacity,
            scale: this.scale,
            rotation: this.rotation,
            phase: this.phase
        };
    }
}
