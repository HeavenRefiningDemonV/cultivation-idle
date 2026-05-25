export function createEmptyDaoRequirementLedger() {
    return {
        hardGates: [],
        readinessFloors: [],
        supportReserves: [],
        sourceRoutes: [],
        optionalOptimizations: [],
        recentOmens: [],
    };
}
export function toneFromRunCompassInfoTone(tone) {
    if (tone === 'success')
        return 'success';
    if (tone === 'warning')
        return 'warning';
    if (tone === 'muted')
        return 'muted';
    return 'neutral';
}
function rowStateFromTone(tone) {
    if (tone === 'success')
        return 'met';
    if (tone === 'danger')
        return 'blocked';
    if (tone === 'warning')
        return 'unmet';
    if (tone === 'muted')
        return 'unknown';
    return 'partial';
}
function obstructionTone(obstruction) {
    if (obstruction.severity === 'success')
        return 'success';
    if (obstruction.severity === 'warning')
        return 'warning';
    if (obstruction.severity === 'danger')
        return 'danger';
    if (obstruction.severity === 'none')
        return 'muted';
    return 'info';
}
function stateFromObstruction(obstruction) {
    if (obstruction.kind === 'none')
        return 'resolved';
    if (obstruction.kind === 'attempt_gate_now')
        return 'met';
    return rowStateFromTone(obstructionTone(obstruction));
}
function bucketForObstruction(obstruction, primaryRoute) {
    switch (obstruction.kind) {
        case 'life_setup_missing_path':
        case 'life_setup_missing_heart_law':
        case 'life_setup_missing_breath_focus':
        case 'content_cap':
        case 'breakthrough_qi_short':
        case 'breakthrough_gate_proof_missing':
        case 'gate_not_at_realm_edge':
        case 'gate_lifecycle_locked':
        case 'required_item_missing':
        case 'source_route_locked':
        case 'invalid_state':
        case 'unknown':
            return 'hard_gate';
        case 'prestige_recommended':
            return primaryRoute.target?.kind === 'tab' && primaryRoute.target.tab === 'prestige'
                ? 'hard_gate'
                : 'optional_optimization';
        case 'gate_recent_failure':
        case 'readiness_shortfall':
        case 'forge_floor_shortfall':
        case 'apothecary_prep_shortfall':
        case 'build_correction_gap':
        case 'manual_pavilion_gap':
            return 'readiness_floor';
        case 'safety_net_available':
        case 'bounty_merit_shortfall':
        case 'expedition_shortage_smoothing':
            return 'support_reserve';
        case 'attempt_gate_now':
        case 'none':
            return 'optional_optimization';
    }
}
function pushRow(ledger, row) {
    switch (row.bucket) {
        case 'hard_gate':
            ledger.hardGates.push(row);
            return;
        case 'readiness_floor':
            ledger.readinessFloors.push(row);
            return;
        case 'support_reserve':
            ledger.supportReserves.push(row);
            return;
        case 'source_route':
            ledger.sourceRoutes.push(row);
            return;
        case 'optional_optimization':
            ledger.optionalOptimizations.push(row);
            return;
        case 'recent_omen':
            ledger.recentOmens.push(row);
            return;
    }
}
function primaryObstructionRow(context) {
    const bucket = bucketForObstruction(context.obstruction, context.primaryRoute);
    if (context.obstruction.kind === 'none')
        return null;
    return {
        id: `primary-${context.obstruction.kind}`,
        bucket,
        label: context.obstruction.label,
        detail: context.obstruction.detail,
        currentLabel: null,
        targetLabel: null,
        state: stateFromObstruction(context.obstruction),
        tone: obstructionTone(context.obstruction),
        route: context.primaryRoute,
        source: context.obstruction.source,
        proofLine: `Source: Dao Mandate resolver / ${context.obstruction.source}`,
        sourceLine: `Primary obstruction: ${context.obstruction.kind}`,
        priority: 1,
    };
}
function sourceForReadinessRow(row) {
    const normalized = `${row.id} ${row.label}`.toLowerCase();
    if (normalized.includes('forge') || normalized.includes('build') || normalized.includes('manual'))
        return 'build';
    if (normalized.includes('merit') || normalized.includes('reserve') || normalized.includes('medicine'))
        return 'economy';
    if (normalized.includes('gate'))
        return 'trial_lifecycle';
    return 'readiness';
}
function readinessLedgerRows(surface, context) {
    return surface.readiness.rows.map((row, index) => {
        const tone = toneFromRunCompassInfoTone(row.tone);
        const route = rowStateFromTone(tone) === 'unmet' || rowStateFromTone(tone) === 'blocked'
            ? context.primaryRoute
            : null;
        return {
            id: `readiness-${row.id}`,
            bucket: 'readiness_floor',
            label: row.label,
            detail: row.detail,
            currentLabel: null,
            targetLabel: null,
            state: rowStateFromTone(tone),
            tone,
            route,
            source: sourceForReadinessRow(row),
            proofLine: `Source: Dao Mandate readiness / ${row.id}`,
            sourceLine: surface.readiness.primaryShortfallLabel,
            priority: 20 + index,
        };
    });
}
function gateTrialRoute(context) {
    return context.primaryRoute.target?.kind === 'world_module' && context.primaryRoute.target.moduleKey === 'gateTrial'
        ? context.primaryRoute
        : null;
}
function breakthroughRoute(context) {
    return context.primaryRoute.target?.kind === 'tab' && context.primaryRoute.target.tab === 'cultivation'
        ? context.primaryRoute
        : null;
}
function currentGateRows(surface, context) {
    const gate = surface.currentGate;
    if (!gate)
        return [];
    const directGateRoute = gateTrialRoute(context);
    const directBreakthroughRoute = breakthroughRoute(context);
    const rows = [
        {
            id: `gate-state-${gate.trialId}`,
            bucket: 'hard_gate',
            label: `Gate state: ${gate.gateLabel}`,
            detail: `${gate.gateLabel} is ${gate.lifecycleState} for ${gate.fromRealmLabel} to ${gate.toRealmLabel}.`,
            currentLabel: gate.lifecycleState,
            targetLabel: gate.canAttempt ? 'Attemptable' : gate.resolved ? 'Resolved' : 'Available',
            state: gate.resolved ? 'resolved' : gate.canAttempt ? 'met' : 'blocked',
            tone: gate.resolved || gate.canAttempt ? 'success' : 'warning',
            route: gate.resolved ? directBreakthroughRoute : gate.canAttempt ? directGateRoute : null,
            source: 'trial_lifecycle',
            proofLine: 'Source: Dao Mandate gate lifecycle',
            sourceLine: gate.trialId,
            priority: 5,
        },
    ];
    if (gate.gateProofItemId || gate.gateProofItemName) {
        rows.push({
            id: `gate-proof-${gate.trialId}`,
            bucket: 'hard_gate',
            label: `Gate proof: ${gate.gateProofItemName ?? gate.gateProofItemId}`,
            detail: `${gate.gateProofItemName ?? gate.gateProofItemId} is the proof item for breakthrough.`,
            currentLabel: gate.resolved || gate.canBreakthrough ? 'Resolved' : gate.canAttempt ? 'Attempt gate' : 'Missing',
            targetLabel: gate.gateProofItemName ?? gate.gateProofItemId,
            state: gate.resolved || gate.canBreakthrough ? 'resolved' : gate.canAttempt ? 'partial' : 'unmet',
            tone: gate.resolved || gate.canBreakthrough ? 'success' : gate.canAttempt ? 'info' : 'warning',
            route: gate.resolved || gate.canBreakthrough ? directBreakthroughRoute : gate.canAttempt ? directGateRoute : null,
            source: 'trial_lifecycle',
            proofLine: 'Source: Dao Mandate gate proof',
            sourceLine: gate.gateProofItemId,
            priority: 6,
        });
    }
    if (gate.canBreakthrough) {
        rows.push({
            id: `gate-breakthrough-${gate.trialId}`,
            bucket: 'hard_gate',
            label: 'Breakthrough proof resolved',
            detail: `${gate.gateLabel} proof and Qi are ready for breakthrough.`,
            currentLabel: 'Ready',
            targetLabel: gate.toRealmLabel,
            state: 'met',
            tone: 'success',
            route: directBreakthroughRoute,
            source: 'progression',
            proofLine: 'Source: Dao Mandate breakthrough proof',
            sourceLine: gate.trialId,
            priority: 7,
        });
    }
    return rows;
}
function safetyNetRows(surface, context) {
    const safetyNet = surface.safetyNet;
    if (!safetyNet || safetyNet.state === 'hidden')
        return [];
    return [{
            id: `safety-net-${safetyNet.state}`,
            bucket: 'support_reserve',
            label: safetyNet.label,
            detail: safetyNet.detail,
            currentLabel: safetyNet.progressLine,
            targetLabel: null,
            state: safetyNet.state === 'available' ? 'met' : safetyNet.state === 'blocked' ? 'blocked' : 'partial',
            tone: safetyNet.state === 'available' ? 'success' : safetyNet.state === 'blocked' ? 'warning' : 'info',
            route: context.safetyNetRoute ?? null,
            source: 'trial_lifecycle',
            proofLine: 'Source: Dao Mandate safety net',
            sourceLine: safetyNet.progressLine,
            priority: 30,
        }];
}
function sourceMapRows(context) {
    return context.sourceMap.map((entry, index) => ({
        id: `source-route-${entry.id}`,
        bucket: 'source_route',
        label: entry.neededThingLabel,
        detail: entry.bestSources[0]?.detail ?? entry.sinkLabel,
        currentLabel: null,
        targetLabel: entry.expectedImpactLabel,
        state: entry.bestSources.length > 0 ? 'partial' : 'unknown',
        tone: entry.bestSources.length > 0 ? 'info' : 'muted',
        route: entry.route,
        source: entry.route?.source ?? 'economy',
        proofLine: 'Source: known source provenance',
        sourceLine: entry.problemKind,
        priority: 50 + index,
    }));
}
function optionalRouteRows(context) {
    const seen = new Set([context.primaryRoute.id]);
    return context.secondaryRoutes
        .filter((route) => {
        if (seen.has(route.id))
            return false;
        seen.add(route.id);
        return true;
    })
        .map((route, index) => ({
        id: `optional-route-${route.id}`,
        bucket: 'optional_optimization',
        label: route.label,
        detail: route.detail,
        currentLabel: null,
        targetLabel: route.expectedDeltaLabel,
        state: route.blocked ? 'blocked' : 'partial',
        tone: route.blocked ? 'muted' : 'info',
        route,
        source: route.source,
        proofLine: 'Source: Dao Mandate secondary routes',
        sourceLine: route.id,
        priority: 70 + index,
    }));
}
function recentOmenRows(context) {
    return context.recentOmens.slice(0, 3).map((omen, index) => ({
        id: `recent-omen-${omen.id}`,
        bucket: 'recent_omen',
        label: omen.label,
        detail: omen.memoryLine,
        currentLabel: omen.rewardSummary,
        targetLabel: omen.readinessDeltaLabel,
        state: 'resolved',
        tone: omen.tone,
        route: null,
        source: 'run_delta',
        proofLine: `Source: Dao Mandate recent omens / ${omen.source}`,
        sourceLine: omen.id,
        priority: 90 + index,
    }));
}
export function buildDaoRequirementLedgerFromRunCompass(surface, context) {
    const ledger = createEmptyDaoRequirementLedger();
    const primaryRow = primaryObstructionRow(context);
    if (primaryRow)
        pushRow(ledger, primaryRow);
    for (const row of currentGateRows(surface, context))
        pushRow(ledger, row);
    for (const row of readinessLedgerRows(surface, context)) {
        if (row.state !== 'met' || row.tone === 'warning' || row.tone === 'danger') {
            pushRow(ledger, row);
        }
    }
    for (const row of safetyNetRows(surface, context))
        pushRow(ledger, row);
    for (const row of sourceMapRows(context))
        pushRow(ledger, row);
    for (const row of optionalRouteRows(context))
        pushRow(ledger, row);
    for (const row of recentOmenRows(context))
        pushRow(ledger, row);
    const buckets = [
        ledger.hardGates,
        ledger.readinessFloors,
        ledger.supportReserves,
        ledger.sourceRoutes,
        ledger.optionalOptimizations,
        ledger.recentOmens,
    ];
    for (const bucket of buckets) {
        bucket.sort((left, right) => left.priority - right.priority);
    }
    return ledger;
}
