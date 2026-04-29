/**
 * SearchSystem — Search bar that never finds anyone
 * Any query returns "NO RECORDS MATCH — SEE APPENDIX"
 */

class SearchSystem {
    constructor(wallState, virtualScroll) {
        this.state = wallState;
        this.virtualScroll = virtualScroll;
        this.input = null;
        this.resultDiv = null;
        this.fadeTimeout = null;
    }

    init() {
        this.input = document.getElementById('search-input');
        this.resultDiv = document.getElementById('search-result');
        if (!this.input || !this.resultDiv) return;

        this.input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && this.input.value.trim()) {
                this.handleSearch(this.input.value.trim());
            }
        }.bind(this));
    }

    handleSearch(query) {
        this.state.addSearchQuery(query);

        // Check if searching "you" — hidden mechanism to reach the "you" entry
        if (query.toLowerCase() === 'you' || query.toLowerCase() === 'me') {
            this.resultDiv.classList.remove('hidden');
            this.resultDiv.textContent = 'SEE ENTRY \u2588\u2588\u2588\u2588\u2588\u2588\u2588';
            this.virtualScroll.scrollToEntry(DepthEngine.YOU_ENTRY_INDEX);
            this.scheduleFade();
            return;
        }

        this.resultDiv.classList.remove('hidden');
        this.resultDiv.textContent = 'NO RECORDS MATCH \u2014 SEE APPENDIX';
        this.resultDiv.style.opacity = '';

        this.scheduleFade();
        this.input.value = '';
    }

    scheduleFade() {
        if (this.fadeTimeout) clearTimeout(this.fadeTimeout);
        this.fadeTimeout = setTimeout(function () {
            this.resultDiv.style.opacity = '0';
            setTimeout(function () {
                this.resultDiv.classList.add('hidden');
                this.resultDiv.style.opacity = '';
            }.bind(this), 600);
        }.bind(this), 5000);
    }
}
