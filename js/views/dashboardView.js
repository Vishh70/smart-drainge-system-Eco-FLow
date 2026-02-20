(() => {
    const EcoFlowViews = (window.EcoFlowViews = window.EcoFlowViews || {});

    function fmtTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }

    function renderIncidentItems(state) {
        const incidents = state.network.incidents.slice(0, 8);
        if (!incidents.length) {
            return '<li class="empty-state">No active incidents in the current window.</li>';
        }

        return incidents
            .map((incident) => `
                <li>
                    <time>T${incident.tick}</time>
                    <strong>${incident.severity}</strong> - ${incident.message}
                </li>
            `)
            .join('');
    }

    function severityChip(summary) {
        if (!summary) {
            return '<span class="status-chip ok">Stable</span>';
        }

        if (summary.severity === 'critical') {
            return '<span class="status-chip crit">Critical</span>';
        }

        if (summary.severity === 'warning') {
            return '<span class="status-chip warn">Warning</span>';
        }

        return '<span class="status-chip ok">Stable</span>';
    }

    function render(state) {
        const historyLength = state.sim.history.length;
        const maxOffset = Math.max(0, historyLength - 1);
        const selectedSnapshot = historyLength ? state.sim.history[historyLength - 1 - state.ui.selectedTickOffset] : null;
        const snapshotLabel = selectedSnapshot ? `T${selectedSnapshot.tick} @ ${fmtTime(selectedSnapshot.timestamp)}` : 'Waiting for first tick';
        const ai = state.sim.aiSummary;

        return `
            <section class="route-fade">
                <header class="page-head">
                    <h2>Urban Drainage Operations</h2>
                    <p>Live city monitoring with deterministic AI/IoT simulation and replayable timeline.</p>
                </header>

                <div class="dashboard-layout">
                    <div class="grid">
                        <article class="card fade-in">
                            <div class="card-head">
                                <h3>City Monitoring Map</h3>
                                <span class="badge" id="dashboard-snapshot-label">Snapshot: ${snapshotLabel}</span>
                            </div>

                            <div class="layer-controls" role="group" aria-label="Map layer controls">
                                <label class="layer-toggle"><input data-action="toggle-layer" data-event="change" data-layer="sensors" type="checkbox" ${state.ui.layers.sensors ? 'checked' : ''}> Sensors</label>
                                <label class="layer-toggle"><input data-action="toggle-layer" data-event="change" data-layer="incidents" type="checkbox" ${state.ui.layers.incidents ? 'checked' : ''}> Incidents</label>
                                <label class="layer-toggle"><input data-action="toggle-layer" data-event="change" data-layer="flowPaths" type="checkbox" ${state.ui.layers.flowPaths ? 'checked' : ''}> Flow Paths</label>
                                <label class="layer-toggle"><input data-action="toggle-layer" data-event="change" data-layer="riskHeat" type="checkbox" ${state.ui.layers.riskHeat ? 'checked' : ''}> Risk Heat</label>
                            </div>

                            <div class="scrubber">
                                <div class="scrubber-label">
                                    <span>Timeline Replay</span>
                                    <span id="dashboard-scrubber-label">${state.ui.selectedTickOffset === 0 ? 'Live' : `${state.ui.selectedTickOffset} ticks back`}</span>
                                </div>
                                <input
                                    id="dashboard-scrubber-input"
                                    type="range"
                                    min="0"
                                    max="${maxOffset}"
                                    value="${Math.min(state.ui.selectedTickOffset, maxOffset)}"
                                    data-action="set-scrubber"
                                    data-event="input"
                                    aria-label="Replay previous simulation ticks"
                                >
                            </div>

                            <div id="city-map" aria-label="Drainage map view"></div>
                        </article>

                        <article class="card fade-in">
                            <div class="card-head">
                                <h3>Incident Timeline</h3>
                                <span class="badge ${state.network.alerts.length ? 'warn' : ''}" id="dashboard-alert-count">${state.network.alerts.length} alerts</span>
                            </div>
                            <ul class="timeline" id="dashboard-incident-list">${renderIncidentItems(state)}</ul>
                        </article>
                    </div>

                    <div class="grid">
                        <article class="card fade-in">
                            <div class="card-head">
                                <h3>AI Risk Intelligence</h3>
                                <span id="dashboard-ai-severity">${severityChip(ai)}</span>
                            </div>
                            <div class="metric-stack" style="margin-bottom: 12px;" id="dashboard-ai-metrics">
                                <div class="metric-row"><span>Risk Score</span><strong id="dashboard-ai-risk">${ai.riskScore}</strong></div>
                                <div class="metric-row"><span>Anomaly</span><strong id="dashboard-ai-anomaly">${ai.anomalyClass}</strong></div>
                                <div class="metric-row"><span>Recommended Action</span><strong id="dashboard-ai-recommendation">${ai.recommendation}</strong></div>
                            </div>
                            <div class="ai-output" id="dashboard-ai-output">${ai.rationale.map((line) => `> ${line}`).join('<br>')}</div>
                        </article>

                        <article class="card fade-in">
                            <div class="card-head">
                                <h3>Quick Mitigations</h3>
                                <span class="badge">Live Ops</span>
                            </div>
                            <div class="grid" style="gap: 10px;">
                                <button class="btn btn-primary" data-action="apply-mitigation" data-type="dispatch_crew">Dispatch Maintenance Crew</button>
                                <button class="btn btn-ghost" data-action="apply-mitigation" data-type="preflush_network">Start Pre-Flush Cycle</button>
                                <button class="btn btn-accent" data-action="apply-mitigation" data-type="reroute_north">Reroute Northbound Flow</button>
                            </div>
                        </article>
                    </div>
                </div>
            </section>
        `;
    }

    function mount(state, context) {
        context.mapWidget.mount('city-map');
        context.mapWidget.render(state);
    }

    function update(state, context) {
        context.mapWidget.render(state);

        const historyLength = state.sim.history.length;
        const selectedSnapshot = historyLength ? state.sim.history[historyLength - 1 - state.ui.selectedTickOffset] : null;
        const snapshotLabel = selectedSnapshot
            ? `Snapshot: T${selectedSnapshot.tick} @ ${fmtTime(selectedSnapshot.timestamp)}`
            : 'Snapshot: Waiting for first tick';

        const snapshotEl = document.getElementById('dashboard-snapshot-label');
        if (snapshotEl) {
            snapshotEl.textContent = snapshotLabel;
        }

        const scrubberInput = document.getElementById('dashboard-scrubber-input');
        const scrubberLabel = document.getElementById('dashboard-scrubber-label');
        const scrubberMax = Math.max(0, historyLength - 1);
        if (scrubberInput) {
            scrubberInput.max = String(scrubberMax);
            scrubberInput.value = String(Math.min(state.ui.selectedTickOffset, scrubberMax));
        }
        if (scrubberLabel) {
            scrubberLabel.textContent = state.ui.selectedTickOffset === 0
                ? 'Live'
                : `${state.ui.selectedTickOffset} ticks back`;
        }

        const alertCount = document.getElementById('dashboard-alert-count');
        if (alertCount) {
            alertCount.textContent = `${state.network.alerts.length} alerts`;
            alertCount.className = `badge ${state.network.alerts.length ? 'warn' : ''}`;
        }

        const incidentList = document.getElementById('dashboard-incident-list');
        if (incidentList) {
            incidentList.innerHTML = renderIncidentItems(state);
        }

        const ai = state.sim.aiSummary;
        const aiSeverity = document.getElementById('dashboard-ai-severity');
        if (aiSeverity) {
            aiSeverity.innerHTML = severityChip(ai);
        }

        const aiRisk = document.getElementById('dashboard-ai-risk');
        if (aiRisk) {
            aiRisk.textContent = ai.riskScore;
        }

        const aiAnomaly = document.getElementById('dashboard-ai-anomaly');
        if (aiAnomaly) {
            aiAnomaly.textContent = ai.anomalyClass;
        }

        const aiRecommendation = document.getElementById('dashboard-ai-recommendation');
        if (aiRecommendation) {
            aiRecommendation.textContent = ai.recommendation;
        }

        const aiOutput = document.getElementById('dashboard-ai-output');
        if (aiOutput) {
            aiOutput.innerHTML = ai.rationale.map((line) => `> ${line}`).join('<br>');
        }
    }

    function unmount(context) {
        context.mapWidget.destroy();
    }

    EcoFlowViews.dashboard = {
        render,
        mount,
        update,
        unmount
    };
})();
