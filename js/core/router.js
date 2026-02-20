(() => {
    const EcoFlow = (window.EcoFlow = window.EcoFlow || {});

    function normalizeRoute(rawRoute) {
        if (!rawRoute) {
            return '/dashboard';
        }

        let route = rawRoute.trim();
        if (!route.startsWith('/')) {
            route = `/${route}`;
        }

        return route.toLowerCase();
    }

    function readRouteFromHash() {
        const hash = window.location.hash || '#/dashboard';
        const value = hash.replace(/^#/, '');
        return normalizeRoute(value);
    }

    function createHashRouter() {
        const routes = new Map();
        let onNavigate = null;

        function registerRoute(path, renderFn) {
            routes.set(normalizeRoute(path), renderFn);
        }

        function resolveRoute(route) {
            const normalized = normalizeRoute(route);
            if (routes.has(normalized)) {
                return normalized;
            }
            return '/dashboard';
        }

        function handleHashChange() {
            const route = resolveRoute(readRouteFromHash());
            const renderFn = routes.get(route);
            if (!renderFn) {
                return;
            }

            renderFn(route);

            if (onNavigate) {
                onNavigate(route);
            }
        }

        function navigate(route) {
            const normalized = resolveRoute(route);
            const nextHash = `#${normalized}`;
            if (window.location.hash === nextHash) {
                handleHashChange();
                return;
            }
            window.location.hash = nextHash;
        }

        function startRouter(callback) {
            onNavigate = callback;
            window.addEventListener('hashchange', handleHashChange);

            if (!window.location.hash) {
                window.location.hash = '#/dashboard';
            }

            handleHashChange();
        }

        function stopRouter() {
            window.removeEventListener('hashchange', handleHashChange);
        }

        return {
            registerRoute,
            startRouter,
            stopRouter,
            navigate
        };
    }

    EcoFlow.createHashRouter = createHashRouter;
})();
