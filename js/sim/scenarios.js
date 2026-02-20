(() => {
    const EcoFlowSim = (window.EcoFlowSim = window.EcoFlowSim || {});

    EcoFlowSim.scenarios = {
        normal_ops: {
            name: 'Normal Ops',
            description: 'Standard drainage operations with mild rainfall and regular maintenance conditions.',
            rainfall: 0.2,
            flowBias: 0,
            riskBias: 8,
            sludgeGrowth: 0.7,
            valveFailureRate: 0.06,
            pumpStress: 0.04
        },
        heavy_rain: {
            name: 'Heavy Rain',
            description: 'Intense downpour causing high flow rates, rapid sludge buildup, and elevated risk across all zones.',
            rainfall: 0.9,
            flowBias: 14,
            riskBias: 18,
            sludgeGrowth: 1.3,
            valveFailureRate: 0.11,
            pumpStress: 0.16
        },
        blockage_cascade: {
            name: 'Blockage Cascade',
            description: 'Multiple blockages propagating through the network, causing severe sludge accumulation and valve stress.',
            rainfall: 0.45,
            flowBias: 9,
            riskBias: 23,
            sludgeGrowth: 1.8,
            valveFailureRate: 0.14,
            pumpStress: 0.19
        },
        pump_failure: {
            name: 'Pump Failure',
            description: 'Primary pump station failure leading to reduced throughput, increased valve failures, and pump stress.',
            rainfall: 0.35,
            flowBias: 11,
            riskBias: 20,
            sludgeGrowth: 1.1,
            valveFailureRate: 0.18,
            pumpStress: 0.28
        }
    };
})();
