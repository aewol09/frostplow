import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getUpgradeModifiers,
  updateCombo,
  calculateSnowScore,
  checkWinCondition,
  canAffordUpgrade,
  stepVehiclePhysics,
  INITIAL_UPGRADES,
  INITIAL_COMBO,
} from './rules.ts';
import type { VehicleState } from './types.ts';

test('getUpgradeModifiers calculates level 1 and higher tiers correctly', () => {
  const base = getUpgradeModifiers(INITIAL_UPGRADES);
  assert.equal(base.bladeWidth, 2.2);
  assert.equal(base.maxForwardSpeed, 8.5);
  assert.equal(base.saltRadius, 0);

  const upgraded = getUpgradeModifiers({
    blade: 4,
    engine: 4,
    heater: 4,
    salt: 4,
    boost: 4,
  });
  assert.equal(upgraded.bladeWidth, 4.8);
  assert.equal(upgraded.maxForwardSpeed, 16.0);
  assert.equal(upgraded.meltBonusMultiplier, 2.0);
  assert.equal(upgraded.saltRadius, 4.8);
  assert.ok(upgraded.boostMaxSpeedMultiplier > 1.8);
});

test('updateCombo increases multiplier on snow clear and decays on idle', () => {
  // Clearing 300 cells should boost multiplier
  const clearedState = updateCombo(INITIAL_COMBO, 300, 0.016);
  assert.ok(clearedState.multiplier > 2.0, `Multiplier should increase, got ${clearedState.multiplier}`);
  assert.equal(clearedState.gauge, 1.0);
  assert.ok(clearedState.timer > 0);

  // Advancing time without snow clearing decays gauge
  const decayedState = updateCombo(clearedState, 0, 1.0);
  assert.ok(decayedState.timer < clearedState.timer);
  assert.ok(decayedState.gauge < 1.0);
  assert.equal(decayedState.multiplier, clearedState.multiplier);

  // After full timeout, combo resets to 1.0
  const expiredState = updateCombo(decayedState, 0, 3.0);
  assert.equal(expiredState.multiplier, 1.0);
  assert.equal(expiredState.streak, 0);
  assert.equal(expiredState.gauge, 0);
});

test('calculateSnowScore scales with multiplier and heater melt bonus', () => {
  const base = calculateSnowScore(10, 1.0, 1.0);
  assert.equal(base.points, 100);

  const multiplied = calculateSnowScore(10, 2.0, 1.5);
  // 10 * 10 * 2.0 * 1.5 = 300
  assert.equal(multiplied.points, 300);
  assert.ok(multiplied.coins > 0);
});

test('checkWinCondition identifies goal achievement', () => {
  const notYet = checkWinCondition(70, 100, 80);
  assert.equal(notYet.isComplete, false);
  assert.equal(notYet.currentPercentage, 70);

  const done = checkWinCondition(82, 100, 80);
  assert.equal(done.isComplete, true);
  assert.equal(done.currentPercentage, 82);
});

test('canAffordUpgrade checks coin balance accurately', () => {
  // Level 1 blade to Level 2 blade costs 50
  const poor = canAffordUpgrade(20, 'blade', 1);
  assert.equal(poor.canBuy, false);
  assert.equal(poor.cost, 50);

  const rich = canAffordUpgrade(60, 'blade', 1);
  assert.equal(rich.canBuy, true);

  // Max level tier check
  const maxed = canAffordUpgrade(9999, 'blade', 4);
  assert.equal(maxed.canBuy, false);
  assert.equal(maxed.nextTierName, null);
});

test('stepVehiclePhysics applies acceleration and bounds clamping', () => {
  const initialState: VehicleState = {
    x: 0,
    z: 0,
    angle: 0, // facing +X
    speed: 0,
    steer: 0,
    isPlowing: false,
    isBoosting: false,
    boostCharge: 100,
    snowHopper: 0,
    maxHopper: 100,
  };

  const mods = getUpgradeModifiers(INITIAL_UPGRADES);
  const bounds = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };

  // Accelerating forward
  const afterGas = stepVehiclePhysics(
    initialState,
    { throttle: 1, steer: 0, boost: false },
    mods,
    0.05,
    bounds
  );

  assert.ok(afterGas.speed > 0);
  assert.ok(afterGas.x > 0);

  // Turning while moving
  const afterTurn = stepVehiclePhysics(
    afterGas,
    { throttle: 1, steer: 1, boost: false },
    mods,
    0.05,
    bounds
  );
  assert.notEqual(afterTurn.angle, 0);

  // Clamping at boundary
  const atEdgeState: VehicleState = {
    ...initialState,
    x: 19.9,
    speed: 10,
  };
  const clamped = stepVehiclePhysics(
    atEdgeState,
    { throttle: 1, steer: 0, boost: false },
    mods,
    0.05,
    bounds
  );
  assert.ok(clamped.x <= bounds.maxX);
});
