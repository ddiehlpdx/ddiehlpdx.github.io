/**
 * StateManager - Global state tracking for the experience
 * Manages current stage, discoveries, and cross-session persistence
 */

class StateManager {
    constructor() {
        this.currentStage = 0;
        this.visitedStages = new Set([0]);
        this.loopCount = 0;
        this.discoveredZones = new Set();
        this.audioInitialized = false;
        this.startTime = Date.now();

        // Load any persistent state
        this.loadState();
    }

    /**
     * Update current stage
     */
    setStage(stageIndex) {
        const previousStage = this.currentStage;
        this.currentStage = stageIndex;

        // Track if we've visited this stage before (for loops)
        if (this.visitedStages.has(stageIndex)) {
            this.loopCount++;
        }
        this.visitedStages.add(stageIndex);

        // Save state
        this.saveState();

        return {
            from: previousStage,
            to: stageIndex,
            isLoop: this.loopCount > 0
        };
    }

    /**
     * Mark audio as initialized
     */
    setAudioInitialized(initialized) {
        this.audioInitialized = initialized;
    }

    /**
     * Add discovered zone
     */
    addDiscoveredZone(zoneId) {
        this.discoveredZones.add(zoneId);
        this.saveState();
        return this.discoveredZones.size;
    }

    /**
     * Check if zone has been discovered
     */
    hasDiscovered(zoneId) {
        return this.discoveredZones.has(zoneId);
    }

    /**
     * Get total discovered zones count
     */
    getDiscoveredCount() {
        return this.discoveredZones.size;
    }

    /**
     * Get time elapsed since start (in seconds)
     */
    getElapsedTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        const state = {
            visitedStages: Array.from(this.visitedStages),
            discoveredZones: Array.from(this.discoveredZones),
            loopCount: this.loopCount,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem('diamondEaterState', JSON.stringify(state));
        } catch (e) {
            console.warn('Could not save state:', e);
        }
    }

    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('diamondEaterState');
            if (saved) {
                const state = JSON.parse(saved);
                this.visitedStages = new Set(state.visitedStages || [0]);
                this.discoveredZones = new Set(state.discoveredZones || []);
                this.loopCount = state.loopCount || 0;
            }
        } catch (e) {
            console.warn('Could not load state:', e);
        }
    }

    /**
     * Reset all state (for testing)
     */
    reset() {
        this.currentStage = 0;
        this.visitedStages = new Set([0]);
        this.loopCount = 0;
        this.discoveredZones = new Set();
        this.startTime = Date.now();

        try {
            localStorage.removeItem('diamondEaterState');
        } catch (e) {
            console.warn('Could not clear state:', e);
        }
    }

    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            currentStage: this.currentStage,
            visitedStages: Array.from(this.visitedStages),
            loopCount: this.loopCount,
            discoveredZones: this.discoveredZones.size,
            elapsedTime: this.getElapsedTime(),
            audioInitialized: this.audioInitialized
        };
    }
}

// Create global instance
const stateManager = new StateManager();
