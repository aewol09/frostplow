/**
 * Comprehensive Monetization Engine for Google Play Store & Web:
 * - Rewarded Video Ads & Interstitials (AdMob / TWA / Web Bridge)
 * - In-App Purchases (No-Ads, Starter Pack, Coin Packs)
 * - Vehicle Skins Catalog & Equipping
 * - 7-Day Daily Login Retention Calendar
 * - Lucky Prize Wheel
 * - Multi-District Stage Progression
 */

import type {
  DailyRewardDay,
  DailyRewardState,
  DistrictInfo,
  LuckyWheelPrize,
  VehicleSkin,
  VehicleSkinId,
} from './types.ts';
import { admobManager } from './admob.ts';
import { billingService, type PurchaseResult } from './billing.ts';

// 1. Vehicle Skins Catalog
export const VEHICLE_SKINS: Record<VehicleSkinId, VehicleSkin> = {
  default: {
    id: 'default',
    name: '클래식 앰버',
    nameKo: '클래식 앰버',
    nameEn: 'Classic Amber',
    desc: '마을 제설대의 든든하고 친숙한 기본 안전 주황색 제설차',
    descKo: '마을 제설대의 든든하고 친숙한 기본 안전 주황색 제설차',
    descEn: 'The reliable and familiar village plow in high-visibility safety orange.',
    priceCoins: 0,
    cabColor: 0xf59e0b,
    bladeColor: 0xe2e8f0,
    accentColor: 0x1e293b,
    beaconColor: 0xf59e0b,
    metalness: 0.15,
    roughness: 0.35,
    icon: 'Truck',
  },
  gold: {
    id: 'gold',
    name: '24K 골든 블리자드',
    nameKo: '24K 골든 블리자드',
    nameEn: '24K Golden Blizzard',
    desc: '눈부신 순금으로 특수 코팅된 최고급 VIP 제설차',
    descKo: '눈부신 순금으로 특수 코팅된 최고급 VIP 제설차',
    descEn: 'Prestige VIP plow coated in gleaming 24-karat alpine gold.',
    priceCoins: 350,
    cabColor: 0xffd700,
    bladeColor: 0xfef08a,
    accentColor: 0xd97706,
    beaconColor: 0xfef08a,
    metalness: 0.85,
    roughness: 0.18,
    emissive: 0x451a03,
    icon: 'Crown',
  },
  santa: {
    id: 'santa',
    name: '산타 윈터 익스프레스',
    nameKo: '산타 윈터 익스프레스',
    nameEn: 'Santa Winter Express',
    desc: '크리스마스 축제 분위기가 물씬 풍기는 루돌프 에디션 제설차',
    descKo: '크리스마스 축제 분위기가 물씬 풍기는 루돌프 에디션 제설차',
    descEn: 'Festive Christmas Rudolph edition with candy-red chassis and snow-white blade.',
    priceCoins: 500,
    cabColor: 0xdc2626,
    bladeColor: 0xffffff,
    accentColor: 0x15803d,
    beaconColor: 0x22c55e,
    metalness: 0.3,
    roughness: 0.25,
    emissive: 0x7f1d1d,
    icon: 'Gift',
  },
  cyber: {
    id: 'cyber',
    name: '사이버플로우 2077',
    nameKo: '사이버플로우 2077',
    nameEn: 'CyberPlow 2077',
    desc: '미래형 옵시디언 바디와 네온 사이언 플라즈마 블레이드',
    descKo: '미래형 옵시디언 바디와 네온 사이언 플라즈마 블레이드',
    descEn: 'Futuristic obsidian chassis with neon cyan thermo-plasma blade.',
    priceCoins: 750,
    cabColor: 0x0f172a,
    bladeColor: 0x06b6d4,
    accentColor: 0x8b5cf6,
    beaconColor: 0xa855f7,
    metalness: 0.7,
    roughness: 0.15,
    emissive: 0x083344,
    icon: 'Zap',
  },
};

// 2. 7-Day Login Rewards
export const DAILY_REWARDS: DailyRewardDay[] = [
  { day: 1, coins: 30, label: '30 코인' },
  { day: 2, coins: 60, label: '60 코인' },
  { day: 3, coins: 100, label: '100 코인' },
  { day: 4, coins: 150, label: '150 코인' },
  { day: 5, coins: 220, label: '220 코인' },
  { day: 6, coins: 300, label: '300 코인' },
  { day: 7, coins: 500, label: '500 코인 (대박!)', specialReward: '황금 왕관 칭호' },
];

// 3. Lucky Wheel Prizes (6 sectors)
export const LUCKY_WHEEL_PRIZES: LuckyWheelPrize[] = [
  { id: 'p1', name: '25 코인', coins: 25, color: '#38bdf8', icon: 'Coins', weight: 35 },
  { id: 'p2', name: '50 코인', coins: 50, color: '#fbbf24', icon: 'Coins', weight: 28 },
  { id: 'p3', name: '100 코인', coins: 100, color: '#34d399', icon: 'Coins', weight: 18 },
  { id: 'p4', name: '200 코인', coins: 200, color: '#f43f5e', icon: 'Coins', weight: 10 },
  { id: 'p5', name: '350 코인', coins: 350, color: '#a855f7', icon: 'Sparkles', weight: 6 },
  { id: 'p6', name: '500 코인 잭팟!', coins: 500, color: '#eab308', icon: 'Trophy', weight: 3 },
];

// 4. Multi-District Progression
export const DISTRICTS: DistrictInfo[] = [
  {
    id: 1,
    name: '알프스 파인즈 마을',
    subtitle: '조용하고 평화로운 산골 마을 진입로',
    targetPercent: 70,
    snowCoveredCells: 2800,
    colorTheme: 'cyan',
  },
  {
    id: 2,
    name: '스노우피크 윈터 리조트',
    subtitle: '호텔과 스키장 진입로 (코인 1.25배 획득)',
    targetPercent: 75,
    snowCoveredCells: 3200,
    colorTheme: 'amber',
  },
  {
    id: 3,
    name: '프로스트 캐년 고갯길',
    subtitle: '눈폭풍이 몰아치는 험준한 산악 도로 (코인 1.5배 획득)',
    targetPercent: 80,
    snowCoveredCells: 3600,
    colorTheme: 'rose',
  },
];

// 5. In-App Purchase Products Definition
export interface IAPProduct {
  id: string;
  type: 'non_consumable' | 'consumable';
  titleKo: string;
  titleEn: string;
  priceKrw: string;
  priceUsd: string;
  badge?: string;
  badgeKo?: string;
  badgeEn?: string;
  coins?: number;
  skinId?: VehicleSkinId;
}

export const IAP_PRODUCTS: IAPProduct[] = [
  {
    id: 'frostplow.noads',
    type: 'non_consumable',
    titleKo: '영구 광고 제거 + 코인 20% 보너스',
    titleEn: 'Remove Ads + 20% Coin Bonus',
    priceKrw: '₩3,900',
    priceUsd: '$2.99',
    badge: '인기',
    badgeKo: '인기',
    badgeEn: 'Popular',
  },
  {
    id: 'frostplow.starter',
    type: 'non_consumable',
    titleKo: '기사 스타터 팩 (500 코인 + 골든 스킨)',
    titleEn: 'Starter Pack (500 Coins + Gold Skin)',
    priceKrw: '₩2,500',
    priceUsd: '$1.99',
    badge: '특가',
    badgeKo: '특가',
    badgeEn: 'Special Deal',
    coins: 500,
    skinId: 'gold',
  },
  {
    id: 'frostplow.coins.100',
    type: 'consumable',
    titleKo: '100 코인 파우치',
    titleEn: '100 Coins Pouch',
    priceKrw: '₩1,200',
    priceUsd: '$0.99',
    coins: 100,
  },
  {
    id: 'frostplow.coins.500',
    type: 'consumable',
    titleKo: '500 코인 상자 (+15% 보너스)',
    titleEn: '500 Coins Chest (+15% Bonus)',
    priceKrw: '₩4,900',
    priceUsd: '$3.99',
    badge: '+15%',
    coins: 575,
  },
  {
    id: 'frostplow.coins.1500',
    type: 'consumable',
    titleKo: '1,500 코인 금고 (+30% 보너스)',
    titleEn: '1,500 Coins Vault (+30% Bonus)',
    priceKrw: '₩12,000',
    priceUsd: '$8.99',
    badge: '최고 가치',
    coins: 1950,
  },
];

// 6. Monetization Storage & Bridge Service
class MonetizationService {
  private noAdsKey = 'frostplow_noads';
  private skinsKey = 'frostplow_owned_skins';
  private activeSkinKey = 'frostplow_active_skin';
  private dailyRewardKey = 'frostplow_daily_reward';
  private luckyWheelKey = 'frostplow_last_wheel_spin';
  private districtKey = 'frostplow_current_district';

  // Check if No-Ads is purchased
  public isNoAds(): boolean {
    try {
      return localStorage.getItem(this.noAdsKey) === 'true';
    } catch {
      return false;
    }
  }

  public setNoAds(active: boolean) {
    try {
      localStorage.setItem(this.noAdsKey, active ? 'true' : 'false');
    } catch {
      // ignore
    }
  }

  // Owned Skins
  public getOwnedSkins(): VehicleSkinId[] {
    try {
      const data = localStorage.getItem(this.skinsKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return ['default'];
  }

  public addOwnedSkin(skinId: VehicleSkinId) {
    const list = this.getOwnedSkins();
    if (!list.includes(skinId)) {
      list.push(skinId);
      try {
        localStorage.setItem(this.skinsKey, JSON.stringify(list));
      } catch {
        // ignore
      }
    }
  }

  // Active Skin
  public getActiveSkin(): VehicleSkinId {
    try {
      const skin = localStorage.getItem(this.activeSkinKey) as VehicleSkinId;
      if (skin && VEHICLE_SKINS[skin]) return skin;
    } catch {
      // ignore
    }
    return 'default';
  }

  public setActiveSkin(skinId: VehicleSkinId) {
    try {
      localStorage.setItem(this.activeSkinKey, skinId);
    } catch {
      // ignore
    }
  }

  // Current District Progression
  public getCurrentDistrict(): number {
    try {
      const saved = localStorage.getItem(this.districtKey);
      if (saved) {
        const val = parseInt(saved, 10);
        if (val >= 1 && val <= DISTRICTS.length) return val;
      }
    } catch {
      // ignore
    }
    return 1;
  }

  public setCurrentDistrict(id: number) {
    try {
      localStorage.setItem(this.districtKey, id.toString());
    } catch {
      // ignore
    }
  }

  // Daily Reward State
  public getDailyRewardState(): DailyRewardState {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const raw = localStorage.getItem(this.dailyRewardKey);
      if (raw) {
        const parsed = JSON.parse(raw) as DailyRewardState;
        return parsed;
      }
    } catch {
      // ignore
    }
    return {
      currentStreak: 0,
      lastClaimDate: '',
      claimedDays: [],
    };
  }

  public canClaimDailyReward(): boolean {
    const today = new Date().toISOString().slice(0, 10);
    const state = this.getDailyRewardState();
    return state.lastClaimDate !== today;
  }

  public claimDailyReward(): { day: number; coins: number; specialReward?: string } {
    const today = new Date().toISOString().slice(0, 10);
    const state = this.getDailyRewardState();

    let nextStreak = state.currentStreak + 1;
    if (nextStreak > 7) nextStreak = 1;

    const reward = DAILY_REWARDS[nextStreak - 1];
    state.currentStreak = nextStreak;
    state.lastClaimDate = today;
    if (!state.claimedDays.includes(nextStreak)) {
      state.claimedDays.push(nextStreak);
    }
    if (nextStreak === 1) {
      state.claimedDays = [1];
    }

    try {
      localStorage.setItem(this.dailyRewardKey, JSON.stringify(state));
    } catch {
      // ignore
    }

    return {
      day: nextStreak,
      coins: reward.coins,
      specialReward: reward.specialReward,
    };
  }

  // Lucky Wheel Timing
  public canSpinLuckyWheelFree(): boolean {
    try {
      const last = localStorage.getItem(this.luckyWheelKey);
      if (!last) return true;
      const lastTime = parseInt(last, 10);
      const now = Date.now();
      // Free spin every 12 hours
      return now - lastTime > 12 * 60 * 60 * 1000;
    } catch {
      return true;
    }
  }

  public recordWheelSpin() {
    try {
      localStorage.setItem(this.luckyWheelKey, Date.now().toString());
    } catch {
      // ignore
    }
  }

  /**
   * Play Rewarded Ad:
   * Uses AdMob via native Google Mobile Ads SDK or interactive simulator.
   */
  public async requestRewardedAd(
    onRewarded: () => void,
    onFailed?: () => void
  ): Promise<boolean> {
    return admobManager.showRewardedAd(onRewarded, onFailed);
  }

  /**
   * Play Interstitial Ad (Between districts or rounds)
   */
  public async showInterstitialAd(): Promise<void> {
    if (this.isNoAds()) return; // VIP pass skips all interstitial ads!
    return admobManager.showInterstitialAd();
  }

  /**
   * Process In-App Purchase:
   * Connects to Google Play Billing Client via @capgo/native-purchases.
   */
  public async purchaseProduct(productId: string): Promise<PurchaseResult> {
    return billingService.purchaseProduct(productId);
  }

  /**
   * Restore Purchases (Google Play Store Policy Mandatory Requirement)
   */
  public async restorePurchases(): Promise<{ restoredNoAds: boolean; restoredSkins: VehicleSkinId[]; message: string }> {
    let restoredNoAds = this.isNoAds();
    let restoredSkins = this.getOwnedSkins();

    const res = await billingService.restorePurchases();
    if (res.restoredNoAds) {
      this.setNoAds(true);
      restoredNoAds = true;
    }
    if (res.restoredStarter) {
      this.addOwnedSkin('gold');
      if (!restoredSkins.includes('gold')) restoredSkins.push('gold');
    }

    return { restoredNoAds, restoredSkins, message: res.message };
  }
}

export const monetizationService = new MonetizationService();
