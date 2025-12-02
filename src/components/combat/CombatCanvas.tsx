import { useCallback, useEffect, useRef, useState } from 'react';
import { useCombatStore } from '../../stores/combatStore';
import { ParticlePool, DamageNumberPool } from './particles';
import { createAnimation, updateAnimation, ScreenShake, FlashEffect, Easing } from './animations';
import type { Animation } from './animations';
import { D } from '../../utils/numbers';
import './CombatCanvas.scss';

interface CombatCanvasProps {
  width?: number;
  height?: number;
  inCombat: boolean;
  playerHP: number;
  enemyHP: number;
}

/**
 * Zone backgrounds (gradient colors)
 */
const ZONE_BACKGROUNDS: Record<string, { top: string; bottom: string }> = {
  training_forest: { top: '#2d5016', bottom: '#1a3009' },
  spirit_cavern: { top: '#1e293b', bottom: '#0f172a' },
  mystic_mountains: { top: '#475569', bottom: '#1e293b' },
  default: { top: '#334155', bottom: '#1e293b' },
};

/**
 * Combat Canvas Component
 */
export function CombatCanvas({
  width = 800,
  height = 400,
  inCombat,
  playerHP,
  enemyHP,
}: CombatCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastLogLengthRef = useRef<number>(0);

  // Combat store
  const currentZone = useCombatStore((state) => state.currentZone);
  const currentEnemy = useCombatStore((state) => state.currentEnemy);
  const combatLog = useCombatStore((state) => state.combatLog);
  const playerMaxHP = useCombatStore((state) => state.playerMaxHP);
  const enemyMaxHP = useCombatStore((state) => state.enemyMaxHP);

  // Animation systems
  const [particlePool] = useState(() => new ParticlePool(200));
  const [damageNumbers] = useState(() => new DamageNumberPool(30));
  const [screenShake] = useState(() => new ScreenShake());
  const [flashEffect] = useState(() => new FlashEffect());

  // Entity positions and animations
  const [playerX, setPlayerX] = useState(150);
  const [enemyX, setEnemyX] = useState(650);
  const playerAnimRef = useRef<Animation | null>(null);
  const enemyAnimRef = useRef<Animation | null>(null);

  const basePlayerX = 150;
  const baseEnemyX = 650;
  const entityY = height / 2;

  /**
   * Get background colors for current zone
   */
    const getBackground = useCallback(() => {
      const zoneKey = currentZone || 'default';
      return ZONE_BACKGROUNDS[zoneKey] || ZONE_BACKGROUNDS.default;
    }, [currentZone]);

  /**
   * Draw background
   */
    const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
      const bg = getBackground();
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, bg.top);
    gradient.addColorStop(1, bg.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Ground line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height - 50);
      ctx.lineTo(width, height - 50);
      ctx.stroke();
    }, [getBackground, height, width]);

  /**
   * Draw entity (player or enemy)
   */
  const drawEntity = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isPlayer: boolean
  ) => {
    ctx.save();

    if (isPlayer) {
      // Player (blue warrior)
      ctx.fillStyle = '#3b82f6';
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 3;

      // Body
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x - 10, y - 5, 5, 0, Math.PI * 2);
      ctx.arc(x + 10, y - 5, 5, 0, Math.PI * 2);
      ctx.fill();

      // Sword
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 35, y);
      ctx.lineTo(x + 55, y - 20);
      ctx.stroke();

      // Sword handle
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x + 35, y);
      ctx.lineTo(x + 40, y + 5);
      ctx.stroke();
    } else {
      // Enemy (red beast)
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 3;

      // Body
      ctx.beginPath();
      ctx.arc(x, y, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Horns
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.moveTo(x - 20, y - 35);
      ctx.lineTo(x - 15, y - 50);
      ctx.lineTo(x - 10, y - 35);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + 20, y - 35);
      ctx.lineTo(x + 15, y - 50);
      ctx.lineTo(x + 10, y - 35);
      ctx.closePath();
      ctx.fill();

      // Eyes (glowing red)
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x - 12, y - 5, 6, 0, Math.PI * 2);
      ctx.arc(x + 12, y - 5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  };

  /**
   * Draw HP bar
   */
  const drawHPBar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    currentHP: number,
    maxHP: number,
    isPlayer: boolean
  ) => {
    const barWidth = 100;
    const barHeight = 10;
    const percent = Math.max(0, Math.min(1, currentHP / maxHP));

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - barWidth / 2, y - 60, barWidth, barHeight);

    // HP fill
    ctx.fillStyle = isPlayer ? '#22c55e' : '#ef4444';
    ctx.fillRect(x - barWidth / 2, y - 60, barWidth * percent, barHeight);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barWidth / 2, y - 60, barWidth, barHeight);
  };

  /**
   * Handle combat log updates and trigger animations
   */
    useEffect(() => {
      if (!inCombat || combatLog.length === 0) {
        lastLogLengthRef.current = 0;
      return;
    }

    // Check for new log entries
    if (combatLog.length > lastLogLengthRef.current) {
      const newEntries = combatLog.slice(lastLogLengthRef.current);
      lastLogLengthRef.current = combatLog.length;

      for (const entry of newEntries) {
        // Parse damage from log entry
        const damageMatch = entry.text.match(/(\d+) damage/);
        const isCrit = entry.text.includes('Critical');

        if (entry.type === 'player' && damageMatch) {
          // Player attacks enemy
          const damage = parseInt(damageMatch[1]);

          // Lunge animation
          playerAnimRef.current = createAnimation(
            basePlayerX,
            basePlayerX + 100,
            0.2,
            Easing.easeOutQuad,
            () => {
              // Return to position
              playerAnimRef.current = createAnimation(
                basePlayerX + 100,
                basePlayerX,
                0.2,
                Easing.easeInQuad
              );
            }
          );

          // Damage number at enemy position
          setTimeout(() => {
            damageNumbers.spawn(baseEnemyX, entityY - 50, damage, isCrit);

            // Particles on hit
            particlePool.emit(baseEnemyX, entityY, 15, {
              color: isCrit ? '#ff6b00' : '#ffffff',
              size: isCrit ? 5 : 3,
              speed: isCrit ? 4 : 2,
              life: 0.8,
            });

            // Flash on crit
            if (isCrit) {
              flashEffect.flash('#ff6b00', 0.15);
              screenShake.shake(15, 0.2);
            } else {
              screenShake.shake(5, 0.1);
            }
          }, 200);
        } else if (entry.type === 'enemy' && damageMatch) {
          // Enemy attacks player
          const damage = parseInt(damageMatch[1]);

          // Lunge animation
          enemyAnimRef.current = createAnimation(
            baseEnemyX,
            baseEnemyX - 100,
            0.2,
            Easing.easeOutQuad,
            () => {
              // Return to position
              enemyAnimRef.current = createAnimation(
                baseEnemyX - 100,
                baseEnemyX,
                0.2,
                Easing.easeInQuad
              );
            }
          );

          // Damage number at player position
          setTimeout(() => {
            damageNumbers.spawn(basePlayerX, entityY - 50, damage, isCrit);

            // Particles on hit
            particlePool.emit(basePlayerX, entityY, 15, {
              color: '#ff0000',
              size: 3,
              speed: 2,
              life: 0.8,
            });

            screenShake.shake(8, 0.15);
          }, 200);
        } else if (entry.type === 'victory') {
          // Victory particles
          particlePool.emit(baseEnemyX, entityY, 50, {
            color: '#fbbf24',
            size: 5,
            speed: 5,
            life: 2,
            spread: Math.PI * 2,
          });
          flashEffect.flash('#22c55e', 0.3);
        } else if (entry.type === 'defeat') {
          // Defeat flash
          flashEffect.flash('#ef4444', 0.5);
        }
      }
    }
    }, [combatLog, damageNumbers, entityY, flashEffect, inCombat, particlePool, screenShake]);

  /**
   * Main render loop
   */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    /**
     * Animation loop
     */
    const animate = (time: number) => {
      const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = time;

      // Cap delta time to prevent huge jumps
      const cappedDelta = Math.min(deltaTime, 0.1);

      // Update animations
      if (playerAnimRef.current?.active) {
        setPlayerX(updateAnimation(playerAnimRef.current, cappedDelta));
      }
      if (enemyAnimRef.current?.active) {
        setEnemyX(updateAnimation(enemyAnimRef.current, cappedDelta));
      }

      particlePool.update(cappedDelta);
      damageNumbers.update(cappedDelta);
      screenShake.update(cappedDelta);
      flashEffect.update(cappedDelta);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Apply screen shake
      const shake = screenShake.getOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      // Draw background
      drawBackground(ctx);

      if (inCombat && currentEnemy) {
        // Draw entities
        drawEntity(ctx, playerX, entityY, true);
        drawEntity(ctx, enemyX, entityY, false);

        // Draw HP bars
        drawHPBar(ctx, playerX, entityY, playerHP, D(playerMaxHP).toNumber(), true);
        drawHPBar(ctx, enemyX, entityY, enemyHP, D(enemyMaxHP).toNumber(), false);

        // Draw particles
        particlePool.render(ctx);

        // Draw damage numbers
        damageNumbers.render(ctx);
      } else {
        // Not in combat - show idle message
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Select a zone to begin combat', width / 2, height / 2);
      }

      ctx.restore();

      // Draw flash effect (no shake applied)
      flashEffect.render(ctx, width, height);

      // Continue loop
      rafRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    rafRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
    }, [
      width,
      height,
      inCombat,
      currentEnemy,
      currentZone,
      playerHP,
      enemyHP,
      playerMaxHP,
      enemyMaxHP,
      playerX,
      enemyX,
      damageNumbers,
      drawBackground,
      entityY,
      flashEffect,
      particlePool,
      screenShake,
    ]);

  // Reset when combat ends
    useEffect(() => {
      if (!inCombat) {
        particlePool.clear();
        damageNumbers.clear();
        setPlayerX(basePlayerX);
        setEnemyX(baseEnemyX);
        playerAnimRef.current = null;
        enemyAnimRef.current = null;
        lastLogLengthRef.current = 0;
      }
    }, [
      baseEnemyX,
      basePlayerX,
      damageNumbers,
      inCombat,
      particlePool,
    ]);

  return (
    <canvas
      ref={canvasRef}
      className={'combatCanvasCanvas'}
      style={{ maxWidth: '100%' }}
    />
  );
}
