/**
 * FormEngine — The gaslighting mechanics
 * Manages field mutation, section injection, textarea redaction, dropdown drift
 */

class FormEngine {
    constructor(exitState) {
        this.state = exitState;

        // Mutation engine
        this.mutationInterval = null;
        this.mutationProbability = 0.1; // Starts at 10%, increases over time

        // Section 7 injection
        this.sectionSevenInjected = false;
        this.hasScrolledPastFour = false;
        this.lastScrollY = 0;
        this.scrollingUpCount = 0;

        // Textarea redaction
        this.activeTextareas = new Map(); // textarea element → typing state

        // Dropdown drift
        this.driftStages = {
            reason: 0,
            department: 0
        };
        this.driftInterval = null;

        // Page count
        this.pageTotal = 1;

        // Track scroll position for section visibility
        this.scrollHandler = null;
    }

    init() {
        this.setupMutationEngine();
        this.setupScrollWatcher();
        this.setupTextareaRedaction();
        this.setupDropdownDrift();
        this.setupCharCounters();
        this.setupKeystrokeTracking();
        this.setupPageCountCreep();
    }

    // ---- Field Mutation ----

    setupMutationEngine() {
        this.mutationInterval = setInterval(() => {
            this.attemptMutation();
        }, 5000 + Math.random() * 3000); // 5-8 seconds
    }

    attemptMutation() {
        // Increase probability over time (caps at 40%)
        const timeMinutes = this.state.totalVisitTime / 60;
        this.mutationProbability = Math.min(0.4, 0.1 + timeMinutes * 0.03);

        if (Math.random() > this.mutationProbability) return;

        const fields = this.getMutableFields();
        if (fields.length === 0) return;

        const field = fields[Math.floor(Math.random() * fields.length)];
        this.mutateField(field);
    }

    getMutableFields() {
        const allFields = document.querySelectorAll(
            '#exit-form input[type="text"], #exit-form input[type="date"], #exit-form select'
        );

        return Array.from(allFields).filter(field => {
            // Must have a value
            if (!field.value || field.value === '') return false;
            // Must not be focused
            if (document.activeElement === field) return false;
            // Must be off-screen (scrolled away)
            const rect = field.getBoundingClientRect();
            if (rect.top >= 0 && rect.bottom <= window.innerHeight) return false;
            return true;
        });
    }

    mutateField(field) {
        if (field.tagName === 'SELECT') {
            this.mutateSelect(field);
        } else if (field.type === 'date') {
            this.mutateDate(field);
        } else {
            this.mutateText(field);
        }

        this.state.recordMutation();
    }

    mutateText(field) {
        const val = field.value;
        if (val.length < 2) return;

        const mutationType = Math.random();

        if (mutationType < 0.5 && val.length >= 3) {
            // Swap two adjacent characters
            const idx = 1 + Math.floor(Math.random() * (val.length - 2));
            field.value = val.substring(0, idx) + val[idx + 1] + val[idx] + val.substring(idx + 2);
        } else {
            // Substitute a similar character
            const subs = {
                'a': 'e', 'e': 'a', 'i': 'l', 'l': 'i', 'o': '0', '0': 'o',
                'm': 'n', 'n': 'm', 'b': 'd', 'd': 'b', 'p': 'q', 'q': 'p',
                's': 'z', 'z': 's', 't': 'f', 'f': 't', 'u': 'v', 'v': 'u',
                'A': 'E', 'E': 'A', 'M': 'N', 'N': 'M', 'B': 'D', 'D': 'B'
            };
            // Pick a random character that has a substitution
            const candidates = [];
            for (let i = 0; i < val.length; i++) {
                if (subs[val[i]]) candidates.push(i);
            }
            if (candidates.length > 0) {
                const idx = candidates[Math.floor(Math.random() * candidates.length)];
                field.value = val.substring(0, idx) + subs[val[idx]] + val.substring(idx + 1);
            }
        }
    }

    mutateSelect(field) {
        const options = field.options;
        if (options.length <= 1) return;

        const current = field.selectedIndex;
        if (current <= 0) return; // Don't mutate the placeholder

        // Shift to an adjacent option
        const direction = Math.random() < 0.5 ? -1 : 1;
        const newIndex = Math.max(1, Math.min(options.length - 1, current + direction));
        field.selectedIndex = newIndex;
    }

    mutateDate(field) {
        if (!field.value) return;

        const date = new Date(field.value);
        const shift = Math.random() < 0.5 ? 1 : -1;
        date.setDate(date.getDate() + shift);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        field.value = `${year}-${month}-${day}`;
    }

    // ---- Radio deselection ----

    mutateRadio() {
        const checkedRadios = document.querySelectorAll('#exit-form input[type="radio"]:checked');
        if (checkedRadios.length === 0) return;

        // Pick one at random and deselect it (only if off-screen)
        const candidates = Array.from(checkedRadios).filter(radio => {
            const rect = radio.getBoundingClientRect();
            return rect.top < 0 || rect.bottom > window.innerHeight;
        });

        if (candidates.length > 0) {
            const target = candidates[Math.floor(Math.random() * candidates.length)];
            target.checked = false;
            this.state.recordMutation();
        }
    }

    // ---- Section 7 Injection ----

    setupScrollWatcher() {
        this.scrollHandler = () => {
            this.checkSectionVisibility();
            this.checkSectionSevenTrigger();
        };
        window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }

    checkSectionVisibility() {
        document.querySelectorAll('.form-section').forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const id = section.dataset.section;
                if (id) this.state.viewSection(id);
            }
        });
    }

    checkSectionSevenTrigger() {
        if (this.sectionSevenInjected) return;

        const currentScrollY = window.scrollY;

        // Phase 1: detect user has scrolled far enough to see Section 5
        if (!this.hasScrolledPastFour) {
            const section5 = document.querySelector('.form-section[data-section="5"]');
            if (section5) {
                const rect5 = section5.getBoundingClientRect();
                if (rect5.top < window.innerHeight && rect5.bottom > 0) {
                    this.hasScrolledPastFour = true;
                }
            }
        }

        // Phase 2: after seeing Section 5, detect sustained upward scrolling
        if (this.hasScrolledPastFour) {
            if (currentScrollY < this.lastScrollY) {
                // Scrolling up — count consecutive up-scroll events
                this.scrollingUpCount++;
            } else {
                this.scrollingUpCount = 0;
            }

            // Inject after a few consecutive upward scroll events
            // (confirms intentional scroll-back, not a tiny bounce)
            if (this.scrollingUpCount >= 3) {
                this.injectSectionSeven();
            }
        }

        this.lastScrollY = currentScrollY;
    }

    injectSectionSeven() {
        if (this.sectionSevenInjected) return;
        this.sectionSevenInjected = true;
        this.state.sectionSevenSeen = true;

        const section4 = document.querySelector('.form-section[data-section="4"]');
        if (!section4) return;

        const fieldset = document.createElement('fieldset');
        fieldset.className = 'form-section section-injected';
        fieldset.dataset.section = '7';

        let thesisQuestion = '';
        if (this.state.hasThesisState) {
            thesisQuestion = `
                <div class="field-group" style="margin-top: 12px;">
                    <label>Did you disclose the contents of the document referenced in
                    case file THESIS-REVIEW to any unauthorized parties?</label>
                    <div class="radio-row" style="margin-top: 6px;">
                        <label class="radio-label"><input type="radio" name="disclosure" value="yes"> Yes</label>
                        <label class="radio-label"><input type="radio" name="disclosure" value="no"> No</label>
                        <label class="radio-label"><input type="radio" name="disclosure" value="unknown"> I don't recall</label>
                    </div>
                </div>
            `;
        }

        fieldset.innerHTML = `
            <legend>Section 7 — The Incident</legend>
            <p class="section-note">This section is required for all personnel
                with access level <span class="redacted-inline">████</span> or above.</p>
            <div class="field-group">
                <label class="checkbox-label">
                    <input type="checkbox" name="acknowledge" value="yes">
                    I acknowledge my involvement in the incident described
                    in reference <span class="redacted-inline">████-████</span>
                </label>
            </div>
            <div class="field-group">
                <label for="field-incident">Describe in your own words</label>
                <textarea id="field-incident" name="incident" rows="4" maxlength="500"></textarea>
                <span class="char-count" data-for="field-incident">0 / 500</span>
            </div>
            ${thesisQuestion}
        `;

        section4.parentNode.insertBefore(fieldset, section4);

        // Setup redaction on the new textarea
        const newTextarea = fieldset.querySelector('textarea');
        if (newTextarea) {
            this.watchTextarea(newTextarea);
            this.setupCharCounter(newTextarea);
        }

        // Increment page count
        this.pageTotal = 2;
        this.updatePageCount();

        this.state.saveState();
    }

    // ---- Textarea Redaction ----

    setupTextareaRedaction() {
        document.querySelectorAll('#exit-form textarea').forEach(textarea => {
            this.watchTextarea(textarea);
        });
    }

    watchTextarea(textarea) {
        const state = {
            redactionTimer: null,
            started: false
        };

        const scheduleNextRedaction = () => {
            // First redaction comes faster (2-3s), subsequent ones 4-8s
            const delay = state.started
                ? (4000 + Math.random() * 4000)
                : (2000 + Math.random() * 1000);
            state.started = true;

            state.redactionTimer = setTimeout(() => {
                if (textarea.value.length >= 15 && !this.isMostlyRedacted(textarea)) {
                    this.redactCharacter(textarea);
                    scheduleNextRedaction();
                } else if (!this.isMostlyRedacted(textarea)) {
                    // Not enough text yet but keep checking
                    scheduleNextRedaction();
                }
                // If mostly redacted, stop scheduling (timer dies)
            }, delay);
        };

        textarea.addEventListener('input', () => {
            // Start the redaction cycle once we hit 15 chars (doesn't reset on input)
            // Also restart if it stopped due to being mostly redacted but user typed more
            if (textarea.value.length >= 15 && !state.redactionTimer) {
                scheduleNextRedaction();
            }
        });

        this.activeTextareas.set(textarea, state);
    }

    /**
     * Check if a textarea is mostly redacted (60%+ of non-space chars are █)
     */
    isMostlyRedacted(textarea) {
        const val = textarea.value;
        if (val.length === 0) return true;
        let total = 0;
        let redacted = 0;
        for (let i = 0; i < val.length; i++) {
            if (val[i] !== ' ' && val[i] !== '\n') {
                total++;
                if (val[i] === '█') redacted++;
            }
        }
        return total > 0 && (redacted / total) >= 0.6;
    }

    redactCharacter(textarea) {
        const val = textarea.value;
        if (val.length < 15) return;

        // Find all words (sequences of non-space, non-redaction characters)
        const wordPattern = /[^\s█]+/g;
        const words = [];
        let match;
        while ((match = wordPattern.exec(val)) !== null) {
            // Skip words that are in the last 5 characters (near cursor)
            if (match.index + match[0].length <= val.length - 5) {
                words.push({ index: match.index, length: match[0].length });
            }
        }

        if (words.length === 0) return;

        // Pick a random word to redact
        const word = words[Math.floor(Math.random() * words.length)];
        const cursorPos = textarea.selectionStart;

        // Replace the word with █ characters of the same length
        const redactionBar = '█'.repeat(word.length);
        textarea.value = val.substring(0, word.index) + redactionBar + val.substring(word.index + word.length);

        // Restore cursor position
        textarea.setSelectionRange(cursorPos, cursorPos);

        this.state.recordRedaction();

        // Update char counter
        const counter = document.querySelector(`.char-count[data-for="${textarea.id}"]`);
        if (counter) {
            counter.textContent = textarea.value.length + ' / ' + textarea.maxLength;
        }
    }

    // ---- Dropdown Drift ----

    setupDropdownDrift() {
        this.driftInterval = setInterval(() => {
            this.checkDropdownDrift();
        }, 10000); // Check every 10 seconds
    }

    checkDropdownDrift() {
        const timeMinutes = this.state.totalVisitTime / 60;

        // Reason for Departure drift
        const reasonSelect = document.getElementById('field-reason');
        if (reasonSelect) {
            const voluntaryOption = reasonSelect.querySelector('option[value="voluntary"]');
            if (voluntaryOption) {
                if (timeMinutes >= 12 && this.driftStages.reason < 5) {
                    voluntaryOption.textContent = 'Employment Disputed';
                    this.driftStages.reason = 5;
                } else if (timeMinutes >= 8 && this.driftStages.reason < 4) {
                    voluntaryOption.textContent = 'No Record of Employment';
                    this.driftStages.reason = 4;
                } else if (timeMinutes >= 5 && this.driftStages.reason < 3) {
                    voluntaryOption.textContent = 'Termination for Cause';
                    this.driftStages.reason = 3;
                } else if (timeMinutes >= 3 && this.driftStages.reason < 2) {
                    voluntaryOption.textContent = 'Involuntary Separation';
                    this.driftStages.reason = 2;
                } else if (timeMinutes >= 1 && this.driftStages.reason < 1) {
                    voluntaryOption.textContent = 'Voluntary Separation';
                    this.driftStages.reason = 1;
                }
            }
        }

        // Department drift
        const deptSelect = document.getElementById('field-department');
        if (deptSelect) {
            const oversightOption = deptSelect.querySelector('option[value="oversight"]');
            if (oversightOption && timeMinutes >= 2 && this.driftStages.department < 1) {
                oversightOption.textContent = 'Oversight (Dissolved)';
                this.driftStages.department = 1;
            }
            if (timeMinutes >= 5 && this.driftStages.department < 2) {
                // Add "Redacted" option if not already there
                if (!deptSelect.querySelector('option[value="redacted"]')) {
                    const opt = document.createElement('option');
                    opt.value = 'redacted';
                    opt.textContent = '██████████';
                    deptSelect.appendChild(opt);
                }
                this.driftStages.department = 2;
            }
        }
    }

    // ---- Character counters ----

    setupCharCounters() {
        document.querySelectorAll('#exit-form textarea').forEach(textarea => {
            this.setupCharCounter(textarea);
        });
    }

    setupCharCounter(textarea) {
        const counter = document.querySelector(`.char-count[data-for="${textarea.id}"]`);
        if (!counter) return;

        textarea.addEventListener('input', () => {
            counter.textContent = textarea.value.length + ' / ' + textarea.maxLength;
        });
    }

    // ---- Keystroke tracking ----

    setupKeystrokeTracking() {
        document.getElementById('exit-form').addEventListener('input', () => {
            this.state.recordKeystroke();
        });
    }

    // ---- Page count creep ----

    setupPageCountCreep() {
        setInterval(() => {
            const timeMinutes = this.state.totalVisitTime / 60;
            let newTotal = this.pageTotal;

            if (timeMinutes >= 8) newTotal = Math.max(newTotal, 12);
            else if (timeMinutes >= 5) newTotal = Math.max(newTotal, 7);
            else if (timeMinutes >= 3) newTotal = Math.max(newTotal, 5);
            else if (timeMinutes >= 1) newTotal = Math.max(newTotal, 3);

            if (newTotal !== this.pageTotal) {
                this.pageTotal = newTotal;
                this.updatePageCount();
            }
        }, 5000);
    }

    updatePageCount() {
        const el = document.getElementById('page-total');
        if (el) {
            el.textContent = this.state.formSubmitted ? '███' : String(this.pageTotal);
        }
    }

    // ---- Capture all field values ----

    captureAllFields() {
        const form = document.getElementById('exit-form');
        if (!form) return;

        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
            this.state.trackField(key, String(value));
        }
    }

    // ---- Cleanup ----

    destroy() {
        if (this.mutationInterval) clearInterval(this.mutationInterval);
        if (this.driftInterval) clearInterval(this.driftInterval);
        if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);

        this.activeTextareas.forEach((state) => {
            if (state.redactionTimer) clearTimeout(state.redactionTimer);
        });
    }
}
