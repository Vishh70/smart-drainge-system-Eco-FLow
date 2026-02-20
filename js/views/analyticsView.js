(() => {
    const EcoFlowViews = (window.EcoFlowViews = window.EcoFlowViews || {});

    function getCurrentSnapshot(state) {
        return state.sim.history[state.sim.history.length - 1] || null;
    }

    function sortRows(rows, sortKey, direction) {
        const factor = direction === 'asc' ? 1 : -1;
        return [...rows].sort((a, b) => {
            if (typeof a[sortKey] === 'number') {
                return (a[sortKey] - b[sortKey]) * factor;
            }
            return String(a[sortKey]).localeCompare(String(b[sortKey])) * factor;
        });
    }

    function buildRows(state) {
        const snapshot = getCurrentSnapshot(state);
        if (!snapshot) {
            return [];
        }

        const { zone, severity } = state.ui.filters;
        const { flow, sludge } = state.ui.thresholds;

        return snapshot.sensors
            .filter((sensor) => (zone === 'all' || sensor.area === zone))
            .filter((sensor) => (severity === 'all' || sensor.status === severity))
            .filter((sensor) => sensor.flow >= flow || sensor.sludge >= sludge || (flow === 0 && sludge === 0))
            .map((sensor) => ({
                location: sensor.name,
                area: sensor.area,
                flow: sensor.flow,
                sludge: sensor.sludge,
                risk: sensor.risk,
                status: sensor.status,
                direction: sensor.direction
            }));
    }

    function renderRows(state) {
        const rows = buildRows(state);
        if (!rows.length) {
            return '<tr><td colspan="7" class="empty-state">No rows match current filters and thresholds.</td></tr>';
        }

        const { key, direction } = state.ui.tableSort;
        const sorted = sortRows(rows, key, direction);

        return sorted
            .map((row) => `
                <tr>
                    <td>${row.location}</td>
                    <td>${row.area}</td>
                    <td>${row.flow.toFixed(1)}</td>
                    <td>${row.sludge.toFixed(1)}</td>
                    <td>${row.risk.toFixed(1)}</td>
                    <td><span class="status-chip ${row.status === 'critical' ? 'crit' : row.status === 'warning' ? 'warn' : 'ok'}">${row.status}</span></td>
                    <td>${row.direction}</td>
                </tr>
            `)
            .join('');
    }

    function render(state) {
        const snapshot = getCurrentSnapshot(state);
        const tickText = snapshot ? `T${snapshot.tick}` : 'Waiting';

        return `
            <section class="route-fade">
                <header class="page-head">
                    <h2>Analytics and Threshold Intelligence</h2>
                    <p>Linked charts and sortable operations feed for rapid control-room decisions.</p>
                </header>

                <div class="analytics-grid">
                    <article class="card chart-box">
                        <div class="card-head">
                            <h3>Network Load Timeline</h3>
                            <span class="badge">${tickText}</span>
                        </div>
                        <canvas id="load-chart" aria-label="Network load line chart"></canvas>
                    </article>
                    <article class="card chart-box">
                        <div class="card-head">
                            <h3>Area Risk Distribution</h3>
                            <span class="badge">Click bar to focus map zone</span>
                        </div>
                        <canvas id="area-risk-chart" aria-label="Area risk stacked chart"></canvas>
                    </article>
                </div>

                <div class="grid grid-2" style="margin-top: 18px;">
                    <article class="card chart-box">
                        <div class="card-head">
                            <h3>Maintenance Mix</h3>
                            <button class="btn btn-sm btn-ghost" data-action="download-snapshot">Download Snapshot JSON</button>
                        </div>
                        <canvas id="maintenance-chart" aria-label="Maintenance donut chart"></canvas>
                    </article>
                    <article class="card">
                        <div class="card-head">
                            <h3>Threshold Controls</h3>
                            <span class="badge">Live Applied</span>
                        </div>
                        <div class="threshold-grid">
                            <div class="threshold-box">
                                <label for="flow-threshold">Flow threshold: <strong id="flow-threshold-value">${state.ui.thresholds.flow}</strong> L/s</label>
                                <input id="flow-threshold" type="range" min="0" max="170" value="${state.ui.thresholds.flow}" data-action="set-threshold" data-event="input" data-threshold-key="flow">
                            </div>
                            <div class="threshold-box">
                                <label for="sludge-threshold">Sludge threshold: <strong id="sludge-threshold-value">${state.ui.thresholds.sludge}</strong> L</label>
                                <input id="sludge-threshold" type="range" min="0" max="150" value="${state.ui.thresholds.sludge}" data-action="set-threshold" data-event="input" data-threshold-key="sludge">
                            </div>
                        </div>
                    </article>
                </div>

                <article class="card" style="margin-top: 18px;">
                    <div class="card-head">
                        <h3>Operations Table</h3>
                        <span class="badge" id="ops-row-count">${buildRows(state).length} sensors</span>
                    </div>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th><button class="btn btn-sm btn-ghost" data-action="sort-ops" data-sort-key="location">Location</button></th>
                                    <th><button class="btn btn-sm btn-ghost" data-action="sort-ops" data-sort-key="area">Area</button></th>
                                    <th><button class="btn btn-sm btn-ghost" data-action="sort-ops" data-sort-key="flow">Flow</button></th>
                                    <th><button class="btn btn-sm btn-ghost" data-action="sort-ops" data-sort-key="sludge">Sludge</button></th>
                                    <th><button class="btn btn-sm btn-ghost" data-action="sort-ops" data-sort-key="risk">Risk</button></th>
                                    <th>Status</th>
                                    <th>Direction</th>
                                </tr>
                            </thead>
                            <tbody id="ops-table-body">${renderRows(state)}</tbody>
                        </table>
                    </div>
                </article>
            </section>
        `;
    }

    function mount(state, context) {
        context.chartsWidget.mount({
            loadChartId: 'load-chart',
            areaChartId: 'area-risk-chart',
            maintenanceChartId: 'maintenance-chart'
        });
        context.chartsWidget.update(state);
    }

    function update(state, context) {
        context.chartsWidget.update(state);

        const body = document.getElementById('ops-table-body');
        if (body) {
            body.innerHTML = renderRows(state);
        }

        const rowCount = document.getElementById('ops-row-count');
        if (rowCount) {
            rowCount.textContent = `${buildRows(state).length} sensors`;
        }

        const flowValue = document.getElementById('flow-threshold-value');
        const sludgeValue = document.getElementById('sludge-threshold-value');
        if (flowValue) {
            flowValue.textContent = state.ui.thresholds.flow;
        }
        if (sludgeValue) {
            sludgeValue.textContent = state.ui.thresholds.sludge;
        }
    }

    function unmount(context) {
        context.chartsWidget.destroy();
    }

    EcoFlowViews.analytics = {
        render,
        mount,
        update,
        unmount
    };
})();
