(() => {
    const EcoFlowWidgets = (window.EcoFlowWidgets = window.EcoFlowWidgets || {});

    function buildHistoryData(state) {
        const windowMap = {
            '15m': 30,
            '30m': 60,
            '60m': 120
        };
        const size = windowMap[state.ui.filters.timeWindow] || 60;
        const history = state.sim.history.slice(-size);
        return {
            labels: history.map((item) => `T${item.tick}`),
            load: history.map((item) => item.networkLoad)
        };
    }

    function createChartsWidget(eventBus) {
        let loadChart = null;
        let areaChart = null;
        let maintenanceChart = null;

        function destroy() {
            [loadChart, areaChart, maintenanceChart].forEach((chart) => {
                if (chart) {
                    chart.destroy();
                }
            });
            loadChart = null;
            areaChart = null;
            maintenanceChart = null;
        }

        function mount(canvasIds) {
            destroy();

            const loadCtx = document.getElementById(canvasIds.loadChartId);
            const areaCtx = document.getElementById(canvasIds.areaChartId);
            const maintenanceCtx = document.getElementById(canvasIds.maintenanceChartId);

            if (!loadCtx || !areaCtx || !maintenanceCtx) {
                return;
            }

            loadChart = new Chart(loadCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Network Load %',
                        data: [],
                        borderColor: '#0f6c8f',
                        backgroundColor: 'rgba(15, 108, 143, 0.16)',
                        pointRadius: 2,
                        fill: true,
                        tension: 0.32
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 240 },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });

            areaChart = new Chart(areaCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Normal',
                            data: [],
                            backgroundColor: '#1a8d57'
                        },
                        {
                            label: 'Warning',
                            data: [],
                            backgroundColor: '#d58a00'
                        },
                        {
                            label: 'Critical',
                            data: [],
                            backgroundColor: '#c63a33'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 240 },
                    scales: {
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true }
                    },
                    onClick(_, elements) {
                        if (!elements.length) {
                            return;
                        }
                        const element = elements[0];
                        const zone = areaChart.data.labels[element.index];
                        eventBus.emit('chart:zone-selected', zone);
                    }
                }
            });

            maintenanceChart = new Chart(maintenanceCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Urgent', 'Scheduled', 'Healthy'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: ['#c63a33', '#d58a00', '#1a8d57']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 240 }
                }
            });
        }

        function update(state) {
            if (!loadChart || !areaChart || !maintenanceChart) {
                return;
            }

            const historyData = buildHistoryData(state);
            loadChart.data.labels = historyData.labels;
            loadChart.data.datasets[0].data = historyData.load;
            loadChart.update('none');

            const latest = state.sim.history[state.sim.history.length - 1];
            if (!latest) {
                return;
            }

            const zoneEntries = Object.entries(latest.zoneRisk);
            areaChart.data.labels = zoneEntries.map((entry) => entry[0]);
            areaChart.data.datasets[0].data = zoneEntries.map((entry) => entry[1].normal);
            areaChart.data.datasets[1].data = zoneEntries.map((entry) => entry[1].warning);
            areaChart.data.datasets[2].data = zoneEntries.map((entry) => entry[1].critical);
            areaChart.update('none');

            maintenanceChart.data.datasets[0].data = [
                latest.maintenanceStats.urgent,
                latest.maintenanceStats.scheduled,
                latest.maintenanceStats.healthy
            ];
            maintenanceChart.update('none');
        }

        return {
            mount,
            update,
            destroy
        };
    }

    EcoFlowWidgets.createChartsWidget = createChartsWidget;
})();
