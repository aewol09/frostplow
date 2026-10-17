/**
 * Official Google AdMob Manager for Android Native & Web:
 * - Uses @capacitor-community/admob for real Google Mobile Ads SDK on Android
 * - Automatically falls back to Web simulator in desktop/browser development
 */

import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  RewardAdPluginEvents,
  InterstitialAdPluginEvents,
  BannerAdPluginEvents,
  type AdMobRewardItem,
  type RewardAdOptions,
  type AdOptions,
  type BannerAdOptions,
} from '@capacitor-community/admob';

export interface AdMobConfig {
  appId: string;
  rewardedAdUnitId: string;
  interstitialAdUnitId: string;
  bannerAdUnitId: string;
  isTesting: boolean;
}

// Production AdMob IDs provided by user
export const ADMOB_PRODUCTION_IDS: AdMobConfig = {
  appId: 'ca-app-pub-3719896316126650~9303543829',
  rewardedAdUnitId: 'ca-app-pub-3719896316126650/9076313112',
  interstitialAdUnitId: 'ca-app-pub-3719896316126650/6548106718',
  bannerAdUnitId: 'ca-app-pub-3719896316126650/8366875835',
  isTesting: false,
};

// Google official test ad unit IDs for Android
export const GOOGLE_TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';
export const GOOGLE_TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
export const GOOGLE_TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';

export class AdMobManager {
  private config: AdMobConfig;
  private isInitialized = false;
  private isRewardedLoaded = false;
  private isInterstitialLoaded = false;
  private isBannerShowing = false;

  private pendingRewardedCallback: (() => void) | null = null;
  private pendingDismissCallback: (() => void) | null = null;
  private wasRewardGranted = false;

  constructor(customConfig?: Partial<AdMobConfig>) {
    this.config = { ...ADMOB_PRODUCTION_IDS, ...customConfig };
    this.init();
  }

  public isNativeAdSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  public async init(): Promise<void> {
    if (!this.isNativeAdSupported()) {
      console.log('[AdMob] Web/Browser 환경: 시뮬레이션 모드로 대기합니다.');
      return;
    }

    if (this.isInitialized) return;

    try {
      await AdMob.initialize({
        initializeForTesting: this.config.isTesting,
      });
      this.isInitialized = true;
      console.log('[AdMob] Google Mobile Ads SDK 초기화 완료');

      this.registerRewardListeners();
      this.registerInterstitialListeners();
      this.registerBannerListeners();

      // Preload ads in background
      await this.prepareRewardedAd();
      await this.prepareInterstitial();
    } catch (err) {
      console.error('[AdMob] 초기화 실패:', err);
    }
  }

  private registerRewardListeners(): void {
    AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
      this.isRewardedLoaded = true;
      console.log('[AdMob] 보상형 광고 로드 완료');
    });

    AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
      this.isRewardedLoaded = false;
      console.warn('[AdMob] 보상형 광고 로드 실패:', error);
    });

    AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
      console.log('[AdMob] 리워드 획득 승인:', reward);
      this.wasRewardGranted = true;
      if (this.pendingRewardedCallback) {
        const cb = this.pendingRewardedCallback;
        this.pendingRewardedCallback = null;
        cb();
      }
    });

    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      console.log('[AdMob] 보상형 광고 닫힘');
      this.isRewardedLoaded = false;

      if (!this.wasRewardGranted && this.pendingDismissCallback) {
        const cb = this.pendingDismissCallback;
        this.pendingDismissCallback = null;
        cb();
      }

      this.wasRewardGranted = false;
      this.pendingRewardedCallback = null;
      this.pendingDismissCallback = null;

      // Preload next reward ad
      this.prepareRewardedAd().catch(() => {});
    });

    AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => {
      console.error('[AdMob] 보상형 광고 노출 실패:', error);
      this.isRewardedLoaded = false;
      if (this.pendingDismissCallback) {
        const cb = this.pendingDismissCallback;
        this.pendingDismissCallback = null;
        cb();
      }
      this.pendingRewardedCallback = null;
      this.prepareRewardedAd().catch(() => {});
    });
  }

  public async prepareRewardedAd(): Promise<boolean> {
    if (!this.isNativeAdSupported()) return false;
    try {
      const options: RewardAdOptions = {
        adId: this.config.rewardedAdUnitId,
        isTesting: this.config.isTesting,
      };
      await AdMob.prepareRewardVideoAd(options);
      this.isRewardedLoaded = true;
      return true;
    } catch (err) {
      console.warn('[AdMob] 프로덕션 보상형 광고 로드 대기 (스토어 미출시 또는 인벤토리 없음), Google 공식 테스트 광고로 연결합니다:', err);
      try {
        await AdMob.prepareRewardVideoAd({
          adId: GOOGLE_TEST_REWARDED_ID,
          isTesting: true,
        });
        this.isRewardedLoaded = true;
        return true;
      } catch (fallbackErr) {
        this.isRewardedLoaded = false;
        console.warn('[AdMob] 테스트 보상형 광고 로드 실패:', fallbackErr);
        return false;
      }
    }
  }

  /**
   * Show Native Google AdMob Rewarded Video Ad
   * Returns true if native ad was dispatched, false if Web fallback needed
   */
  public async showRewardedAd(
    onRewarded: () => void,
    onDismissedOrFailed?: () => void
  ): Promise<boolean> {
    if (!this.isNativeAdSupported()) {
      return false;
    }

    this.pendingRewardedCallback = onRewarded;
    this.pendingDismissCallback = onDismissedOrFailed || null;
    this.wasRewardGranted = false;

    try {
      if (!this.isRewardedLoaded) {
        console.log('[AdMob] 광고 사전 준비 확인 중...');
        const loaded = await this.prepareRewardedAd();
        if (!loaded) {
          throw new Error('AdMob 광고가 아직 준비되지 않았습니다.');
        }
      }

      await AdMob.showRewardVideoAd();
      return true;
    } catch (err) {
      console.warn('[AdMob] 네이티브 광고 표시 예외:', err);
      this.isRewardedLoaded = false;
      if (this.pendingDismissCallback) {
        const cb = this.pendingDismissCallback;
        this.pendingDismissCallback = null;
        this.pendingRewardedCallback = null;
        cb();
      }
      return false;
    }
  }

  // --- 2. Interstitial Ads ---
  private registerInterstitialListeners(): void {
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
      this.isInterstitialLoaded = true;
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (err) => {
      this.isInterstitialLoaded = false;
    });

    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      this.isInterstitialLoaded = false;
      this.prepareInterstitial().catch(() => {});
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
      this.isInterstitialLoaded = false;
      this.prepareInterstitial().catch(() => {});
    });
  }

  public async prepareInterstitial(): Promise<boolean> {
    if (!this.isNativeAdSupported()) return false;
    try {
      const options: AdOptions = {
        adId: this.config.interstitialAdUnitId,
        isTesting: this.config.isTesting,
      };
      await AdMob.prepareInterstitial(options);
      this.isInterstitialLoaded = true;
      return true;
    } catch {
      try {
        await AdMob.prepareInterstitial({
          adId: GOOGLE_TEST_INTERSTITIAL_ID,
          isTesting: true,
        });
        this.isInterstitialLoaded = true;
        return true;
      } catch {
        this.isInterstitialLoaded = false;
        return false;
      }
    }
  }

  public async showInterstitialAd(): Promise<void> {
    if (!this.isNativeAdSupported()) return;
    try {
      if (!this.isInterstitialLoaded) {
        await this.prepareInterstitial();
      }
      await AdMob.showInterstitial();
    } catch (err) {
      console.warn('[AdMob] 전면 광고 표시 실패:', err);
    }
  }

  // --- 3. Banner Ads ---
  private registerBannerListeners(): void {
    AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      this.isBannerShowing = true;
    });
    AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
      this.isBannerShowing = false;
    });
  }

  public async showBannerAd(): Promise<boolean> {
    if (!this.isNativeAdSupported()) return false;
    try {
      const options: BannerAdOptions = {
        adId: this.config.bannerAdUnitId,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        isTesting: this.config.isTesting,
      };
      await AdMob.showBanner(options);
      this.isBannerShowing = true;
      return true;
    } catch {
      try {
        await AdMob.showBanner({
          adId: GOOGLE_TEST_BANNER_ID,
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          isTesting: true,
        });
        this.isBannerShowing = true;
        return true;
      } catch {
        return false;
      }
    }
  }

  public async hideBannerAd(): Promise<boolean> {
    if (!this.isNativeAdSupported() || !this.isBannerShowing) return false;
    try {
      await AdMob.hideBanner();
      this.isBannerShowing = false;
      return true;
    } catch {
      return false;
    }
  }

  public getConfig(): AdMobConfig {
    return this.config;
  }
}

export const admobManager = new AdMobManager();
