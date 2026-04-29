/**
 * ParticleSystem — White particles that drift upward from scrolled-past names
 * Canvas 2D overlay behind the text layer.
 */

class ParticleSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.maxParticles = 5000;
        this.animFrameId = null;
        this.lastTime = 0;
    }

    init() {
        this.canvas = document.getElementById('particle-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
        this.lastTime = performance.now();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Spawn a particle for a scrolled-past name.
     * @param nameHash — integer derived from the name string
     */
    spawnParticle(nameHash) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift();
        }

        // Derive x position from hash for visual variety
        var x = Math.abs(nameHash % this.canvas.width) * 0.6 + this.canvas.width * 0.2;

        this.particles.push({
            x: x,
            y: this.canvas.height * 0.08, // Start near top
            vx: (Math.random() - 0.5) * 0.3,
            vy: -(0.3 + Math.random() * 0.5),
            life: 1.0,
            decay: 1 / (30 + Math.random() * 30), // 30-60 second lifetime
            size: 1 + Math.random() * 1.5
        });
    }

    animate() {
        var now = performance.now();
        var dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // Cap delta to avoid jumps after tab-switch
        if (dt > 0.1) dt = 0.016;

        this.update(dt);
        this.render();

        this.animFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    update(dt) {
        var constellationY = this.canvas.height * 0.15;

        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];

            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.life -= p.decay * dt;

            // Slight horizontal wander
            p.vx += (Math.random() - 0.5) * 0.005;
            // Clamp horizontal drift
            if (p.vx > 0.4) p.vx = 0.4;
            if (p.vx < -0.4) p.vx = -0.4;

            // Constellation formation: slow down near the top
            if (p.y < constellationY) {
                p.vy *= (1 - 3.0 * dt); // Rapid deceleration
                if (p.vy > -0.02) p.vy = -0.02; // Tiny residual drift
            }

            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        var ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            ctx.globalAlpha = p.life * 0.6;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    getActiveCount() {
        return this.particles.length;
    }

    destroy() {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    }
}
