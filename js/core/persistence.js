(() => {
    const EcoFlow = (window.EcoFlow = window.EcoFlow || {});

    const STORAGE_KEYS = {
        state: 'ecoflow.app.state.v1',
        settings: 'ecoflow.app.settings.v1'
    };

    function migrateState(savedState, version) {
        if (!savedState || typeof savedState !== 'object') {
            return null;
        }

        if (savedState.version !== version) {
            return null;
        }

        return savedState;
    }

    function loadState() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEYS.state);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('[Persistence] failed to load state', error);
            return null;
        }
    }

    function loadSettings() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEYS.settings);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('[Persistence] failed to load settings', error);
            return null;
        }
    }

    function saveState(state) {
        try {
            const serialized = JSON.stringify(state);
            window.localStorage.setItem(STORAGE_KEYS.state, serialized);
        } catch (error) {
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.warn('[Persistence] storage quota exceeded, clearing old state');
                try {
                    window.localStorage.removeItem(STORAGE_KEYS.state);
                } catch (_) {
                    // ignore
                }
            } else {
                console.warn('[Persistence] failed to save state', error);
            }
        }
    }

    function saveSettings(settings) {
        try {
            window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
        } catch (error) {
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.warn('[Persistence] storage quota exceeded for settings');
            } else {
                console.warn('[Persistence] failed to save settings', error);
            }
        }
    }

    function startAutoSave(store, intervalMs = 5000) {
        const timerId = window.setInterval(() => {
            const state = store.getState();
            saveState(state);
            saveSettings({
                filters: state.ui.filters,
                layers: state.ui.layers,
                thresholds: state.ui.thresholds
            });
        }, intervalMs);

        return () => window.clearInterval(timerId);
    }

    EcoFlow.Persistence = {
        STORAGE_KEYS,
        migrateState,
        loadState,
        loadSettings,
        saveState,
        saveSettings,
        startAutoSave
    };
})();
