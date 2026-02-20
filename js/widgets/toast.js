(() => {
    const EcoFlowWidgets = (window.EcoFlowWidgets = window.EcoFlowWidgets || {});

    const MAX_TOASTS = 5;

    function createToast() {
        const stack = document.createElement('div');
        stack.className = 'toast-stack';
        stack.setAttribute('role', 'status');
        stack.setAttribute('aria-live', 'polite');
        stack.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(stack);

        function show(message, type = 'info', timeout = 3800) {
            // Enforce max toast limit
            while (stack.children.length >= MAX_TOASTS) {
                stack.removeChild(stack.firstChild);
            }

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.setAttribute('role', type === 'urgent' ? 'alert' : 'status');
            toast.setAttribute('aria-live', type === 'urgent' ? 'assertive' : 'polite');

            const textNode = document.createElement('span');
            textNode.textContent = message;
            toast.appendChild(textNode);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'toast-close';
            closeBtn.setAttribute('aria-label', 'Dismiss notification');
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => dismiss(toast));
            toast.appendChild(closeBtn);

            stack.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('show'));

            const timerId = window.setTimeout(() => dismiss(toast), timeout);
            toast._timerId = timerId;
        }

        function dismiss(toast) {
            if (toast._timerId) {
                window.clearTimeout(toast._timerId);
            }
            toast.classList.remove('show');
            window.setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 230);
        }

        return { show };
    }

    EcoFlowWidgets.createToast = createToast;
})();
