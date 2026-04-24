/**
 * TextSystem - Spawns and renders degrading text across the canvas
 * Uses object pooling for performance
 */

class TextSystem {
    constructor() {
        this.canvas = document.getElementById('text-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.activeTexts = [];
        this.textPool = [];
        this.spawnTimer = 0;
        this.maxActiveTexts = 20; // Limit for performance

        // Resize canvas to window
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Load text variations
        this.loadTextVariations();

        // Listen for stage changes to adjust spawn rate
        window.addEventListener('stageChange', (e) => {
            this.onStageChange(e.detail);
        });
    }

    /**
     * Load text variations from JSON
     */
    async loadTextVariations() {
        try {
            const response = await fetch('data/textVariations.json');
            const data = await response.json();

            // Combine all categories into one pool
            this.textPool = [
                ...data.obsessive,
                ...data.clinical,
                ...data.corrupted
            ];

            console.log(`Loaded ${this.textPool.length} text variations`);
        } catch (error) {
            console.error('Failed to load text variations:', error);
            // Fallback to minimal set
            this.textPool = [
                'it keeps eating diamonds',
                'consumption continues',
                'specimen behavior: ongoing'
            ];
        }
    }

    /**
     * Resize canvas to fill window
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Handle stage change
     */
    onStageChange(detail) {
        // Could adjust spawn behavior based on stage
        console.log('TextSystem: Stage changed to', detail.to);
    }

    /**
     * Get spawn interval based on current stage
     */
    getSpawnInterval() {
        const characteristics = stageManager.getCurrentCharacteristics();
        return characteristics.textSpawnRate || 3000; // Default 3 seconds
    }

    /**
     * Update text system
     */
    update(deltaTime) {
        // Check if we should spawn new text
        this.spawnTimer += deltaTime;

        if (this.spawnTimer > this.getSpawnInterval() && this.activeTexts.length < this.maxActiveTexts) {
            this.spawnText();
            this.spawnTimer = 0;
        }

        // Update all active texts
        this.activeTexts = this.activeTexts.filter(text => {
            const shouldRemove = text.update(deltaTime);
            return !shouldRemove; // Keep if not marked for removal
        });
    }

    /**
     * Spawn new text at random position
     */
    spawnText() {
        if (this.textPool.length === 0) return; // Not loaded yet

        // Get random text variation
        const text = this.textPool[Math.floor(Math.random() * this.textPool.length)];

        // Random position (with padding from edges)
        const padding = 50;
        const position = {
            x: padding + Math.random() * (window.innerWidth - padding * 2),
            y: padding + Math.random() * (window.innerHeight - padding * 2)
        };

        // Create new degradation instance
        const textInstance = new TextDegradation(text, position);
        this.activeTexts.push(textInstance);
    }

    /**
     * Render all active texts
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render each text
        this.activeTexts.forEach(text => {
            const props = text.getRenderProps();
            this.renderText(props);
        });
    }

    /**
     * Render single text instance
     */
    renderText(props) {
        const { text, position, opacity, scale, rotation, phase } = props;

        this.ctx.save();

        // Move to position
        this.ctx.translate(position.x, position.y);

        // Apply rotation
        this.ctx.rotate(rotation);

        // Apply scale
        this.ctx.scale(scale, scale);

        // Font styling - monospace for code aesthetic
        const baseFontSize = 14;
        const fontSize = baseFontSize + Math.random() * 8;
        this.ctx.font = `${fontSize}px 'Courier New', monospace`;

        // Color variation based on phase
        let color = '#ffffff';

        if (phase === 'degrading') {
            // Mix of colors as it corrupts
            const colors = [
                '#ffffff',
                '#cccccc',
                '#999999',
                '#ff0000', // Occasional red
                '#00ff00'  // Matrix-style green (rare)
            ];
            color = colors[Math.floor(Math.random() * colors.length)];
        } else if (phase === 'dying') {
            color = '#666666'; // Fade to gray
        }

        this.ctx.fillStyle = color;

        // Apply opacity
        this.ctx.globalAlpha = opacity;

        // Text shadow for slight glow
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 5;

        // Render text centered around origin
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, 0, 0);

        this.ctx.restore();
    }

    /**
     * Get active text count (for debugging)
     */
    getActiveCount() {
        return this.activeTexts.length;
    }

    /**
     * Force spawn text (for testing)
     */
    forceSpawn() {
        this.spawnText();
    }

    /**
     * Clear all texts
     */
    clear() {
        this.activeTexts = [];
    }
}

// Create global instance (will be initialized in main.js)
let textSystem = null;
