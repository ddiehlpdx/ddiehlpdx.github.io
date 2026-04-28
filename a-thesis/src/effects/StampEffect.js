/**
 * StampEffect — Red "NOTED" / "SEE APPENDIX" stamp overlay
 * Triggered when hidden word elements are clicked
 * Uses event delegation to handle elements that may be
 * recreated by the TypewriterSystem
 */

class StampEffect {
    constructor() {
        this.overlay = document.getElementById('stamp-overlay');
        this.isActive = false;
        this.dateIndex = 0;
        this.dates = [
            '████████',
            '2026.██.██',
            '████.03.17',
            '2024.11.05',
            '████████',
            '2027.01.01',
            '████.██.██',
            '████████'
        ];
    }

    init() {
        // Use event delegation on document for elements that may not exist yet
        // (TypewriterSystem clears and restores header elements)
        document.addEventListener('click', (e) => {
            // Hidden word stamps
            const hiddenWord = e.target.closest('.hidden-word');
            if (hiddenWord) {
                const stampText = hiddenWord.dataset.stamp;
                if (stampText) {
                    this.trigger(stampText);
                    window.dispatchEvent(new CustomEvent('hiddenElementFound', {
                        detail: { elementId: `word-${hiddenWord.textContent.trim()}`, type: 'stamp' }
                    }));
                }
                return;
            }

            // Date field cycling
            const dateField = e.target.closest('#date-field, .header-date');
            if (dateField) {
                this.cycleDateField(dateField);
                return;
            }
        });
    }

    /**
     * Show stamp overlay with text
     */
    trigger(text) {
        if (this.isActive || !this.overlay) return;
        this.isActive = true;

        const stamp = document.createElement('div');
        stamp.className = 'stamp-text';
        stamp.textContent = text;

        this.overlay.innerHTML = '';
        this.overlay.appendChild(stamp);
        this.overlay.classList.remove('hidden');

        gsap.fromTo(stamp, {
            scale: 3,
            opacity: 0,
            rotation: -12 + Math.random() * 6
        }, {
            scale: 1,
            opacity: 0.95,
            duration: 0.15,
            ease: 'power4.out',
            onComplete: () => {
                gsap.to(stamp, {
                    opacity: 0,
                    delay: 0.8,
                    duration: 0.5,
                    ease: 'power2.in',
                    onComplete: () => {
                        this.overlay.classList.add('hidden');
                        this.overlay.innerHTML = '';
                        this.isActive = false;
                    }
                });
            }
        });
    }

    /**
     * Cycle through date values on click
     */
    cycleDateField(dateField) {
        this.dateIndex = (this.dateIndex + 1) % this.dates.length;

        gsap.to(dateField, {
            opacity: 0,
            duration: 0.05,
            onComplete: () => {
                dateField.textContent = this.dates[this.dateIndex];
                gsap.to(dateField, {
                    opacity: 1,
                    duration: 0.1
                });
            }
        });

        window.dispatchEvent(new CustomEvent('hiddenElementFound', {
            detail: { elementId: 'date-field', type: 'date-cycle' }
        }));
    }
}
