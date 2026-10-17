/**
 * Types for FrostPlow: Cozy Snow Clearance
 */

export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type UpgradeCategory = 'blade' | 'engine' | 'heater' | 'salt' | 'boost';

export interface UpgradeTier {
  level: number;
  name: string;
  cost: number;
  description: string;
  statLabel: string;
}

export interface UpgradeConfig {
  id: UpgradeCategory;
  name: string;
  icon: string;
  color: string;
  tiers: UpgradeTier[];
}

export interface PlayerUpgrades {
  blade: number;
  engine: number;
  heater: number;
  salt: number;
  boost: number;
}

export interface ComboState {
  multiplier: number;
  gauge: number; // 0 to 1
  timer: number;
  streak: number;
  tierName: string;
}

export interface VehicleState {
  x: number;
  z: number;
  angle: number; // in radians
  speed: number;
  steer: number;
  isPlowing: boolean;
  isBoosting: boolean;
  boostCharge: number; // 0 - 100
  snowHopper: number; // 0 - 100
  maxHopper: number;
}

export interface CollectibleItem {
  id: string;
  type: 'coin' | 'cocoa' | 'mitten' | 'snowflake';
  x: number;
  z: number;
  collected: boolean;
  value: number;
  name: string;
}

export interface DistrictInfo {
  id: number;
  name: string;
  subtitle: string;
  targetPercent: number; // percentage needed to win/advance, e.g. 80%
  snowCoveredCells: number;
  colorTheme: string;
}

export interface GameStats {
  score: number;
  coins: number;
  totalClearedCells: number;
  clearPercentage: number;
  highestCombo: number;
  runTimeSeconds: number;
  itemsFound: number;
  drivewaysCleared: number;
}

export type VehicleSkinId = 'default' | 'gold' | 'santa' | 'cyber';

export interface VehicleSkin {
  id: VehicleSkinId;
  name: string;
  nameKo?: string;
  nameEn?: string;
  desc: string;
  descKo?: string;
  descEn?: string;
  priceCoins: number;
  isIAPOnly?: boolean;
  cabColor: number;
  bladeColor: number;
  accentColor: number;
  beaconColor: number;
  metalness: number;
  roughness: number;
  emissive?: number;
  icon: string;
}

export interface DailyRewardDay {
  day: number;
  coins: number;
  label: string;
  specialReward?: string;
}

export interface DailyRewardState {
  currentStreak: number;
  lastClaimDate: string; // YYYY-MM-DD
  claimedDays: number[];
}

export interface LuckyWheelPrize {
  id: string;
  name: string;
  coins: number;
  color: string;
  icon: string;
  weight: number;
}

