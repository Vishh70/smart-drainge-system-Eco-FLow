(() => {
    const EcoFlowWidgets = (window.EcoFlowWidgets = window.EcoFlowWidgets || {});

    function severityColor(status) {
        if (status === 'critical') return '#c63a33';
        if (status === 'warning') return '#d58a00';
        return '#1a8d57';
    }

    function getSnapshot(state) {
        const history = state.sim.history;
        if (!history.length) {
            return null;
        }

        const offset = Math.max(0, Math.min(state.ui.selectedTickOffset, history.length - 1));
        const index = history.length - 1 - offset;
        return history[index];
    }

    function createMapWidget() {
        let map = null;
        let sensorsLayer = null;
        let incidentsLayer = null;
        let flowLayer = null;
        let heatLayer = null;

        function mount(containerId) {
            const container = document.getElementById(containerId);
            if (!container) {
                return;
            }

            if (map && map.getContainer() === container) {
                map.invalidateSize();
                return;
            }

            if (map) {
                map.remove();
            }

            map = L.map(container).setView([18.7318, 73.6654], 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            sensorsLayer = L.layerGroup().addTo(map);
            incidentsLayer = L.layerGroup().addTo(map);
            flowLayer = L.layerGroup().addTo(map);
            heatLayer = L.layerGroup().addTo(map);
        }

        function render(state) {
            if (!map || !sensorsLayer) {
                return;
            }

            sensorsLayer.clearLayers();
            incidentsLayer.clearLayers();
            flowLayer.clearLayers();
            heatLayer.clearLayers();

            const snapshot = getSnapshot(state);
            if (!snapshot) {
                return;
            }

            const zoneFilter = state.ui.filters.zone;
            const severityFilter = state.ui.filters.severity;
            const focusedZone = state.ui.focusZone;
            const layers = state.ui.layers;

            const visibleSensors = snapshot.sensors.filter((sensor) => {
                const zoneMatch = zoneFilter === 'all' || sensor.area === zoneFilter;
                const severityMatch = severityFilter === 'all' || sensor.status === severityFilter;
                const focusMatch = focusedZone === 'all' || focusedZone === sensor.area;
                return zoneMatch && severityMatch && focusMatch;
            });

            const points = [];
            if (layers.sensors) {
                visibleSensors.forEach((sensor) => {
                    const marker = L.circleMarker([sensor.lat, sensor.lng], {
                        radius: sensor.status === 'critical' ? 9 : sensor.status === 'warning' ? 7 : 6,
                        color: '#fff',
                        weight: 1,
                        fillOpacity: 0.9,
                        fillColor: severityColor(sensor.status)
                    });

                    marker.bindPopup(`
                        <div>
                            <strong>${sensor.name}</strong><br>
                            Status: ${sensor.status}<br>
                            Flow: ${sensor.flow} L/s<br>
                            Sludge: ${sensor.sludge} L<br>
                            Clog Probability: ${(sensor.clogProbability * 100).toFixed(0)}%<br>
                            Recommendation: ${state.sim.aiSummary.recommendation}
                        </div>
                    `);

                    sensorsLayer.addLayer(marker);
                    points.push([sensor.lat, sensor.lng]);
                });
            }

            if (layers.flowPaths) {
                const grouped = visibleSensors.reduce((acc, sensor) => {
                    if (!acc[sensor.area]) {
                        acc[sensor.area] = [];
                    }
                    acc[sensor.area].push(sensor);
                    return acc;
                }, {});

                Object.values(grouped).forEach((group) => {
                    if (group.length < 2) {
                        return;
                    }

                    const coords = group.map((sensor) => [sensor.lat, sensor.lng]);
                    L.polyline(coords, {
                        color: '#0f6c8f',
                        weight: 3,
                        opacity: 0.72,
                        dashArray: '10 10'
                    }).addTo(flowLayer);
                });
            }

            if (layers.riskHeat) {
                visibleSensors.forEach((sensor) => {
                    L.circle([sensor.lat, sensor.lng], {
                        radius: Math.max(28, sensor.risk * 2.8),
                        color: 'transparent',
                        fillColor: severityColor(sensor.status),
                        fillOpacity: sensor.status === 'critical' ? 0.22 : 0.12
                    }).addTo(heatLayer);
                });
            }

            if (layers.incidents) {
                const activeIncidents = state.network.incidents.filter((incident) => !incident.resolved).slice(0, 8);
                activeIncidents.forEach((incident) => {
                    const sensor = snapshot.sensors.find((item) => item.id === incident.sensorId);
                    if (!sensor) {
                        return;
                    }
                    L.marker([sensor.lat, sensor.lng])
                        .bindPopup(`<b>${incident.severity}</b><br>${incident.message}`)
                        .addTo(incidentsLayer);
                });
            }

            if (points.length > 1) {
                map.fitBounds(points, { padding: [32, 32], maxZoom: 15 });
            }
        }

        function destroy() {
            if (!map) {
                return;
            }
            map.remove();
            map = null;
            sensorsLayer = null;
            incidentsLayer = null;
            flowLayer = null;
            heatLayer = null;
        }

        return {
            mount,
            render,
            destroy
        };
    }

    EcoFlowWidgets.createMapWidget = createMapWidget;
})();
