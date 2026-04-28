/**
 * PaperEffects — Canvas grain texture, CSS stain management, paper aging
 * Generates all paper texture effects without image assets
 * Grain is applied as a tiled body background so it scrolls with the page
 */

class PaperEffects {
    constructor() {
        this.canvas = document.getElementById('paper-grain');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.baseColor = { r: 244, g: 240, b: 232 }; // #f4f0e8
        this.agingFactor = 0; // 0 to 1, increases over visit duration
        this.grainDataUrl = null;
        this.grainOpacity = 0.04;
    }

    init() {
        if (!this.ctx) return;
        this.generateGrain();
        this.applyGrainToBody();
        // Hide the canvas — grain is now a body background
        this.canvas.style.display = 'none';
    }

    /**
     * Generate paper grain noise texture on canvas
     */
    generateGrain() {
        const canvas = this.canvas;
        canvas.width = 256;
        canvas.height = 256;

        const ctx = this.ctx;
        const imageData = ctx.createImageData(256, 256);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 255;
            data[i] = noise;       // R
            data[i + 1] = noise;   // G
            data[i + 2] = noise;   // B
            // Bake opacity into alpha channel so we can control it here
            data[i + 3] = Math.round(this.grainOpacity * 255);
        }

        ctx.putImageData(imageData, 0, 0);
        this.grainDataUrl = canvas.toDataURL('image/png');
    }

    /**
     * Apply the grain as a repeating background-image on body
     * This makes it scroll with the page naturally
     */
    applyGrainToBody() {
        if (!this.grainDataUrl) return;
        document.body.style.backgroundImage = `url(${this.grainDataUrl})`;
        document.body.style.backgroundRepeat = 'repeat';
    }

    /**
     * Update paper aging based on cumulative visit time
     * Called periodically by main loop
     */
    updateAging(totalVisitSeconds) {
        // Paper starts aging noticeably after 2 minutes, maxes out around 10 minutes
        this.agingFactor = Math.min(1, totalVisitSeconds / 600);

        // Shift background color warmer as paper ages
        const warmShift = this.agingFactor * 8;
        const r = Math.min(255, this.baseColor.r + warmShift);
        const g = Math.min(255, this.baseColor.g - warmShift * 0.5);
        const b = Math.min(255, this.baseColor.b - warmShift);

        document.body.style.backgroundColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

        // Increase stain visibility with aging
        const stain = document.querySelector('.stain-coffee');
        if (stain) {
            stain.style.opacity = 0.5 + this.agingFactor * 0.5;
        }

        // Regenerate grain with increased opacity as paper ages
        const newOpacity = 0.04 + this.agingFactor * 0.02;
        if (Math.abs(newOpacity - this.grainOpacity) > 0.005) {
            this.grainOpacity = newOpacity;
            this.generateGrain();
            this.applyGrainToBody();
        }
    }
}
