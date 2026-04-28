/**
 * DossierSystem — Confirmation page / surveillance dossier
 * Collects browser data and renders a classified-looking report
 */

class DossierSystem {
    constructor(exitState) {
        this.state = exitState;
    }

    /**
     * Collect all available browser data (async for battery + media devices)
     */
    async collectBrowserData() {
        const data = {};

        // Screen
        data.screenResolution = screen.width + ' \u00d7 ' + screen.height;
        data.colorDepth = screen.colorDepth + '-bit';

        // Timezone & locale
        try {
            data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {
            data.timezone = 'Unavailable';
        }
        data.locale = navigator.language || 'Unavailable';

        // Browser / platform
        data.platform = navigator.platform || 'Unavailable';
        data.browser = this.parseBrowser(navigator.userAgent);

        // GPU
        data.gpu = this.getGPURenderer();

        // Hardware
        data.cores = navigator.hardwareConcurrency
            ? navigator.hardwareConcurrency + ' cores'
            : 'Unavailable';

        // Memory
        data.memory = navigator.deviceMemory
            ? navigator.deviceMemory + ' GB'
            : 'Unavailable';

        // Viewport vs screen
        data.viewport = window.innerWidth + ' \u00d7 ' + window.innerHeight
            + ' (of ' + screen.width + ' \u00d7 ' + screen.height + ' available)';

        // Network
        if (navigator.connection) {
            data.network = navigator.connection.effectiveType || 'Unknown';
        } else {
            data.network = navigator.onLine ? 'Online' : 'Offline';
        }

        // Do Not Track
        if (navigator.doNotTrack === '1') {
            data.doNotTrack = 'Enabled (noted)';
        } else if (navigator.doNotTrack === '0') {
            data.doNotTrack = 'Disabled';
        } else {
            data.doNotTrack = 'Not set';
        }

        // Battery (async)
        try {
            const battery = await navigator.getBattery();
            const pct = Math.round(battery.level * 100);
            const status = battery.charging ? 'charging' : 'discharging';
            data.battery = pct + '% (' + status + ')';
        } catch (e) {
            data.battery = 'Unavailable';
        }

        // Media devices (async)
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(d => d.kind === 'videoinput').length;
            const audioInputs = devices.filter(d => d.kind === 'audioinput').length;
            data.videoDevices = videoInputs + ' detected';
            data.audioDevices = audioInputs + ' detected';
        } catch (e) {
            data.videoDevices = 'Unavailable';
            data.audioDevices = 'Unavailable';
        }

        // Session metrics from state
        data.employeeId = this.state.employeeId || 'UNASSIGNED';
        data.sessionCount = this.state.visitCount;
        data.timeUnderObservation = this.formatTime(this.state.totalVisitTime);
        data.keystrokesLogged = this.state.keystrokeCount;
        data.sectionsAccessed = Array.from(this.state.sectionsViewed).join(', ') || 'none';
        data.anomaliesDetected = this.state.mutationCount + ' field modification(s) observed';
        data.redactedCharacters = this.state.redactedCharCount;
        data.cursorDisplacement = Math.round(this.state.mouseDisplacement).toLocaleString() + ' px';
        data.attentionLapses = this.state.tabDefocusCount + ' detected';

        return data;
    }

    /**
     * Get GPU renderer string via WebGL
     */
    getGPURenderer() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'Unavailable';
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            if (!ext) return 'Unavailable';
            return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Unavailable';
        } catch (e) {
            return 'Unavailable';
        }
    }

    /**
     * Parse user agent into readable browser string
     */
    parseBrowser(ua) {
        if (ua.includes('Firefox/')) return 'Firefox';
        if (ua.includes('Edg/')) return 'Edge';
        if (ua.includes('Chrome/')) return 'Chrome';
        if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
        return 'Unknown';
    }

    /**
     * Format seconds into readable time
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return secs + 's';
        return mins + 'm ' + secs + 's';
    }

    /**
     * Render the dossier — hides form, shows surveillance report
     */
    async render() {
        const form = document.getElementById('exit-form');
        const dossier = document.getElementById('dossier');
        if (!form || !dossier) return;

        // Mark submitted
        this.state.formSubmitted = true;
        this.state.dossierViewed = true;
        this.state.saveState();

        // Update page count to redacted
        const pageTotal = document.getElementById('page-total');
        if (pageTotal) pageTotal.textContent = '███';

        // Hide form
        form.style.display = 'none';

        // Collect data (async — waits for battery + media devices)
        const data = await this.collectBrowserData();

        // Build dossier HTML
        let html = `
            <div class="dossier-header">
                <div class="dossier-classification">CONFIDENTIAL — INTERNAL USE ONLY</div>
                <div class="dossier-title">SUBJECT FILE — EXIT PROCESSING RECORD</div>
                <div class="dossier-id">REF: EI-7734-${data.employeeId}</div>
            </div>

            <p class="dossier-intro">Thank you for your service. The following
            information was collected during your tenure:</p>

            <table class="dossier-table">
                <tr>
                    <td>Employee ID</td>
                    <td>${data.employeeId}</td>
                </tr>
                <tr>
                    <td>Terminal Type</td>
                    <td>${data.browser} / ${data.platform}</td>
                </tr>
                <tr>
                    <td>Graphics Processor</td>
                    <td>${data.gpu}</td>
                </tr>
                <tr>
                    <td>Display Configuration</td>
                    <td>${data.screenResolution} @ ${data.colorDepth}</td>
                </tr>
                <tr>
                    <td>Terminal Viewport</td>
                    <td>${data.viewport}</td>
                </tr>
                <tr>
                    <td>Memory Allocation</td>
                    <td>${data.memory}</td>
                </tr>
                <tr>
                    <td>Processing Cores</td>
                    <td>${data.cores}</td>
                </tr>
                <tr>
                    <td>Power Reserve</td>
                    <td>${data.battery}</td>
                </tr>
                <tr>
                    <td>Temporal Zone</td>
                    <td>${data.timezone}</td>
                </tr>
                <tr>
                    <td>Primary Locale</td>
                    <td>${data.locale}</td>
                </tr>
                <tr>
                    <td>Network Classification</td>
                    <td>${data.network}</td>
                </tr>
                <tr>
                    <td>Tracking Consent Directive</td>
                    <td>${data.doNotTrack}</td>
                </tr>
                <tr>
                    <td>Visual Input Devices</td>
                    <td>${data.videoDevices}</td>
                </tr>
                <tr>
                    <td>Audio Input Devices</td>
                    <td>${data.audioDevices}</td>
                </tr>
                <tr>
                    <td>Session Count</td>
                    <td>${data.sessionCount}</td>
                </tr>
                <tr>
                    <td>Time Under Observation</td>
                    <td>${data.timeUnderObservation}</td>
                </tr>
                <tr>
                    <td>Keystrokes Logged</td>
                    <td>${data.keystrokesLogged}</td>
                </tr>
                <tr>
                    <td>Characters Redacted</td>
                    <td>${data.redactedCharacters}</td>
                </tr>
                <tr>
                    <td>Cursor Displacement</td>
                    <td>${data.cursorDisplacement}</td>
                </tr>
                <tr>
                    <td>Attention Lapses</td>
                    <td>${data.attentionLapses}</td>
                </tr>
                <tr>
                    <td>Sections Accessed</td>
                    <td>${data.sectionsAccessed}</td>
                </tr>
                <tr>
                    <td>Anomalies Detected</td>
                    <td>${data.anomaliesDetected}</td>
                </tr>
            </table>
        `;

        // Cross-site references
        if (this.state.hasThesisState) {
            let thesisTime = 'unknown';
            let thesisSections = 'unknown';
            try {
                const ts = JSON.parse(localStorage.getItem('aThesisDocumentState'));
                if (ts) {
                    thesisTime = this.formatTime(ts.totalVisitTime || 0);
                    thesisSections = (ts.sectionsViewed || []).join(', ') || 'none';
                }
            } catch (e) {}

            html += `
                <div class="dossier-cross-ref">
                    <h3>CROSS-REFERENCE: DOCUMENT REVIEW</h3>
                    <p>Subject accessed classified document (ref: A THESIS) on
                    <span class="redacted-inline">████████</span>. Total exposure:
                    ${thesisTime}. Sections reviewed: ${thesisSections}.</p>
                </div>
            `;
        }

        if (this.state.hasDiamondEaterState) {
            html += `
                <div class="dossier-cross-ref">
                    <h3>CROSS-REFERENCE: SECURITY SCREENING</h3>
                    <p>Subject completed security screening protocol.
                    Clearance level: <span class="redacted-inline">████████</span>.
                    Status: Active.</p>
                </div>
            `;
        }

        if (this.state.hasComplianceState) {
            html += `
                <div class="dossier-cross-ref">
                    <h3>CROSS-REFERENCE: TRAINING RECORD</h3>
                    <p>Subject completed compliance training module.
                    Certificate on file. Employee ID verified.</p>
                </div>
            `;
        }

        if (this.state.hasOrganismState) {
            html += `
                <div class="dossier-cross-ref">
                    <h3>CROSS-REFERENCE: SPECIMEN LOG</h3>
                    <p>Subject flagged in specimen tracking system.
                    Containment status: <span class="redacted-inline">████████████████</span>.</p>
                </div>
            `;
        }

        if (this.state.hasWitnessWallState) {
            html += `
                <div class="dossier-cross-ref">
                    <h3>CROSS-REFERENCE: MEMORIAL ACCESS</h3>
                    <p>Subject accessed memorial records. Depth of review noted.
                    See: <span class="redacted-inline">████████████████████████</span>.</p>
                </div>
            `;
        }

        // Footer
        html += `
            <div class="dossier-footer">
                <p>Is this information correct?</p>
                <button id="dossier-confirm" class="confirm-btn">Yes</button>
                <div id="dossier-filed-msg" class="dossier-filed" style="display: none;"></div>
            </div>
        `;

        dossier.innerHTML = html;
        dossier.style.display = 'block';

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Confirm button
        const confirmBtn = document.getElementById('dossier-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.handleConfirmation(confirmBtn);
            });
        }
    }

    /**
     * Handle the "Yes" confirmation
     */
    handleConfirmation(button) {
        button.textContent = 'Confirmed.';
        button.disabled = true;

        // Change page title immediately
        document.title = '████████';

        setTimeout(() => {
            const msg = document.getElementById('dossier-filed-msg');
            if (msg) {
                msg.textContent = 'Your records have been filed.';
                msg.style.display = 'block';
            }

            // Begin the redaction sequence after the filed message
            setTimeout(() => {
                this.startPostConfirmationRedaction();
            }, 2000);
        }, 2000);
    }

    /**
     * Progressively redact the dossier after confirmation
     */
    startPostConfirmationRedaction() {
        const dossier = document.getElementById('dossier');
        if (!dossier) return;

        // Phase 1: Collect and shuffle table value cells
        const valueCells = Array.from(dossier.querySelectorAll('.dossier-table td:last-child'));
        this.shuffleArray(valueCells);

        // Phase 2: Collect cross-reference paragraphs
        const crossRefParagraphs = Array.from(dossier.querySelectorAll('.dossier-cross-ref p'));

        // Phase 3: Header elements
        const headerElements = [
            dossier.querySelector('.dossier-classification'),
            dossier.querySelector('.dossier-title'),
            dossier.querySelector('.dossier-id')
        ].filter(Boolean);

        // Build the full redaction queue
        const queue = [];

        // Table cells first
        valueCells.forEach(cell => {
            queue.push(() => {
                const text = cell.textContent;
                cell.textContent = '█'.repeat(Math.max(text.length, 4));
            });
        });

        // Cross-reference paragraphs
        crossRefParagraphs.forEach(p => {
            queue.push(() => {
                const text = p.textContent;
                p.textContent = '█'.repeat(Math.min(text.length, 60));
            });
        });

        // Header fields
        headerElements.forEach(el => {
            queue.push(() => {
                const text = el.textContent;
                el.textContent = '█'.repeat(text.length);
            });
        });

        // Final: seal the file
        queue.push(() => {
            const intro = dossier.querySelector('.dossier-intro');
            if (intro) intro.textContent = 'This file has been sealed.';

            const msg = document.getElementById('dossier-filed-msg');
            if (msg) msg.textContent = 'Access revoked.';
        });

        // Execute queue with random delays
        this.processRedactionQueue(queue, 0);
    }

    /**
     * Process one item from the redaction queue, then schedule the next
     */
    processRedactionQueue(queue, index) {
        if (index >= queue.length) return;

        queue[index]();

        const delay = 2000 + Math.random() * 2000; // 2-4 seconds
        setTimeout(() => {
            this.processRedactionQueue(queue, index + 1);
        }, delay);
    }

    /**
     * Fisher-Yates shuffle
     */
    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
}
