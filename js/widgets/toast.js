(() => {
    const EcoFlowWidgets = (window.EcoFlowWidgets = window.EcoFlowWidgets || {});

    function createToast() {
        const stack = document.createElement('div');
        stack.className = 'toast-stack';
        document.body.appendChild(stack);

        function show(message, type = 'info', timeout = 3800) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;

            stack.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('show'));

            window.setTimeout(() => {
                toast.classList.remove('show');
                window.setTimeout(() => toast.remove(), 230);
            }, timeout);
        }

        return { show };
    }

    EcoFlowWidgets.createToast = createToast;
})();
