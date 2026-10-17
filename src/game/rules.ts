/**
 * Pure game rules, math, upgrades configuration, and physics calculations.
 * Completely decoupled from React and Three.js for deterministic testing.
 */

import type {
  ComboState,
  PlayerUpgrades,
  UpgradeCategory,
  UpgradeConfig,
  VehicleState,
} from './types.ts';

export const UPGRADE_CONFIGS: Record<UpgradeCategory, UpgradeConfig> = {
  blade: {
    id: 'blade',
    name: 'Snow Blade',
    icon: 'Shield',
    color: '#38bdf8',
    tiers: [
      { level: 1, name: 'Steel Scoop (2.2m)', cost: 0, description: 'Standard plow blade for driveways and paths.', statLabel: 'Width: 2.2m' },
      { level: 2, name: 'V-Wing Blade (3.0m)', cost: 50, description: 'Expanded angled wings push more snow aside.', statLabel: 'Width: 3.0m' },
      { level: 3, name: 'Highway Sweeper (3.8m)', cost: 120, description: 'Heavy-duty steel clearing broad village avenues.', statLabel: 'Width: 3.8m' },
      { level: 4, name: 'Mega Blizzard Plow (4.8m)', cost: 240, description: 'Massive alpine clearing beast with hydraulic wings.', statLabel: 'Width: 4.8m' },
    ]
  },
  engine: {
    id: 'engine',
    name: 'Tractor Engine',
    icon: 'Zap',
    color: '#fbbf24',
    tiers: [
      { level: 1, name: 'Stock Diesel (45 HP)', cost: 0, description: 'Reliable cold-start tractor engine.', statLabel: 'Speed: 8.5 m/s' },
      { level: 2, name: 'Turbo Charger (75 HP)', cost: 60, description: 'Faster acceleration and responsive hill torque.', statLabel: 'Speed: 11.0 m/s' },
      { level: 3, name: 'Alpine Treads (110 HP)', cost: 140, description: 'Deep rubber winter tracks with agile drift turning.', statLabel: 'Speed: 13.5 m/s' },
      { level: 4, name: 'Hyper-Torque Twin-V8', cost: 260, description: 'Effortless speed through deep mountain powder.', statLabel: 'Speed: 16.0 m/s' },
    ]
  },
  heater: {
    id: 'heater',
    name: 'Thermo-Melt Blade',
    icon: 'Flame',
    color: '#f87171',
    tiers: [
      { level: 1, name: 'Unheated Steel', cost: 0, description: 'Relies solely on mechanical scraping.', statLabel: 'Melt Bonus: 0%' },
      { level: 2, name: 'Heated Edge', cost: 45, description: 'Warm blade melts hard ice crusts for extra points.', statLabel: 'Melt Bonus: +25%' },
      { level: 3, name: 'Steam Jets', cost: 110, description: 'Blasts superheated steam into deep snowbanks.', statLabel: 'Melt Bonus: +60%' },
      { level: 4, name: 'Magma Coil Blade', cost: 220, description: 'Vaporizes packed snowdrifts in sizzling clouds.', statLabel: 'Melt Bonus: +100%' },
    ]
  },
  salt: {
    id: 'salt',
    name: 'Salt Spreader',
    icon: 'Sparkles',
    color: '#a78bfa',
    tiers: [
      { level: 1, name: 'No Spreader', cost: 0, description: 'Manual plowing only.', statLabel: 'Radius: 0m' },
      { level: 2, name: 'Gravity Hopper', cost: 40, description: 'Scatters rock salt behind the plow to melt trailing snow.', statLabel: 'Radius: 1.8m' },
      { level: 3, name: 'Rotary Spinner', cost: 100, description: 'Wide-arc centrifugal salt spreader.', statLabel: 'Radius: 3.2m' },
      { level: 4, name: 'Cryo-Brine Cannon', cost: 200, description: 'Covers the street with premium fast-acting brine.', statLabel: 'Radius: 4.8m' },
    ]
  },
  boost: {
    id: 'boost',
    name: 'Nitro Turbo Boost',
    icon: 'Wind',
    color: '#34d399',
    tiers: [
      { level: 1, name: 'Standard Boost Tank', cost: 0, description: 'Short speed surge on Spacebar.', statLabel: 'Cap: 100' },
      { level: 2, name: 'High-Flow Injector', cost: 50, description: 'Faster boost recharge and longer duration.', statLabel: 'Recharge: +40%' },
      { level: 3, name: 'Cryo-Nitrous Chamber', cost: 130, description: 'Massive burst of drift acceleration.', statLabel: 'Speed: +65%' },
      { level: 4, name: 'Perpetual Vortex Jet', cost: 250, description: 'Rapid auto-recharging rocket surge.', statLabel: 'Recharge: +120%' },
    ]
  }
};

export const INITIAL_UPGRADES: PlayerUpgrades = {
  blade: 1,
  engine: 1,
  heater: 1,
  salt: 1,
  boost: 1,
};

export interface UpgradeModifiers {
  bladeWidth: number; // in world units
  maxForwardSpeed: number;
  maxReverseSpeed: number;
  acceleration: number;
  turnSpeed: number;
  meltBonusMultiplier: number;
  saltRadius: number;
  boostMaxSpeedMultiplier: number;
  boostRechargeRate: number; // per second
  boostDrainRate: number; // per second
}

export function getUpgradeModifiers(upgrades: PlayerUpgrades): UpgradeModifiers {
  // Blade widths: 2.2, 3.0, 3.8, 4.8
  const bladeWidths = [2.2, 3.0, 3.8, 4.8];
  const bladeWidth = bladeWidths[Math.min(Math.max(upgrades.blade - 1, 0), 3)];

  // Engine speeds: 8.5, 11.0, 13.5, 16.0
  const speeds = [8.5, 11.0, 13.5, 16.0];
  const maxForwardSpeed = speeds[Math.min(Math.max(upgrades.engine - 1, 0), 3)];
  const maxReverseSpeed = maxForwardSpeed * 0.45;
  const acceleration = 7.0 + (upgrades.engine - 1) * 2.2;
  const turnSpeed = 2.4 + (upgrades.engine - 1) * 0.35;

  // Heater melt bonuses: 1.0, 1.25, 1.6, 2.0
  const meltBonuses = [1.0, 1.25, 1.6, 2.0];
  const meltBonusMultiplier = meltBonuses[Math.min(Math.max(upgrades.heater - 1, 0), 3)];

  // Salt radius: 0, 1.8, 3.2, 4.8
  const saltRadii = [0, 1.8, 3.2, 4.8];
  const saltRadius = saltRadii[Math.min(Math.max(upgrades.salt - 1, 0), 3)];

  // Boost
  const boostSpeedMults = [1.45, 1.55, 1.68, 1.85];
  const rechargeRates = [12, 18, 25, 35]; // per second
  const boostMaxSpeedMultiplier = boostSpeedMults[Math.min(Math.max(upgrades.boost - 1, 0), 3)];
  const boostRechargeRate = rechargeRates[Math.min(Math.max(upgrades.boost - 1, 0), 3)];
  const boostDrainRate = 30; // drains in ~3.3 seconds of continuous use

  return {
    bladeWidth,
    maxForwardSpeed,
    maxReverseSpeed,
    acceleration,
    turnSpeed,
    meltBonusMultiplier,
    saltRadius,
    boostMaxSpeedMultiplier,
    boostRechargeRate,
    boostDrainRate,
  };
}

export function calculateComboTier(multiplier: number): { name: string; color: string } {
  if (multiplier >= 4.5) return { name: 'FROST LEGEND!', color: '#e879f9' };
  if (multiplier >= 3.5) return { name: 'BLIZZARD BLITZ!', color: '#38bdf8' };
  if (multiplier >= 2.5) return { name: 'DRIFT MASTER!', color: '#34d399' };
  if (multiplier >= 1.8) return { name: 'SNOW SHIFTER', color: '#fbbf24' };
  if (multiplier > 1.0) return { name: 'CLEAN SWEEP', color: '#60a5fa' };
  return { name: 'CRUISING', color: '#94a3b8' };
}

export const INITIAL_COMBO: ComboState = {
  multiplier: 1.0,
  gauge: 0,
  timer: 0,
  streak: 0,
  tierName: 'CRUISING',
};

const COMBO_TIMEOUT = 2.4; // seconds of no plowing before combo resets

/**
 * Updates combo state.
 * When snow is cleared, combo timer resets and multiplier grows based on streak.
 * When no snow is cleared, timer counts down and resets multiplier once expired.
 */
export function updateCombo(
  current: ComboState,
  clearedSnowAmount: number,
  dt: number
): ComboState {
  if (clearedSnowAmount > 0) {
    const newStreak = current.streak + clearedSnowAmount;
    // Multiplier scales smoothly from 1.0 up to 5.0
    // Every 15 cells adds 0.1 to multiplier
    const rawMultiplier = 1.0 + Math.min(newStreak / 150, 4.0);
    const newMultiplier = Math.round(rawMultiplier * 10) / 10;
    const tier = calculateComboTier(newMultiplier);

    return {
      multiplier: newMultiplier,
      gauge: 1.0,
      timer: COMBO_TIMEOUT,
      streak: newStreak,
      tierName: tier.name,
    };
  }

  // No snow cleared this frame, count down timer
  if (current.timer > 0) {
    const remainingTimer = Math.max(0, current.timer - dt);
    const gauge = remainingTimer / COMBO_TIMEOUT;
    if (remainingTimer <= 0) {
      // Combo ended
      return {
        multiplier: 1.0,
        gauge: 0,
        timer: 0,
        streak: 0,
        tierName: 'CRUISING',
      };
    }
    return {
      ...current,
      timer: remainingTimer,
      gauge,
    };
  }

  return current;
}

/**
 * Calculate score and coin gains for snow and collectibles.
 */
export function calculateSnowScore(
  cellsCleared: number,
  multiplier: number,
  meltBonus: number
): { points: number; coins: number } {
  if (cellsCleared <= 0) return { points: 0, coins: 0 };
  const basePointsPerCell = 10;
  const points = Math.round(cellsCleared * basePointsPerCell * multiplier * meltBonus);
  // Every 20 cells cleared with combo yields coins
  const coins = Math.floor((cellsCleared * multiplier) / 8);
  return { points, coins };
}

/**
 * Calculates win state when district clearance goal is satisfied.
 */
export function checkWinCondition(
  clearedCells: number,
  totalCoveredCells: number,
  targetPercentage: number
): { isComplete: boolean; currentPercentage: number } {
  if (totalCoveredCells <= 0) return { isComplete: true, currentPercentage: 100 };
  const ratio = Math.min(clearedCells / totalCoveredCells, 1.0);
  const currentPercentage = Math.round(ratio * 100);
  return {
    isComplete: currentPercentage >= targetPercentage,
    currentPercentage,
  };
}

/**
 * Check if player can afford an upgrade.
 */
export function canAffordUpgrade(
  currentCoins: number,
  category: UpgradeCategory,
  currentLevel: number
): { canBuy: boolean; cost: number; nextTierName: string | null } {
  const config = UPGRADE_CONFIGS[category];
  if (!config) return { canBuy: false, cost: 0, nextTierName: null };
  const nextTier = config.tiers.find((t) => t.level === currentLevel + 1);
  if (!nextTier) return { canBuy: false, cost: 0, nextTierName: null }; // max level
  return {
    canBuy: currentCoins >= nextTier.cost,
    cost: nextTier.cost,
    nextTierName: nextTier.name,
  };
}

/**
 * Step vehicle physics with realistic arcade vehicle kinematics.
 */
export function stepVehiclePhysics(
  state: VehicleState,
  inputs: { throttle: number; steer: number; boost: boolean },
  modifiers: UpgradeModifiers,
  dt: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
): VehicleState {
  const clampedDt = Math.min(dt, 0.05);

  let isBoosting = inputs.boost && state.boostCharge > 5 && inputs.throttle > 0;
  let boostCharge = state.boostCharge;

  if (isBoosting) {
    boostCharge = Math.max(0, boostCharge - modifiers.boostDrainRate * clampedDt);
    if (boostCharge <= 1) {
      isBoosting = false;
    }
  } else {
    boostCharge = Math.min(100, boostCharge + modifiers.boostRechargeRate * clampedDt);
  }

  const effectiveMaxForward = isBoosting
    ? modifiers.maxForwardSpeed * modifiers.boostMaxSpeedMultiplier
    : modifiers.maxForwardSpeed;

  // Throttle response
  let targetSpeed = 0;
  if (inputs.throttle > 0) {
    targetSpeed = effectiveMaxForward * inputs.throttle;
  } else if (inputs.throttle < 0) {
    targetSpeed = -modifiers.maxReverseSpeed * Math.abs(inputs.throttle);
  }

  // Smooth acceleration / braking / natural deceleration
  let speed = state.speed;
  const accelRate = isBoosting ? modifiers.acceleration * 1.5 : modifiers.acceleration;
  const friction = 6.0;

  if (Math.abs(targetSpeed) > 0.01) {
    if (targetSpeed > speed) {
      speed = Math.min(targetSpeed, speed + accelRate * clampedDt);
    } else {
      speed = Math.max(targetSpeed, speed - accelRate * clampedDt);
    }
  } else {
    // Coast to stop
    if (speed > 0) {
      speed = Math.max(0, speed - friction * clampedDt);
    } else if (speed < 0) {
      speed = Math.min(0, speed + friction * clampedDt);
    }
  }

  // Steering: vehicle only turns when moving, turning radius sharpens at moderate speed
  let angle = state.angle;
  const speedRatio = Math.min(Math.abs(speed) / 5.0, 1.0);
  if (inputs.steer !== 0 && Math.abs(speed) > 0.1) {
    const direction = speed >= 0 ? 1 : -1;
    const steerDelta = inputs.steer * modifiers.turnSpeed * speedRatio * direction * clampedDt;
    angle += steerDelta;
  }

  // Move along forward vector
  // angle 0 points toward +X, angle PI/2 points toward +Z (or standard 2D polar coordinates)
  const forwardX = Math.cos(angle);
  const forwardZ = Math.sin(angle);

  let newX = state.x + forwardX * speed * clampedDt;
  let newZ = state.z + forwardZ * speed * clampedDt;

  // Boundary wall sliding: clamp position and preserve tangential momentum so vehicle can plow alongside edges
  if (newX < bounds.minX) {
    newX = bounds.minX;
    speed *= 0.88;
  } else if (newX > bounds.maxX) {
    newX = bounds.maxX;
    speed *= 0.88;
  }

  if (newZ < bounds.minZ) {
    newZ = bounds.minZ;
    speed *= 0.88;
  } else if (newZ > bounds.maxZ) {
    newZ = bounds.maxZ;
    speed *= 0.88;
  }

  return {
    ...state,
    x: newX,
    z: newZ,
    angle,
    speed,
    steer: inputs.steer,
    isBoosting,
    boostCharge,
  };
}
