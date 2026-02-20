(() => {
    const EcoFlowSim = (window.EcoFlowSim = window.EcoFlowSim || {});

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function mulberry32(seed) {
        let t = seed >>> 0;
        return function random() {
            t += 0x6d2b79f5;
            let r = Math.imul(t ^ (t >>> 15), 1 | t);
            r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    }

    function randomRange(rng, min, max) {
        return min + (max - min) * rng();
    }

    function statusFromRisk(risk) {
        if (risk >= 80) return 'critical';
        if (risk >= 60) return 'warning';
        return 'normal';
    }

    function directionForArea(area) {
        if (area === 'Latis Society') return 'East';
        if (area === 'Vaibhav Apartment') return 'West';
        return 'South';
    }

    function initializeSensors(points, rng) {
        return points.map((point, index) => ({
            id: `sensor-${index + 1}`,
            name: point.name,
            area: point.area,
            lat: point.lat,
            lng: point.lng,
            flow: Math.round(20 + randomRange(rng, 5, 28)),
            sludge: Math.round(24 + randomRange(rng, 8, 32)),
            risk: Math.round(18 + randomRange(rng, 8, 22)),
            status: 'normal',
            direction: directionForArea(point.area),
            clogProbability: randomRange(rng, 0.18, 0.32),
            cleanedAtTick: Math.round(randomRange(rng, -25, -4))
        }));
    }

    function aggregateZoneRisk(sensors, zones) {
        const zoneRisk = {};
        zones.forEach((zone) => {
            zoneRisk[zone] = {
                avgRisk: 0,
                normal: 0,
                warning: 0,
                critical: 0,
                count: 0
            };
        });

        sensors.forEach((sensor) => {
            if (!zoneRisk[sensor.area]) {
                zoneRisk[sensor.area] = { avgRisk: 0, normal: 0, warning: 0, critical: 0, count: 0 };
            }

            const bucket = zoneRisk[sensor.area];
            bucket.count += 1;
            bucket.avgRisk += sensor.risk;
            bucket[sensor.status] += 1;
        });

        Object.keys(zoneRisk).forEach((zone) => {
            const bucket = zoneRisk[zone];
            if (!bucket.count) {
                return;
            }
            bucket.avgRisk = Number((bucket.avgRisk / bucket.count).toFixed(1));
        });

        return zoneRisk;
    }

    function buildMaintenanceQueue(sensors, tick) {
        const crews = ['Crew-A', 'Crew-B', 'Crew-C', 'Crew-D'];

        return sensors
            .filter((sensor) => sensor.risk >= 58)
            .sort((a, b) => b.risk - a.risk)
            .slice(0, 12)
            .map((sensor, index) => {
                const etaMinutes = Math.max(8, Math.round(40 - sensor.risk / 3 + index * 4));
                return {
                    id: `${sensor.id}-task-${tick}`,
                    sensorId: sensor.id,
                    location: sensor.name,
                    area: sensor.area,
                    risk: sensor.risk,
                    etaMinutes,
                    crew: crews[index % crews.length],
                    status: sensor.risk >= 78 ? 'Urgent' : 'Scheduled',
                    predictedImpact: sensor.risk >= 78 ? 'High' : 'Medium'
                };
            });
    }

    function createSimulationEngine({ store, eventBus }) {
        const data = window.EcoFlowData;
        let timerId = null;
        let rng = mulberry32(store.getState().sim.seed || 240219);

        function scenarioSeed(baseSeed, scenarioName) {
            let hash = 0;
            for (let index = 0; index < scenarioName.length; index += 1) {
                hash = ((hash << 5) - hash) + scenarioName.charCodeAt(index);
                hash |= 0;
            }
            return Math.abs(baseSeed + hash);
        }

        function ensureSensors() {
            const state = store.getState();
            if (state.network.sensors.length) {
                return;
            }

            store.dispatch({
                type: 'NETWORK_SENSORS_INITIALIZED',
                payload: initializeSensors(data.drainagePoints, rng)
            });
        }

        function stepSimulation() {
            const state = store.getState();
            if (!state.sim.running) {
                return;
            }

            ensureSensors();

            const current = store.getState();
            const scenario = EcoFlowSim.scenarios[current.sim.scenario] || EcoFlowSim.scenarios.normal_ops;
            const tick = current.sim.tick + 1;
            const mitigationBoost = current.sim.mitigationBoost || 0;

            const openValvesByZone = current.network.valves.reduce((acc, valve) => {
                if (valve.state === 'ON') {
                    acc[valve.zone] = (acc[valve.zone] || 0) + 1;
                }
                return acc;
            }, {});

            const sensors = current.network.sensors.map((sensor, index) => {
                const openValveCount = openValvesByZone[sensor.area] || 0;
                const valveRelief = openValveCount * 4;
                const valveDrain = openValveCount * 1.6;

                const flow = clamp(
                    sensor.flow
                    + Math.sin((tick + index) / 6) * 5.2
                    + scenario.flowBias
                    + scenario.rainfall * 21
                    + randomRange(rng, -4.5, 4.5)
                    - valveRelief,
                    5,
                    180
                );

                const cleanedRecently = tick - sensor.cleanedAtTick < 6;
                const sludge = clamp(
                    sensor.sludge
                    + scenario.sludgeGrowth
                    + randomRange(rng, -2.2, 2.4)
                    - valveDrain
                    - (cleanedRecently ? 2.1 : 0),
                    3,
                    150
                );

                const risk = clamp(
                    (flow * 0.42)
                    + (sludge * 0.53)
                    + scenario.riskBias
                    + randomRange(rng, -6, 6)
                    - valveRelief
                    - mitigationBoost * 2,
                    0,
                    100
                );

                return {
                    ...sensor,
                    flow: Number(flow.toFixed(1)),
                    sludge: Number(sludge.toFixed(1)),
                    risk: Number(risk.toFixed(1)),
                    status: statusFromRisk(risk),
                    clogProbability: Number(clamp((sludge / 150) * 0.58 + (risk / 100) * 0.42, 0.05, 0.99).toFixed(2))
                };
            });

            const zoneRisk = aggregateZoneRisk(sensors, data.zones);
            const criticalSensors = sensors.filter((sensor) => sensor.status === 'critical');
            const warningSensors = sensors.filter((sensor) => sensor.status === 'warning');

            let incidents = current.network.incidents
                .filter((incident) => !incident.resolved && tick - incident.tick <= 24)
                .slice(0, 25);

            criticalSensors.slice(0, 4).forEach((sensor) => {
                const exists = incidents.some((incident) => incident.sensorId === sensor.id);
                if (exists) {
                    return;
                }

                incidents.unshift({
                    id: `incident-${sensor.id}-${tick}`,
                    tick,
                    sensorId: sensor.id,
                    area: sensor.area,
                    severity: 'Critical',
                    message: `Overflow risk rising near ${sensor.name}.`,
                    resolved: false
                });
            });

            incidents = incidents.slice(0, 25);

            let alerts = current.network.alerts
                .filter((alert) => tick - alert.tick <= 28)
                .slice(0, 24);

            let lastAlertTick = current.sim.cooldowns.lastAlertTick;
            if ((criticalSensors.length > 0 || warningSensors.length > 10) && tick - lastAlertTick >= 3) {
                const leadingSensor = criticalSensors[0] || warningSensors[0];
                const level = criticalSensors.length ? 'critical' : 'warning';

                alerts.unshift({
                    id: `alert-${tick}-${leadingSensor.id}`,
                    tick,
                    level,
                    zone: leadingSensor.area,
                    message: `${level === 'critical' ? 'Critical surge' : 'Elevated load'} in ${leadingSensor.area}`
                });
                lastAlertTick = tick;
            }

            alerts = alerts.slice(0, 24);

            const maintenanceTasks = buildMaintenanceQueue(sensors, tick);

            const averageRisk = sensors.reduce((sum, sensor) => sum + sensor.risk, 0) / sensors.length;
            const averageFlow = sensors.reduce((sum, sensor) => sum + sensor.flow, 0) / sensors.length;
            const affectedZones = Object.values(zoneRisk).filter((zone) => zone.avgRisk >= 60).length;
            const networkLoad = clamp(averageFlow * 0.95, 0, 100);

            const pumpUptime = clamp(
                (current.sim.health.pumpUptime || 99.4)
                - scenario.pumpStress
                + randomRange(rng, -0.08, 0.05)
                + mitigationBoost * 0.03,
                84,
                99.9
            );

            const healthScore = clamp(
                100 - averageRisk * 0.55 - criticalSensors.length * 3.8 + mitigationBoost * 2.8,
                8,
                99
            );

            const snapshot = {
                tick,
                timestamp: Date.now(),
                networkLoad: Number(networkLoad.toFixed(1)),
                zoneRisk,
                sensors: sensors.map((sensor) => ({
                    id: sensor.id,
                    name: sensor.name,
                    area: sensor.area,
                    lat: sensor.lat,
                    lng: sensor.lng,
                    flow: sensor.flow,
                    sludge: sensor.sludge,
                    risk: sensor.risk,
                    status: sensor.status,
                    clogProbability: sensor.clogProbability,
                    direction: sensor.direction,
                    cleanedAtTick: sensor.cleanedAtTick
                })),
                maintenanceStats: {
                    urgent: maintenanceTasks.filter((task) => task.status === 'Urgent').length,
                    scheduled: maintenanceTasks.filter((task) => task.status === 'Scheduled').length,
                    healthy: sensors.length - maintenanceTasks.length
                }
            };

            const history = [...current.sim.history, snapshot].slice(-120);
            const aiSummary = EcoFlowSim.evaluateAiForSnapshot(snapshot, current, scenario);

            store.dispatch({
                type: 'SIM_TICK_APPLIED',
                payload: {
                    tick,
                    sensors,
                    incidents,
                    alerts,
                    maintenanceTasks,
                    history,
                    aiSummary,
                    snapshot,
                    cooldowns: { lastAlertTick },
                    mitigationBoost: Number(Math.max(0, mitigationBoost - 0.35).toFixed(2)),
                    health: {
                        score: Number(healthScore.toFixed(1)),
                        activeAlerts: alerts.length,
                        affectedZones,
                        pumpUptime: Number(pumpUptime.toFixed(2)),
                        networkLoad: Number(networkLoad.toFixed(1))
                    }
                }
            });

            if (aiSummary.severity === 'critical') {
                eventBus.emit('toast', {
                    type: 'urgent',
                    message: `AI alert: ${aiSummary.anomalyClass}`
                });
            }

            eventBus.emit('simulation:tick', snapshot);
        }

        function startSimulation(options = {}) {
            if (typeof options.seed === 'number') {
                rng = mulberry32(options.seed);
                store.dispatch({ type: 'SIM_SEED_SET', payload: options.seed });
            }

            if (options.scenario) {
                store.dispatch({ type: 'SIM_SCENARIO_SET', payload: options.scenario });
            }

            ensureSensors();

            if (timerId) {
                window.clearInterval(timerId);
            }

            store.dispatch({ type: 'SIMULATION_RUNNING_SET', payload: true });
            stepSimulation();
            timerId = window.setInterval(stepSimulation, 2000);
        }

        function stopSimulation() {
            if (timerId) {
                window.clearInterval(timerId);
                timerId = null;
            }

            store.dispatch({ type: 'SIMULATION_RUNNING_SET', payload: false });
        }

        function setScenario(nextScenario) {
            if (!EcoFlowSim.scenarios[nextScenario]) {
                return;
            }

            const state = store.getState();
            const seed = scenarioSeed(state.sim.seed, nextScenario);
            rng = mulberry32(seed);

            store.dispatch({ type: 'SIM_SCENARIO_SET', payload: nextScenario });
            store.dispatch({
                type: 'NETWORK_SENSORS_INITIALIZED',
                payload: initializeSensors(data.drainagePoints, rng)
            });

            eventBus.emit('toast', {
                type: 'info',
                message: `Scenario switched to ${EcoFlowSim.scenarios[nextScenario].name}`
            });
        }

        function queueValveCommand(valveId, desiredState, retryDepth = 0) {
            const state = store.getState();
            const valve = state.network.valves.find((item) => item.id === valveId);
            if (!valve) {
                return;
            }

            const finalState = desiredState || (valve.state === 'ON' ? 'OFF' : 'ON');

            store.dispatch({
                type: 'VALVE_COMMAND_QUEUED',
                payload: { valveId, desiredState: finalState }
            });

            window.setTimeout(() => {
                store.dispatch({ type: 'VALVE_COMMAND_IN_FLIGHT', payload: { valveId } });
            }, 180);

            const scenario = EcoFlowSim.scenarios[store.getState().sim.scenario] || EcoFlowSim.scenarios.normal_ops;
            const latency = Math.floor(randomRange(rng, 750, 1800));

            window.setTimeout(() => {
                const latestState = store.getState();
                const latestValve = latestState.network.valves.find((item) => item.id === valveId);
                if (!latestValve) {
                    return;
                }

                const failureBias = scenario.valveFailureRate + (latestState.sim.health.networkLoad > 75 ? 0.08 : 0);
                const success = rng() > failureBias;

                if (success) {
                    store.dispatch({
                        type: 'VALVE_COMMAND_SUCCESS',
                        payload: { valveId, desiredState: finalState }
                    });
                    eventBus.emit('toast', {
                        type: 'success',
                        message: `${latestValve.label} switched ${finalState}`
                    });
                    return;
                }

                const canRetry = retryDepth < 2;
                store.dispatch({
                    type: 'VALVE_COMMAND_FAILED',
                    payload: { valveId, retry: canRetry }
                });
                eventBus.emit('toast', {
                    type: 'warning',
                    message: `${latestValve.label} command failed${canRetry ? ', retrying...' : ''}`
                });

                if (canRetry) {
                    window.setTimeout(() => queueValveCommand(valveId, finalState, retryDepth + 1), 850);
                }
            }, latency);
        }

        function applyMitigation(type) {
            const map = {
                dispatch_crew: 'Maintenance crew dispatched to top-risk zones.',
                preflush_network: 'Network pre-flush initiated in sludge-heavy sectors.',
                reroute_north: 'Flow reroute applied to reduce pressure on southern corridors.'
            };

            store.dispatch({ type: 'MITIGATION_APPLIED', payload: { type } });
            eventBus.emit('toast', { type: 'success', message: map[type] || 'Mitigation action applied.' });
        }

        return {
            startSimulation,
            stopSimulation,
            stepSimulation,
            setScenario,
            queueValveCommand,
            applyMitigation
        };
    }

    EcoFlowSim.createSimulationEngine = createSimulationEngine;
})();
