/**
 * Boss mechanics manager
 */
export class BossMechanics {
    // Mechanic states
    enrageState = {
        type: 'enrage',
        triggered: false,
        warning: false,
        warningTime: 0,
        effectActive: false,
    };
    healState = {
        type: 'heal',
        triggered: false,
        warning: false,
        warningTime: 0,
        effectActive: false,
    };
    ultimateState = {
        type: 'ultimate',
        triggered: false,
        warning: false,
        warningTime: 0,
        effectActive: false,
    };
    // Ultimate timing
    ultimateTimer = 0;
    ultimateCooldown = 30; // 30 seconds
    // Mechanic thresholds
    enrageThreshold = 0.5; // 50% HP
    healThreshold = 0.25; // 25% HP
    // Warning duration
    warningDuration = 3; // 3 seconds
    // ATK multiplier for enrage
    enrageAtkMultiplier = 1.5; // +50% ATK
    // Heal amount
    healAmount = 0.3; // 30% of max HP
    /**
     * Update boss mechanics
     */
    update(deltaTime, currentHP, maxHP, _combatTime) {
        void _combatTime;
        const hpPercent = currentHP.dividedBy(maxHP).toNumber();
        // Check enrage (50% HP threshold)
        if (hpPercent <= this.enrageThreshold && !this.enrageState.triggered) {
            this.enrageState.triggered = true;
            this.enrageState.effectActive = true;
        }
        // Check heal (25% HP threshold)
        let healAmount = null;
        if (hpPercent <= this.healThreshold && !this.healState.triggered) {
            this.healState.triggered = true;
            this.healState.effectActive = true;
            healAmount = maxHP.times(this.healAmount);
        }
        // Update ultimate timer
        this.ultimateTimer += deltaTime;
        // Check ultimate (every 30 seconds)
        let ultimateDamageMultiplier = null;
        if (this.ultimateTimer >= this.ultimateCooldown) {
            if (!this.ultimateState.warning) {
                // Start warning phase
                this.ultimateState.warning = true;
                this.ultimateState.warningTime = 0;
            }
            else {
                // Update warning timer
                this.ultimateState.warningTime += deltaTime;
                // Trigger ultimate after warning duration
                if (this.ultimateState.warningTime >= this.warningDuration) {
                    this.ultimateState.triggered = true;
                    this.ultimateState.effectActive = true;
                    this.ultimateState.warning = false;
                    this.ultimateTimer = 0; // Reset cooldown
                    this.ultimateState.warningTime = 0;
                    ultimateDamageMultiplier = 3.0; // 300% damage
                }
            }
        }
        return {
            enrageTriggered: this.enrageState.triggered && this.enrageState.effectActive,
            healTriggered: this.healState.triggered && healAmount !== null,
            ultimateTriggered: this.ultimateState.triggered && this.ultimateState.effectActive,
            enrageWarning: false, // Enrage is instant, no warning
            healWarning: false, // Heal is instant, no warning
            ultimateWarning: this.ultimateState.warning,
            healAmount,
            ultimateDamageMultiplier,
        };
    }
    /**
     * Get enrage ATK multiplier
     */
    getEnrageMultiplier() {
        return this.enrageState.effectActive ? this.enrageAtkMultiplier : 1.0;
    }
    /**
     * Check if enrage is active
     */
    isEnraged() {
        return this.enrageState.effectActive;
    }
    /**
     * Check if ultimate warning is active
     */
    isUltimateWarning() {
        return this.ultimateState.warning;
    }
    /**
     * Get ultimate warning progress (0-1)
     */
    getUltimateWarningProgress() {
        if (!this.ultimateState.warning)
            return 0;
        return Math.min(1, this.ultimateState.warningTime / this.warningDuration);
    }
    /**
     * Reset boss mechanics
     */
    reset() {
        this.enrageState = {
            type: 'enrage',
            triggered: false,
            warning: false,
            warningTime: 0,
            effectActive: false,
        };
        this.healState = {
            type: 'heal',
            triggered: false,
            warning: false,
            warningTime: 0,
            effectActive: false,
        };
        this.ultimateState = {
            type: 'ultimate',
            triggered: false,
            warning: false,
            warningTime: 0,
            effectActive: false,
        };
        this.ultimateTimer = 0;
    }
    /**
     * Reset ultimate triggered flag (for next attack)
     */
    resetUltimateTriggered() {
        this.ultimateState.triggered = false;
        this.ultimateState.effectActive = false;
    }
}
/**
 * Create a new boss mechanics instance
 */
export function createBossMechanics() {
    return new BossMechanics();
}
