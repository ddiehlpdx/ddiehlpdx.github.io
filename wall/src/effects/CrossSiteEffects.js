/**
 * CrossSiteEffects — Modifies entries based on other sites' localStorage
 * A Thesis: blue ink highlights. Diamond Eater: unicode corruption. Compliance: badge.
 */

class CrossSiteEffects {
    constructor(wallState) {
        this.state = wallState;
        this.thesisData = null;
        this.diamondEaterData = null;
        this.complianceData = null;

        this.loadCrossSiteData();
    }

    loadCrossSiteData() {
        try {
            if (this.state.hasThesisState) {
                this.thesisData = JSON.parse(localStorage.getItem('aThesisDocumentState'));
            }
            if (this.state.hasDiamondEaterState) {
                this.diamondEaterData = JSON.parse(localStorage.getItem('diamondEaterState'));
            }
            if (this.state.hasComplianceState) {
                this.complianceData = JSON.parse(localStorage.getItem('complianceModuleState'));
            }
        } catch (e) {}
    }

    /**
     * Apply cross-site visual effects to a rendered entry element.
     * Called by VirtualScroll.populateEntry() for each visible entry.
     */
    applyToEntry(el, index, entryGen) {
        // Use a fresh RNG seeded specifically for cross-site decisions
        // so it doesn't interfere with the main entry generation
        var crossRng = PRNG.mulberry32(index * 1597334677 + 43);

        // A Thesis: ~5% of entries highlighted with blue ink
        if (this.thesisData && crossRng() < 0.05) {
            el.classList.add('entry-thesis-linked');
            var ann = document.createElement('div');
            ann.className = 'entry-thesis-annotation';
            var annotations = CrossSiteEffects.THESIS_ANNOTATIONS;
            ann.textContent = annotations[Math.floor(crossRng() * annotations.length)];
            el.appendChild(ann);
        }

        // Diamond Eater: ~3% of entries have unicode glitching
        if (this.diamondEaterData && crossRng() < 0.03) {
            el.classList.add('entry-corrupted');
            var nameEl = el.querySelector('.entry-name');
            if (nameEl) {
                nameEl.textContent = this.corruptText(nameEl.textContent, crossRng);
            }
            var causeEl = el.querySelector('.entry-cause');
            if (causeEl) {
                causeEl.textContent = 'c0nsum3d.';
            }
        }
    }

    corruptText(text, rng) {
        var glitchChars = ['\u0336', '\u0337', '\u0338', '\u0334', '\u0335'];
        return text.split('').map(function (c) {
            if (c !== ' ' && rng() < 0.3) {
                return c + glitchChars[Math.floor(rng() * glitchChars.length)];
            }
            return c;
        }).join('');
    }

    /**
     * Render compliance badge if Compliance Module state exists.
     */
    renderComplianceBadge() {
        if (!this.complianceData) return;
        var badge = document.createElement('div');
        badge.className = 'compliance-badge';
        badge.textContent = 'ID: ' + (this.complianceData.employeeId || '\u2588\u2588-\u2588\u2588\u2588\u2588\u2588\u2588');
        document.body.appendChild(badge);
    }
}

CrossSiteEffects.THESIS_ANNOTATIONS = [
    'this one was connected to section iv',
    'see case file \u2014 THESIS-REVIEW',
    'referenced in the document',
    'flagged during review',
    'name appears in appendix \u2588\u2588'
];
