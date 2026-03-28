import { CANONICAL_MAJOR_REALMS } from '../contract/realmMap.js';
import { getContentCapRealm } from '../contract/index.js';
const LIVE_REALM_NAMES = {
    qi_condensation: 'Qi Condensation',
    foundation_establishment: 'Foundation Establishment',
    core_formation: 'Core Formation',
    nascent_soul: 'Nascent Soul',
    soul_formation: 'Soul Formation',
    spirit_severing: 'Spirit Severing',
};
const LIVE_REALM_MAJOR_LABELS = {
    qi_condensation: 'Mortal',
    foundation_establishment: 'Mortal',
    core_formation: 'Spiritual',
    nascent_soul: 'Spiritual',
    soul_formation: 'Spiritual',
    spirit_severing: 'Transcendent',
};
export const LIVE_REALM_PROJECTION = CANONICAL_MAJOR_REALMS.map((id, index) => ({
    id,
    index,
    name: LIVE_REALM_NAMES[id],
    majorRealm: LIVE_REALM_MAJOR_LABELS[id],
}));
const SEMESTER_CAP_INDEX = LIVE_REALM_PROJECTION.length - 1;
export const getOrderedLiveRealms = () => LIVE_REALM_PROJECTION;
export const clampRealmIndexToSemesterSlice = (realmIndex) => {
    if (!Number.isFinite(realmIndex))
        return 0;
    return Math.min(SEMESTER_CAP_INDEX, Math.max(0, Math.floor(realmIndex)));
};
export const getLiveRealmByIndex = (realmIndex) => LIVE_REALM_PROJECTION[clampRealmIndexToSemesterSlice(realmIndex)] ?? LIVE_REALM_PROJECTION[0];
export const getLiveRealmNameByIndex = (realmIndex) => getLiveRealmByIndex(realmIndex).name;
export const getLiveRealmById = (realmId) => LIVE_REALM_PROJECTION.find((realm) => realm.id === realmId) ?? LIVE_REALM_PROJECTION[0];
export const getLiveRealmNameById = (realmId) => getLiveRealmById(realmId).name;
export const getNextLiveRealm = (realmIndex) => {
    const nextIndex = clampRealmIndexToSemesterSlice(realmIndex) + 1;
    return nextIndex > SEMESTER_CAP_INDEX ? null : LIVE_REALM_PROJECTION[nextIndex] ?? null;
};
export const hasNextLiveRealm = (realmIndex) => getNextLiveRealm(realmIndex) !== null;
export const isAtSemesterCap = (realmIndex) => clampRealmIndexToSemesterSlice(realmIndex) >= SEMESTER_CAP_INDEX;
export const getSemesterCapRealm = () => LIVE_REALM_PROJECTION[SEMESTER_CAP_INDEX];
export const isSemesterCapRealmId = (realmId) => realmId === getSemesterCapRealm().id;
export const isContractAtSemesterCap = (contract) => getContentCapRealm(contract) === getSemesterCapRealm().id;
