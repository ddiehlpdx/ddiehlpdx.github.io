/**
 * DocumentState — State tracking and localStorage persistence
 * Tracks cumulative visit time, scroll depth, discoveries across sessions
 */

class DocumentState {
    constructor() {
        this.totalVisitTime = 0;
        this.currentVisitStart = Date.now();
        this.maxScrollDepth = 0;
        this.sectionsViewed = new Set();
        this.redactionsLifted = new Set();
        this.hiddenElementsFound = new Set();
        this.visitCount = 0;
        this.lastVisitTimestamp = 0;
        this.hasDiamondEaterState = false;

        this.storageKey = 'aThesisDocumentState';
        this.timeTrackingInterval = null;

        this.loadState();
        this.visitCount++;
        this.checkCrossState();
        this.startTimeTracking();
        this.saveState();
    }

    /**
     * Check if Diamond Eater state exists in localStorage
     */
    checkCrossState() {
        try {
            this.hasDiamondEaterState = localStorage.getItem('diamondEaterState') !== null;
        } catch (e) {
            this.hasDiamondEaterState = false;
        }
    }

    /**
     * Start tracking visit time (updates every second)
     */
    startTimeTracking() {
        this.timeTrackingInterval = setInterval(() => {
            this.totalVisitTime++;
            // Save periodically (every 10 seconds)
            if (this.totalVisitTime % 10 === 0) {
                this.saveState();
            }
        }, 1000);
    }

    /**
     * Update max scroll depth (0 to 1)
     */
    updateScrollDepth(ratio) {
        if (ratio > this.maxScrollDepth) {
            this.maxScrollDepth = ratio;
        }
    }

    /**
     * Mark a section as viewed
     */
    viewSection(sectionId) {
        if (!this.sectionsViewed.has(sectionId)) {
            this.sectionsViewed.add(sectionId);
            this.saveState();
        }
    }

    /**
     * Mark a timed redaction as lifted
     */
    liftRedaction(redactionId) {
        if (!this.redactionsLifted.has(redactionId)) {
            this.redactionsLifted.add(redactionId);
            this.saveState();
        }
    }

    /**
     * Mark a hidden element as found
     */
    findHiddenElement(elementId) {
        if (!this.hiddenElementsFound.has(elementId)) {
            this.hiddenElementsFound.add(elementId);
            this.saveState();
            return true; // newly found
        }
        return false; // already found
    }

    /**
     * Check if cumulative time exceeds threshold (in seconds)
     */
    hasExceededTime(thresholdSeconds) {
        return this.totalVisitTime >= thresholdSeconds;
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        const state = {
            totalVisitTime: this.totalVisitTime,
            maxScrollDepth: this.maxScrollDepth,
            sectionsViewed: Array.from(this.sectionsViewed),
            redactionsLifted: Array.from(this.redactionsLifted),
            hiddenElementsFound: Array.from(this.hiddenElementsFound),
            visitCount: this.visitCount,
            lastVisitTimestamp: Date.now()
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (e) {
            console.warn('[a thesis] could not save state:', e);
        }
    }

    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const state = JSON.parse(saved);
                this.totalVisitTime = state.totalVisitTime || 0;
                this.maxScrollDepth = state.maxScrollDepth || 0;
                this.sectionsViewed = new Set(state.sectionsViewed || []);
                this.redactionsLifted = new Set(state.redactionsLifted || []);
                this.hiddenElementsFound = new Set(state.hiddenElementsFound || []);
                this.visitCount = state.visitCount || 0;
                this.lastVisitTimestamp = state.lastVisitTimestamp || 0;
            }
        } catch (e) {
            console.warn('[a thesis] could not load state:', e);
        }
    }

    /**
     * Reset all state (for testing)
     */
    reset() {
        this.totalVisitTime = 0;
        this.maxScrollDepth = 0;
        this.sectionsViewed = new Set();
        this.redactionsLifted = new Set();
        this.hiddenElementsFound = new Set();
        this.visitCount = 0;
        this.lastVisitTimestamp = 0;

        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.warn('[a thesis] could not clear state:', e);
        }
    }

    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            totalVisitTime: this.totalVisitTime,
            visitCount: this.visitCount,
            maxScrollDepth: Math.round(this.maxScrollDepth * 100) + '%',
            sectionsViewed: Array.from(this.sectionsViewed),
            redactionsLifted: this.redactionsLifted.size,
            hiddenElementsFound: this.hiddenElementsFound.size,
            hasDiamondEaterState: this.hasDiamondEaterState
        };
    }

    /**
     * Cleanup on page unload
     */
    destroy() {
        if (this.timeTrackingInterval) {
            clearInterval(this.timeTrackingInterval);
        }
        this.saveState();
    }
}
