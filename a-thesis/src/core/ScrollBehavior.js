/**
 * ScrollBehavior — GSAP ScrollTrigger integration with subtle wrongness
 * Normal scroll (contrast with Diamond Eater's hijacked scroll) but slightly off
 */

class ScrollBehavior {
    constructor(documentState) {
        this.state = documentState;
        this.phantomScrollTriggered = false;
        this.speedVarianceActive = false;
        this.idleTimer = null;
        this.idleThreshold = 30000; // 30 seconds idle before phantom scroll
        this.lastScrollTime = Date.now();
    }

    init() {
        gsap.registerPlugin(ScrollTrigger);
        this.setupSectionReveals();
        this.setupTrackRowReveals();
        this.setupExhibitReveals();
        this.setupFooterReveal();
        this.setupScrollTracking();
        this.setupIdleDetection();
        this.scheduleSpeedVariance();
    }

    /**
     * Reveal document sections as they scroll into view
     */
    setupSectionReveals() {
        const sections = document.querySelectorAll('.document-section');
        sections.forEach(section => {
            ScrollTrigger.create({
                trigger: section,
                start: 'top 85%',
                onEnter: () => {
                    section.classList.add('revealed');
                    const sectionId = section.dataset.section;
                    if (sectionId) {
                        this.state.viewSection(sectionId);
                        window.dispatchEvent(new CustomEvent('sectionRevealed', {
                            detail: { sectionId }
                        }));
                    }
                },
                once: true
            });
        });
    }

    /**
     * Reveal track table rows sequentially
     */
    setupTrackRowReveals() {
        const rows = document.querySelectorAll('.track-row');
        const toc = document.getElementById('table-of-contents');

        if (!toc || rows.length === 0) return;

        ScrollTrigger.create({
            trigger: toc,
            start: 'top 75%',
            onEnter: () => {
                rows.forEach((row, i) => {
                    gsap.to(row, {
                        delay: i * 0.15,
                        duration: 0,
                        onComplete: () => row.classList.add('revealed')
                    });
                });
            },
            once: true
        });
    }

    /**
     * Reveal exhibit entries one by one
     */
    setupExhibitReveals() {
        const entries = document.querySelectorAll('.exhibit-entry');
        entries.forEach((entry, i) => {
            ScrollTrigger.create({
                trigger: entry,
                start: 'top 90%',
                onEnter: () => {
                    gsap.to(entry, {
                        delay: i * 0.1,
                        duration: 0,
                        onComplete: () => entry.classList.add('revealed')
                    });
                },
                once: true
            });
        });
    }

    /**
     * Reveal footer
     */
    setupFooterReveal() {
        const footer = document.getElementById('document-footer');
        if (!footer) return;

        ScrollTrigger.create({
            trigger: footer,
            start: 'top 90%',
            onEnter: () => footer.classList.add('revealed'),
            once: true
        });
    }

    /**
     * Track scroll depth for state persistence
     */
    setupScrollTracking() {
        window.addEventListener('scroll', () => {
            this.lastScrollTime = Date.now();
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollHeight > 0) {
                const depth = window.scrollY / scrollHeight;
                this.state.updateScrollDepth(depth);
            }
        }, { passive: true });
    }

    /**
     * Detect idle state and trigger phantom scroll
     */
    setupIdleDetection() {
        const resetIdle = () => {
            this.lastScrollTime = Date.now();
        };

        window.addEventListener('mousemove', resetIdle, { passive: true });
        window.addEventListener('keydown', resetIdle, { passive: true });
        window.addEventListener('touchstart', resetIdle, { passive: true });

        // Check for idle every 5 seconds
        setInterval(() => {
            const idleDuration = Date.now() - this.lastScrollTime;
            if (idleDuration > this.idleThreshold && !this.phantomScrollTriggered) {
                this.triggerPhantomScroll();
            }
        }, 5000);
    }

    /**
     * Phantom scroll — page shifts 2-3px on its own during idle
     * Only happens once per visit
     */
    triggerPhantomScroll() {
        this.phantomScrollTriggered = true;
        const shift = 2 + Math.random();
        const startY = window.scrollY;
        const targetY = startY + shift;

        // Animate scroll manually without requiring ScrollToPlugin
        gsap.to({ y: startY }, {
            y: targetY,
            duration: 0.8,
            ease: 'power1.inOut',
            onUpdate: function () {
                window.scrollTo(0, this.targets()[0].y);
            }
        });
    }

    /**
     * Schedule occasional scroll speed variance
     * Subtly changes scroll smoothness for a few seconds
     */
    scheduleSpeedVariance() {
        const scheduleNext = () => {
            const delay = 30000 + Math.random() * 30000; // 30-60 seconds
            setTimeout(() => {
                if (!this.speedVarianceActive) {
                    this.applySpeedVariance();
                }
                scheduleNext();
            }, delay);
        };
        scheduleNext();
    }

    /**
     * Apply a brief scroll speed change via CSS scroll-behavior manipulation
     */
    applySpeedVariance() {
        this.speedVarianceActive = true;
        // Apply subtle transform to document wrapper for a visceral "shift"
        const wrapper = document.getElementById('document-wrapper');
        if (wrapper) {
            gsap.to(wrapper, {
                y: 1,
                duration: 2,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    gsap.set(wrapper, { y: 0 });
                    this.speedVarianceActive = false;
                }
            });
        }
    }

    /**
     * Force refresh all ScrollTriggers (useful after content changes)
     */
    refresh() {
        ScrollTrigger.refresh();
    }
}
