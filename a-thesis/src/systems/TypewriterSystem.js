/**
 * TypewriterSystem — Character-by-character text revelation
 * Types out document header lines, preserving child elements
 */

class TypewriterSystem {
    constructor() {
        this.queue = [];
        this.isTyping = false;
    }

    init() {
        const elements = document.querySelectorAll('[data-typewriter]');
        elements.forEach(el => {
            // Store original HTML (preserves child elements like spans)
            el.dataset.fullHtml = el.innerHTML;
            el.dataset.fullText = el.textContent;
            // Clear visible content
            el.innerHTML = '';
            el.style.visibility = 'visible';
        });
    }

    /**
     * Start typing all header lines with their delays
     */
    startHeaderSequence() {
        const elements = document.querySelectorAll('[data-typewriter]');
        const promises = [];
        elements.forEach(el => {
            const delay = parseInt(el.dataset.delay) || 0;
            const text = el.dataset.fullText;
            const originalHtml = el.dataset.fullHtml;
            if (text) {
                promises.push(new Promise(resolve => {
                    setTimeout(() => this.typeElement(el, text, originalHtml).then(resolve), delay);
                }));
            }
        });
        Promise.all(promises).then(() => {
            window.dispatchEvent(new CustomEvent('typewriterComplete'));
        });
    }

    /**
     * Type text into an element character by character
     * After typing completes, restores original HTML so child elements
     * (redacted spans, date field, etc.) are functional
     */
    typeElement(element, text, originalHtml, speed = 35) {
        return new Promise(resolve => {
            let index = 0;

            // Add cursor
            const cursor = document.createElement('span');
            cursor.className = 'typewriter-cursor';
            element.appendChild(cursor);

            const type = () => {
                if (index < text.length) {
                    const char = text[index];

                    // Insert character before cursor
                    const textNode = document.createTextNode(char);
                    element.insertBefore(textNode, cursor);

                    index++;

                    // Variable speed for realism
                    const variation = speed * (0.5 + Math.random());
                    // Pause longer on spaces and punctuation
                    const pause = (char === ' ' || char === '/' || char === ':') ? variation * 1.5 : variation;

                    setTimeout(type, pause);
                } else {
                    // Remove cursor after a delay
                    setTimeout(() => {
                        cursor.remove();
                        // Restore original HTML so child elements are functional
                        if (originalHtml) {
                            element.innerHTML = originalHtml;
                        }
                        resolve();
                    }, 1500);
                }
            };

            type();
        });
    }
}
