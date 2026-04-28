/**
 * AnnotationSystem — Inline censor annotations that fade in on scroll
 * Annotations are placed directly between paragraphs in the HTML.
 * This system only handles scroll-triggered reveal timing.
 */

class AnnotationSystem {
    constructor(documentState) {
        this.state = documentState;
        this.annotations = [];
    }

    init() {
        this.annotations = document.querySelectorAll('.annotation');
        if (this.annotations.length === 0) return;

        this.annotations.forEach(annotation => {
            // Use the closest document-section parent as the scroll trigger
            const section = annotation.closest('.document-section');
            if (!section) return;

            ScrollTrigger.create({
                trigger: section,
                start: 'top 70%',
                onEnter: () => {
                    // Staggered reveal with random delay
                    const delay = 0.5 + Math.random() * 1.5;
                    gsap.to(annotation, {
                        delay,
                        duration: 0,
                        onComplete: () => annotation.classList.add('visible')
                    });
                },
                once: true
            });
        });
    }
}
