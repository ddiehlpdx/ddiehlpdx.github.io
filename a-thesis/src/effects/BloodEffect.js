/**
 * BloodEffect — Occasional blood drops that fall and stain the paper
 * Creates a visceral, unsettling punctuation — the document is bleeding
 */

class BloodEffect {
    constructor(documentState, scrollBehaviorRef) {
        this.state = documentState;
        this.scrollBehavior = scrollBehaviorRef;
        this.stains = [];
        this.stainPositions = []; // {x, y} in document coords for proximity checks
        this.dropTimer = null;
        this.isActive = false;
        this.dropCount = 0;

        // Content column bounds (avoid dropping stains over text)
        this.contentMargin = 60; // px padding from content edges
        this.poolingRadius = 120; // px — stains within this distance count as "nearby"
    }

    init() {
        this.isActive = true;

        // First drop after 1-2 seconds (DEBUG TIMING)
        const firstDelay = 1000 + Math.random() * 1000;
        this.dropTimer = setTimeout(() => this.attemptDrop(), firstDelay);

        // Pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.dropTimer) {
                clearTimeout(this.dropTimer);
                this.dropTimer = null;
            } else if (!document.hidden && this.isActive) {
                this.scheduleNextDrop();
            }
        });
    }

    /**
     * Schedule the next drop (20-30 seconds)
     */
    scheduleNextDrop() {
        if (this.dropTimer) clearTimeout(this.dropTimer);
        const delay = 3000 + Math.random() * 1000; // DEBUG TIMING (normally 20000 + 10000)
        this.dropTimer = setTimeout(() => this.attemptDrop(), delay);
    }

    /**
     * Check conditions before dropping
     */
    attemptDrop() {
        // Don't drop if page is hidden
        if (document.hidden) {
            this.scheduleNextDrop();
            return;
        }

        this.createDrop();
        this.scheduleNextDrop();
    }

    /**
     * Get a random position that avoids the content column
     */
    getRandomPosition() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Calculate content column bounds
        const wrapper = document.getElementById('document-wrapper');
        let contentLeft = 0;
        let contentRight = vw;

        if (wrapper) {
            const rect = wrapper.getBoundingClientRect();
            contentLeft = rect.left - this.contentMargin;
            contentRight = rect.right + this.contentMargin;
        }

        // Choose x position: prefer margins but allow some overlap
        let x;
        const useLeftMargin = Math.random() < 0.5;

        if (useLeftMargin && contentLeft > 40) {
            // Left margin
            x = 20 + Math.random() * (contentLeft - 30);
        } else if (!useLeftMargin && (vw - contentRight) > 40) {
            // Right margin
            x = contentRight + 10 + Math.random() * (vw - contentRight - 30);
        } else {
            // Narrow viewport — allow anywhere but slight preference for edges
            x = 20 + Math.random() * (vw - 40);
        }

        // Y position: land somewhere in the visible area
        const y = vh * 0.15 + Math.random() * (vh * 0.7);

        return { x, y };
    }

    /**
     * Create and animate a falling blood drop
     */
    createDrop() {
        const { x, y } = this.getRandomPosition();

        // Create drop element
        const drop = document.createElement('div');
        drop.className = 'blood-drop';
        drop.style.left = x + 'px';
        drop.style.top = '-10px';
        document.body.appendChild(drop);

        // Fall duration varies with distance
        const fallDuration = 0.5 + (y / window.innerHeight) * 0.4;

        // Animate the fall
        gsap.to(drop, {
            top: y,
            duration: fallDuration,
            ease: 'power2.in',
            onComplete: () => {
                // Remove the falling drop
                drop.remove();
                // Create the stain at impact
                this.createImpact(x, y);
            }
        });

        this.dropCount++;
    }

    /**
     * Create a stain at the impact point
     */
    createImpact(x, y) {
        // Convert viewport coordinates to document coordinates so stains scroll with the page
        const docX = x;
        const docY = y + window.scrollY;

        // Check proximity to existing stains for pooling effect
        const nearbyCount = this.countNearbyStains(docX, docY);
        // Opacity multiplier: more nearby stains = more saturated
        const opacityMultiplier = Math.min(2.5, 1.0 + nearbyCount * 0.3);

        // Create a pool element if stains are clustering
        if (nearbyCount >= 2) {
            this.createPool(docX, docY, nearbyCount);
        }

        // Track this stain's position
        this.stainPositions.push({ x: docX, y: docY });

        // Randomize stain size and shape
        const size = 30 + Math.random() * 30;

        // Random irregular border-radius for organic shape
        const br = () => 40 + Math.random() * 20;
        const borderRadius = `${br()}% ${br()}% ${br()}% ${br()}% / ${br()}% ${br()}% ${br()}% ${br()}%`;

        // Create stain element
        const stain = document.createElement('div');
        stain.className = 'blood-stain';
        stain.style.left = (docX - size / 2) + 'px';
        stain.style.top = (docY - size / 2) + 'px';
        stain.style.width = size + 'px';
        stain.style.height = size + 'px';
        stain.style.borderRadius = borderRadius;
        document.body.appendChild(stain);
        this.stains.push(stain);

        // Impact animation: quick expand then settle, with pooling opacity
        const targetOpacity = Math.min(1, opacityMultiplier);
        gsap.fromTo(stain,
            { scale: 0.2, opacity: 0 },
            {
                scale: 1,
                opacity: targetOpacity,
                duration: 0.15,
                ease: 'power4.out',
                onComplete: () => {
                    gsap.to(stain, {
                        scale: 0.95,
                        duration: 0.3,
                        ease: 'power1.out'
                    });
                }
            }
        );

        // Create 1-2 splatter dots (pass document coordinates)
        this.createSplatter(docX, docY, size);
    }

    /**
     * Count how many existing stains are within the pooling radius
     */
    countNearbyStains(x, y) {
        let count = 0;
        for (const pos of this.stainPositions) {
            const dx = pos.x - x;
            const dy = pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.poolingRadius) {
                count++;
            }
        }
        return count;
    }

    /**
     * Create a larger, softer pool element underneath clustered stains
     */
    createPool(x, y, nearbyCount) {
        const pool = document.createElement('div');
        pool.className = 'blood-pool';

        // Pool gets larger and more opaque with more nearby stains
        const poolSize = 80 + nearbyCount * 30;
        const poolOpacity = Math.min(0.8, 0.15 + nearbyCount * 0.1);

        // Irregular shape
        const br = () => 40 + Math.random() * 20;
        const borderRadius = `${br()}% ${br()}% ${br()}% ${br()}% / ${br()}% ${br()}% ${br()}% ${br()}%`;

        pool.style.left = (x - poolSize / 2) + 'px';
        pool.style.top = (y - poolSize / 2) + 'px';
        pool.style.width = poolSize + 'px';
        pool.style.height = poolSize + 'px';
        pool.style.borderRadius = borderRadius;
        document.body.appendChild(pool);
        this.stains.push(pool); // track for cleanup

        // Fade in the pool slowly
        gsap.fromTo(pool,
            { opacity: 0 },
            {
                opacity: poolOpacity,
                duration: 0.8,
                ease: 'power2.out'
            }
        );
    }

    /**
     * Create small satellite splatter dots near impact
     */
    createSplatter(x, y, parentSize) {
        const count = 1 + Math.floor(Math.random() * 2); // 1 or 2

        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = 'blood-splatter';

            // Size: tiny (3-8px)
            const dotSize = 3 + Math.random() * 5;
            dot.style.width = dotSize + 'px';
            dot.style.height = dotSize + 'px';

            // Position: offset from center of parent stain
            const angle = Math.random() * Math.PI * 2;
            const distance = parentSize * 0.4 + Math.random() * parentSize * 0.3;
            const dotX = x + Math.cos(angle) * distance;
            const dotY = y + Math.sin(angle) * distance;
            dot.style.left = (dotX - dotSize / 2) + 'px';
            dot.style.top = (dotY - dotSize / 2) + 'px';

            document.body.appendChild(dot);
            this.stains.push(dot); // track for cleanup

            // Animate in slightly after parent
            gsap.fromTo(dot,
                { scale: 0, opacity: 0 },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 0.1,
                    delay: 0.05 + Math.random() * 0.1,
                    ease: 'power3.out'
                }
            );
        }
    }

    /**
     * Debug info
     */
    getDebugInfo() {
        return {
            dropCount: this.dropCount,
            activeStains: this.stains.length,
            isActive: this.isActive
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.dropTimer) clearTimeout(this.dropTimer);
        this.isActive = false;
        this.stains.forEach(s => s.remove());
        this.stains = [];
        this.stainPositions = [];
    }
}
