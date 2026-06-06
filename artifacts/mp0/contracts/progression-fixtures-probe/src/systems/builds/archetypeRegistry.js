export const BUILD_ARCHETYPE_ORDER = Object.freeze([
    'heaven_scripture_flow',
    'heaven_insight_burst',
    'earth_iron_bastion',
    'earth_tempered_counter',
    'martial_pressure_duelist',
    'martial_sweeping_reaper',
]);
const freezeArchetype = (profile) => {
    Object.freeze(profile.primaryFamilies);
    Object.freeze(profile.secondaryFamilies);
    Object.freeze(profile.preferredSupportFlags);
    return Object.freeze(profile);
};
export const SEMESTER_BUILD_ARCHETYPES = Object.freeze([
    freezeArchetype({
        id: 'heaven_scripture_flow',
        path: 'heaven',
        label: 'Scripture Flow',
        summary: 'Buff-and-setup Heaven posture that wins through sequencing, curses, and doctrine tempo.',
        primaryFamilies: ['buff', 'setup', 'control'],
        secondaryFamilies: ['guard', 'coreDamage'],
        preferredSupportFlags: ['tempo'],
    }),
    freezeArchetype({
        id: 'heaven_insight_burst',
        path: 'heaven',
        label: 'Insight Burst',
        summary: 'Direct-pressure Heaven posture that converts setup into burst windows and boss pressure.',
        primaryFamilies: ['coreDamage', 'execute'],
        secondaryFamilies: ['setup', 'buff'],
        preferredSupportFlags: ['boss'],
    }),
    freezeArchetype({
        id: 'earth_iron_bastion',
        path: 'earth',
        label: 'Iron Bastion',
        summary: 'Defensive Earth posture built around guard, sustain, and slow inevitability.',
        primaryFamilies: ['guard', 'heal'],
        secondaryFamilies: ['buff', 'control'],
        preferredSupportFlags: ['survival'],
    }),
    freezeArchetype({
        id: 'earth_tempered_counter',
        path: 'earth',
        label: 'Tempered Counter',
        summary: 'Earth counter-build that braces, breaks defenses, and punishes openings.',
        primaryFamilies: ['guard', 'setup', 'execute'],
        secondaryFamilies: ['control', 'heal'],
        preferredSupportFlags: ['boss', 'survival'],
    }),
    freezeArchetype({
        id: 'martial_pressure_duelist',
        path: 'martial',
        label: 'Pressure Duelist',
        summary: 'Single-target Martial posture built around pressure chains and finishing windows.',
        primaryFamilies: ['coreDamage', 'execute', 'setup'],
        secondaryFamilies: ['buff', 'mobility'],
        preferredSupportFlags: ['boss', 'tempo'],
    }),
    freezeArchetype({
        id: 'martial_sweeping_reaper',
        path: 'martial',
        label: 'Sweeping Reaper',
        summary: 'Clear-speed Martial posture built around AoE tempo and fast farming.',
        primaryFamilies: ['coreDamage', 'aoe'],
        secondaryFamilies: ['execute', 'mobility'],
        preferredSupportFlags: ['farm', 'tempo'],
    }),
]);
export const BUILD_ARCHETYPE_BY_ID = Object.freeze(Object.fromEntries(SEMESTER_BUILD_ARCHETYPES.map((profile) => [profile.id, profile])));
export function getBuildArchetype(id) {
    if (id === null) {
        return null;
    }
    return BUILD_ARCHETYPE_BY_ID[id] ?? null;
}
export function getBuildArchetypesForPath(path) {
    if (path === null) {
        return [];
    }
    return SEMESTER_BUILD_ARCHETYPES.filter((profile) => profile.path === path);
}
