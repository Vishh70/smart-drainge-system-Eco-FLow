(() => {
    const EcoFlow = (window.EcoFlow = window.EcoFlow || {});

    function createStore(initialState, reducer) {
        let state = initialState;
        const listeners = new Set();

        function getState() {
            return state;
        }

        function dispatch(action) {
            if (!action || typeof action.type !== 'string') {
                throw new Error('Invalid action dispatched to store');
            }

            const previous = state;
            state = reducer(state, action);

            listeners.forEach((listener) => {
                try {
                    listener(state, previous, action);
                } catch (error) {
                    console.error('[Store] listener failed', error);
                }
            });

            return action;
        }

        function subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }

        return {
            getState,
            dispatch,
            subscribe
        };
    }

    EcoFlow.createStore = createStore;
})();
