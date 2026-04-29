/**
 * DepthEngine — Determines entry content based on scroll depth tier
 * Controls the emotional arc: clinical → cruel → fragmentary → redacted
 */

class DepthEngine {
    constructor() {
        this.TIERS = {
            TOP:   { min: 0,    max: 60     },
            MID:   { min: 60,   max: 625    },
            DEEP:  { min: 625,  max: 6250   },
            ABYSS: { min: 6250, max: Infinity }
        };
    }

    getTier(index) {
        if (index >= this.TIERS.ABYSS.min) return 'ABYSS';
        if (index >= this.TIERS.DEEP.min)  return 'DEEP';
        if (index >= this.TIERS.MID.min)   return 'MID';
        return 'TOP';
    }

    getTierClass(index) {
        const tier = this.getTier(index);
        if (tier === 'MID')   return 'depth-mid';
        if (tier === 'DEEP')  return 'depth-deep';
        if (tier === 'ABYSS') return 'depth-abyss';
        return '';
    }

    /**
     * Generate a full entry from an EntryGenerator at a given index.
     * Returns { name, birth, death, cause, detail }
     */
    generateEntry(entryGen, index) {
        // Check for "you" entry
        if (this.isYouEntry(index)) {
            return {
                name: 'you.',
                birth: '',
                death: '',
                cause: '\u2014 pending.',
                detail: null,
                isYou: true
            };
        }

        let name = entryGen.generateName();
        let dates = entryGen.generateDates();
        const cause = this.generateCause(entryGen, index);
        const detail = this.generateDetail(entryGen, index);

        // Apply depth-based corruption
        name = this.corruptName(name, index, entryGen.nameRng);
        dates = this.corruptDates(dates, index, entryGen.dateRng);

        return {
            name: name,
            birth: dates.birth,
            death: dates.death,
            cause: cause,
            detail: detail,
            isYou: false
        };
    }

    generateCause(entryGen, index) {
        const tier = this.getTier(index);
        const rng = entryGen.causeRng;

        if (tier === 'ABYSS') {
            const len = 3 + Math.floor(rng() * 12);
            return '\u2588'.repeat(len);
        }
        if (tier === 'DEEP')  return entryGen.pick(rng, DepthEngine.DEEP_CAUSES);
        if (tier === 'MID')   return this.fillTemplate(entryGen.pick(rng, DepthEngine.MID_CAUSES), rng);
        return entryGen.pick(rng, DepthEngine.TOP_CAUSES);
    }

    /**
     * Replace {min-max} placeholders with a random integer in range.
     */
    fillTemplate(template, rng) {
        return template.replace(/\{(\d+)-(\d+)\}/g, function (match, lo, hi) {
            var min = parseInt(lo, 10);
            var max = parseInt(hi, 10);
            return min + Math.floor(rng() * (max - min + 1));
        });
    }

    generateDetail(entryGen, index) {
        const rng = entryGen.detailRng;
        const tier = this.getTier(index);

        if (tier === 'ABYSS') return null;
        if (tier === 'DEEP') return rng() < 0.03 ? '...' : null;
        if (rng() > 0.10) return null; // 90% have no detail

        return entryGen.pick(rng, DepthEngine.DETAIL_LINES);
    }

    corruptName(name, index, rng) {
        const tier = this.getTier(index);

        if (tier === 'ABYSS') {
            return '\u2588'.repeat(name.length);
        }

        if (tier === 'DEEP') {
            const corruption = 0.2 + rng() * 0.4;
            return name.split('').map(function (c) {
                if (c === ' ') return ' ';
                return rng() < corruption ? '\u2588' : c;
            }).join('');
        }

        return name;
    }

    corruptDates(dates, index, rng) {
        const tier = this.getTier(index);

        if (tier === 'ABYSS') {
            return { birth: '\u2588\u2588\u2588\u2588', death: '\u2588\u2588\u2588\u2588' };
        }

        if (tier === 'DEEP' && rng() < 0.3) {
            // Impossible: death before birth
            return { birth: dates.death, death: dates.birth };
        }

        return dates;
    }

    isYouEntry(index) {
        return index === DepthEngine.YOU_ENTRY_INDEX;
    }
}

// The "you" entry — matches the EI-7734 form number pattern
DepthEngine.YOU_ENTRY_INDEX = 19335;

// ── Cause Pools ──

// TOP (0-60): Standard bureaucratic. Clinical.
DepthEngine.TOP_CAUSES = [
    'processing delay',
    'reclassification',
    'administrative oversight',
    'form 27-B not filed',
    'position eliminated',
    'record not found',
    'benefits lapsed',
    'case closed \u2014 no action taken',
    'referral expired',
    'pending review (indefinite)',
    'clerical error \u2014 not corrected',
    'coverage gap',
    'transfer denied',
    'resubmission required',
    'insufficient documentation',
    'appeal window closed',
    'automated denial',
    'system migration \u2014 data lost',
    'eligibility revoked',
    'departmental restructuring'
];

// MID (60-625): Specific and cruel.
DepthEngine.MID_CAUSES = [
    'medication approval delayed {4-19} months',
    'evacuation order sent to previous address',
    'translator not provided',
    'caseworker reassigned \u2014 file not transferred',
    'shelter application marked duplicate',
    'identity could not be verified',
    'dependent status disputed',
    'appointment rescheduled {6-23} times',
    'wrong form submitted \u2014 restarted',
    'power of attorney not recognized',
    'wait time exceeded life expectancy',
    'classified as non-urgent',
    'funding allocation redirected',
    'hearing conducted in absentia',
    'signature did not match',
    'benefits terminated during treatment',
    'hearing rescheduled {8-31} times',
    'filed under wrong jurisdiction',
    'automated response loop \u2014 unresolved',
    'denied on a technicality',
    'call placed on hold for {2-7} hours',
    'application lost {2-4} times',
    'referred to {3-9} different departments',
    'waited {14-47} weeks for response'
];

// DEEP (625-6250): Fragmentary. Single words.
DepthEngine.DEEP_CAUSES = [
    'processing',
    'denied',
    'pending',
    'error',
    'see file',
    'n/a',
    'redacted',
    '\u2014',
    '.',
    'unknown',
    'void',
    '[blank]',
    'ref: \u2588\u2588\u2588\u2588',
    '0',
    'neglect',
    'silence',
    'arithmetic'
];

// Detail lines (~10% of TOP/MID entries)
DepthEngine.DETAIL_LINES = [
    'she filed three appeals.',
    'the response was automated.',
    'he called every day for a year.',
    'the office had been closed.',
    'no interpreter was available.',
    'the form was revised after submission.',
    'they were told to wait.',
    'the letter was returned unopened.',
    'a hearing was never scheduled.',
    'the file was marked complete.',
    'someone wrote "see above" in the margin.',
    'the system flagged it as resolved.',
    'no one remembers.',
    'the appeal was filed one day late.',
    'the number was disconnected.',
    'she was told to come back monday.',
    'the case was reassigned six times.',
    'he died in the waiting room.',
    'the correction was noted but not applied.',
    'the fax did not go through.'
];
