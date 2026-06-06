function proofSourceForMethod(method) {
    if (method === 'safety_net_bypass')
        return 'safety_net';
    if (method === 'clean_clear' || method === 'strained_clear')
        return 'gate_clear';
    return 'unknown';
}
function memoryLineForEvent(payload) {
    const toRealmName = payload.toRealmName ?? `Realm ${payload.toRealmIndex}`;
    if (payload.method === 'safety_net_bypass')
        return `Echo: Safety Net secured the proof for ${toRealmName}.`;
    if (payload.method === 'clean_clear')
        return `Echo: ${toRealmName} established by clean clear.`;
    if (payload.method === 'strained_clear')
        return `Echo: ${toRealmName} formed after a strained gate clear.`;
    if (payload.method === 'cap_transition')
        return `Echo: ${toRealmName} reached the current chapter cap.`;
    return `Echo: ${toRealmName} entered this life record.`;
}
export function buildBreakthroughEcho(event) {
    const payload = event.payload;
    if (!payload.major)
        return null;
    return {
        echoId: `breakthrough-echo-${payload.timestamp}-${payload.toRealmIndex}`,
        createdAt: payload.timestamp,
        fromRealmIndex: payload.fromRealmIndex,
        fromRealmName: payload.fromRealmName ?? `Realm ${payload.fromRealmIndex}`,
        toRealmIndex: payload.toRealmIndex,
        toRealmName: payload.toRealmName ?? `Realm ${payload.toRealmIndex}`,
        method: payload.method ?? 'unknown',
        proofItemId: payload.gateItemIdSpent ?? null,
        proofItemName: payload.gateItemNameSpent ?? null,
        proofSource: proofSourceForMethod(payload.method),
        strongestBlockerOvercome: null,
        doctrineLine: null,
        cityUnlockedId: payload.cityUnlockedIds?.[0] ?? null,
        cityUnlockedName: payload.cityUnlockedNames?.[0] ?? null,
        memoryLine: memoryLineForEvent(payload),
    };
}
