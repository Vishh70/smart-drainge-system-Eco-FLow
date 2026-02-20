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

    const brandColors = {
        teal: '#0a7ea4',
        tealLight: 'rgba(10, 126, 164, 0.16)',
        green: '#0fa958',
        greenBg: 'rgba(15, 169, 88, 0.75)',
        orange: '#e69500',
        orangeBg: 'rgba(230, 149, 0, 0.75)',
        red: '#d92f28',
        redBg: 'rgba(217, 47, 40, 0.75)'
    };

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
                console.warn('[ChartsWidget] One or more canvas elements not found');
                return;
            }

            const loadContext = loadCtx.getContext('2d');
            const areaContext = areaCtx.getContext('2d');
            const maintenanceContext = maintenanceCtx.getContext('2d');

            if (!loadContext || !areaContext || !maintenanceContext) {
                console.warn('[ChartsWidget] Failed to get 2D canvas context');
                return;
            }

            loadChart = new Chart(loadContext, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Network Load %',
                        data: [],
                        borderColor: brandColors.teal,
                        backgroundColor: brandColors.tealLight,
                        pointRadius: 2,
                        pointHoverRadius: 5,
                        fill: true,
                        tension: 0.32
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 240 },
                    plugins: {
                        legend: {
                            labels: {
                                font: { family: "'IBM Plex Sans', sans-serif", size: 12 },
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: 'rgba(10, 126, 164, 0.06)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });

            areaChart = new Chart(areaContext, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Normal',
                            data: [],
                            backgroundColor: brandColors.greenBg
                        },
                        {
                            label: 'Warning',
                            data: [],
                            backgroundColor: brandColors.orangeBg
                        },
                        {
                            label: 'Critical',
                            data: [],
                            backgroundColor: brandColors.redBg
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 240 },
                    plugins: {
                        legend: {
                            labels: {
                                font: { family: "'IBM Plex Sans', sans-serif", size: 12 },
                                usePointStyle: true,
                                pointStyle: 'rectRounded'
                            }
                        }
                    },
                    scales: {
                        x: { stacked: true, grid: { display: false } },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            grid: { color: 'rgba(10, 126, 164, 0.06)' }
                        }
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

            maintenanceChart = new Chart(maintenanceContext, {
                type: 'doughnut',
                data: {
                    labels: ['Urgent', 'Scheduled', 'Healthy'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: [brandColors.redBg, brandColors.orangeBg, brandColors.greenBg],
                        borderWidth: 2,
                        borderColor: 'rgba(255, 255, 255, 0.9)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 240 },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { family: "'IBM Plex Sans', sans-serif", size: 12 },
                                usePointStyle: true,
                                pointStyle: 'circle',
                                padding: 16
                            }
                        }
                    }
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
