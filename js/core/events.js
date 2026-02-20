(() => {
    const EcoFlow = (window.EcoFlow = window.EcoFlow || {});

    function createEventBus() {
        const listeners = new Map();

        function on(eventName, handler) {
            if (!listeners.has(eventName)) {
                listeners.set(eventName, new Set());
            }
            listeners.get(eventName).add(handler);
            return () => off(eventName, handler);
        }

        function off(eventName, handler) {
            const bucket = listeners.get(eventName);
            if (!bucket) {
                return;
            }
            bucket.delete(handler);
            if (!bucket.size) {
                listeners.delete(eventName);
            }
        }

        function emit(eventName, payload) {
            const bucket = listeners.get(eventName);
            if (!bucket) {
                return;
            }
            bucket.forEach((handler) => {
                try {
                    handler(payload);
                } catch (error) {
                    console.error('[EventBus] handler error', eventName, error);
                }
            });
        }

        return { on, off, emit };
    }

    function bindActionDelegates(rootElement, handlers) {
        const root = rootElement || document;
        const events = ['click', 'change', 'input'];

        function listener(event) {
            const target = event.target.closest('[data-action]');
            if (!target || !root.contains(target)) {
                return;
            }

            const expectedEvent = target.dataset.event || 'click';
            if (expectedEvent !== event.type) {
                return;
            }

            const handler = handlers[target.dataset.action];
            if (!handler) {
                return;
            }

            handler({
                event,
                element: target,
                action: target.dataset.action
            });
        }

        events.forEach((eventName) => root.addEventListener(eventName, listener));

        return () => {
            events.forEach((eventName) => root.removeEventListener(eventName, listener));
        };
    }

    EcoFlow.createEventBus = createEventBus;
    EcoFlow.bindActionDelegates = bindActionDelegates;
})();
