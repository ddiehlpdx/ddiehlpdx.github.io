/**
 * VirtualScroll — DOM recycling for infinite wall entries
 * Only renders entries visible in viewport + buffer.
 */

class VirtualScroll {
    constructor(wallState, depthEngine, crossSiteEffects) {
        this.state = wallState;
        this.depthEngine = depthEngine;
        this.crossSiteEffects = crossSiteEffects;

        // DOM
        this.container = null;
        this.spacer = null;
        this.viewport = null;

        // Entry pool
        this.entryPool = [];
        this.poolSize = 50;
        this.activeEntries = new Map(); // index -> DOM element

        // Layout
        this.entryHeight = 72;
        this.totalEntries = 31250; // ~2.25M px — safe for all browsers

        // Scroll tracking
        this.lastTopIndex = 0;
        this.onNameScrolledPast = null; // callback(index, name)
    }

    init() {
        this.container = document.getElementById('wall-container');
        this.spacer = document.getElementById('wall-spacer');
        this.viewport = document.getElementById('wall-viewport');
        if (!this.container || !this.spacer || !this.viewport) return;

        // Set spacer height
        this.spacer.style.height = (this.totalEntries * this.entryHeight) + 'px';

        // Create entry pool
        for (var i = 0; i < this.poolSize; i++) {
            this.entryPool.push(this.createEntryElement());
        }

        // Initial render
        this.onScroll();

        // Scroll listener
        this.container.addEventListener('scroll', this.onScroll.bind(this), { passive: true });

        // Handle #you hash
        if (window.location.hash === '#you') {
            this.scrollToEntry(this.depthEngine.constructor.YOU_ENTRY_INDEX);
        }
    }

    createEntryElement() {
        var el = document.createElement('div');
        el.className = 'wall-entry';
        el.innerHTML =
            '<div class="entry-name"></div>' +
            '<div class="entry-dates"></div>' +
            '<div class="entry-cause"></div>' +
            '<div class="entry-detail"></div>';
        return el;
    }

    onScroll() {
        var scrollTop = this.container.scrollTop;
        var viewportHeight = this.container.clientHeight;

        var bufferEntries = 12;
        var firstVisible = Math.max(0, Math.floor(scrollTop / this.entryHeight) - bufferEntries);
        var lastVisible = Math.min(
            this.totalEntries - 1,
            Math.ceil((scrollTop + viewportHeight) / this.entryHeight) + bufferEntries
        );

        // Track names scrolled past (scrolling down only)
        var currentTopIndex = Math.floor(scrollTop / this.entryHeight);
        if (currentTopIndex > this.lastTopIndex && this.onNameScrolledPast) {
            var start = this.lastTopIndex;
            var end = currentTopIndex;
            // Cap how many we fire per frame to avoid performance issues during fast scrolling
            if (end - start > 10) start = end - 10;
            for (var i = start; i < end; i++) {
                var gen = PRNG.forEntry(i);
                this.onNameScrolledPast(i, gen.generateName());
            }
        }
        this.lastTopIndex = currentTopIndex;

        // Update depth
        this.state.updateDepth(lastVisible);

        // Recycle entries
        this.updateVisibleEntries(firstVisible, lastVisible);
    }

    updateVisibleEntries(start, end) {
        // Determine needed set
        var needed = new Set();
        for (var i = start; i <= end; i++) {
            needed.add(i);
        }

        // Return entries no longer visible to pool
        var self = this;
        this.activeEntries.forEach(function (el, index) {
            if (!needed.has(index)) {
                self.viewport.removeChild(el);
                self.entryPool.push(el);
                self.activeEntries.delete(index);
            }
        });

        // Add newly visible entries
        for (var i = start; i <= end; i++) {
            if (!this.activeEntries.has(i)) {
                var el = this.entryPool.pop();
                if (!el) el = this.createEntryElement();
                this.populateEntry(el, i);
                el.style.position = 'absolute';
                el.style.top = (i * this.entryHeight) + 'px';
                el.style.width = '100%';
                this.viewport.appendChild(el);
                this.activeEntries.set(i, el);
            }
        }
    }

    populateEntry(el, index) {
        var gen = PRNG.forEntry(index);
        var entry = this.depthEngine.generateEntry(gen, index);

        el.querySelector('.entry-name').textContent = entry.name;

        if (entry.birth && entry.death) {
            el.querySelector('.entry-dates').textContent = entry.birth + ' \u2014 ' + entry.death;
        } else {
            el.querySelector('.entry-dates').textContent = '';
        }

        el.querySelector('.entry-cause').textContent = entry.cause;

        var detailEl = el.querySelector('.entry-detail');
        if (entry.detail) {
            detailEl.textContent = entry.detail;
            detailEl.style.display = '';
        } else {
            detailEl.textContent = '';
            detailEl.style.display = 'none';
        }

        // Remove any previous cross-site annotations
        var oldAnn = el.querySelector('.entry-thesis-annotation');
        if (oldAnn) oldAnn.remove();

        // Clean up any previous "you" click handler
        if (el._youClickHandler) {
            el.removeEventListener('click', el._youClickHandler);
            el._youClickHandler = null;
        }

        // Set classes
        if (entry.isYou) {
            el.className = 'wall-entry entry-you';
            // Secret link to Exit Interview — no visual affordance
            el._youClickHandler = function () {
                window.location.href = '/exit/';
            };
            el.addEventListener('click', el._youClickHandler);
        } else {
            el.className = 'wall-entry ' + this.depthEngine.getTierClass(index);
        }

        // Apply cross-site effects
        if (this.crossSiteEffects) {
            this.crossSiteEffects.applyToEntry(el, index, gen);
        }
    }

    scrollToEntry(index) {
        // Clamp to available range
        if (index >= this.totalEntries) index = this.totalEntries - 1;
        // Center the entry in the viewport
        var viewportHeight = this.container.clientHeight;
        this.container.scrollTop = (index * this.entryHeight) - (viewportHeight / 2) + (this.entryHeight / 2);
    }
}
