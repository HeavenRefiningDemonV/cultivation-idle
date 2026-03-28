export const CANONICAL_MAJOR_REALMS = [
    'qi_condensation',
    'foundation_establishment',
    'core_formation',
    'nascent_soul',
    'soul_formation',
    'spirit_severing',
];
export const CANONICAL_MAJOR_REALM_NAMES = {
    qi_condensation: 'Qi Condensation',
    foundation_establishment: 'Foundation Establishment',
    core_formation: 'Core Formation',
    nascent_soul: 'Nascent Soul',
    soul_formation: 'Soul Formation',
    spirit_severing: 'Spirit Severing',
};
export const MAJOR_REALM_ALIASES = {
    golden_core: 'core_formation',
};
export const isMajorRealmId = (value) => CANONICAL_MAJOR_REALMS.includes(value);
export const normalizeMajorRealmId = (value) => {
    if (isMajorRealmId(value))
        return value;
    return MAJOR_REALM_ALIASES[value] ?? null;
};
export const getCanonicalMajorRealmIndex = (realmId) => CANONICAL_MAJOR_REALMS.indexOf(realmId);
export const getCanonicalMajorRealmName = (realmId) => CANONICAL_MAJOR_REALM_NAMES[realmId];
