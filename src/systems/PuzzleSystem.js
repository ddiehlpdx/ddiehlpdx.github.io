/**
 * PuzzleSystem - Hidden interactions and QR code reveal
 * 8 hidden zones across stages that unlock the final reveal
 */

class PuzzleSystem {
    constructor() {
        this.discoveredZones = new Set();
        this.activeZones = [];
        this.currentStage = 0;
        this.mousePosition = { x: 0, y: 0 };
        this.nearZone = null;
        this.totalZones = 8;
        this.zoneMarkersVisible = false;
        this.zoneMarkers = [];

        // Mobile detection and progressive pulse state
        this.isMobile = this.detectMobile();
        this.stageEnterTime = 0;
        this.mobilePulseIntensity = 0;

        // Periodic zone flash interval
        this.periodicFlashInterval = null;

        // Reference to "it knows you now" message for glitch effects
        this.revealMessage = null;

        // Define hidden zones - each zone has position, radius, and required stage
        this.zones = [
            // Early stages - easier to find
            { id: 'z1', x: 0.25, y: 0.35, radius: 80, stage: 1, message: 'pattern recognized' },
            { id: 'z2', x: 0.75, y: 0.65, radius: 80, stage: 2, message: 'consumption detected' },

            // Mid stages
            { id: 'z3', x: 0.5, y: 0.2, radius: 70, stage: 3, message: 'observation logged' },
            { id: 'z4', x: 0.15, y: 0.75, radius: 70, stage: 4, message: 'breach confirmed' },
            { id: 'z5', x: 0.85, y: 0.4, radius: 70, stage: 5, message: 'temporal anomaly' },

            // Later stages - harder to find
            { id: 'z6', x: 0.6, y: 0.8, radius: 60, stage: 6, message: 'void signature' },
            { id: 'z7', x: 0.3, y: 0.5, radius: 60, stage: 7, message: 'entity awareness' },
            { id: 'z8', x: 0.7, y: 0.3, radius: 60, stage: 8, message: 'convergence point' }
        ];

        console.log(`PuzzleSystem initialized (${this.isMobile ? 'mobile' : 'desktop'} mode)`);
        this.setupEventListeners();
    }

    /**
     * Detect if running on mobile device
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (window.innerWidth < 768)
            || ('ontouchstart' in window);
    }

    /**
     * Setup event listeners (dual-mode: desktop vs mobile)
     */
    setupEventListeners() {
        if (this.isMobile) {
            // MOBILE MODE: touchend for discovery (no continuous tracking)
            document.addEventListener('touchend', (e) => {
                const touch = e.changedTouches[0];
                this.handleClick(touch.clientX, touch.clientY);
            });

            // Start progressive pulse system
            this.startProgressivePulse();
        } else {
            // DESKTOP MODE: existing mousemove/click behavior
            document.addEventListener('mousemove', (e) => {
                this.mousePosition = { x: e.clientX, y: e.clientY };
                this.checkProximity();
            });

            document.addEventListener('click', (e) => {
                this.handleClick(e.clientX, e.clientY);
            });

            // Update cursor proximity check regularly
            setInterval(() => {
                this.checkProximity();
            }, 100);
        }

        // BOTH MODES: Listen for stage changes
        window.addEventListener('stageChange', (e) => {
            this.onStageChange(e.detail);
        });
    }

    /**
     * Start progressive pulse system for mobile (time-based reveal)
     */
    startProgressivePulse() {
        setInterval(() => {
            if (!this.activeZones.length) return;

            const timeSinceStageEnter = Date.now() - this.stageEnterTime;

            // Progressive intensity curve:
            // 0-5s: intensity = 0 (invisible)
            // 5-10s: intensity = 0 → 0.5 (faint pulse)
            // 10-15s: intensity = 0.5 → 1.0 (strong pulse)
            // 15s+: intensity = 1.0 (maximum visibility)

            if (timeSinceStageEnter < 5000) {
                this.mobilePulseIntensity = 0;
            } else if (timeSinceStageEnter < 10000) {
                this.mobilePulseIntensity = (timeSinceStageEnter - 5000) / 10000;
            } else if (timeSinceStageEnter < 15000) {
                this.mobilePulseIntensity = 0.5 + (timeSinceStageEnter - 10000) / 10000;
            } else {
                this.mobilePulseIntensity = 1.0;
            }

            this.updateMobileZoneHints();
        }, 200); // Update every 200ms
    }

    /**
     * Update mobile zone hint visuals based on pulse intensity
     */
    updateMobileZoneHints() {
        // Remove old hints
        document.querySelectorAll('.zone-hint-mobile').forEach(el => el.remove());

        if (this.mobilePulseIntensity === 0) return;

        // Create hints for each active zone
        this.activeZones.forEach(zone => {
            const hint = document.createElement('div');
            hint.className = 'zone-hint-mobile';

            const zoneX = window.innerWidth * zone.x;
            const zoneY = window.innerHeight * zone.y;
            const size = zone.radius * 2;

            hint.style.left = `${zoneX - zone.radius}px`;
            hint.style.top = `${zoneY - zone.radius}px`;
            hint.style.width = `${size}px`;
            hint.style.height = `${size}px`;
            hint.style.opacity = this.mobilePulseIntensity * 0.25; // Max 25% opacity

            // Chromatic aberration increases with intensity
            const aberration = this.mobilePulseIntensity * 10;
            hint.style.filter = `
                drop-shadow(${aberration}px 0 0 rgba(255,0,0,0.3))
                drop-shadow(-${aberration}px 0 0 rgba(0,255,255,0.3))
            `;

            document.body.appendChild(hint);
        });
    }

    /**
     * Handle stage change - update which zones are active
     */
    onStageChange(detail) {
        const { stage } = detail;
        this.currentStage = stage.id;

        // Reset mobile pulse timer on stage change
        if (this.isMobile) {
            this.stageEnterTime = Date.now();
            this.mobilePulseIntensity = 0;
        }

        // Track previously active zones
        const previousActiveZones = new Set(this.activeZones.map(z => z.id));

        // Update active zones - only current stage zones are active
        this.activeZones = this.zones.filter(zone =>
            zone.stage === this.currentStage && !this.discoveredZones.has(zone.id)
        );

        // Find newly activated zones
        const newlyActivatedZones = this.activeZones.filter(z =>
            !previousActiveZones.has(z.id)
        );

        // Trigger subtle activation cue for new zones
        if (newlyActivatedZones.length > 0) {
            this.triggerZoneActivationCue(newlyActivatedZones);
        }

        // Setup periodic flashing for active undiscovered zones
        this.stopPeriodicZoneFlash(); // Clear any existing interval
        if (this.activeZones.length > 0) {
            this.startPeriodicZoneFlash();
        }

        console.log(`PuzzleSystem: Stage ${this.currentStage}, ${this.activeZones.length} active zones`);
    }

    /**
     * Trigger very subtle visual cue when zones activate
     * Feels like a micro-glitch rather than UI feedback
     */
    triggerZoneActivationCue(newZones) {
        console.log(`Zone activation cue triggered for ${newZones.length} new zone(s):`, newZones.map(z => z.id));

        // Stagger pulses slightly if multiple zones (50ms apart)
        newZones.forEach((zone, index) => {
            setTimeout(() => {
                this.pulseZoneLocation(zone);
            }, index * 50);
        });

        // Also trigger a visible global screen glitch
        if (window.glitchEffect) {
            glitchEffect.trigger(0.3); // Increased visibility
        }
    }

    /**
     * Create a brief chromatic aberration pulse at zone location
     */
    pulseZoneLocation(zone) {
        console.log(`Pulsing zone ${zone.id} at (${zone.x * 100}%, ${zone.y * 100}%)`);

        // Create temporary visual element at zone position
        const pulse = document.createElement('div');
        pulse.className = 'zone-activation-pulse';

        const zoneX = window.innerWidth * zone.x;
        const zoneY = window.innerHeight * zone.y;

        // Position at zone center
        pulse.style.position = 'fixed';
        pulse.style.left = `${zoneX}px`;
        pulse.style.top = `${zoneY}px`;
        pulse.style.width = '4px';
        pulse.style.height = '4px';
        pulse.style.pointerEvents = 'none';
        pulse.style.zIndex = '999'; // Much higher to ensure visibility

        // Stronger chromatic aberration effect
        const aberration = 8; // Doubled for visibility
        pulse.style.filter = `
            drop-shadow(${aberration}px 0 0 rgba(255,0,0,0.5))
            drop-shadow(-${aberration}px 0 0 rgba(0,255,255,0.5))
        `;

        document.body.appendChild(pulse);

        // Animate: scale from 0 to full zone radius, then fade out
        gsap.fromTo(pulse,
            {
                scale: 0,
                opacity: 0.6
            },
            {
                scale: zone.radius * 1.2, // Scale to full zone size
                opacity: 0,
                duration: 1.8, // Slower fade for better visibility
                ease: 'power2.out',
                onComplete: () => {
                    pulse.remove();
                    console.log(`Zone ${zone.id} pulse complete`);
                }
            }
        );

        // More visible visual layer glitch
        if (window.visualLayer) {
            visualLayer.triggerGlitch(0.2);
        }
    }

    /**
     * Start periodic flashing for active undiscovered zones (every 10 seconds)
     */
    startPeriodicZoneFlash() {
        this.periodicFlashInterval = setInterval(() => {
            // Only flash zones that are active but not yet discovered
            const undiscoveredActiveZones = this.activeZones.filter(zone =>
                !this.discoveredZones.has(zone.id)
            );

            if (undiscoveredActiveZones.length > 0) {
                this.triggerZoneActivationCue(undiscoveredActiveZones);
            } else {
                // All active zones discovered, stop flashing
                this.stopPeriodicZoneFlash();
            }
        }, 10000); // Every 10 seconds

        console.log('Periodic zone flash started (every 10 seconds)');
    }

    /**
     * Stop periodic zone flashing
     */
    stopPeriodicZoneFlash() {
        if (this.periodicFlashInterval) {
            clearInterval(this.periodicFlashInterval);
            this.periodicFlashInterval = null;
            console.log('Periodic zone flash stopped');
        }
    }

    /**
     * Check if mouse is near any active zone
     */
    checkProximity() {
        const wasNearZone = this.nearZone !== null;
        this.nearZone = null;

        for (let zone of this.activeZones) {
            const zoneX = window.innerWidth * zone.x;
            const zoneY = window.innerHeight * zone.y;

            const distance = Math.sqrt(
                Math.pow(this.mousePosition.x - zoneX, 2) +
                Math.pow(this.mousePosition.y - zoneY, 2)
            );

            if (distance < zone.radius) {
                this.nearZone = zone;
                break;
            }
        }

        // Update cursor style
        if (this.nearZone) {
            document.body.style.cursor = 'crosshair';

            // Apply subtle visual hint
            if (!wasNearZone) {
                this.showProximityHint();
            }
        } else if (wasNearZone) {
            document.body.style.cursor = 'default';
            this.hideProximityHint();
        }
    }

    /**
     * Show subtle hint when near a zone
     */
    showProximityHint() {
        // Subtle screen distortion
        gsap.to(document.body, {
            filter: 'hue-rotate(5deg) brightness(1.05)',
            duration: 0.3
        });

        // Trigger subtle glitch in visual layer
        if (window.visualLayer) {
            visualLayer.triggerGlitch(0.2);
        }
    }

    /**
     * Hide proximity hint
     */
    hideProximityHint() {
        gsap.to(document.body, {
            filter: 'none',
            duration: 0.3
        });
    }

    /**
     * Handle click/tap - check if clicking/tapping on a zone (dual-mode)
     */
    handleClick(x, y) {
        let targetZone = null;

        if (this.isMobile) {
            // MOBILE: Check if tap is within any active zone
            for (let zone of this.activeZones) {
                const zoneX = window.innerWidth * zone.x;
                const zoneY = window.innerHeight * zone.y;
                const distance = Math.sqrt(
                    Math.pow(x - zoneX, 2) + Math.pow(y - zoneY, 2)
                );

                if (distance < zone.radius) {
                    targetZone = zone;
                    break;
                }
            }

            // Add haptic feedback for mobile
            if (targetZone && navigator.vibrate) {
                navigator.vibrate(50); // 50ms vibration
            }
        } else {
            // DESKTOP: Use proximity-detected zone
            targetZone = this.nearZone;
        }

        if (!targetZone) return;

        // Discovery!
        this.discoverZone(targetZone);
    }

    /**
     * Handle zone discovery
     */
    discoverZone(zone) {
        // Mark as discovered
        this.discoveredZones.add(zone.id);

        // Remove from active zones
        this.activeZones = this.activeZones.filter(z => z.id !== zone.id);

        // Stop periodic flashing if all active zones are now discovered
        if (this.activeZones.length === 0) {
            this.stopPeriodicZoneFlash();
        }

        console.log(`Discovered zone: ${zone.id} (${this.discoveredZones.size}/${this.totalZones})`);

        // Visual feedback
        this.showDiscoveryFeedback(zone);

        // Audio feedback
        if (window.audioSystem) {
            audioSystem.triggerMechanical();
        }

        // Glitch effect
        if (window.glitchEffect) {
            glitchEffect.trigger(0.7);
        }

        // Check for completion
        if (this.discoveredZones.size === this.totalZones) {
            // Only reveal if not already revealed
            const container = document.getElementById('qr-container');
            if (container.classList.contains('hidden')) {
                setTimeout(() => this.revealQRCode(), 1000);
            }
        }
    }

    /**
     * Show discovery feedback message
     */
    showDiscoveryFeedback(zone) {
        const messageContainer = document.getElementById('message-container');

        // Create message element
        const message = document.createElement('div');
        message.className = 'discovery-message';
        message.innerHTML = `
            <div style="font-size: 18px; margin-bottom: 10px;">${zone.message}</div>
            <div style="font-size: 14px; opacity: 0.6;">[${this.discoveredZones.size}/${this.totalZones} found]</div>
        `;

        messageContainer.appendChild(message);

        // Animate in
        gsap.fromTo(message,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5 }
        );

        // Remove after delay
        setTimeout(() => {
            gsap.to(message, {
                opacity: 0,
                y: -20,
                duration: 0.5,
                onComplete: () => message.remove()
            });
        }, 3000);
    }

    /**
     * Apply reverse corruption to DOM text element
     * @param {HTMLElement} element - Element with text to corrupt
     * @param {number} intensity - 0 (clear) to 1 (corrupted)
     */
    applyReverseDOMCorruption(element, intensity) {
        const originalText = element.dataset.originalText || element.textContent;

        if (!element.dataset.originalText) {
            element.dataset.originalText = originalText;
        }

        let corruptedText = originalText;

        // Apply weighted corruption patterns
        corruptedText = CorruptionPatterns.glyphSubstitution(corruptedText, intensity * 0.4);
        corruptedText = CorruptionPatterns.unicodeShift(corruptedText, intensity * 0.3);
        corruptedText = CorruptionPatterns.insertion(corruptedText, intensity * 0.2);
        corruptedText = CorruptionPatterns.stutter(corruptedText, intensity * 0.1);

        element.textContent = corruptedText;
    }

    /**
     * Reveal QR code with reverse corruption and auto-dissolution
     */
    revealQRCode() {
        console.log('All zones discovered! Revealing QR code...');

        const container = document.getElementById('qr-container');
        container.innerHTML = '';
        container.classList.remove('hidden');
        container.style.opacity = 1; // Reset opacity
        container.style.position = 'fixed'; // Ensure positioning context

        // Create message (will start corrupted)
        const message = document.createElement('div');
        message.style.position = 'absolute';
        message.style.top = 'calc(50% - 180px)'; // 180px above center
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.textAlign = 'center';
        message.style.color = '#ffffff';
        message.style.whiteSpace = 'nowrap';
        message.style.zIndex = '9999'; // Above QR code
        message.style.pointerEvents = 'none'; // Allow clicks through

        const mainText = document.createElement('p');
        mainText.style.fontSize = '24px';
        mainText.style.marginBottom = '10px';
        mainText.textContent = 'it knows you now';
        mainText.dataset.originalText = 'it knows you now';

        message.appendChild(mainText);
        container.appendChild(message);

        // Store reference for later glitch effects
        this.revealMessage = message;

        // Apply initial corruption
        this.applyReverseDOMCorruption(mainText, 1.0);

        // Create QR code
        const qrWrapper = document.createElement('div');
        qrWrapper.id = 'qr-code';
        qrWrapper.style.position = 'absolute';
        qrWrapper.style.top = '50%';
        qrWrapper.style.left = '50%';
        qrWrapper.style.transform = 'translate(-50%, -50%)';
        qrWrapper.style.display = 'inline-block';
        qrWrapper.style.padding = '20px';
        qrWrapper.style.background = 'linear-gradient(135deg, rgb(255, 0, 0) 0%, rgb(0, 255, 255) 100%)';
        qrWrapper.style.zIndex = '1'; // Below message
        container.appendChild(qrWrapper);

        new QRCode(qrWrapper, {
            text: 'https://example.com/diamond-eater-complete',
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: 'transparent', // Fully transparent to remove white border
            quietZone: 0 // Remove white space around QR code
        });

        // Master timeline
        const masterTimeline = gsap.timeline();

        // Phase 1: Message corruption clears (0-1.5s)
        // Animate a proxy object to drive corruption intensity from 1.0 to 0.0
        const corruptionProxy = { intensity: 1.0 };
        masterTimeline.to(corruptionProxy, {
            intensity: 0,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => {
                this.applyReverseDOMCorruption(mainText, corruptionProxy.intensity);
            }
        }, 0);

        // Phase 2: Dramatic screen flash at transition point (1.5s)
        masterTimeline.call(() => {
            if (window.glitchEffect) {
                glitchEffect.trigger(0.9); // Slightly reduced for subtlety
            }
        }, null, 1.5); // Execute at 1.5s mark

        // Phase 3: QR code scales in after flash (1.8-3.8s)
        masterTimeline.fromTo(qrWrapper,
            { opacity: 0, scale: 0.5 },
            { opacity: 1, scale: 1, duration: 2, ease: 'back.out(1.7)' },
            1.8  // Start at 1.8s (after flash completes)
        );

        // Audio feedback
        if (window.audioSystem) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => audioSystem.triggerMechanical(), i * 100);
            }
        }

        // Phase 3: Wait briefly, then dissolve
        setTimeout(() => {
            this.dissolveQRCode(container, qrWrapper);
        }, 6000);
    }

    /**
     * Dissolve QR code - crumble into data stream
     */
    dissolveQRCode(container, qrWrapper) {
        console.log('QR code dissolution starting - CRUMBLE MODE');

        // Step 1: Extract QR pixel data
        const darkPixels = this.extractQRPixels(qrWrapper);

        // Step 2: Get QR wrapper screen bounds for position mapping
        const qrBounds = qrWrapper.getBoundingClientRect();

        // Step 3: Trigger crumble effect in VisualLayer
        if (window.visualLayer && darkPixels.length > 0) {
            visualLayer.startQRCrumble(darkPixels, qrBounds);
        }

        // Step 4: Fade out original QR code very quickly as glyphs appear
        gsap.to(qrWrapper, {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                qrWrapper.remove();
                console.log('Original QR removed, crumble continues');
            }
        });

        // Step 5: Fade message to faint visibility
        if (this.revealMessage) {
            gsap.to(this.revealMessage, {
                opacity: 0.15,
                duration: 2,
                ease: 'power2.in',
                onComplete: () => {
                    this.startMessageGlitch();
                }
            });
        }

        // Step 6: Trigger glitch effect
        if (window.glitchEffect) {
            glitchEffect.trigger(0.8);
        }
    }

    /**
     * Extract dark pixel positions from QR code for crumble effect
     * @param {HTMLElement} qrWrapper - QR code wrapper element
     * @returns {Array} Array of {x, y} pixel positions
     */
    extractQRPixels(qrWrapper) {
        // Find the canvas or img element created by QRCode.js
        let canvas = qrWrapper.querySelector('canvas');
        let tempCanvas = null;

        if (!canvas) {
            // If no canvas, might be an img - convert to canvas
            const img = qrWrapper.querySelector('img');
            if (!img) {
                console.warn('No QR code canvas/img found');
                return [];
            }

            // Create temporary canvas
            tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas = tempCanvas;
        }

        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const darkPixels = [];

        // Sample every 8 pixels to reduce sprite count
        const sampleRate = 8;

        for (let y = 0; y < canvas.height; y += sampleRate) {
            for (let x = 0; x < canvas.width; x += sampleRate) {
                const index = (y * canvas.width + x) * 4;
                const r = pixels[index];
                const g = pixels[index + 1];
                const b = pixels[index + 2];
                const brightness = (r + g + b) / 3;

                // If dark (QR code data), store position
                if (brightness < 128) {
                    darkPixels.push({ x, y });
                }
            }
        }

        console.log(`Extracted ${darkPixels.length} dark pixels from QR code`);
        return darkPixels;
    }

    /**
     * Start periodic glitch effect on "it knows you now" message
     * Similar to logo glitch but applied to text
     */
    startMessageGlitch() {
        if (!this.revealMessage) return;

        const triggerGlitch = () => {
            // Random position shift
            const offsetX = (Math.random() - 0.5) * 8;
            const offsetY = (Math.random() - 0.5) * 8;

            // Random rotation
            const rotation = (Math.random() - 0.5) * 4;

            // Random chromatic aberration intensity
            const aberration = 2 + Math.random() * 3; // 2-5px

            // Random opacity during glitch
            const glitchOpacity = 0.3 + Math.random() * 0.3; // 0.3-0.6

            // Apply glitch (preserve centering transform)
            this.revealMessage.style.transform = `translateX(-50%) translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`;
            this.revealMessage.style.opacity = glitchOpacity;
            this.revealMessage.style.filter = `
                drop-shadow(${aberration}px 0 0 rgba(255, 0, 0, 0.6))
                drop-shadow(-${aberration}px 0 0 rgba(0, 255, 255, 0.6))
            `;

            // Random glitch duration
            const glitchDuration = 60 + Math.random() * 60; // 60-120ms

            // Reset after brief moment
            setTimeout(() => {
                if (this.revealMessage) {
                    this.revealMessage.style.transform = 'translateX(-50%)'; // Restore centering
                    this.revealMessage.style.opacity = '0.15'; // Return to faint visibility
                    this.revealMessage.style.filter = '';
                }
            }, glitchDuration);

            // Schedule next glitch (4-6 seconds, same as logo)
            const nextGlitch = 4000 + Math.random() * 2000;
            setTimeout(triggerGlitch, nextGlitch);
        };

        // Start first glitch after 4-6 seconds
        const firstGlitch = 4000 + Math.random() * 2000;
        setTimeout(triggerGlitch, firstGlitch);

        console.log('Message glitch effect started');
    }

    /**
     * Get discovery progress
     */
    getProgress() {
        return {
            discovered: this.discoveredZones.size,
            total: this.totalZones,
            percentage: (this.discoveredZones.size / this.totalZones) * 100
        };
    }

    /**
     * Reset puzzle (for testing)
     */
    reset() {
        // Kill any active GSAP timelines
        gsap.killTweensOf('#qr-container');
        gsap.killTweensOf('#qr-code');

        this.discoveredZones.clear();
        this.activeZones = this.zones.filter(zone => zone.stage <= this.currentStage);

        const container = document.getElementById('qr-container');
        container.classList.add('hidden');
        container.innerHTML = '';

        console.log('Puzzle reset');
    }

    /**
     * Skip to finish - discover all zones and reveal QR code (debug only)
     */
    skipToFinish() {
        console.log('DEBUG: Skipping to finish...');

        // Stop any periodic flashing
        this.stopPeriodicZoneFlash();

        // Mark all zones as discovered
        this.zones.forEach(zone => {
            this.discoveredZones.add(zone.id);
        });

        // Clear active zones
        this.activeZones = [];

        // Reveal QR code immediately
        const container = document.getElementById('qr-container');
        if (container.classList.contains('hidden')) {
            this.revealQRCode();
        }

        console.log('DEBUG: All zones discovered, QR revealed');
    }

    /**
     * Toggle visibility of zone markers (for debugging)
     */
    toggleZoneVisibility() {
        this.zoneMarkersVisible = !this.zoneMarkersVisible;

        if (this.zoneMarkersVisible) {
            // Create markers for all zones
            this.zones.forEach(zone => {
                const marker = document.createElement('div');
                marker.id = `zone-marker-${zone.id}`;
                marker.style.position = 'fixed';
                marker.style.border = '2px solid #00ff00';
                marker.style.borderRadius = '50%';
                marker.style.pointerEvents = 'none';
                marker.style.zIndex = '9999';
                marker.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';

                // Position based on zone coordinates
                const x = window.innerWidth * zone.x;
                const y = window.innerHeight * zone.y;
                const size = zone.radius * 2;

                marker.style.left = `${x - zone.radius}px`;
                marker.style.top = `${y - zone.radius}px`;
                marker.style.width = `${size}px`;
                marker.style.height = `${size}px`;

                // Add label
                const label = document.createElement('div');
                label.style.position = 'absolute';
                label.style.top = '50%';
                label.style.left = '50%';
                label.style.transform = 'translate(-50%, -50%)';
                label.style.color = '#00ff00';
                label.style.fontSize = '12px';
                label.style.fontFamily = 'monospace';
                label.style.textAlign = 'center';
                label.style.textShadow = '0 0 4px #000';
                label.innerHTML = `${zone.id}<br>Stage ${zone.stage}`;

                marker.appendChild(label);
                document.body.appendChild(marker);
                this.zoneMarkers.push(marker);
            });

            console.log('Zone markers shown');
        } else {
            // Remove all markers
            this.zoneMarkers.forEach(marker => marker.remove());
            this.zoneMarkers = [];
            console.log('Zone markers hidden');
        }

        return this.zoneMarkersVisible;
    }
}

// Create global instance
let puzzleSystem = null;
