import { resolveBountyDestination } from '../../utils/bountyRouting.js';
import { getLiveBountyBoardSlot, inspectLiveBountyBoard, LIVE_BOUNTY_BOARD_SIZE, LIVE_BOUNTY_BOARD_SLOTS, } from '../world/bountyBoardContract.js';
import { normalizeCityModulesForLiveSlice } from '../world/liveWorldSchema.js';
export const LIVE_BOUNTY_DIFFICULTIES = ['easy', 'medium', 'hard'];
export function getLiveBountyModules(cityModules) {
    return normalizeCityModulesForLiveSlice(cityModules);
}
export function isLiveBountyDescription(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
export function isLiveBountyBoardEntry(args) {
    const { bounty, cityId, cityIndex, cityModules, difficulty } = args;
    if (bounty.cityId !== cityId || bounty.cityIndex !== cityIndex || bounty.difficulty !== difficulty)
        return false;
    if (!isLiveBountyDescription(bounty.description))
        return false;
    const destination = resolveBountyDestination({
        cityId,
        bountyKind: bounty.kind,
        cityModules: getLiveBountyModules(cityModules),
    });
    return destination.kind !== 'unavailable';
}
export function isLiveBountyBoard(args) {
    return inspectLiveBountyBoard(args).valid;
}
export function getAvailableLiveBountyTemplates(args) {
    const { templates, cityId, cityIndex, cityModules } = args;
    const liveModules = getLiveBountyModules(cityModules);
    return templates.filter((template) => {
        if ((template.minCityIndex ?? 0) > cityIndex)
            return false;
        if (!isLiveBountyDescription(template.desc))
            return false;
        const destination = resolveBountyDestination({ cityId, bountyKind: template.kind, cityModules: liveModules });
        return destination.kind !== 'unavailable';
    });
}
export function selectLiveBountyTemplate(args) {
    const { templates, slotIndex, cityIndex, refreshSeed } = args;
    const slot = getLiveBountyBoardSlot(slotIndex);
    if (!slot)
        return null;
    if (templates.length === 0)
        return null;
    const pickIndex = Math.abs(cityIndex + refreshSeed + slotIndex) % templates.length;
    return templates[pickIndex];
}
export function buildLiveBountyDescription(template, target) {
    return template.desc.replace(/\{target\}/g, target.toString()).trim();
}
export function getBountyKindKey(kind) {
    return kind;
}
export function getSupportTemplateCityIndexById(templates) {
    return Object.fromEntries(templates
        .filter((template) => template.kind === 'CRAFT_COMPLETE' || template.kind === 'EXPEDITION_COMPLETE')
        .map((template) => [template.id, template.minCityIndex ?? 0]));
}
export function getTemplatesForLiveBountySlot(args) {
    const { templates, slotIndex, cityId, cityIndex, cityModules } = args;
    const slot = getLiveBountyBoardSlot(slotIndex);
    if (!slot)
        return [];
    const liveModules = getLiveBountyModules(cityModules);
    return templates.filter((template) => {
        if (!slot.allowedKinds.includes(template.kind))
            return false;
        if (!template.difficulties?.includes(slot.difficulty))
            return false;
        if (!isLiveBountyDescription(template.desc))
            return false;
        if (slot.role === 'support') {
            if ((template.minCityIndex ?? 0) !== cityIndex)
                return false;
        }
        else if ((template.minCityIndex ?? 0) > cityIndex) {
            return false;
        }
        const destination = resolveBountyDestination({ cityId, bountyKind: template.kind, cityModules: liveModules });
        return destination.kind === 'module';
    });
}
export function getCanonicalLiveBountyDifficultyOrder() {
    return LIVE_BOUNTY_BOARD_SLOTS.map((slot) => slot.difficulty);
}
export { LIVE_BOUNTY_BOARD_SIZE };
