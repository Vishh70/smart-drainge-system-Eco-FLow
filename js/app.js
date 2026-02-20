(() => {
    const EcoFlow = (window.EcoFlow = window.EcoFlow || {});

    const APP_VERSION = 2;

    function defaultAiSummary() {
        return {
            riskScore: 0,
            anomalyClass: 'Bootstrapping simulation',
            recommendation: 'Initializing telemetry stream.',
            rationale: ['Awaiting first simulation tick.'],
            severity: 'ok'
        };
    }

    function baseState() {
        return {
            version: APP_VERSION,
            ui: {
                route: '/dashboard',
                filters: {
                    zone: 'all',
                    severity: 'all',
                    timeWindow: '30m'
                },
                layers: {
                    sensors: true,
                    incidents: true,
                    flowPaths: true,
                    riskHeat: true
                },
                thresholds: {
                    flow: 0,
                    sludge: 0
                },
                selectedTickOffset: 0,
                focusZone: 'all',
                tableSort: {
                    key: 'risk',
                    direction: 'desc'
                }
            },
            network: {
                sensors: [],
                valves: [
                    { id: '101', label: 'Valve #101 (NMIET Junction)', zone: 'NMIET', state: 'OFF', commandStatus: 'idle', retries: 0 },
                    { id: '204', label: 'Valve #204 (Latis West)', zone: 'Latis Society', state: 'OFF', commandStatus: 'idle', retries: 0 },
                    { id: '307', label: 'Valve #307 (Shahu Link)', zone: 'Shahu Colony', state: 'OFF', commandStatus: 'idle', retries: 0 },
                    { id: '411', label: 'Valve #411 (Vaibhav Node)', zone: 'Vaibhav Apartment', state: 'OFF', commandStatus: 'idle', retries: 0 }
                ],
                incidents: [],
                alerts: [],
                maintenanceTasks: []
            },
            sim: {
                seed: 240219,
                scenario: 'normal_ops',
                tick: 0,
                running: false,
                lastTickAt: null,
                history: [],
                health: {
                    score: 99,
                    activeAlerts: 0,
                    affectedZones: 0,
                    pumpUptime: 99.6,
                    networkLoad: 0
                },
                cooldowns: {
                    lastAlertTick: -999
                },
                aiSummary: defaultAiSummary(),
                mitigationBoost: 0
            },
            ops: {
                activityLog: []
            }
        };
    }

    function deepMerge(base, source) {
        if (!source || typeof source !== 'object') {
            return base;
        }

        const output = Array.isArray(base) ? [...base] : { ...base };

        Object.keys(source).forEach((key) => {
            if (!(key in output)) {
                return;
            }

            const baseValue = output[key];
            const sourceValue = source[key];

            if (Array.isArray(baseValue)) {
                output[key] = Array.isArray(sourceValue) ? sourceValue : baseValue;
                return;
            }

            if (baseValue && typeof baseValue === 'object') {
                output[key] = deepMerge(baseValue, sourceValue);
                return;
            }

            output[key] = sourceValue;
        });

        return output;
    }

    function createInitialState() {
        const defaultState = baseState();
        const persisted = EcoFlow.Persistence.migrateState(EcoFlow.Persistence.loadState(), APP_VERSION);
        const settings = EcoFlow.Persistence.loadSettings();

        let initial = persisted ? deepMerge(defaultState, persisted) : defaultState;

        if (settings && typeof settings === 'object') {
            initial = {
                ...initial,
                ui: {
                    ...initial.ui,
                    filters: settings.filters || initial.ui.filters,
                    layers: settings.layers || initial.ui.layers,
                    thresholds: settings.thresholds || initial.ui.thresholds
                }
            };
        }

        return initial;
    }

    function createLogEntry(level, message) {
        return {
            id: `log-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            level,
            message,
            timestamp: Date.now()
        };
    }

    function appendLog(state, level, message) {
        return {
            ...state,
            ops: {
                ...state.ops,
                activityLog: [createLogEntry(level, message), ...state.ops.activityLog].slice(0, 90)
            }
        };
    }

    function reducer(state, action) {
        switch (action.type) {
            case 'ROUTE_CHANGED':
                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        route: action.payload
                    }
                };

            case 'UI_FILTER_UPDATED':
                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        filters: {
                            ...state.ui.filters,
                            [action.payload.key]: action.payload.value
                        }
                    }
                };

            case 'UI_LAYER_TOGGLED':
                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        layers: {
                            ...state.ui.layers,
                            [action.payload.layer]: action.payload.enabled
                        }
                    }
                };

            case 'UI_SCRUBBER_SET':
                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        selectedTickOffset: action.payload
                    }
                };

            case 'UI_THRESHOLD_UPDATED':
                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        thresholds: {
                            ...state.ui.thresholds,
                            [action.payload.key]: action.payload.value
                        }
                    }
                };

            case 'UI_TABLE_SORT_SET': {
                const current = state.ui.tableSort;
                const direction = current.key === action.payload
                    ? (current.direction === 'asc' ? 'desc' : 'asc')
                    : 'desc';

                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        tableSort: {
                            key: action.payload,
                            direction
                        }
                    }
                };
            }

            case 'UI_FOCUS_ZONE_SET':
                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        focusZone: action.payload,
                        filters: {
                            ...state.ui.filters,
                            zone: action.payload
                        }
                    }
                };

            case 'NETWORK_SENSORS_INITIALIZED':
                return {
                    ...state,
                    network: {
                        ...state.network,
                        sensors: action.payload
                    }
                };

            case 'SIM_SEED_SET':
                return {
                    ...state,
                    sim: {
                        ...state.sim,
                        seed: action.payload
                    }
                };

            case 'SIM_SCENARIO_SET':
                return appendLog({
                    ...state,
                    ui: {
                        ...state.ui,
                        selectedTickOffset: 0
                    },
                    network: {
                        ...state.network,
                        incidents: [],
                        alerts: [],
                        maintenanceTasks: []
                    },
                    sim: {
                        ...state.sim,
                        scenario: action.payload,
                        tick: 0,
                        history: [],
                        aiSummary: defaultAiSummary(),
                        cooldowns: { lastAlertTick: -999 }
                    }
                }, 'info', `Scenario switched to ${action.payload}`);

            case 'SIMULATION_RUNNING_SET':
                return {
                    ...state,
                    sim: {
                        ...state.sim,
                        running: action.payload
                    }
                };

            case 'SIM_TICK_APPLIED':
                return {
                    ...state,
                    network: {
                        ...state.network,
                        sensors: action.payload.sensors,
                        incidents: action.payload.incidents,
                        alerts: action.payload.alerts,
                        maintenanceTasks: action.payload.maintenanceTasks
                    },
                    sim: {
                        ...state.sim,
                        tick: action.payload.tick,
                        history: action.payload.history,
                        aiSummary: action.payload.aiSummary,
                        cooldowns: action.payload.cooldowns,
                        mitigationBoost: action.payload.mitigationBoost,
                        lastTickAt: action.payload.snapshot.timestamp,
                        health: action.payload.health
                    }
                };

            case 'VALVE_COMMAND_QUEUED': {
                const updated = {
                    ...state,
                    network: {
                        ...state.network,
                        valves: state.network.valves.map((valve) => {
                            if (valve.id !== action.payload.valveId) {
                                return valve;
                            }
                            return {
                                ...valve,
                                commandStatus: 'queued',
                                desiredState: action.payload.desiredState
                            };
                        })
                    }
                };
                return appendLog(updated, 'info', `Queued command for valve ${action.payload.valveId}`);
            }

            case 'VALVE_COMMAND_IN_FLIGHT':
                return {
                    ...state,
                    network: {
                        ...state.network,
                        valves: state.network.valves.map((valve) => valve.id === action.payload.valveId
                            ? { ...valve, commandStatus: 'in_flight' }
                            : valve)
                    }
                };

            case 'VALVE_COMMAND_SUCCESS': {
                const updated = {
                    ...state,
                    network: {
                        ...state.network,
                        valves: state.network.valves.map((valve) => {
                            if (valve.id !== action.payload.valveId) {
                                return valve;
                            }

                            return {
                                ...valve,
                                state: action.payload.desiredState,
                                commandStatus: 'idle',
                                retries: 0,
                                desiredState: null
                            };
                        })
                    }
                };
                return appendLog(updated, 'success', `Valve ${action.payload.valveId} set to ${action.payload.desiredState}`);
            }

            case 'VALVE_COMMAND_FAILED': {
                const updated = {
                    ...state,
                    network: {
                        ...state.network,
                        valves: state.network.valves.map((valve) => {
                            if (valve.id !== action.payload.valveId) {
                                return valve;
                            }

                            return {
                                ...valve,
                                commandStatus: 'failed',
                                retries: (valve.retries || 0) + 1
                            };
                        })
                    }
                };
                return appendLog(updated, 'warning', `Valve ${action.payload.valveId} command failed`);
            }

            case 'MITIGATION_APPLIED': {
                const boostMap = {
                    dispatch_crew: 2.5,
                    preflush_network: 3.1,
                    reroute_north: 3.8
                };
                const boost = boostMap[action.payload.type] || 2;
                const updated = {
                    ...state,
                    sim: {
                        ...state.sim,
                        mitigationBoost: Number((state.sim.mitigationBoost + boost).toFixed(2))
                    }
                };
                return appendLog(updated, 'success', `Mitigation applied: ${action.payload.type}`);
            }

            default:
                return state;
        }
    }

    function safeRender(view, fallback) {
        try {
            return view();
        } catch (error) {
            console.error('[Render] View failed', error);
            return fallback;
        }
    }

    function appInit() {
        const appRoot = document.getElementById('app-root');
        const navRoot = document.getElementById('sidebar-nav');
        const kpiRoot = document.getElementById('kpi-strip');
        const filtersRoot = document.getElementById('global-filters');

        if (!appRoot || !navRoot || !kpiRoot || !filtersRoot) {
            throw new Error('Required app mount nodes are missing.');
        }

        const initialState = createInitialState();
        const store = EcoFlow.createStore(initialState, reducer);
        const eventBus = EcoFlow.createEventBus();

        const toast = EcoFlowWidgets.createToast();
        const mapWidget = EcoFlowWidgets.createMapWidget();
        const chartsWidget = EcoFlowWidgets.createChartsWidget(eventBus);
        const simulationEngine = EcoFlowSim.createSimulationEngine({ store, eventBus });

        eventBus.on('toast', ({ message, type }) => toast.show(message, type));

        eventBus.on('chart:zone-selected', (zone) => {
            store.dispatch({ type: 'UI_FOCUS_ZONE_SET', payload: zone });
            toast.show(`Zone focus applied: ${zone}`, 'info');
        });

        const routeMap = {
            '/dashboard': 'dashboard',
            '/analytics': 'analytics',
            '/admin': 'admin'
        };

        let currentViewKey = null;
        let currentView = null;

        function renderKpis(state) {
            kpiRoot.innerHTML = `
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-label">System Health</div>
                        <div class="kpi-value">${state.sim.health.score.toFixed(1)}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Active Alerts</div>
                        <div class="kpi-value">${state.sim.health.activeAlerts}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Affected Zones</div>
                        <div class="kpi-value">${state.sim.health.affectedZones}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Pump Uptime</div>
                        <div class="kpi-value">${state.sim.health.pumpUptime.toFixed(2)}%</div>
                    </div>
                </div>
            `;
        }

        function renderFilters(state) {
            const zoneOptions = ['<option value="all">All Zones</option>']
                .concat(window.EcoFlowData.zones.map((zone) => `<option value="${zone}">${zone}</option>`))
                .join('');

            filtersRoot.innerHTML = `
                <div class="toolbar">
                    <div class="toolbar-group">
                        <label for="zone-filter">Zone Filter</label>
                        <select id="zone-filter" class="select" data-action="set-filter" data-event="change" data-filter-key="zone">
                            ${zoneOptions}
                        </select>
                    </div>
                    <div class="toolbar-group">
                        <label for="severity-filter">Severity Filter</label>
                        <select id="severity-filter" class="select" data-action="set-filter" data-event="change" data-filter-key="severity">
                            <option value="all">All</option>
                            <option value="normal">Normal</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div class="toolbar-group">
                        <label for="window-filter">Time Window</label>
                        <select id="window-filter" class="select" data-action="set-filter" data-event="change" data-filter-key="timeWindow">
                            <option value="15m">15 Minutes</option>
                            <option value="30m">30 Minutes</option>
                            <option value="60m">60 Minutes</option>
                        </select>
                    </div>
                </div>
            `;

            const zoneEl = document.getElementById('zone-filter');
            const severityEl = document.getElementById('severity-filter');
            const windowEl = document.getElementById('window-filter');
            if (zoneEl) zoneEl.value = state.ui.filters.zone;
            if (severityEl) severityEl.value = state.ui.filters.severity;
            if (windowEl) windowEl.value = state.ui.filters.timeWindow;
        }

        function syncNav(state) {
            navRoot.querySelectorAll('[data-nav-route]').forEach((button) => {
                const active = button.dataset.navRoute === state.ui.route;
                button.classList.toggle('is-active', active);
                if (active) {
                    button.setAttribute('aria-current', 'page');
                } else {
                    button.removeAttribute('aria-current');
                }
            });
        }

        function syncFilterValues(state) {
            const zoneEl = document.getElementById('zone-filter');
            const severityEl = document.getElementById('severity-filter');
            const windowEl = document.getElementById('window-filter');
            if (zoneEl && zoneEl.value !== state.ui.filters.zone) zoneEl.value = state.ui.filters.zone;
            if (severityEl && severityEl.value !== state.ui.filters.severity) severityEl.value = state.ui.filters.severity;
            if (windowEl && windowEl.value !== state.ui.filters.timeWindow) windowEl.value = state.ui.filters.timeWindow;
        }

        function mountRoute(state) {
            const key = routeMap[state.ui.route] || 'dashboard';
            if (key === currentViewKey && currentView) {
                return;
            }

            if (currentView && typeof currentView.unmount === 'function') {
                currentView.unmount({ mapWidget, chartsWidget, eventBus, store });
            }

            currentViewKey = key;
            currentView = window.EcoFlowViews[key];

            if (!currentView) {
                appRoot.innerHTML = '<article class="card error-card"><h3>Route Error</h3><p>View module not found.</p></article>';
                return;
            }

            appRoot.innerHTML = safeRender(
                () => currentView.render(state),
                '<article class="card error-card"><h3>Rendering Failed</h3><p>This view failed to render. Check console logs.</p></article>'
            );

            if (typeof currentView.mount === 'function') {
                currentView.mount(state, { mapWidget, chartsWidget, eventBus, store });
            }
        }

        function updateCurrentView(state, action) {
            if (!currentView || typeof currentView.update !== 'function') {
                return;
            }
            currentView.update(state, { mapWidget, chartsWidget, eventBus, store }, action);
        }

        function downloadSnapshot(state) {
            const snapshot = state.sim.history[state.sim.history.length - 1];
            if (!snapshot) {
                toast.show('No simulation snapshot available yet.', 'warning');
                return;
            }

            const payload = {
                exportedAt: new Date().toISOString(),
                route: state.ui.route,
                filters: state.ui.filters,
                scenario: state.sim.scenario,
                tick: state.sim.tick,
                snapshot
            };

            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `ecoflow-snapshot-t${state.sim.tick}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
            toast.show('Snapshot downloaded.', 'success');
        }

        const router = EcoFlow.createHashRouter();
        ['/dashboard', '/analytics', '/admin'].forEach((route) => {
            router.registerRoute(route, (resolvedRoute) => {
                store.dispatch({ type: 'ROUTE_CHANGED', payload: resolvedRoute });
            });
        });

        const actions = {
            'nav-route': ({ element }) => {
                router.navigate(element.dataset.navRoute);
                document.body.classList.remove('sidebar-open');
            },
            'toggle-sidebar': () => {
                document.body.classList.toggle('sidebar-open');
            },
            'set-filter': ({ element }) => {
                const key = element.dataset.filterKey;
                store.dispatch({ type: 'UI_FILTER_UPDATED', payload: { key, value: element.value } });
            },
            'toggle-layer': ({ element }) => {
                store.dispatch({
                    type: 'UI_LAYER_TOGGLED',
                    payload: { layer: element.dataset.layer, enabled: element.checked }
                });
            },
            'set-scrubber': ({ element }) => {
                store.dispatch({ type: 'UI_SCRUBBER_SET', payload: Number(element.value) || 0 });
            },
            'set-threshold': ({ element }) => {
                const key = element.dataset.thresholdKey;
                store.dispatch({ type: 'UI_THRESHOLD_UPDATED', payload: { key, value: Number(element.value) || 0 } });
            },
            'sort-ops': ({ element }) => {
                store.dispatch({ type: 'UI_TABLE_SORT_SET', payload: element.dataset.sortKey });
            },
            'toggle-valve': ({ element }) => {
                simulationEngine.queueValveCommand(element.dataset.valveId);
            },
            'set-scenario': ({ element }) => {
                simulationEngine.setScenario(element.value);
                simulationEngine.startSimulation();
            },
            'toggle-simulation': () => {
                const state = store.getState();
                if (state.sim.running) {
                    simulationEngine.stopSimulation();
                    toast.show('Simulation paused.', 'info');
                    return;
                }
                simulationEngine.startSimulation();
                toast.show('Simulation resumed.', 'success');
            },
            'apply-mitigation': ({ element }) => {
                simulationEngine.applyMitigation(element.dataset.type);
            },
            'download-snapshot': () => {
                downloadSnapshot(store.getState());
            }
        };

        EcoFlow.bindActionDelegates(document, actions);

        store.subscribe((nextState, prevState, action) => {
            renderKpis(nextState);
            syncNav(nextState);

            if (prevState.ui.route !== nextState.ui.route || !currentView) {
                mountRoute(nextState);
                syncFilterValues(nextState);
                return;
            }

            syncFilterValues(nextState);
            updateCurrentView(nextState, action);
        });

        renderKpis(initialState);
        renderFilters(initialState);
        syncNav(initialState);
        mountRoute(initialState);

        router.startRouter();

        simulationEngine.startSimulation({
            seed: initialState.sim.seed,
            scenario: initialState.sim.scenario
        });

        EcoFlow.Persistence.startAutoSave(store, 5000);

        window.EcoFlowApp = {
            init: appInit,
            navigate: router.navigate,
            dispatch: store.dispatch,
            getState: store.getState
        };

        toast.show('EcoFlow control room initialized.', 'success');
    }

    document.addEventListener('DOMContentLoaded', () => {
        try {
            appInit();
        } catch (error) {
            console.error('[EcoFlow] init failed', error);
            const appRoot = document.getElementById('app-root');
            if (appRoot) {
                appRoot.innerHTML = `<article class="card error-card"><h3>App failed to initialize</h3><p>${error.message}</p></article>`;
            }
        }
    });
})();
