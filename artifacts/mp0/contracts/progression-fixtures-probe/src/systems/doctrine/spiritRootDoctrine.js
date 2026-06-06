import { getSpiritRootPurityMultiplierForPurity, getSpiritRootQualityMultiplierForGrade, getSpiritRootTotalMultiplierForRoot, } from '../../stores/prestigeStore.js';
export const SPIRIT_ROOT_POWER_DELTA_CAP = 0.12;
function clampSpiritRootPurity(purity) {
    if (!Number.isFinite(purity)) {
        return 0;
    }
    return Math.min(100, Math.max(0, purity));
}
export function buildSpiritRootDoctrineProfile(root) {
    if (root === null) {
        return null;
    }
    const purity = clampSpiritRootPurity(root.purity);
    const normalizedRoot = {
        grade: root.grade,
        element: root.element,
        purity,
    };
    return {
        grade: normalizedRoot.grade,
        element: normalizedRoot.element,
        purity,
        qualityMultiplier: getSpiritRootQualityMultiplierForGrade(normalizedRoot.grade),
        purityMultiplier: getSpiritRootPurityMultiplierForPurity(purity),
        totalMultiplier: getSpiritRootTotalMultiplierForRoot(normalizedRoot),
    };
}
