/**
 * GlitchEffect - Visual glitch effects for transitions and interactions
 * RGB split, chromatic aberration, digital artifacts
 */

class GlitchEffect {
    constructor() {
        this.isActive = false;
        this.intensity = 0;
        this.duration = 0;
        this.startTime = 0;

        // Create overlay element for CSS-based effects
        this.createOverlay();

        // Listen for scroll attempts and stage transitions
        window.addEventListener('scrollAttempt', (e) => {
            this.trigger(e.detail.intensity * 0.3);
        });

        window.addEventListener('stageTransition', () => {
            this.trigger(0.8);
        });
    }

    /**
     * Create DOM overlay for glitch effects
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'glitch-overlay';
        this.overlay.style.position = 'fixed';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        this.overlay.style.pointerEvents = 'none';
        this.overlay.style.zIndex = '5';
        this.overlay.style.mixBlendMode = 'screen';
        document.body.appendChild(this.overlay);
    }

    /**
     * Trigger glitch effect
     */
    trigger(intensity = 0.5) {
        this.isActive = true;
        this.intensity = Math.min(intensity, 1.0);
        this.duration = 200 + (this.intensity * 300); // 200-500ms
        this.startTime = Date.now();

        // Apply effects
        this.applyRGBSplit();
        this.applyDigitalArtifacts();
        this.applyScreenDistortion();

        // Trigger visual layer glitch if available
        if (window.visualLayer) {
            window.visualLayer.triggerGlitch(this.intensity);
        }

        // Auto-clear after duration
        setTimeout(() => {
            this.clear();
        }, this.duration);
    }

    /**
     * RGB channel separation effect - subtle
     */
    applyRGBSplit() {
        const splitAmount = this.intensity * 3; // Reduced from 10 to 3

        // Create multiple offset copies
        const textCanvas = document.getElementById('text-canvas');
        if (textCanvas) {
            textCanvas.style.filter = `
                drop-shadow(${splitAmount}px 0 0 rgba(255, 0, 0, 0.3))
                drop-shadow(-${splitAmount}px 0 0 rgba(0, 255, 255, 0.3))
            `;
        }

        // Apply to visual container too - very subtle
        const visualContainer = document.getElementById('visual-container');
        if (visualContainer) {
            visualContainer.style.filter = `
                drop-shadow(${splitAmount * 0.3}px 0 0 rgba(255, 0, 0, 0.2))
                drop-shadow(-${splitAmount * 0.3}px 0 0 rgba(0, 255, 255, 0.2))
            `;
        }
    }

    /**
     * Digital artifacts - subtle random pixels
     */
    applyDigitalArtifacts() {
        // Clear previous artifacts
        this.overlay.innerHTML = '';

        const artifactCount = Math.floor(this.intensity * 8); // Reduced from 20 to 8

        for (let i = 0; i < artifactCount; i++) {
            const artifact = document.createElement('div');
            artifact.style.position = 'absolute';
            artifact.style.left = `${Math.random() * 100}%`;
            artifact.style.top = `${Math.random() * 100}%`;
            artifact.style.width = `${Math.random() * 30 + 10}px`; // Smaller
            artifact.style.height = `${Math.random() * 2 + 1}px`; // Thinner
            artifact.style.backgroundColor = Math.random() > 0.7 ? '#ffffff' : '#000000';
            artifact.style.opacity = this.intensity * 0.3; // Much more transparent

            this.overlay.appendChild(artifact);
        }
    }

    /**
     * Screen distortion - very subtle
     */
    applyScreenDistortion() {
        const body = document.body;

        // Much more subtle skew
        const skewX = (Math.random() - 0.5) * this.intensity * 0.5; // Reduced from 2 to 0.5
        const skewY = (Math.random() - 0.5) * this.intensity * 0.5;

        gsap.to(body, {
            skewX: skewX,
            skewY: skewY,
            duration: 0.05,
            onComplete: () => {
                gsap.to(body, {
                    skewX: 0,
                    skewY: 0,
                    duration: 0.1
                });
            }
        });
    }

    /**
     * Clear all glitch effects
     */
    clear() {
        this.isActive = false;
        this.intensity = 0;

        // Clear filters
        const textCanvas = document.getElementById('text-canvas');
        if (textCanvas) {
            textCanvas.style.filter = '';
        }

        const visualContainer = document.getElementById('visual-container');
        if (visualContainer) {
            visualContainer.style.filter = '';
        }

        // Clear overlay
        this.overlay.innerHTML = '';

        // Clear body transform
        gsap.set(document.body, { skewX: 0, skewY: 0 });
    }

    /**
     * Chromatic aberration pulse
     */
    pulseChromatic() {
        let pulseIntensity = 0;
        const pulseInterval = setInterval(() => {
            pulseIntensity += 0.1;

            if (pulseIntensity > 1) {
                clearInterval(pulseInterval);
                this.clear();
                return;
            }

            const split = Math.sin(pulseIntensity * Math.PI) * 5;
            const textCanvas = document.getElementById('text-canvas');
            if (textCanvas) {
                textCanvas.style.filter = `
                    drop-shadow(${split}px 0 0 red)
                    drop-shadow(-${split}px 0 0 cyan)
                `;
            }
        }, 50);
    }

    /**
     * Scan line sweep effect
     */
    scanLineSweep() {
        const scanLine = document.createElement('div');
        scanLine.style.position = 'fixed';
        scanLine.style.left = '0';
        scanLine.style.width = '100%';
        scanLine.style.height = '3px';
        scanLine.style.backgroundColor = '#ffffff';
        scanLine.style.opacity = '0.5';
        scanLine.style.pointerEvents = 'none';
        scanLine.style.zIndex = '9999';
        document.body.appendChild(scanLine);

        gsap.fromTo(scanLine,
            { top: '0%' },
            {
                top: '100%',
                duration: 1,
                ease: 'linear',
                onComplete: () => scanLine.remove()
            }
        );
    }
}

// Create global instance
const glitchEffect = new GlitchEffect();
