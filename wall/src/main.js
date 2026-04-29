/**
 * Main application — Witness Wall
 * Entry point, initialization flow, system wiring
 */

(function () {
    'use strict';

    var wallState = null;
    var depthEngine = null;
    var virtualScroll = null;
    var searchSystem = null;
    var particleSystem = null;
    var wallAudio = null;
    var crossSiteEffects = null;

    var isDebug = new URLSearchParams(window.location.search).has('debug');
    var debugUpdateInterval = null;

    function init() {
        var overlay = document.getElementById('init-overlay');
        if (!overlay) return;

        // Slow, solemn fade
        overlay.classList.add('dismissed');
        setTimeout(function () {
            overlay.style.display = 'none';
        }, 1200);

        // Show UI
        var container = document.getElementById('wall-container');
        var searchEl = document.getElementById('search-container');
        var depthEl = document.getElementById('depth-indicator');
        if (container) container.classList.remove('hidden');
        if (searchEl) searchEl.classList.remove('hidden');
        if (depthEl) depthEl.classList.remove('hidden');

        // Initialize state
        wallState = new WallState();

        // Initialize systems
        depthEngine = new DepthEngine();
        crossSiteEffects = new CrossSiteEffects(wallState);
        virtualScroll = new VirtualScroll(wallState, depthEngine, crossSiteEffects);
        searchSystem = new SearchSystem(wallState, virtualScroll);
        particleSystem = new ParticleSystem();
        wallAudio = new WallAudio();

        // Audio must init from user gesture
        wallAudio.init();

        virtualScroll.init();
        searchSystem.init();
        particleSystem.init();

        // Compliance badge
        crossSiteEffects.renderComplianceBadge();

        // Wire: name scrolled past → particle + tone
        virtualScroll.onNameScrolledPast = function (index, name) {
            var hash = WallAudio.hashName(name);
            particleSystem.spawnParticle(hash);
            wallAudio.playTone(hash, index);
            wallState.recordNameScrolled();
        };

        // Depth indicator update
        setInterval(function () {
            var indicator = document.getElementById('depth-indicator');
            if (indicator && wallState) {
                indicator.textContent = 'depth: ' + wallState.depthReached.toLocaleString();
            }
        }, 500);

        // Debug
        if (isDebug) setupDebug();

        // Save on unload
        window.addEventListener('beforeunload', function () {
            if (wallState) wallState.destroy();
            if (particleSystem) particleSystem.destroy();
            if (wallAudio) wallAudio.destroy();
        });

        console.log('[wall] initialized \u2014 visit #' + wallState.visitCount);
    }

    function setupDebug() {
        var debugOverlay = document.getElementById('debug-overlay');
        var debugContent = document.getElementById('debug-content');
        var debugReset = document.getElementById('debug-reset');

        if (!debugOverlay) return;
        debugOverlay.classList.remove('hidden');

        debugUpdateInterval = setInterval(function () {
            if (!wallState || !debugContent) return;

            var info = wallState.getDebugInfo();
            info.activeParticles = particleSystem ? particleSystem.getActiveCount() : 0;
            info.activeEntryDOMs = virtualScroll ? virtualScroll.activeEntries.size : 0;

            debugContent.innerHTML = Object.entries(info)
                .map(function (pair) { return '<div>' + pair[0] + ': ' + pair[1] + '</div>'; })
                .join('');
        }, 1000);

        if (debugReset) {
            debugReset.addEventListener('click', function () {
                if (wallState) {
                    wallState.reset();
                    console.log('[wall] state reset');
                    window.location.reload();
                }
            });
        }
    }

    function setupInitListeners() {
        var overlay = document.getElementById('init-overlay');
        if (!overlay) return;

        var startHandler = function (e) {
            e.preventDefault();
            overlay.removeEventListener('click', startHandler);
            overlay.removeEventListener('touchend', startHandler);
            document.removeEventListener('keydown', keyHandler);
            init();
        };

        var keyHandler = function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                startHandler(e);
            }
        };

        overlay.addEventListener('click', startHandler);
        overlay.addEventListener('touchend', startHandler);
        document.addEventListener('keydown', keyHandler);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupInitListeners);
    } else {
        setupInitListeners();
    }
})();
