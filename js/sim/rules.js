(() => {
    const EcoFlowSim = (window.EcoFlowSim = window.EcoFlowSim || {});

    function evaluateAiForSnapshot(snapshot, state, scenario) {
        const sensorCount = snapshot.sensors.length || 1;
        const criticalSensors = snapshot.sensors.filter((sensor) => sensor.status === 'critical').length;
        const warningSensors = snapshot.sensors.filter((sensor) => sensor.status === 'warning').length;
        const avgClog = snapshot.sensors.reduce((sum, sensor) => sum + sensor.clogProbability, 0) / sensorCount;

        const rainfallSignal = scenario.rainfall * 100;
        const loadSignal = snapshot.networkLoad;
        const alertSignal = criticalSensors * 5 + warningSensors * 2;
        const clogSignal = avgClog * 35;
        const mitigationLift = state.sim.mitigationBoost || 0;

        const riskScore = Math.max(
            0,
            Math.min(100, Math.round((rainfallSignal * 0.27) + (loadSignal * 0.35) + alertSignal + clogSignal - mitigationLift * 5))
        );

        let anomalyClass = 'Stable';
        let severity = 'ok';
        let recommendation = 'Maintain current routing and continue scheduled cleaning.';

        if (riskScore >= 80) {
            anomalyClass = 'Critical surge risk';
            severity = 'critical';
            recommendation = 'Activate emergency reroute, dispatch crew to top-risk drains, and lock high-load valves to safe mode.';
        } else if (riskScore >= 60) {
            anomalyClass = 'Elevated overflow risk';
            severity = 'warning';
            recommendation = 'Pre-position maintenance crew and pre-flush high-sludge corridors.';
        } else if (riskScore >= 40) {
            anomalyClass = 'Moderate turbulence';
            severity = 'watch';
            recommendation = 'Run preventive valve balancing and monitor risk trend.';
        }

        const topZones = Object.entries(snapshot.zoneRisk)
            .sort((a, b) => b[1].avgRisk - a[1].avgRisk)
            .slice(0, 2)
            .map((entry) => entry[0]);

        const rationale = [
            `Rainfall proxy: ${Math.round(rainfallSignal)} / 100`,
            `Network load: ${Math.round(loadSignal)}%`,
            `Critical sensors: ${criticalSensors}`,
            `Warning sensors: ${warningSensors}`,
            `Avg clog probability: ${(avgClog * 100).toFixed(1)}%`,
            `Mitigation boost active: ${mitigationLift > 0 ? `+${mitigationLift.toFixed(1)}` : 'None'}`,
            `Top risk zones: ${topZones.join(', ') || 'None'}`
        ];

        return {
            riskScore,
            anomalyClass,
            recommendation,
            rationale,
            severity
        };
    }

    EcoFlowSim.evaluateAiForSnapshot = evaluateAiForSnapshot;
})();
