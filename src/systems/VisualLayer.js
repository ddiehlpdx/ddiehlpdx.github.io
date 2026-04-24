/**
 * VisualLayer - Simple working Three.js effects
 * Build up subtle effects using basic materials only
 */

class VisualLayer {
    constructor() {
        console.log('Initializing VisualLayer with Three.js...');

        // Check if THREE is loaded
        if (typeof THREE === 'undefined') {
            console.error('THREE.js not loaded!');
            return;
        }

        // Three.js setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
        this.camera.position.z = 10;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);

        // Add to DOM
        const container = document.getElementById('visual-container');
        if (!container) {
            console.error('visual-container not found!');
            return;
        }
        container.appendChild(this.renderer.domElement);

        // State
        this.time = 0;
        this.intensity = 0.05;

        // QR crumble state
        this.crumbleGlyphs = null;
        this.crumbleStartTime = 0;

        // Create effects - build up gradually
        this.createBackgroundGrid();
        this.createParticles();
        this.createScanLines();
        this.createDataStream();

        // Resize handler
        window.addEventListener('resize', () => this.onResize());

        // Stage change
        window.addEventListener('stageChange', (e) => {
            this.onStageChange(e.detail);
        });

        console.log('VisualLayer initialized successfully');
    }

    /**
     * Background geometries - layered wireframe shapes
     */
    createBackgroundGrid() {
        this.backgroundShapes = [];

        // Outer sphere - slow rotation
        const sphere = new THREE.Mesh(
            new THREE.IcosahedronGeometry(8, 1),
            new THREE.MeshBasicMaterial({
                color: 0x1a1a3a,
                wireframe: true,
                transparent: true,
                opacity: 0.06
            })
        );
        sphere.position.z = -3;
        this.backgroundShapes.push({ mesh: sphere, rotSpeed: { x: 0.02, y: 0.03, z: 0.01 } });
        this.scene.add(sphere);

        // Middle torus - medium rotation
        const torus = new THREE.Mesh(
            new THREE.TorusGeometry(5, 1.5, 16, 32),
            new THREE.MeshBasicMaterial({
                color: 0x222255,
                wireframe: true,
                transparent: true,
                opacity: 0.08
            })
        );
        torus.position.z = 0;
        torus.rotation.x = Math.PI / 4;
        this.backgroundShapes.push({ mesh: torus, rotSpeed: { x: 0.01, y: 0.04, z: 0.02 } });
        this.scene.add(torus);

        // Inner polyhedron - faster rotation
        const poly = new THREE.Mesh(
            new THREE.OctahedronGeometry(4),
            new THREE.MeshBasicMaterial({
                color: 0x2a2a66,
                wireframe: true,
                transparent: true,
                opacity: 0.1
            })
        );
        poly.position.z = 2;
        this.backgroundShapes.push({ mesh: poly, rotSpeed: { x: 0.05, y: 0.02, z: 0.04 } });
        this.scene.add(poly);
    }

    /**
     * Particle field - subtle floating points
     */
    createParticles() {
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);

        // Distribute particles in 3D space
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 30;     // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 30; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x6688aa,
            size: 0.4,
            transparent: true,
            opacity: 0.25,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    /**
     * Scan lines - horizontal lines that slowly move
     */
    createScanLines() {
        const lineCount = 5;
        this.scanLines = [];

        for (let i = 0; i < lineCount; i++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array([
                -20, 0, 0,  // start point
                20, 0, 0    // end point
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const material = new THREE.LineBasicMaterial({
                color: 0x7788cc,
                transparent: true,
                opacity: 0.15,
                linewidth: 2
            });

            const line = new THREE.Line(geometry, material);
            line.position.y = (Math.random() - 0.5) * 15;

            this.scanLines.push({
                line: line,
                speed: 0.2 + Math.random() * 0.3
            });

            this.scene.add(line);
        }
    }

    /**
     * Create corrupted data stream - vertical columns of falling glyphs
     */
    createDataStream() {
        this.dataStreamColumns = [];
        const columnCount = 18;

        // Character pool for corruption
        this.glyphPool = [
            'Ђ', 'Љ', 'Њ', 'Ћ', 'Џ', 'Ѐ', 'Ѝ', 'Ў',
            '∀', '∃', '∅', '∈', '∉', '∋', '∏', '∑', '√', '∞',
            '⌀', '⌂', '⌐', '⌠', '⌡', '○', '●', '◦',
            '─', '│', '┌', '┐', '└', '┘', '├', '┤',
            '█', '▓', '▒', '░', '■', '□', '▪', '▫'
        ];

        for (let col = 0; col < columnCount; col++) {
            const column = {
                glyphs: [],
                x: (col / columnCount - 0.5) * 25, // Distribute across width
                z: -4 + Math.random() * 8, // Vary depth (-4 to +4)
                speed: 0.01 + Math.random() * 0.02, // Vary scroll speed
                corruptionChance: 0.02 // Base 2% chance per frame
            };

            // Create glyphs for this column
            const glyphCount = 20 + Math.floor(Math.random() * 10);
            for (let i = 0; i < glyphCount; i++) {
                const glyph = this.createGlyph(column.x, -10 + i * 0.8, column.z);
                column.glyphs.push(glyph);
                this.scene.add(glyph);
            }

            this.dataStreamColumns.push(column);
        }

        console.log(`Created ${columnCount} data stream columns`);
    }

    /**
     * Create a single glyph sprite
     */
    createGlyph(x, y, z) {
        // Create canvas for character rendering
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // Draw random glyph
        const char = this.glyphPool[Math.floor(Math.random() * this.glyphPool.length)];
        ctx.fillStyle = '#6688aa'; // Base color (matches particle color)
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, 16, 16);

        // Create sprite
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending // Gives glowy effect
        });

        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        sprite.scale.set(0.5, 0.5, 1);

        // Store original char and canvas for corruption
        sprite.userData = {
            char: char,
            canvas: canvas,
            ctx: ctx,
            baseColor: '#6688aa'
        };

        return sprite;
    }

    /**
     * Update a glyph's character (for corruption effect)
     */
    updateGlyphChar(glyph, newChar, color = null) {
        const { canvas, ctx } = glyph.userData;

        // Clear canvas
        ctx.clearRect(0, 0, 32, 32);

        // Draw new character
        ctx.fillStyle = color || glyph.userData.baseColor;
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(newChar, 16, 16);

        // Update texture
        glyph.material.map.needsUpdate = true;
        glyph.userData.char = newChar;
    }

    /**
     * Start QR code crumble effect - convert pixels to falling glyphs
     * @param {Array} darkPixels - Array of {x, y} pixel positions from QR code
     * @param {DOMRect} qrBounds - QR wrapper bounding rect for position mapping
     */
    startQRCrumble(darkPixels, qrBounds) {
        console.log(`Starting QR crumble with ${darkPixels.length} glyphs`);

        this.crumbleGlyphs = []; // Initialize crumble array
        this.crumbleStartTime = Date.now();

        // QR code center in screen space
        const qrCenterX = qrBounds.left + qrBounds.width / 2;
        const qrCenterY = qrBounds.top + qrBounds.height / 2;

        // Convert screen center to world space (approximate)
        // Since QR is centered on screen, it's roughly at camera position
        // Use camera's world position as reference
        const worldCenterX = 0; // Camera is centered
        const worldCenterY = 0;
        const worldZ = 0; // Same Z as torus

        darkPixels.forEach(pixel => {
            // Convert pixel offset to world offset
            // QR is 256px, map to world units (scale to match data stream width)
            const offsetX = (pixel.x - 128) / 256 * 10; // ±5 units (wider spread)
            const offsetY = -(pixel.y - 128) / 256 * 6; // Flip Y, ±3 units

            const worldX = worldCenterX + offsetX;
            const worldY = worldCenterY + offsetY;

            // Random scatter velocity - more horizontal spread
            const velocityX = (Math.random() - 0.5) * 6; // ±3 units/sec (wider)
            const velocityY = (Math.random() - 0.5) * 4; // ±2 units/sec
            const velocityZ = (Math.random() - 0.5) * 2; // ±1 unit/sec

            // Create glyph at QR pixel position
            const glyph = this.createGlyph(worldX, worldY, worldZ);

            // Store crumble-specific data
            glyph.userData.crumble = {
                velocityX: velocityX,
                velocityY: velocityY,
                velocityZ: velocityZ,
                phase: 'scatter', // 'scatter' -> 'fall' -> 'integrated'
                spawnTime: Date.now(),
                flashColor: Math.random() < 0.3 ? (Math.random() < 0.5 ? '#ff0000' : '#00ffff') : null
            };

            // Start visible, fade in to full
            glyph.material.opacity = 0.35;

            this.crumbleGlyphs.push(glyph);
            this.scene.add(glyph);
        });

        console.log(`Created ${this.crumbleGlyphs.length} crumble glyphs`);
    }

    /**
     * Handle stage change
     */
    onStageChange(detail) {
        const { stage } = detail;
        // Intensity increases with stage depth, max 0.3
        this.intensity = Math.min(stage.id / 15, 0.3);

        // Gradually increase visibility of background shapes
        if (this.backgroundShapes) {
            this.backgroundShapes.forEach((shape, index) => {
                // Each shape has slightly different base opacity
                const baseOpacity = 0.06 + (index * 0.02);
                shape.mesh.material.opacity = baseOpacity + (this.intensity * 0.12);
            });
        }

        if (this.particles) {
            this.particles.material.opacity = 0.08 + (this.intensity * 0.15);
        }

        if (this.scanLines) {
            this.scanLines.forEach(scanLine => {
                scanLine.line.material.opacity = 0.04 + (this.intensity * 0.08);
            });
        }

        // Update data stream based on stage
        if (this.dataStreamColumns) {
            this.dataStreamColumns.forEach(column => {
                // Increase scroll speed with stage
                column.speed = (0.01 + Math.random() * 0.02) * (1 + this.intensity);

                // Increase corruption chance
                column.corruptionChance = 0.02 + (this.intensity * 0.05);

                // Update glyph opacity
                column.glyphs.forEach(glyph => {
                    glyph.material.opacity = 0.15 + (this.intensity * 0.45); // 0.15 → 0.6
                });
            });
        }

        // Animate camera for each stage
        this.animateCameraForStage(stage.id);

        console.log(`VisualLayer: Stage ${stage.id}, intensity: ${this.intensity.toFixed(2)}`);
    }

    /**
     * Animate camera position and rotation based on stage
     */
    animateCameraForStage(stageId) {
        // Define camera states for each stage - dramatic movements through 3D space
        const cameraStates = [
            { z: 10, x: 0, y: 0, rotX: 0, rotY: 0, rotZ: 0 },              // 0: Entry - centered
            { z: 15, x: 5, y: 3, rotX: 0.3, rotY: 0.8, rotZ: -0.2 },       // 1: First glitch - swing right and up
            { z: 6, x: -4, y: -2, rotX: -0.4, rotY: -0.6, rotZ: 0.3 },     // 2: Deepening - dive left and down
            { z: 16, x: 0, y: 10, rotX: 0.6, rotY: 0, rotZ: 0 },           // 3: Surveillance - high above, looking down at center
            { z: 5, x: 6, y: -4, rotX: -0.5, rotY: 1.0, rotZ: -0.4 },      // 4: Breach - close, far right diagonal
            { z: 8, x: -5, y: 3, rotX: 0.4, rotY: -0.9, rotZ: 0.6 },       // 5: Temporal - left orbit, twisted
            { z: 18, x: -3, y: -3, rotX: -0.3, rotY: -0.4, rotZ: 0.5 },    // 6: Void approach - far back diagonal
            { z: 4, x: 2, y: -6, rotX: -0.9, rotY: 0.5, rotZ: -0.3 },      // 7: Void - very close, deep below
            { z: 14, x: -6, y: 5, rotX: 0.6, rotY: -1.2, rotZ: 0.4 },      // 8: Convergence - sweeping left arc
            { z: 10, x: 0, y: 0, rotX: 0, rotY: 0, rotZ: 0 }               // 9: Revelation - return to center
        ];

        const state = cameraStates[stageId] || cameraStates[0];

        // Animate camera position
        gsap.to(this.camera.position, {
            x: state.x,
            y: state.y,
            z: state.z,
            duration: 2.5,
            ease: 'power2.inOut'
        });

        // Animate camera rotation
        gsap.to(this.camera.rotation, {
            x: state.rotX,
            y: state.rotY,
            z: state.rotZ,
            duration: 2.5,
            ease: 'power2.inOut'
        });
    }

    /**
     * Handle resize
     */
    onResize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.left = -10 * aspect;
        this.camera.right = 10 * aspect;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Recalculate data stream column positions
        if (this.dataStreamColumns) {
            this.dataStreamColumns.forEach((column, index) => {
                const columnCount = this.dataStreamColumns.length;
                column.x = (index / columnCount - 0.5) * 25 * aspect;
                column.glyphs.forEach(glyph => {
                    glyph.position.x = column.x;
                });
            });
        }
    }

    /**
     * Update
     */
    update(deltaTime) {
        this.time += deltaTime * 0.001;

        // Rotate background shapes at different speeds
        if (this.backgroundShapes) {
            this.backgroundShapes.forEach(shape => {
                shape.mesh.rotation.x += shape.rotSpeed.x * deltaTime * 0.001;
                shape.mesh.rotation.y += shape.rotSpeed.y * deltaTime * 0.001;
                shape.mesh.rotation.z += shape.rotSpeed.z * deltaTime * 0.001;
            });
        }

        // Animate particles - slow drift
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;

            for (let i = 0; i < positions.length; i += 3) {
                // Slow vertical drift
                positions[i + 1] += Math.sin(this.time + i) * 0.002;

                // Wrap particles vertically
                if (positions[i + 1] > 15) positions[i + 1] = -15;
                if (positions[i + 1] < -15) positions[i + 1] = 15;
            }

            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        // Animate scan lines - slow vertical movement
        if (this.scanLines) {
            this.scanLines.forEach((scanLine, index) => {
                scanLine.line.position.y += scanLine.speed * deltaTime * 0.001;

                // Wrap around
                if (scanLine.line.position.y > 12) {
                    scanLine.line.position.y = -12;
                }

                // Subtle opacity pulse
                const basePulse = Math.sin(this.time * 0.5 + index) * 0.02;
                scanLine.line.material.opacity = Math.max(0.04 + (this.intensity * 0.08) + basePulse, 0);
            });
        }

        // Animate crumble glyphs (QR code breaking apart)
        if (this.crumbleGlyphs && this.crumbleGlyphs.length > 0) {
            const now = Date.now();

            // Use reverse iteration to safely remove elements
            for (let i = this.crumbleGlyphs.length - 1; i >= 0; i--) {
                const glyph = this.crumbleGlyphs[i];
                const glyphData = glyph.userData.crumble;
                const glyphAge = now - glyphData.spawnTime;

                if (glyphData.phase === 'scatter') {
                    // Scatter phase (0-1000ms)
                    if (glyphAge < 1000) {
                        // Apply scatter velocity
                        glyph.position.x += glyphData.velocityX * deltaTime * 0.001;
                        glyph.position.y += glyphData.velocityY * deltaTime * 0.001;
                        glyph.position.z += glyphData.velocityZ * deltaTime * 0.001;

                        // Fade in from 0.35 to 0.6
                        glyph.material.opacity = Math.min(0.35 + (glyphAge / 1000) * 0.25, 0.6);

                        // Flash color if assigned
                        if (glyphData.flashColor && glyphAge < 500) {
                            this.updateGlyphChar(glyph, glyph.userData.char, glyphData.flashColor);
                        } else if (glyphAge >= 500 && glyphData.flashColor) {
                            // Reset color after flash
                            this.updateGlyphChar(glyph, glyph.userData.char, glyph.userData.baseColor);
                            glyphData.flashColor = null;
                        }
                    } else {
                        // Transition to fall phase
                        glyphData.phase = 'fall';
                        glyphData.fallStartY = glyph.position.y;
                    }
                } else if (glyphData.phase === 'fall') {
                    // Fall phase - keep falling until off screen
                    // Decay scatter velocity
                    glyphData.velocityX *= 0.95;
                    glyphData.velocityZ *= 0.95;

                    // Increase downward velocity (gravity)
                    glyphData.velocityY -= 0.0001 * deltaTime;

                    // Apply velocities
                    glyph.position.x += glyphData.velocityX * deltaTime * 0.001;
                    glyph.position.y += glyphData.velocityY * deltaTime * 0.001;
                    glyph.position.z += glyphData.velocityZ * deltaTime * 0.001;

                    // Random corruption
                    if (Math.random() < 0.02) {
                        const newChar = this.glyphPool[Math.floor(Math.random() * this.glyphPool.length)];
                        this.updateGlyphChar(glyph, newChar);
                    }

                    // Remove when off screen (below visible area)
                    if (glyph.position.y < -15) {
                        this.scene.remove(glyph);
                        this.crumbleGlyphs.splice(i, 1);
                    }
                }
            }

            // Clean up crumble array when empty
            if (this.crumbleGlyphs.length === 0) {
                this.crumbleGlyphs = null;
                console.log('QR crumble complete - all glyphs fell off screen');
            }
        }

        // Animate data stream columns
        if (this.dataStreamColumns) {
            this.dataStreamColumns.forEach(column => {
                column.glyphs.forEach(glyph => {
                    // Scroll down
                    glyph.position.y -= column.speed * deltaTime * 0.001;

                    // Wrap around
                    if (glyph.position.y < -12) {
                        glyph.position.y = 12;
                    }

                    // Random corruption
                    const corruptChance = column.corruptionChance * (1 + this.intensity * 2);
                    if (Math.random() < corruptChance) {
                        const newChar = this.glyphPool[Math.floor(Math.random() * this.glyphPool.length)];

                        // Occasionally flash red/cyan
                        let color = null;
                        if (Math.random() < 0.1) {
                            color = Math.random() < 0.5 ? '#ff0000' : '#00ffff';
                        }

                        this.updateGlyphChar(glyph, newChar, color);

                        // Reset color after brief flash
                        if (color) {
                            setTimeout(() => {
                                this.updateGlyphChar(glyph, glyph.userData.char, glyph.userData.baseColor);
                            }, 50);
                        }
                    }
                });
            });
        }
    }

    /**
     * Render
     */
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Trigger glitch - brief intensity spike
     */
    triggerGlitch(intensity) {
        // Flash background shapes
        if (this.backgroundShapes) {
            this.backgroundShapes.forEach(shape => {
                const original = shape.mesh.material.opacity;
                shape.mesh.material.opacity = Math.min(original + intensity * 0.15, 0.3);

                setTimeout(() => {
                    shape.mesh.material.opacity = original;
                }, 100);
            });
        }

        // Boost particle visibility briefly
        if (this.particles) {
            const original = this.particles.material.opacity;
            this.particles.material.opacity = Math.min(original + intensity * 0.12, 0.25);

            setTimeout(() => {
                this.particles.material.opacity = original;
            }, 100);
        }

        // Brighten scan lines
        if (this.scanLines) {
            this.scanLines.forEach(scanLine => {
                const original = scanLine.line.material.opacity;
                scanLine.line.material.opacity = Math.min(original + intensity * 0.1, 0.2);

                setTimeout(() => {
                    scanLine.line.material.opacity = original;
                }, 100);
            });
        }

        // Flash data stream
        if (this.dataStreamColumns) {
            this.dataStreamColumns.forEach(column => {
                column.glyphs.forEach(glyph => {
                    const original = glyph.material.opacity;
                    glyph.material.opacity = Math.min(original + intensity * 0.2, 0.8);

                    // Burst of corruption
                    if (Math.random() < 0.3) {
                        const newChar = this.glyphPool[Math.floor(Math.random() * this.glyphPool.length)];
                        const color = Math.random() < 0.5 ? '#ff0000' : '#00ffff';
                        this.updateGlyphChar(glyph, newChar, color);
                    }

                    setTimeout(() => {
                        glyph.material.opacity = original;
                        // Restore base color
                        if (glyph.userData.char) {
                            this.updateGlyphChar(glyph, glyph.userData.char, glyph.userData.baseColor);
                        }
                    }, 100);
                });
            });
        }
    }
}

// Global instance
let visualLayer = null;
