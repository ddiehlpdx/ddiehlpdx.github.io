/**
 * ExitState — State tracking, cross-site detection, browser fingerprint
 * Follows DocumentState.js pattern from A Thesis
 */

class ExitState {
    constructor() {
        this.totalVisitTime = 0;
        this.currentVisitStart = Date.now();
        this.visitCount = 0;
        this.sectionsViewed = new Set();
        this.fieldsModified = {};
        this.formSubmitted = false;
        this.dossierViewed = false;
        this.sectionSevenSeen = false;
        this.mutationCount = 0;
        this.keystrokeCount = 0;
        this.redactedCharCount = 0;
        this.employeeId = null;

        // Session tracking
        this.tabDefocusCount = 0;
        this.mouseDisplacement = 0;
        this.lastMouseX = null;
        this.lastMouseY = null;
        this.mouseThrottleTimer = null;

        // Cross-site state flags
        this.hasDiamondEaterState = false;
        this.hasThesisState = false;
        this.hasComplianceState = false;
        this.hasWitnessWallState = false;
        this.hasOrganismState = false;

        this.storageKey = 'exitInterviewState';
        this.timeTrackingInterval = null;

        this.loadState();
        this.visitCount++;
        this.checkCrossState();
        this.generateEmployeeId();
        this.startTimeTracking();
        this.startSessionTracking();
        this.saveState();
    }

    /**
     * Check for other sites' state in localStorage
     */
    checkCrossState() {
        try {
            this.hasDiamondEaterState = localStorage.getItem('diamondEaterState') !== null;
            this.hasThesisState = localStorage.getItem('aThesisDocumentState') !== null;
            this.hasComplianceState = localStorage.getItem('complianceModuleState') !== null;
            this.hasWitnessWallState = localStorage.getItem('witnessWallState') !== null;
            this.hasOrganismState = localStorage.getItem('organismState') !== null;
        } catch (e) {
            // Silent fail — cross-state is enhancement only
        }
    }

    /**
     * Generate deterministic employee ID from browser fingerprint
     * Format: XX-XXXXXX (hex)
     */
    generateEmployeeId() {
        if (this.employeeId) return; // Already generated in a previous session

        const signals = [
            String(screen.width),
            String(screen.height),
            String(screen.colorDepth),
            navigator.language || '',
            String(navigator.hardwareConcurrency || 0),
            navigator.platform || '',
            Intl.DateTimeFormat().resolvedOptions().timeZone || '',
            this.getCanvasFingerprint()
        ];

        const combined = signals.join('|');
        const hash = this.hashString(combined);

        // Format as XX-XXXXXX
        const hex = Math.abs(hash).toString(16).padStart(8, '0').substring(0, 8);
        this.employeeId = (hex.substring(0, 2) + '-' + hex.substring(2)).toUpperCase();
    }

    /**
     * Canvas fingerprint — draw specific shapes/text, hash the result
     */
    getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');

            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('exit interview', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('ei-7734', 4, 35);

            return canvas.toDataURL();
        } catch (e) {
            return 'canvas-unavailable';
        }
    }

    /**
     * Simple hash function (djb2)
     */
    hashString(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }

    /**
     * Start tracking visit time
     */
    startTimeTracking() {
        this.timeTrackingInterval = setInterval(() => {
            this.totalVisitTime++;
            if (this.totalVisitTime % 10 === 0) {
                this.saveState();
            }
        }, 1000);
    }

    /**
     * Track tab visibility changes and mouse movement
     */
    startSessionTracking() {
        // Tab defocus detection
        this.visibilityHandler = () => {
            if (document.hidden) {
                this.tabDefocusCount++;
            }
        };
        document.addEventListener('visibilitychange', this.visibilityHandler);

        // Mouse displacement tracking (throttled)
        this.mouseMoveHandler = (e) => {
            if (this.mouseThrottleTimer) return;
            this.mouseThrottleTimer = setTimeout(() => {
                this.mouseThrottleTimer = null;
            }, 100);

            if (this.lastMouseX !== null) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.mouseDisplacement += Math.sqrt(dx * dx + dy * dy);
            }
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        };
        document.addEventListener('mousemove', this.mouseMoveHandler);
    }

    /**
     * Track a field value change
     */
    trackField(fieldName, value) {
        this.fieldsModified[fieldName] = value;
    }

    /**
     * Record a keystroke
     */
    recordKeystroke() {
        this.keystrokeCount++;
    }

    /**
     * Record a redacted character
     */
    recordRedaction() {
        this.redactedCharCount++;
    }

    /**
     * Record a gaslighting mutation
     */
    recordMutation() {
        this.mutationCount++;
    }

    /**
     * Mark a section as viewed
     */
    viewSection(sectionId) {
        this.sectionsViewed.add(sectionId);
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        const state = {
            totalVisitTime: this.totalVisitTime,
            visitCount: this.visitCount,
            sectionsViewed: Array.from(this.sectionsViewed),
            fieldsModified: this.fieldsModified,
            formSubmitted: this.formSubmitted,
            dossierViewed: this.dossierViewed,
            sectionSevenSeen: this.sectionSevenSeen,
            mutationCount: this.mutationCount,
            keystrokeCount: this.keystrokeCount,
            redactedCharCount: this.redactedCharCount,
            tabDefocusCount: this.tabDefocusCount,
            mouseDisplacement: Math.round(this.mouseDisplacement),
            employeeId: this.employeeId,
            lastVisitTimestamp: Date.now()
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (e) {
            console.warn('[exit] could not save state:', e);
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
                this.visitCount = state.visitCount || 0;
                this.sectionsViewed = new Set(state.sectionsViewed || []);
                this.fieldsModified = state.fieldsModified || {};
                this.formSubmitted = state.formSubmitted || false;
                this.dossierViewed = state.dossierViewed || false;
                this.sectionSevenSeen = state.sectionSevenSeen || false;
                this.mutationCount = state.mutationCount || 0;
                this.keystrokeCount = state.keystrokeCount || 0;
                this.redactedCharCount = state.redactedCharCount || 0;
                this.tabDefocusCount = state.tabDefocusCount || 0;
                this.mouseDisplacement = state.mouseDisplacement || 0;
                this.employeeId = state.employeeId || null;
            }
        } catch (e) {
            console.warn('[exit] could not load state:', e);
        }
    }

    /**
     * Reset all state
     */
    reset() {
        this.totalVisitTime = 0;
        this.visitCount = 0;
        this.sectionsViewed = new Set();
        this.fieldsModified = {};
        this.formSubmitted = false;
        this.dossierViewed = false;
        this.sectionSevenSeen = false;
        this.mutationCount = 0;
        this.keystrokeCount = 0;
        this.redactedCharCount = 0;
        this.tabDefocusCount = 0;
        this.mouseDisplacement = 0;
        this.employeeId = null;

        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.warn('[exit] could not clear state:', e);
        }
    }

    /**
     * Debug info
     */
    getDebugInfo() {
        return {
            visitTime: this.totalVisitTime + 's',
            visitCount: this.visitCount,
            employeeId: this.employeeId,
            mutations: this.mutationCount,
            keystrokes: this.keystrokeCount,
            redactedChars: this.redactedCharCount,
            tabDefocus: this.tabDefocusCount,
            mouseDisplacement: Math.round(this.mouseDisplacement) + 'px',
            sectionSevenSeen: this.sectionSevenSeen,
            formSubmitted: this.formSubmitted,
            sectionsViewed: Array.from(this.sectionsViewed).join(', ') || 'none',
            crossState: [
                this.hasDiamondEaterState ? 'DE' : '',
                this.hasThesisState ? 'AT' : '',
                this.hasComplianceState ? 'CM' : '',
                this.hasWitnessWallState ? 'WW' : '',
                this.hasOrganismState ? 'ORG' : ''
            ].filter(Boolean).join(', ') || 'none'
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.timeTrackingInterval) {
            clearInterval(this.timeTrackingInterval);
        }
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.mouseThrottleTimer) {
            clearTimeout(this.mouseThrottleTimer);
        }
        this.saveState();
    }
}
