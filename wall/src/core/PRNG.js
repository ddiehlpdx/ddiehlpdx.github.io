/**
 * PRNG — Deterministic random generation for the Witness Wall
 * Mulberry32 PRNG seeded by entry index.
 * Provides: name generation, date generation via EntryGenerator.
 */

class PRNG {
    /**
     * Mulberry32 — returns a function that produces deterministic
     * floats in [0, 1) for a given 32-bit seed.
     */
    static mulberry32(seed) {
        return function () {
            seed |= 0;
            seed = seed + 0x6D2B79F5 | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Create an EntryGenerator for the entry at the given index.
     */
    static forEntry(index) {
        return new EntryGenerator(index);
    }
}


/**
 * EntryGenerator — produces all procedural data for a single wall entry.
 * Each aspect (name, dates, cause, detail) uses its own seeded RNG stream.
 */
class EntryGenerator {
    constructor(index) {
        this.index = index;
        this.nameRng = PRNG.mulberry32(index * 2654435761);
        this.dateRng = PRNG.mulberry32(index * 2246822519 + 13);
        this.causeRng = PRNG.mulberry32(index * 3266489917 + 7);
        this.detailRng = PRNG.mulberry32(index * 2147483647 + 31);
    }

    pick(rng, array) {
        return array[Math.floor(rng() * array.length)];
    }

    generateName() {
        const rng = this.nameRng;

        // First name from curated pool of real names (diverse origins)
        let first = this.pick(rng, EntryGenerator.FIRST_NAMES);

        // ~15% chance of middle initial
        let middle = '';
        if (rng() < 0.15) {
            middle = ' ' + String.fromCharCode(65 + Math.floor(rng() * 26)) + '.';
        }

        // Last name from prefix + suffix pools
        let last = this.pick(rng, EntryGenerator.LAST_PREFIX)
                 + this.pick(rng, EntryGenerator.LAST_SUFFIX);
        last = last.charAt(0).toUpperCase() + last.slice(1);

        return first + middle + ' ' + last;
    }

    generateDates() {
        const rng = this.dateRng;

        const birthYear = 1920 + Math.floor(rng() * 90);
        const birthMonth = 1 + Math.floor(rng() * 12);
        const birthDay = 1 + Math.floor(rng() * 28);

        const ageAtDeath = 18 + Math.floor(rng() * 72);
        let deathYear = birthYear + ageAtDeath;
        if (deathYear > 2026) deathYear = 2024 + Math.floor(rng() * 3);
        const deathMonth = 1 + Math.floor(rng() * 12);
        const deathDay = 1 + Math.floor(rng() * 28);

        return {
            birth: this.formatDate(birthYear, birthMonth, birthDay),
            death: this.formatDate(deathYear, deathMonth, deathDay)
        };
    }

    formatDate(y, m, d) {
        return y + '.' + String(m).padStart(2, '0') + '.' + String(d).padStart(2, '0');
    }
}

// Real first names — diverse origins (Arabic, Chinese, English, French, German,
// Hindi, Japanese, Korean, Latin, Slavic, Spanish, Swahili, Scandinavian, etc.)
EntryGenerator.FIRST_NAMES = [
    'Aisha', 'Akira', 'Alejandro', 'Amara', 'Amina', 'Anders', 'Andrei', 'Anna',
    'Arun', 'Aya', 'Beatriz', 'Boris', 'Camille', 'Carlos', 'Chen', 'Clara',
    'Daisuke', 'Daniel', 'Darya', 'David', 'Dimitri', 'Elif', 'Elena', 'Elias',
    'Emiko', 'Emmanuel', 'Esther', 'Fatima', 'Felix', 'Gabriela', 'Grace', 'Hana',
    'Hans', 'Haruki', 'Hassan', 'Helena', 'Henrik', 'Ibrahim', 'Ingrid', 'Isadora',
    'Ivan', 'Javier', 'Jing', 'Jonas', 'Jorge', 'Julia', 'Jun', 'Kaia',
    'Kaleb', 'Kamila', 'Karim', 'Katarina', 'Kenji', 'Khalid', 'Kofi', 'Lara',
    'Lars', 'Leila', 'Leo', 'Liam', 'Lin', 'Lucia', 'Luis', 'Luna',
    'Magnus', 'Malik', 'Mara', 'Marco', 'Maria', 'Mariam', 'Marina', 'Mateo',
    'Maya', 'Mei', 'Miguel', 'Mila', 'Min', 'Miriam', 'Mohamed', 'Nadia',
    'Naomi', 'Nasser', 'Nia', 'Nikolai', 'Nina', 'Noah', 'Noor', 'Olga',
    'Oliver', 'Omar', 'Oscar', 'Pavel', 'Priya', 'Rafael', 'Rahul', 'Rana',
    'Rosa', 'Rui', 'Sana', 'Santiago', 'Sara', 'Sebastian', 'Selma', 'Sergei',
    'Shin', 'Sofia', 'Soren', 'Suki', 'Talia', 'Tamir', 'Tatiana', 'Thomas',
    'Tomoko', 'Viktor', 'Viola', 'Wei', 'Yara', 'Yuki', 'Yusuf', 'Zara',
    'Abel', 'Ada', 'Adrian', 'Agnes', 'Ahmad', 'Aiko', 'Alina', 'Amos',
    'Ananya', 'Andre', 'Arjun', 'Astrid', 'Ayumi', 'Bao', 'Bianca', 'Celeste',
    'Chandra', 'Chiara', 'Cyrus', 'Dalia', 'Diego', 'Ekaterina', 'Emil', 'Eva',
    'Ezra', 'Farah', 'Flora', 'Fumiko', 'Greta', 'Hamza', 'Hector', 'Hugo',
    'Idris', 'Ilya', 'Ines', 'Iris', 'Ismail', 'Ito', 'Jasper', 'Khadija',
    'Koji', 'Kwame', 'Layla', 'Lena', 'Luca', 'Luz', 'Maia', 'Marcel',
    'Marta', 'Mikael', 'Mina', 'Nadia', 'Nate', 'Noemi', 'Petra', 'Rania',
    'Ravi', 'Reem', 'Ren', 'Rita', 'Ruben', 'Samir', 'Silvia', 'Simon',
    'Sumi', 'Takeshi', 'Thiago', 'Uma', 'Valentina', 'Vera', 'Wen', 'Xin',
    'Yasmin', 'Yolanda', 'Zhi', 'Adele', 'Anton', 'Celia', 'Dante', 'Elise'
];

// Last name construction: prefix + suffix
// Prefixes drawn from real surname patterns across many cultures
EntryGenerator.LAST_PREFIX = [
    'Ander', 'Baha', 'Casta', 'Chen', 'Da', 'Dim', 'El', 'Engel',
    'Fernan', 'Fuku', 'Gonza', 'Gupta', 'Hashi', 'Hernan', 'Holm',
    'Ibrahi', 'Johan', 'Kawa', 'Kova', 'Kumar', 'Lind', 'Morten',
    'Naka', 'Ngu', 'Ogun', 'Patel', 'Peter', 'Rodri', 'Sato',
    'Soren', 'Suzuki', 'Tana', 'Varga', 'Wata', 'Yama', 'Zava'
];

// Suffixes drawn from real surname endings across many cultures
EntryGenerator.LAST_SUFFIX = [
    'son', 'ez', 'ov', 'ski', 'moto', 'dez', 'berg', 'ovic', 'enko',
    'ara', 'quez', 'ssen', 'nez', 'ida', 'awa', 'oshi', 'kov', 'ini',
    'ura', 'elli', 'stra', 'mund', 'wicz', 'shima', 'guchi'
];
