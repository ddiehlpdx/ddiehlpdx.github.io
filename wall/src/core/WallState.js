/**
 * WallState — State tracking for the Witness Wall
 * Follows ExitState.js / DocumentState.js pattern
 */

class WallState {
    constructor() {
        this.totalVisitTime = 0;
        this.currentVisitStart = Date.now();
        this.visitCount = 0;
        this.depthReached = 0;
        this.namesScrolledPast = 0;
        this.searchQueries = [];
        this.totalParticlesSpawned = 0;

        // Cross-site state flags
        this.hasDiamondEaterState = false;
        this.hasThesisState = false;
        this.hasComplianceState = false;
        this.hasExitInterviewState = false;

        this.storageKey = 'witnessWallState';
        this.timeTrackingInterval = null;

        this.loadState();
        this.visitCount++;
        this.checkCrossState();
        this.startTimeTracking();
        this.saveState();
    }

    checkCrossState() {
        try {
            this.hasDiamondEaterState = localStorage.getItem('diamondEaterState') !== null;
            this.hasThesisState = localStorage.getItem('aThesisDocumentState') !== null;
            this.hasComplianceState = localStorage.getItem('complianceModuleState') !== null;
            this.hasExitInterviewState = localStorage.getItem('exitInterviewState') !== null;
        } catch (e) {}
    }

    startTimeTracking() {
        this.timeTrackingInterval = setInterval(() => {
            this.totalVisitTime += 1;
            // Save every 10 seconds
            if (this.totalVisitTime % 10 === 0) {
                this.saveState();
            }
        }, 1000);
    }

    updateDepth(entryIndex) {
        if (entryIndex > this.depthReached) {
            this.depthReached = entryIndex;
        }
    }

    recordNameScrolled() {
        this.namesScrolledPast++;
        this.totalParticlesSpawned++;
    }

    addSearchQuery(query) {
        this.searchQueries.push(query);
        if (this.searchQueries.length > 50) {
            this.searchQueries = this.searchQueries.slice(-50);
        }
        this.saveState();
    }

    saveState() {
        try {
            const state = {
                totalVisitTime: this.totalVisitTime,
                visitCount: this.visitCount,
                depthReached: this.depthReached,
                namesScrolledPast: this.namesScrolledPast,
                searchQueries: this.searchQueries,
                totalParticlesSpawned: this.totalParticlesSpawned
            };
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (e) {
            console.warn('[wall] could not save state:', e);
        }
    }

    loadState() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return;
            const state = JSON.parse(raw);
            this.totalVisitTime = state.totalVisitTime || 0;
            this.visitCount = state.visitCount || 0;
            this.depthReached = state.depthReached || 0;
            this.namesScrolledPast = state.namesScrolledPast || 0;
            this.searchQueries = state.searchQueries || [];
            this.totalParticlesSpawned = state.totalParticlesSpawned || 0;
        } catch (e) {
            console.warn('[wall] could not load state:', e);
        }
    }

    reset() {
        this.totalVisitTime = 0;
        this.visitCount = 0;
        this.depthReached = 0;
        this.namesScrolledPast = 0;
        this.searchQueries = [];
        this.totalParticlesSpawned = 0;
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {}
    }

    getDebugInfo() {
        return {
            visitCount: this.visitCount,
            totalVisitTime: Math.round(this.totalVisitTime) + 's',
            depthReached: this.depthReached.toLocaleString(),
            namesScrolledPast: this.namesScrolledPast.toLocaleString(),
            searchQueries: this.searchQueries.length,
            particles: this.totalParticlesSpawned.toLocaleString(),
            hasDiamondEater: this.hasDiamondEaterState,
            hasThesis: this.hasThesisState,
            hasCompliance: this.hasComplianceState,
            hasExitInterview: this.hasExitInterviewState
        };
    }

    destroy() {
        if (this.timeTrackingInterval) {
            clearInterval(this.timeTrackingInterval);
        }
        this.saveState();
    }
}
