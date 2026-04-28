/**
 * Main application — Exit Interview
 * Entry point, initialization flow, system wiring
 */

(function () {
    'use strict';

    let exitState = null;
    let formEngine = null;
    let dossierSystem = null;

    const isDebug = new URLSearchParams(window.location.search).has('debug');
    let debugUpdateInterval = null;

    /**
     * Initialize the experience — boots all systems, wires form
     * Called after the access sequence completes (overlay already handled)
     */
    function init() {
        // Show form wrapper
        const wrapper = document.getElementById('form-wrapper');
        if (wrapper) {
            wrapper.classList.add('visible');
        }

        // Initialize systems
        exitState = new ExitState();
        formEngine = new FormEngine(exitState);
        dossierSystem = new DossierSystem(exitState);

        formEngine.init();

        // Pre-fill fields from cross-site state
        applyStatePrefills();

        // Form submit handler
        const form = document.getElementById('exit-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                formEngine.captureAllFields();
                dossierSystem.render();
            });
        }

        // Debug mode
        if (isDebug) {
            setupDebug();
        }

        // Save state on page unload
        window.addEventListener('beforeunload', () => {
            if (exitState) exitState.destroy();
            if (formEngine) formEngine.destroy();
        });

        console.log('[exit] initialized — visit #' + exitState.visitCount);
        console.log('[exit] employee ID: ' + exitState.employeeId);
    }

    // ── Glitch Access Sequence ──────────────────────────────────

    /**
     * Calculate a human-like delay for the next keystroke
     * Varies by character type: fast bursts, pauses at spaces/punctuation, occasional hesitations
     */
    function getTypingDelay(char, nextChar, baseSpeed) {
        // Occasional long hesitation (~8% chance) — someone thinking
        if (Math.random() < 0.08) {
            return baseSpeed * 6 + Math.random() * baseSpeed * 4;
        }

        // Pause after punctuation (. , : ; -)
        if ('.,:;-'.includes(char)) {
            return baseSpeed * 3 + Math.random() * baseSpeed * 2;
        }

        // Slight pause at spaces — between words
        if (char === ' ') {
            return baseSpeed * 1.5 + Math.random() * baseSpeed;
        }

        // Faster for common letter sequences (burst typing)
        if (/[a-z]/.test(char) && nextChar && /[a-z]/.test(nextChar)) {
            return baseSpeed * 0.5 + Math.random() * baseSpeed * 0.6;
        }

        // Slower for special characters, uppercase, numbers
        if (/[A-Z0-9/\\@]/.test(char)) {
            return baseSpeed * 1.2 + Math.random() * baseSpeed;
        }

        // Default with jitter
        return baseSpeed * 0.7 + Math.random() * baseSpeed * 0.8;
    }

    /**
     * Type text into an element one character at a time with human-like rhythm
     * Returns a Promise that resolves when typing is complete
     */
    function typeText(container, text, baseSpeed) {
        return new Promise((resolve) => {
            let i = 0;
            const span = document.createElement('span');
            span.className = 'terminal-line';
            container.appendChild(span);

            // Add blinking cursor
            const cursor = document.createElement('span');
            cursor.className = 'terminal-cursor';
            cursor.textContent = '_';
            container.appendChild(cursor);

            function typeNext() {
                if (i < text.length) {
                    span.textContent += text[i];
                    const current = text[i];
                    const next = text[i + 1] || null;
                    i++;
                    setTimeout(typeNext, getTypingDelay(current, next, baseSpeed));
                } else {
                    // Remove cursor when done
                    cursor.remove();
                    // Add line break
                    container.appendChild(document.createElement('br'));
                    resolve();
                }
            }

            typeNext();
        });
    }

    /**
     * Print a full line of system output instantly (no typing effect)
     * If returnSpan is true, returns the span without appending a <br> (for inline appending)
     */
    function printLine(container, text, returnSpan) {
        const span = document.createElement('span');
        span.className = 'terminal-line';
        span.textContent = text;
        container.appendChild(span);
        if (returnSpan) return span;
        container.appendChild(document.createElement('br'));
        return span;
    }

    /**
     * Type text onto an existing line element character by character (e.g. password after sudo prompt)
     * Returns a Promise. No cursor shown.
     */
    function typeInline(container, lineEl, text, baseSpeed) {
        return new Promise((resolve) => {
            let i = 0;
            function typeNext() {
                if (i < text.length) {
                    lineEl.textContent += text[i];
                    const current = text[i];
                    const next = text[i + 1] || null;
                    i++;
                    setTimeout(typeNext, getTypingDelay(current, next, baseSpeed));
                } else {
                    container.appendChild(document.createElement('br'));
                    resolve();
                }
            }
            typeNext();
        });
    }

    /**
     * Show a prompt and wait for the user to type "y" and press Enter
     * Returns a Promise that resolves when confirmed
     */
    function waitForConfirmation(container, promptText) {
        return new Promise((resolve) => {
            // Wrap prompt + input on one line
            const wrapper = document.createElement('div');
            wrapper.className = 'terminal-line';
            wrapper.style.whiteSpace = 'nowrap';

            const promptSpan = document.createElement('span');
            promptSpan.textContent = promptText;
            wrapper.appendChild(promptSpan);

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'terminal-input';
            input.maxLength = 1;
            input.autocomplete = 'off';
            input.spellcheck = false;
            wrapper.appendChild(input);

            container.appendChild(wrapper);

            // Focus the input
            input.focus();

            // Re-focus if user clicks elsewhere on the overlay
            const overlay = document.getElementById('init-overlay');
            const refocusHandler = () => input.focus();
            if (overlay) overlay.addEventListener('click', refocusHandler);

            const handler = (e) => {
                if (e.key !== 'Enter') return;
                const val = input.value.toLowerCase();

                if (val === 'y') {
                    input.removeEventListener('keydown', handler);
                    if (overlay) overlay.removeEventListener('click', refocusHandler);

                    // Replace input with static "y" text
                    input.remove();
                    promptSpan.textContent = promptText + 'y';

                    // Add line break after confirmed line
                    container.appendChild(document.createElement('br'));

                    resolve();
                } else if (val === 'n' || val === '') {
                    // N or empty Enter (default is N) — abort, reload to start screen
                    input.removeEventListener('keydown', handler);
                    if (overlay) overlay.removeEventListener('click', refocusHandler);

                    input.remove();
                    promptSpan.textContent = promptText + (val || 'N');
                    container.appendChild(document.createElement('br'));

                    // Show abort message then reload
                    setTimeout(() => {
                        printLine(container, 'Connection closed.');
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }, 300);
                }
            };

            input.addEventListener('keydown', handler);
        });
    }

    /**
     * Spawn random glitch characters across the overlay
     */
    function spawnGlitchChars(overlay) {
        const chars = ['\u2593', '\u2591', '\u2592', '\u2588', '\u256C', '\u2502', '\u2550', '\u2557', '\u255A', '\u2563', '\u2569', '\u2566'];
        const count = 12;
        const spawned = [];

        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            el.className = 'glitch-char';
            el.textContent = chars[Math.floor(Math.random() * chars.length)];
            el.style.left = (Math.random() * 90 + 5) + '%';
            el.style.top = (Math.random() * 90 + 5) + '%';
            el.style.fontSize = (10 + Math.random() * 10) + 'px';
            overlay.appendChild(el);
            spawned.push(el);
        }

        // Remove after 300ms
        setTimeout(() => {
            spawned.forEach(el => el.remove());
        }, 300);
    }

    /**
     * Run the full glitchy access denied → override → granted sequence
     */
    function runAccessSequence() {
        const overlay = document.getElementById('init-overlay');
        if (!overlay) return;

        const content = overlay.querySelector('.init-content');
        const prompt = overlay.querySelector('.init-prompt');
        const seal = overlay.querySelector('.init-seal');
        const classification = overlay.querySelector('.init-classification');

        // ── Phase 1: Denial (0ms) ──
        overlay.classList.add('denied');
        if (prompt) prompt.textContent = 'ACCESS DENIED';
        if (seal) seal.textContent = '\u2715'; // ✕
        if (classification) classification.textContent = 'UNAUTHORIZED ACCESS LOGGED';

        // Shudder
        if (content) {
            content.classList.add('init-shudder');
            setTimeout(() => content.classList.remove('init-shudder'), 300);
        }

        // ── Phase 2: Glitch / System Break (800ms) ──
        setTimeout(() => {
            // Rapid opacity flicker
            let flickerCount = 0;
            const flickerInterval = setInterval(() => {
                overlay.style.opacity = flickerCount % 2 === 0 ? '0' : '1';
                flickerCount++;
                if (flickerCount >= 8) {
                    clearInterval(flickerInterval);
                    overlay.style.opacity = '1';

                    // Switch to terminal mode
                    overlay.classList.add('terminal');

                    // Spawn glitch characters
                    spawnGlitchChars(overlay);

                    // Scan lines
                    overlay.classList.add('scan-lines');
                    setTimeout(() => overlay.classList.remove('scan-lines'), 500);
                }
            }, 50);
        }, 800);

        // ── Phase 3: Terminal Override (2000ms) ──
        setTimeout(async () => {
            if (!content) return;

            // Clear the security screen content
            content.innerHTML = '';

            // Create terminal block
            const terminal = document.createElement('div');
            terminal.style.padding = '20px';
            content.appendChild(terminal);

            // User types SSH command
            await typeText(terminal, '$ ssh -p 7734 auth@ei-portal.internal', 40);
            await new Promise(r => setTimeout(r, 600));

            // System responds instantly
            printLine(terminal, 'Connection refused: credentials expired');
            await new Promise(r => setTimeout(r, 800));

            // User types override command
            await typeText(terminal, '$ sudo /opt/ei/bin/auth-override --bypass-pam --cert /dev/null', 40);
            await new Promise(r => setTimeout(r, 300));

            // System shows sudo prompt, user types password
            const sudoLine = printLine(terminal, '[sudo] password for \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588: ', true);
            await typeInline(terminal, sudoLine, '************', 60);
            await new Promise(r => setTimeout(r, 500));

            // System output — rapid sequence
            printLine(terminal, 'WARNING: override protocol \u2588\u2588-7734 invoked');
            await new Promise(r => setTimeout(r, 200));
            printLine(terminal, 'Injecting session token... OK');
            await new Promise(r => setTimeout(r, 200));
            printLine(terminal, 'Mounting /srv/ei/forms/exit-interview.conf... OK');
            await new Promise(r => setTimeout(r, 400));

            // System prompt, real user types y
            await waitForConfirmation(terminal, 'Override authentication system? [y/N]: ');
            await new Promise(r => setTimeout(r, 300));

            // System grants access — instant
            const accessLine = printLine(terminal, 'Access: ', true);
            await new Promise(r => setTimeout(r, 500));

            // GRANTED appears instantly
            const grantedSpan = document.createElement('span');
            grantedSpan.className = 'terminal-line granted';
            grantedSpan.textContent = 'GRANTED';
            accessLine.after(grantedSpan);

            // ── Phase 4: Dissolve (after GRANTED + 500ms) ──
            setTimeout(() => {
                // Brief white flash
                overlay.style.backgroundColor = '#fff';
                setTimeout(() => {
                    overlay.style.backgroundColor = '#0a0a0a';

                    setTimeout(() => {
                        // Fade out overlay
                        overlay.style.transition = 'opacity 0.8s ease';
                        overlay.style.opacity = '0';
                        overlay.style.pointerEvents = 'none';

                        // Boot systems
                        init();

                        // Remove overlay after fade
                        setTimeout(() => {
                            overlay.style.display = 'none';
                        }, 800);
                    }, 200);
                }, 80);
            }, 500);

        }, 2000);
    }

    // ── Existing functionality ───────────────────────────────────

    /**
     * Pre-fill form fields based on cross-site state
     */
    function applyStatePrefills() {
        // If Compliance Module completed, pre-fill employee ID
        if (exitState.hasComplianceState) {
            try {
                const compState = JSON.parse(localStorage.getItem('complianceModuleState'));
                if (compState && compState.employeeId) {
                    const field = document.getElementById('field-employee-id');
                    if (field) field.value = compState.employeeId;
                }
            } catch (e) {}
        }

        // If Witness Wall visited deep, pre-fill final remarks
        if (exitState.hasWitnessWallState) {
            try {
                const wallState = JSON.parse(localStorage.getItem('witnessWallState'));
                if (wallState && wallState.depthReached > 1000) {
                    const field = document.getElementById('field-remarks');
                    if (field && !field.value) field.value = 'I saw the names.';
                }
            } catch (e) {}
        }

        // If Organism state exists, add specimen container to equipment list
        if (exitState.hasOrganismState) {
            const checkboxList = document.querySelector('.checkbox-list');
            if (checkboxList) {
                const label = document.createElement('label');
                label.className = 'checkbox-label';
                label.innerHTML = '<input type="checkbox" name="equipment" value="specimen"> Specimen container (DO NOT OPEN)';
                checkboxList.appendChild(label);
            }
        }

        // Always show the employee ID if we have one
        if (exitState.employeeId) {
            const field = document.getElementById('field-employee-id');
            if (field && !field.value) {
                field.value = exitState.employeeId;
            }
        }
    }

    /**
     * Debug overlay
     */
    function setupDebug() {
        const debugOverlay = document.getElementById('debug-overlay');
        const debugContent = document.getElementById('debug-content');
        const debugReset = document.getElementById('debug-reset');

        if (!debugOverlay) return;

        debugOverlay.classList.remove('hidden');

        debugUpdateInterval = setInterval(() => {
            if (!exitState || !debugContent) return;

            const info = exitState.getDebugInfo();
            debugContent.innerHTML = Object.entries(info)
                .map(([key, val]) => `<div>${key}: ${val}</div>`)
                .join('');
        }, 1000);

        if (debugReset) {
            debugReset.addEventListener('click', () => {
                if (exitState) {
                    exitState.reset();
                    console.log('[exit] state reset');
                    window.location.reload();
                }
            });
        }
    }

    /**
     * Setup init overlay listeners — triggers access sequence on interaction
     */
    function setupInitListeners() {
        const overlay = document.getElementById('init-overlay');
        if (!overlay) return;

        let sequenceStarted = false;

        const startHandler = (e) => {
            e.preventDefault();
            if (sequenceStarted) return;
            sequenceStarted = true;

            overlay.removeEventListener('click', startHandler);
            overlay.removeEventListener('touchend', startHandler);
            document.removeEventListener('keydown', keyHandler);

            runAccessSequence();
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
