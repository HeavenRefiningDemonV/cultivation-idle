import Decimal from 'decimal.js';

/**
 * Boss mechanic types
 */
export type BossMechanicType = 'enrage' | 'heal' | 'ultimate';

/**
 * Boss mechanic state
 */
export interface BossMechanicState {
  type: BossMechanicType;
  triggered: boolean;
  warning: boolean;
  warningTime: number;
  effectActive: boolean;
}

/**
 * Boss mechanics manager
 */
export class BossMechanics {
  // Mechanic states
  private enrageState: BossMechanicState = {
    type: 'enrage',
    triggered: false,
    warning: false,
    warningTime: 0,
    effectActive: false,
  };

  private healState: BossMechanicState = {
    type: 'heal',
    triggered: false,
    warning: false,
    warningTime: 0,
    effectActive: false,
  };

  private ultimateState: BossMechanicState = {
    type: 'ultimate',
    triggered: false,
    warning: false,
    warningTime: 0,
    effectActive: false,
  };

  // Ultimate timing
  private ultimateTimer: number = 0;
  private ultimateCooldown: number = 30; // 30 seconds

  // Mechanic thresholds
  private enrageThreshold: number = 0.5; // 50% HP
  private healThreshold: number = 0.25; // 25% HP

  // Warning duration
  private warningDuration: number = 3; // 3 seconds

  // ATK multiplier for enrage
  private enrageAtkMultiplier: number = 1.5; // +50% ATK

  // Heal amount
  private healAmount: number = 0.3; // 30% of max HP

  /**
   * Update boss mechanics
   */
  public update(
    deltaTime: number,
    currentHP: Decimal,
    maxHP: Decimal,
    _combatTime: number
  ): {
    enrageTriggered: boolean;
    healTriggered: boolean;
    ultimateTriggered: boolean;
    enrageWarning: boolean;
    healWarning: boolean;
    ultimateWarning: boolean;
    healAmount: Decimal | null;
    ultimateDamageMultiplier: number | null;
  } {
    const hpPercent = currentHP.dividedBy(maxHP).toNumber();

    // Check enrage (50% HP threshold)
    if (hpPercent <= this.enrageThreshold && !this.enrageState.triggered) {
      this.enrageState.triggered = true;
      this.enrageState.effectActive = true;
    }

    // Check heal (25% HP threshold)
    let healAmount: Decimal | null = null;
    if (hpPercent <= this.healThreshold && !this.healState.triggered) {
      this.healState.triggered = true;
      this.healState.effectActive = true;
      healAmount = maxHP.times(this.healAmount);
    }

    // Update ultimate timer
    this.ultimateTimer += deltaTime;

    // Check ultimate (every 30 seconds)
    let ultimateDamageMultiplier: number | null = null;
    if (this.ultimateTimer >= this.ultimateCooldown) {
      if (!this.ultimateState.warning) {
        // Start warning phase
        this.ultimateState.warning = true;
        this.ultimateState.warningTime = 0;
      } else {
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
  public getEnrageMultiplier(): number {
    return this.enrageState.effectActive ? this.enrageAtkMultiplier : 1.0;
  }

  /**
   * Check if enrage is active
   */
  public isEnraged(): boolean {
    return this.enrageState.effectActive;
  }

  /**
   * Check if ultimate warning is active
   */
  public isUltimateWarning(): boolean {
    return this.ultimateState.warning;
  }

  /**
   * Get ultimate warning progress (0-1)
   */
  public getUltimateWarningProgress(): number {
    if (!this.ultimateState.warning) return 0;
    return Math.min(1, this.ultimateState.warningTime / this.warningDuration);
  }

  /**
   * Reset boss mechanics
   */
  public reset(): void {
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
  public resetUltimateTriggered(): void {
    this.ultimateState.triggered = false;
    this.ultimateState.effectActive = false;
  }
}

/**
 * Create a new boss mechanics instance
 */
export function createBossMechanics(): BossMechanics {
  return new BossMechanics();
}
