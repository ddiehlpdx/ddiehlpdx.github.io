/**
 * Main application — "A Thesis" official page
 * Entry point, initialization flow, system wiring
 */

(function () {
    'use strict';

    // Global system instances
    let documentState = null;
    let scrollBehavior = null;
    let typewriterSystem = null;
    let redactionSystem = null;
    let paperEffects = null;
    let annotationSystem = null;
    let stampEffect = null;
    let bloodEffect = null;

    // Debug mode
    const isDebug = new URLSearchParams(window.location.search).has('debug');
    let debugUpdateInterval = null;

    /**
     * Initialize the experience after user interaction
     */
    function init() {
        const overlay = document.getElementById('init-overlay');
        if (!overlay) return;

        overlay.classList.add('dismissed');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 800);

        // Show document
        const wrapper = document.getElementById('document-wrapper');
        if (wrapper) {
            wrapper.classList.add('visible');
        }

        // Initialize systems
        documentState = new DocumentState();
        paperEffects = new PaperEffects();
        typewriterSystem = new TypewriterSystem();
        scrollBehavior = new ScrollBehavior(documentState);
        redactionSystem = new RedactionSystem(documentState);
        annotationSystem = new AnnotationSystem(documentState);
        stampEffect = new StampEffect();

        paperEffects.init();
        typewriterSystem.init();

        // Start header typewriter after a brief pause
        setTimeout(() => {
            typewriterSystem.startHeaderSequence();
        }, 400);

        // Wait for GSAP/ScrollTrigger to be ready
        gsap.delayedCall(0.1, () => {
            scrollBehavior.init();
            annotationSystem.init();
        });

        redactionSystem.init();
        stampEffect.init();
        bloodEffect = new BloodEffect(documentState, scrollBehavior);
        bloodEffect.init();

        // Wire up events
        setupEventListeners();

        // Paper aging update loop
        setInterval(() => {
            if (documentState && paperEffects) {
                paperEffects.updateAging(documentState.totalVisitTime);
            }
        }, 10000); // every 10 seconds

        // Apply immediate aging if returning visitor
        if (documentState.totalVisitTime > 0) {
            paperEffects.updateAging(documentState.totalVisitTime);
        }

        // Debug mode
        if (isDebug) {
            setupDebug();
        }

        // Save state on page unload
        window.addEventListener('beforeunload', () => {
            if (documentState) documentState.destroy();
        });

        console.log('[a thesis] initialized — visit #' + documentState.visitCount);
    }

    /**
     * Wire up cross-system events
     */
    function setupEventListeners() {
        // Hidden element discovery tracking
        window.addEventListener('hiddenElementFound', (e) => {
            if (documentState) {
                const isNew = documentState.findHiddenElement(e.detail.elementId);
                if (isNew) {
                    console.log('[a thesis] discovered:', e.detail.elementId);
                }
            }
        });

        // Section reveal tracking
        window.addEventListener('sectionRevealed', (e) => {
            console.log('[a thesis] section viewed:', e.detail.sectionId);
        });

        // Redaction lifted tracking
        window.addEventListener('redactionLifted', (e) => {
            console.log('[a thesis] redaction lifted:', e.detail.redactionId);
        });
    }

    /**
     * Debug overlay setup
     */
    function setupDebug() {
        const debugOverlay = document.getElementById('debug-overlay');
        const debugContent = document.getElementById('debug-content');
        const debugReset = document.getElementById('debug-reset');

        if (!debugOverlay) return;

        debugOverlay.classList.remove('hidden');

        // Update debug info every second
        debugUpdateInterval = setInterval(() => {
            if (!documentState || !debugContent) return;

            const info = documentState.getDebugInfo();
            if (bloodEffect) {
                const bloodInfo = bloodEffect.getDebugInfo();
                info.bloodDrops = bloodInfo.dropCount;
                info.bloodStains = bloodInfo.activeStains;
            }
            debugContent.innerHTML = Object.entries(info)
                .map(([key, val]) => {
                    const display = Array.isArray(val) ? val.join(', ') || 'none' : val;
                    return `<div>${key}: ${display}</div>`;
                })
                .join('');
        }, 1000);

        // Reset button
        if (debugReset) {
            debugReset.addEventListener('click', () => {
                if (documentState) {
                    documentState.reset();
                    console.log('[a thesis] state reset');
                    window.location.reload();
                }
            });
        }
    }

    /**
     * Setup init overlay click/touch/key listeners
     */
    function setupInitListeners() {
        const overlay = document.getElementById('init-overlay');
        if (!overlay) return;

        const startHandler = (e) => {
            e.preventDefault();
            overlay.removeEventListener('click', startHandler);
            overlay.removeEventListener('touchend', startHandler);
            document.removeEventListener('keydown', keyHandler);
            init();
        };

        const keyHandler = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                startHandler(e);
            }
        };

        overlay.addEventListener('click', startHandler);
        overlay.addEventListener('touchend', startHandler);
        document.addEventListener('keydown', keyHandler);
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupInitListeners);
    } else {
        setupInitListeners();
    }
})();
