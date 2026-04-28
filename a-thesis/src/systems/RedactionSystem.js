/**
 * RedactionSystem — Manages redaction bar behaviors
 * Three types: permanent (no interaction), flicker (hover reveals glimpses),
 * timed (cracks open after cumulative visit time threshold)
 */

class RedactionSystem {
    constructor(documentState) {
        this.state = documentState;
        this.flickerElements = [];
        this.timedElements = [];
        this.timedCheckInterval = null;
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    init() {
        this.flickerElements = document.querySelectorAll('.redacted[data-type="flicker"]');
        this.timedElements = document.querySelectorAll('.redacted[data-type="timed"]');

        this.setupFlickerInteractions();
        this.setupTimedRedactions();
        this.checkTimedRedactions(); // Check immediately in case thresholds already met
    }

    /**
     * Setup flicker behavior — hover (desktop) or tap (mobile) shows glimpses
     */
    setupFlickerInteractions() {
        this.flickerElements.forEach(el => {
            if (this.isMobile) {
                // Mobile: tap to toggle flicker briefly
                el.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    el.classList.add('flickering');
                    setTimeout(() => {
                        el.classList.remove('flickering');
                    }, 600 + Math.random() * 400);
                }, { passive: false });
            } else {
                // Desktop: flicker on hover
                el.addEventListener('mouseenter', () => {
                    el.classList.add('flickering');
                });
                el.addEventListener('mouseleave', () => {
                    el.classList.remove('flickering');
                });
            }
        });
    }

    /**
     * Setup timed redactions — check periodically if thresholds are met
     */
    setupTimedRedactions() {
        // Check every 5 seconds
        this.timedCheckInterval = setInterval(() => {
            this.checkTimedRedactions();
        }, 5000);
    }

    /**
     * Check all timed redactions against their thresholds
     */
    checkTimedRedactions() {
        this.timedElements.forEach((el, index) => {
            // Skip already cracked
            if (el.classList.contains('cracked')) return;

            const threshold = parseInt(el.dataset.threshold) || 180; // default 3 minutes
            const redactionId = `timed-${index}`;

            // Check if already lifted in a previous session
            if (this.state.redactionsLifted.has(redactionId)) {
                this.crackRedaction(el, redactionId, true);
                return;
            }

            // Check if threshold met
            if (this.state.hasExceededTime(threshold)) {
                this.crackRedaction(el, redactionId, false);
            }
        });
    }

    /**
     * Animate a timed redaction cracking open
     */
    crackRedaction(element, redactionId, instant) {
        if (element.classList.contains('cracked')) return;

        this.state.liftRedaction(redactionId);

        if (instant) {
            // Already seen in previous session — show immediately
            element.classList.add('cracking', 'cracked');
            return;
        }

        // Animate the crack
        element.classList.add('cracking');

        // Brief pause then split apart
        gsap.to(element, {
            duration: 0.3,
            onComplete: () => {
                element.classList.add('cracked');

                // Dispatch event for other systems
                window.dispatchEvent(new CustomEvent('redactionLifted', {
                    detail: { redactionId, element }
                }));
            }
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.timedCheckInterval) {
            clearInterval(this.timedCheckInterval);
        }
    }
}
