(() => {
    const EcoFlowViews = (window.EcoFlowViews = window.EcoFlowViews || {});

    function badgeForCommand(status) {
        if (status === 'failed') return '<span class="badge crit">Failed</span>';
        if (status === 'in_flight') return '<span class="badge warn">In Flight</span>';
        if (status === 'queued') return '<span class="badge">Queued</span>';
        return '<span class="badge">Idle</span>';
    }

    function renderValves(state) {
        return state.network.valves
            .map((valve) => `
                <div class="valve-row">
                    <div>
                        <strong>${valve.label}</strong><br>
                        <small>${valve.zone}</small>
                    </div>
                    <div>${badgeForCommand(valve.commandStatus)}</div>
                    <button class="btn btn-sm ${valve.state === 'ON' ? 'btn-accent' : 'btn-primary'}" data-action="toggle-valve" data-valve-id="${valve.id}" ${valve.commandStatus === 'in_flight' ? 'disabled' : ''}>
                        ${valve.state}
                    </button>
                </div>
            `)
            .join('');
    }

    function renderMaintenanceRows(state) {
        if (!state.network.maintenanceTasks.length) {
            return '<tr><td colspan="6" class="empty-state">No maintenance tasks generated yet.</td></tr>';
        }

        return state.network.maintenanceTasks
            .slice(0, 10)
            .map((task) => `
                <tr>
                    <td>${task.location}</td>
                    <td>${task.area}</td>
                    <td>${task.risk.toFixed(1)}</td>
                    <td>${task.crew}</td>
                    <td>${task.etaMinutes} min</td>
                    <td>${task.status}</td>
                </tr>
            `)
            .join('');
    }

    function renderLogRows(state) {
        if (!state.ops.activityLog.length) {
            return '<li class="empty-state">No command activity yet.</li>';
        }

        return state.ops.activityLog.slice(0, 18).map((log) => `
            <li>
                <time>${new Date(log.timestamp).toLocaleTimeString()}</time>
                <strong>${log.level.toUpperCase()}</strong> - ${log.message}
            </li>
        `).join('');
    }

    function render(state) {
        const scenario = state.sim.scenario;
        const running = state.sim.running;

        return `
            <section class="route-fade">
                <header class="page-head">
                    <h2>Admin Control and IoT Simulation</h2>
                    <p>Manage smart valves, scenarios, predictive maintenance queue, and operations timeline.</p>
                </header>

                <div class="admin-grid">
                    <div class="grid">
                        <article class="card">
                            <div class="card-head">
                                <h3>Scenario and Runtime</h3>
                                <span class="badge" id="admin-tick-badge">Tick: ${state.sim.tick}</span>
                            </div>

                            <div class="toolbar" style="margin: 0;">
                                <div class="toolbar-group">
                                    <label for="scenario-select">Scenario Pack</label>
                                    <select id="scenario-select" class="select" data-action="set-scenario" data-event="change">
                                        <option value="normal_ops" ${scenario === 'normal_ops' ? 'selected' : ''}>Normal Ops</option>
                                        <option value="heavy_rain" ${scenario === 'heavy_rain' ? 'selected' : ''}>Heavy Rain</option>
                                        <option value="blockage_cascade" ${scenario === 'blockage_cascade' ? 'selected' : ''}>Blockage Cascade</option>
                                        <option value="pump_failure" ${scenario === 'pump_failure' ? 'selected' : ''}>Pump Failure</option>
                                    </select>
                                </div>
                                <div class="toolbar-group">
                                    <label>Simulation State</label>
                                    <button id="admin-sim-toggle" class="btn ${running ? 'btn-ghost' : 'btn-primary'}" data-action="toggle-simulation">${running ? 'Pause Simulation' : 'Start Simulation'}</button>
                                </div>
                                <div class="toolbar-group">
                                    <label>Mitigations</label>
                                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                        <button class="btn btn-sm btn-ghost" data-action="apply-mitigation" data-type="dispatch_crew">Dispatch Crew</button>
                                        <button class="btn btn-sm btn-ghost" data-action="apply-mitigation" data-type="preflush_network">Pre-Flush</button>
                                        <button class="btn btn-sm btn-accent" data-action="apply-mitigation" data-type="reroute_north">Reroute</button>
                                    </div>
                                </div>
                            </div>
                        </article>

                        <article class="card">
                            <div class="card-head">
                                <h3>Predictive Maintenance Queue</h3>
                                <span class="badge ${state.network.maintenanceTasks.length ? 'warn' : ''}">${state.network.maintenanceTasks.length} tasks</span>
                            </div>
                            <div class="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Location</th>
                                            <th>Area</th>
                                            <th>Risk</th>
                                            <th>Crew</th>
                                            <th>ETA</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody id="maintenance-rows">${renderMaintenanceRows(state)}</tbody>
                                </table>
                            </div>
                        </article>
                    </div>

                    <div class="grid">
                        <article class="card">
                            <div class="card-head">
                                <h3>Smart Valve IoT Control</h3>
                                <span class="badge">Command lifecycle: queued -> in-flight -> result</span>
                            </div>
                            <div class="valve-grid" id="valve-grid">${renderValves(state)}</div>
                        </article>

                        <article class="card">
                            <div class="card-head">
                                <h3>Operations Log</h3>
                                <span class="badge">Latest first</span>
                            </div>
                            <ul class="log-list" id="ops-log-list">${renderLogRows(state)}</ul>
                        </article>
                    </div>
                </div>
            </section>
        `;
    }

    function mount() {
        // Mount logic not required for admin view.
    }

    function update(state) {
        const scenarioSelect = document.getElementById('scenario-select');
        if (scenarioSelect) {
            scenarioSelect.value = state.sim.scenario;
        }

        const toggleBtn = document.getElementById('admin-sim-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = state.sim.running ? 'Pause Simulation' : 'Start Simulation';
            toggleBtn.className = `btn ${state.sim.running ? 'btn-ghost' : 'btn-primary'}`;
        }

        const tickBadge = document.getElementById('admin-tick-badge');
        if (tickBadge) {
            tickBadge.textContent = `Tick: ${state.sim.tick}`;
        }

        const valveGrid = document.getElementById('valve-grid');
        if (valveGrid) {
            valveGrid.innerHTML = renderValves(state);
        }

        const maintenanceRows = document.getElementById('maintenance-rows');
        if (maintenanceRows) {
            maintenanceRows.innerHTML = renderMaintenanceRows(state);
        }

        const opsLogList = document.getElementById('ops-log-list');
        if (opsLogList) {
            opsLogList.innerHTML = renderLogRows(state);
        }
    }

    function unmount() {
        // No-op
    }

    EcoFlowViews.admin = {
        render,
        mount,
        update,
        unmount
    };
})();
