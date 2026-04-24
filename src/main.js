/**
 * Main application entry point
 * Initializes all systems and starts the experience
 */

class Application {
    constructor() {
        this.initialized = false;
        this.animationFrameId = null;
        this.lastFrameTime = Date.now();

        // Initialize on user interaction
        this.setupInitialization();

        // Setup debug overlay (for Phase 1 testing)
        this.setupDebugOverlay();

        // Setup stage change visualization (for Phase 1 testing)
        this.setupStageVisualization();
    }

    /**
     * Setup initialization trigger
     */
    setupInitialization() {
        const initPrompt = document.getElementById('init-prompt');

        const init = async () => {
            if (!this.initialized) {
                initPrompt.classList.add('hidden');

                // Remove listeners first
                document.removeEventListener('click', init);
                document.removeEventListener('touchstart', init);
                document.removeEventListener('keydown', init);

                // Initialize (async)
                await this.init();
            }
        };

        document.addEventListener('click', init);
        document.addEventListener('touchstart', init);
        document.addEventListener('keydown', init);

        // Start random glitch effect on logo
        this.startLogoGlitch();
    }

    /**
     * Random glitch effect for logo
     */
    startLogoGlitch() {
        const logo = document.querySelector('.init-prompt img');
        if (!logo) return;

        const triggerGlitch = () => {
            // Random position shift (increased for visibility)
            const offsetX = (Math.random() - 0.5) * 8;
            const offsetY = (Math.random() - 0.5) * 8;

            // Get current scale from breathing animation (approximate based on time)
            const currentScale = 0.98 + (Math.sin(Date.now() / 955) + 1) * 0.02; // ~6 second cycle

            // Apply glitch with combined transform (preserve breathing animation)
            logo.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${currentScale})`;
            logo.style.opacity = '0.7';
            logo.style.filter = 'drop-shadow(3px 0 0 rgba(255, 0, 0, 0.6)) drop-shadow(-3px 0 0 rgba(0, 255, 255, 0.6))';

            // Reset after brief moment
            setTimeout(() => {
                logo.style.transform = '';
                logo.style.opacity = '1';
                logo.style.filter = '';
            }, 80);

            // Schedule next glitch (4-6 seconds)
            const nextGlitch = 4000 + Math.random() * 2000;
            setTimeout(triggerGlitch, nextGlitch);
        };

        // Start first glitch after 4-6 seconds
        const firstGlitch = 4000 + Math.random() * 2000;
        setTimeout(triggerGlitch, firstGlitch);
    }

    /**
     * Initialize application
     */
    async init() {
        try {
            console.log('Initializing Diamond Eater...');

            // Initialize scroll engine
            scrollEngine = new ScrollEngine();

            // Initialize visual layer (Three.js)
            window.visualLayer = visualLayer = new VisualLayer();

            // Initialize text system
            textSystem = new TextSystem();

            // Initialize audio system (requires user interaction)
            audioSystem = new AudioSystem();
            await audioSystem.init();

            // Initialize puzzle system
            puzzleSystem = new PuzzleSystem();

            // Listen for stage changes
            window.addEventListener('stageChange', (e) => {
                this.onStageChange(e.detail);
            });

            // Listen for scroll attempts
            window.addEventListener('scrollAttempt', (e) => {
                this.onScrollAttempt(e.detail);
            });

            // Start render loop
            this.startRenderLoop();

            this.initialized = true;
            console.log('Diamond Eater initialized');
            console.log('Current stage:', stateManager.currentStage);
        } catch (error) {
            console.error('Failed to initialize Diamond Eater:', error);
            alert('Initialization failed. Check console for details.');
        }
    }

    /**
     * Handle stage change
     */
    onStageChange(detail) {
        console.log('Stage change:', detail);
        const { to, from, stage, isLoop } = detail;

        // Update debug overlay
        this.updateDebugOverlay();

        // Show stage name briefly
        this.showStageMessage(stage.name);
    }

    /**
     * Handle scroll attempt
     */
    onScrollAttempt(detail) {
        // Update debug overlay
        this.updateDebugOverlay();
    }

    /**
     * Start main render loop
     */
    startRenderLoop() {
        const render = () => {
            const now = Date.now();
            const deltaTime = now - this.lastFrameTime;
            this.lastFrameTime = now;

            // Update visual layer (renders behind text)
            if (visualLayer) {
                visualLayer.update(deltaTime);
                visualLayer.render();
            }

            // Update text system (renders on top)
            if (textSystem) {
                textSystem.update(deltaTime);
                textSystem.render();
            }

            this.animationFrameId = requestAnimationFrame(render);
        };

        render();
    }

    /**
     * Setup debug overlay for testing (Phase 1)
     */
    setupDebugOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'debug-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '10px';
        overlay.style.left = '10px';
        overlay.style.padding = '10px';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.color = '#00ff00';
        overlay.style.fontFamily = 'monospace';
        overlay.style.fontSize = '12px';
        overlay.style.zIndex = '10000';
        overlay.style.pointerEvents = 'auto'; // Allow button clicks
        overlay.style.lineHeight = '1.5';

        // Show/hide based on query string (?debug=true)
        const urlParams = new URLSearchParams(window.location.search);
        const debugMode = urlParams.get('debug') === 'true';
        overlay.style.display = debugMode ? 'block' : 'none';

        document.body.appendChild(overlay);

        // Create separate div for debug info (so innerHTML updates don't affect button)
        const debugInfo = document.createElement('div');
        debugInfo.id = 'debug-info';
        overlay.appendChild(debugInfo);

        // Add toggle button for puzzle zones
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-zones-btn';
        toggleButton.textContent = 'Show Zones';
        toggleButton.style.marginTop = '10px';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.backgroundColor = '#00ff00';
        toggleButton.style.color = '#000000';
        toggleButton.style.border = 'none';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.fontFamily = 'monospace';
        toggleButton.style.fontSize = '12px';

        toggleButton.addEventListener('click', () => {
            if (puzzleSystem) {
                const isVisible = puzzleSystem.toggleZoneVisibility();
                toggleButton.textContent = isVisible ? 'Hide Zones' : 'Show Zones';
            }
        });

        overlay.appendChild(toggleButton);

        // Add skip to finish button
        const skipButton = document.createElement('button');
        skipButton.id = 'skip-to-finish-btn';
        skipButton.textContent = 'Skip to Finish';
        skipButton.style.marginTop = '5px';
        skipButton.style.padding = '5px 10px';
        skipButton.style.backgroundColor = '#ff0000';
        skipButton.style.color = '#ffffff';
        skipButton.style.border = 'none';
        skipButton.style.cursor = 'pointer';
        skipButton.style.fontFamily = 'monospace';
        skipButton.style.fontSize = '12px';

        skipButton.addEventListener('click', () => {
            if (puzzleSystem) {
                puzzleSystem.skipToFinish();
            }
        });

        overlay.appendChild(skipButton);

        // Update every 100ms
        setInterval(() => {
            if (this.initialized) {
                this.updateDebugOverlay();
            }
        }, 100);
    }

    /**
     * Update debug overlay
     */
    updateDebugOverlay() {
        const debugInfo = document.getElementById('debug-info');
        if (!debugInfo || !scrollEngine) return;

        const scrollContext = scrollEngine.getContext();
        const stageData = stageManager.getCurrentStage();
        const stateData = stateManager.getDebugInfo();

        const textCount = textSystem ? textSystem.getActiveCount() : 0;
        const puzzleProgress = puzzleSystem ? puzzleSystem.getProgress() : { discovered: 0, total: 8 };

        debugInfo.innerHTML = `
            <strong>DEBUG MODE - PHASE 5</strong><br>
            Stage: ${stateData.currentStage} (${stageData.name})<br>
            Accumulator: ${scrollContext.accumulator.toFixed(0)}<br>
            Direction: ${scrollContext.direction > 0 ? 'DOWN' : scrollContext.direction < 0 ? 'UP' : 'NONE'}<br>
            Delta: ${scrollContext.delta.toFixed(0)}<br>
            Time at Pos: ${scrollContext.timeAtPosition}ms<br>
            Loop Count: ${stateData.loopCount}<br>
            Visited: [${stateData.visitedStages.join(', ')}]<br>
            Scrolling: ${scrollContext.isScrolling ? 'YES' : 'NO'}<br>
            <strong>Active Texts: ${textCount}</strong><br>
            <strong>Puzzles Found: ${puzzleProgress.discovered}/${puzzleProgress.total}</strong>
        `;
    }

    /**
     * Setup stage visualization (background color changes for Phase 1)
     */
    setupStageVisualization() {
        window.addEventListener('stageChange', (e) => {
            const { stage } = e.detail;

            // Change background to visualize stage changes
            // In future phases, this will be replaced by actual visual effects
            const colors = [
                '#000000', // 0: Entry
                '#0a0000', // 1: First glitch
                '#000a00', // 2: Deepening
                '#00000a', // 3: Surveillance
                '#0a000a', // 4: Breach
                '#0a0a00', // 5: Temporal
                '#000a0a', // 6: Void approach
                '#0a0a0a', // 7: Void
                '#050505', // 8: Convergence
                '#020202'  // 9: Revelation
            ];

            gsap.to(document.body, {
                backgroundColor: colors[stage.id] || '#000000',
                duration: 1
            });
        });
    }

    /**
     * Show stage name message
     */
    showStageMessage(stageName) {
        const messageContainer = document.getElementById('message-container');

        const message = document.createElement('div');
        message.className = 'discovery-message';
        message.textContent = stageName;
        message.style.position = 'relative';

        messageContainer.appendChild(message);

        // Remove after animation
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new Application();
    });
} else {
    window.app = new Application();
}
