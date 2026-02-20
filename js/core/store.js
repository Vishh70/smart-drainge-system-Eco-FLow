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
                throw new Error('Invalid action dispatched to store: ' + JSON.stringify(action));
            }

            const previous = state;
            state = reducer(state, action);

            if (state === previous) {
                return action;
            }

            listeners.forEach((listener) => {
                try {
                    listener(state, previous, action);
                } catch (error) {
                    console.error(`[Store] listener failed on action "${action.type}"`, error);
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
