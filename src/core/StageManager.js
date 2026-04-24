/**
 * StageManager - Defines stages and coordinates transitions
 * Each stage has unique characteristics and transition rules
 */

class Stage {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.transitions = config.transitions || [];
        this.backgroundColor = config.backgroundColor || '#000000';
        this.characteristics = config.characteristics || {};
    }

    /**
     * Evaluate which stage to transition to based on context
     */
    evaluateTransition(context) {
        for (let transition of this.transitions) {
            if (transition.condition(context)) {
                return transition.targetStage;
            }
        }
        return this.id; // Stay in current stage
    }
}

class StageManager {
    constructor() {
        this.stages = [];
        this.initStages();
    }

    /**
     * Initialize all stages with their transition rules
     */
    initStages() {
        // Stage 0: Entry - Semi-normal behavior
        this.stages.push(new Stage({
            id: 0,
            name: 'entry',
            backgroundColor: '#000000',
            characteristics: {
                textSpawnRate: 3000, // ms between spawns
                visualIntensity: 0.1,
                audioVolume: 0.3,
                hintText: 'navigation is not what it seems'
            },
            transitions: [
                {
                    condition: (ctx) => ctx.direction > 0 && ctx.accumulator > 500,
                    targetStage: 1
                }
            ]
        }));

        // Stage 1: First Glitch - Introduction to disorientation
        this.stages.push(new Stage({
            id: 1,
            name: 'first-glitch',
            backgroundColor: '#000000',
            characteristics: {
                textSpawnRate: 2500,
                visualIntensity: 0.2,
                audioVolume: 0.4,
                glitchProbability: 0.3
            },
            transitions: [
                {
                    // Scroll reversal - down goes back
                    condition: (ctx) => ctx.direction > 0 && ctx.accumulator > 400,
                    targetStage: 0
                },
                {
                    // Slow upward scroll reveals next stage
                    condition: (ctx) => ctx.direction < 0 && Math.abs(ctx.accumulator) > 600,
                    targetStage: 2
                }
            ]
        }));

        // Stage 2: Deepening - Confusion intensifies
        this.stages.push(new Stage({
            id: 2,
            name: 'deepening',
            backgroundColor: '#000000',
            characteristics: {
                textSpawnRate: 2000,
                visualIntensity: 0.3,
                audioVolume: 0.5,
                glitchProbability: 0.4
            },
            transitions: [
                {
                    // Rapid scrolling sends back
                    condition: (ctx) => Math.abs(ctx.delta) > 100 && ctx.accumulator > 200,
                    targetStage: 1
                },
                {
                    // Gentle consistent scroll forward
                    condition: (ctx) => ctx.direction > 0 && ctx.accumulator > 700 && Math.abs(ctx.delta) < 50,
                    targetStage: 3
                }
            ]
        }));

        // Stage 3: Surveillance - Feeling watched
        this.stages.push(new Stage({
            id: 3,
            name: 'surveillance',
            backgroundColor: '#000000',
            characteristics: {
                textSpawnRate: 1800,
                visualIntensity: 0.4,
                audioVolume: 0.6,
                surveillanceActive: true,
                glitchProbability: 0.5
            },
            transitions: [
                {
                    // Stillness reveals path - must wait without scrolling (longer)
                    condition: (ctx) => !ctx.isScrolling && ctx.timeAtPosition > 5000,
                    targetStage: 4
                },
                {
                    // Frantic movement loops back
                    condition: (ctx) => ctx.isScrolling && Math.abs(ctx.delta) > 80,
                    targetStage: 2
                }
            ]
        }));

        // Stage 4: Breach - Something broke through
        this.stages.push(new Stage({
            id: 4,
            name: 'breach',
            backgroundColor: '#000000',
            characteristics: {
                textSpawnRate: 1500,
                visualIntensity: 0.5,
                audioVolume: 0.7,
                glitchProbability: 0.6
            },
            transitions: [
                {
                    condition: (ctx) => ctx.direction < 0 && Math.abs(ctx.accumulator) > 500,
                    targetStage: 5
                },
                {
                    // Loop back on rapid down scroll
                    condition: (ctx) => ctx.direction > 0 && ctx.accumulator > 300,
                    targetStage: 3
                }
            ]
        }));

        // Stage 5: Temporal Distortion - Time feels wrong
        this.stages.push(new Stage({
            id: 5,
            name: 'temporal',
            backgroundColor: '#000000',
            characteristics: {
                textSpawnRate: 1200,
                visualIntensity: 0.6,
                audioVolume: 0.75,
                temporalActive: true,
                glitchProbability: 0.7
            },
            transitions: [
                {
                    // Slow consistent motion
                    condition: (ctx) => ctx.direction > 0 && ctx.accumulator > 800 && Math.abs(ctx.delta) < 40,
                    targetStage: 6
                },
                {
                    // Fast motion creates loop
                    condition: (ctx) => Math.abs(ctx.delta) > 90,
                    targetStage: 4
                }
            ]
        }));

        // Stage 6: Deepening Void - Emptiness grows
        this.stages.push(new Stage({
            id: 6,
            name: 'void-approach',
            backgroundColor: '#000000',
            characteristics: {
                textSpawnRate: 1000,
                visualIntensity: 0.7,
                audioVolume: 0.8,
                voidActive: true,
                glitchProbability: 0.8
            },
            transitions: [
                {
                    // Stillness for a long time
                    condition: (ctx) => !ctx.isScrolling && ctx.timeAtPosition > 5000,
                    targetStage: 7
                },
                {
                    condition: (ctx) => ctx.isScrolling && ctx.direction < 0 && Math.abs(ctx.accumulator) > 600,
                    targetStage: 7
                }
            ]
        }));

        // Stage 7: The Void - Peak intensity
        this.stages.push(new Stage({
            id: 7,
            name: 'void',
            backgroundColor: '#000000',
            characteristics: {
                textSpawnRate: 800,
                visualIntensity: 0.85,
                audioVolume: 0.9,
                voidActive: true,
                glitchProbability: 0.9
            },
            transitions: [
                {
                    // Stillness in the void - wait without moving for a LONG time
                    condition: (ctx) => !ctx.isScrolling && ctx.timeAtPosition > 10000,
                    targetStage: 8
                }
            ]
        }));

        // Stage 8: Convergence - Beginning of the end
        this.stages.push(new Stage({
            id: 8,
            name: 'convergence',
            backgroundColor: '#000000',
            characteristics: {
                textSpawnRate: 2500, // Slows down
                visualIntensity: 0.8,
                audioVolume: 0.85,
                glitchProbability: 0.95
            },
            transitions: [
                {
                    // Downward leads to final
                    condition: (ctx) => ctx.direction > 0 && ctx.accumulator > 600,
                    targetStage: 9
                },
                {
                    // Upward loops back to void
                    condition: (ctx) => ctx.direction < 0 && Math.abs(ctx.accumulator) > 500,
                    targetStage: 7
                }
            ]
        }));

        // Stage 9: Revelation - QR code accessible here
        this.stages.push(new Stage({
            id: 9,
            name: 'revelation',
            backgroundColor: '#000000',
            characteristics: {
                textSpawnRate: 3500, // Very slow
                visualIntensity: 0.6, // Pulls back
                audioVolume: 0.7,
                qrAccessible: true,
                glitchProbability: 1.0
            },
            transitions: [
                // No transitions - this is the end state
                // User can scroll but stays here
            ]
        }));
    }

    /**
     * Get stage by index
     */
    getStage(index) {
        return this.stages[index] || this.stages[0];
    }

    /**
     * Get current stage from state
     */
    getCurrentStage() {
        return this.getStage(stateManager.currentStage);
    }

    /**
     * Evaluate transition from current stage
     */
    evaluateTransition(context) {
        const currentStage = this.getCurrentStage();
        const nextStageIndex = currentStage.evaluateTransition(context);

        if (nextStageIndex !== currentStage.id) {
            const transitionInfo = stateManager.setStage(nextStageIndex);

            // Dispatch event for other systems to react
            window.dispatchEvent(new CustomEvent('stageChange', {
                detail: {
                    ...transitionInfo,
                    stage: this.getStage(nextStageIndex),
                    loopCount: stateManager.loopCount
                }
            }));

            return true; // Transition occurred
        }

        return false; // No transition
    }

    /**
     * Get total number of stages
     */
    getTotalStages() {
        return this.stages.length;
    }

    /**
     * Get stage characteristics for current stage
     */
    getCurrentCharacteristics() {
        return this.getCurrentStage().characteristics;
    }
}

// Create global instance
const stageManager = new StageManager();
