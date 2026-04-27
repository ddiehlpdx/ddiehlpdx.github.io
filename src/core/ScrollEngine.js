/**
 * ScrollEngine - Non-linear scroll system
 * Hijacks native scroll and implements disorienting navigation
 */

class ScrollEngine {
    constructor() {
        this.scrollAccumulator = 0;
        this.lastScrollDirection = 0;
        this.timeAtPosition = 0;
        this.lastScrollTime = Date.now();
        this.delta = 0;

        // For visual feedback
        this.isScrolling = false;
        this.scrollTimeout = null;

        // Performance tracking
        this.lastFrameTime = Date.now();

        // Initialize
        this.disableNativeScroll();
        this.startTimeTracking();
    }

    /**
     * Disable native scroll completely
     */
    disableNativeScroll() {
        // Prevent scrollbar
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        // Capture wheel events (desktop)
        window.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleScrollDelta(e.deltaY * 0.5);
        }, { passive: false });

        // Capture touch events (mobile) - use incremental delta
        let lastTouchY = 0;

        window.addEventListener('touchstart', (e) => {
            lastTouchY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const currentY = e.touches[0].clientY;
            const delta = lastTouchY - currentY; // Incremental since last move
            lastTouchY = currentY;

            this.handleScrollDelta(delta * 0.5);
        }, { passive: false });

        // Prevent space bar and arrow key scrolling
        window.addEventListener('keydown', (e) => {
            if ([32, 37, 38, 39, 40].includes(e.keyCode)) {
                e.preventDefault();

                // Map arrow keys to scroll
                switch(e.keyCode) {
                    case 38: // up
                        this.handleScrollDelta(-50);
                        break;
                    case 40: // down
                        this.handleScrollDelta(50);
                        break;
                }
            }
        }, { passive: false });
    }

    /**
     * Handle scroll delta from any input source
     */
    handleScrollDelta(deltaValue) {
        const now = Date.now();
        const direction = Math.sign(deltaValue);
        this.delta = deltaValue;

        // Update accumulator
        this.scrollAccumulator += deltaValue;

        // Check if direction changed (reset accumulator on direction change)
        if (direction !== 0 && direction !== this.lastScrollDirection && this.lastScrollDirection !== 0) {
            this.scrollAccumulator = deltaValue;
        }

        // Reset time at position when scrolling
        this.timeAtPosition = 0;
        this.lastScrollTime = now;

        // Visual feedback - trigger scroll effect
        this.triggerScrollFeedback();

        // Build context for stage evaluation
        const context = {
            delta: this.delta,
            direction: direction,
            accumulator: this.scrollAccumulator,
            timeAtPosition: this.timeAtPosition,
            lastDirection: this.lastScrollDirection,
            loopCount: stateManager.loopCount,
            isScrolling: true // We're actively scrolling during this event
        };

        // Evaluate stage transition
        const didTransition = stageManager.evaluateTransition(context);

        if (didTransition) {
            // Reset accumulator on stage transition
            this.scrollAccumulator = 0;
            this.timeAtPosition = 0;

            // Trigger visual transition effect
            this.triggerStageTransitionEffect();
        }

        // Update last direction
        this.lastScrollDirection = direction;

        // Mark as scrolling
        this.isScrolling = true;
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, 150);
    }

    /**
     * Start tracking time at position
     */
    startTimeTracking() {
        setInterval(() => {
            const now = Date.now();
            const timeSinceLastScroll = now - this.lastScrollTime;

            // Only start tracking stillness after being still for 1 second
            // This prevents accidental transitions from brief pauses
            if (timeSinceLastScroll > 1000) {
                this.timeAtPosition += 100;

                // Check for stillness-based transitions
                this.checkStillnessTransitions();
            }
        }, 100);
    }

    /**
     * Check for stage transitions based on stillness
     */
    checkStillnessTransitions() {
        // Only check if we're not actively scrolling
        if (!this.isScrolling && this.timeAtPosition > 0) {
            const context = {
                delta: 0,
                direction: 0,
                accumulator: this.scrollAccumulator,
                timeAtPosition: this.timeAtPosition,
                lastDirection: this.lastScrollDirection,
                loopCount: stateManager.loopCount,
                isScrolling: false
            };

            // Evaluate stage transition
            const didTransition = stageManager.evaluateTransition(context);

            if (didTransition) {
                // Reset accumulator on stage transition
                this.scrollAccumulator = 0;
                this.timeAtPosition = 0;

                // Trigger visual transition effect
                this.triggerStageTransitionEffect();
            }
        }
    }

    /**
     * Trigger visual feedback for scroll attempts
     */
    triggerScrollFeedback() {
        // Small screen shake
        const intensity = Math.min(Math.abs(this.delta) / 100, 1);
        const shakeAmount = intensity * 3;

        gsap.to(document.body, {
            x: (Math.random() - 0.5) * shakeAmount,
            y: (Math.random() - 0.5) * shakeAmount,
            duration: 0.05,
            onComplete: () => {
                gsap.to(document.body, {
                    x: 0,
                    y: 0,
                    duration: 0.1
                });
            }
        });

        // Dispatch event for other systems
        window.dispatchEvent(new CustomEvent('scrollAttempt', {
            detail: {
                delta: this.delta,
                direction: this.lastScrollDirection,
                intensity: intensity
            }
        }));
    }

    /**
     * Trigger effect when stage transition occurs
     */
    triggerStageTransitionEffect() {
        // Larger glitch effect
        const body = document.body;

        // Screen shake
        gsap.to(body, {
            x: (Math.random() - 0.5) * 20,
            y: (Math.random() - 0.5) * 20,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                gsap.set(body, { x: 0, y: 0 });
            }
        });

        // Flash effect
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = '#ffffff';
        flash.style.opacity = '0';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '9999';
        document.body.appendChild(flash);

        gsap.to(flash, {
            opacity: 0.3,
            duration: 0.05,
            onComplete: () => {
                gsap.to(flash, {
                    opacity: 0,
                    duration: 0.2,
                    onComplete: () => flash.remove()
                });
            }
        });

        // Dispatch transition event
        window.dispatchEvent(new CustomEvent('stageTransition', {
            detail: {
                stage: stateManager.currentStage
            }
        }));
    }

    /**
     * Get current scroll context (for debugging)
     */
    getContext() {
        return {
            accumulator: this.scrollAccumulator,
            direction: this.lastScrollDirection,
            timeAtPosition: this.timeAtPosition,
            delta: this.delta,
            isScrolling: this.isScrolling
        };
    }

    /**
     * Reset scroll state (for testing)
     */
    reset() {
        this.scrollAccumulator = 0;
        this.lastScrollDirection = 0;
        this.timeAtPosition = 0;
        this.delta = 0;
        this.isScrolling = false;
    }
}

// Create global instance (will be initialized in main.js)
let scrollEngine = null;
