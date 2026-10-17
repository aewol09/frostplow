/**
 * In-Game Store & VIP Shop Modal:
 * Handles Google Play IAP packages (No-Ads, Starter Pack, Coin Crates),
 * cosmetic vehicle skins catalogue with equip/buy, and free rewarded ad coin grants.
 */

import React, { useState } from 'react';
import {
  X,
  Coins,
  ShieldCheck,
  Sparkles,
  Zap,
  Crown,
  Gift,
  Check,
  CheckCircle,
  Video,
  ShoppingBag,
} from 'lucide-react';
import type { Language } from '../game/i18n.ts';
import { translations } from '../game/i18n.ts';
import type { VehicleSkinId } from '../game/types.ts';
import {
  IAP_PRODUCTS,
  VEHICLE_SKINS,
  monetizationService,
} from '../game/monetization.ts';

interface ShopModalProps {
  coins: number;
  isNoAds: boolean;
  activeSkin: VehicleSkinId;
  ownedSkins: VehicleSkinId[];
  language: Language;
  onBuyIAP: (productId: string) => void;
  onBuySkin: (skinId: VehicleSkinId) => void;
  onEquipSkin: (skinId: VehicleSkinId) => void;
  onWatchAdForCoins: () => void;
  onRestorePurchases?: () => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  coins,
  isNoAds,
  activeSkin,
  ownedSkins,
  language,
  onBuyIAP,
  onBuySkin,
  onEquipSkin,
  onWatchAdForCoins,
  onRestorePurchases,
  onClose,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'iap' | 'skins' | 'free'>('iap');

  const skinList = Object.values(VEHICLE_SKINS);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800 bg-slate-900/95 shrink-0 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-xl font-bold text-white tracking-wide flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                <span className="truncate">{t.shopTitle}</span>
                {isNoAds && (
                  <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold whitespace-nowrap shrink-0">
                    VIP PASS
                  </span>
                )}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 break-keep truncate max-w-[130px] sm:max-w-none">
                {t.shopSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Coins Purse */}
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800 border border-amber-500/30 text-amber-300 font-mono-numbers font-bold text-xs sm:text-sm whitespace-nowrap shrink-0 shadow">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span>{coins}</span>
            </div>

            <button
              onClick={onClose}
              aria-label="Close store"
              className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/60 px-4 sm:px-6 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('iap')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'iap'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{t.tabIap}</span>
          </button>

          <button
            onClick={() => setActiveTab('skins')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'skins'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{t.tabSkins}</span>
          </button>

          <button
            onClick={() => setActiveTab('free')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'free'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t.tabFreeCoins}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5">
          {/* TAB 1: IAP & PACKAGES */}
          {activeTab === 'iap' && (
            <div className="space-y-3">
              {IAP_PRODUCTS.map((prod) => {
                const isNoAdsItem = prod.id === 'frostplow.noads';
                const isOwnedNoAds = isNoAdsItem && isNoAds;

                return (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow">
                        {isNoAdsItem ? (
                          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : prod.skinId ? (
                          <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                        ) : (
                          <Coins className="w-5 h-5 text-amber-400 shrink-0" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                          <h3 className="text-xs sm:text-sm font-bold text-white whitespace-nowrap truncate">
                            {language === 'en' ? prod.titleEn : prod.titleKo}
                          </h3>
                          {prod.badge && (
                            <span className="text-[9px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0 whitespace-nowrap">
                              {language === 'en' ? (prod.badgeEn || prod.badge) : (prod.badgeKo || prod.badge)}
                            </span>
                          )}
                        </div>

                        {prod.coins && (
                          <p className="text-[11px] text-amber-300/90 font-mono-numbers mt-0.5 whitespace-nowrap">
                            +{prod.coins} Frost Coins
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isOwnedNoAds ? (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold whitespace-nowrap">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span>{language === 'ko' ? '적용됨' : 'Active'}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onBuyIAP(prod.id)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition active:scale-95 shadow cursor-pointer whitespace-nowrap shadow-amber-500/20"
                        >
                          {language === 'ko' ? prod.priceKrw : prod.priceUsd}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: VEHICLE SKINS */}
          {activeTab === 'skins' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skinList.map((skin) => {
                const isOwned = ownedSkins.includes(skin.id);
                const isEquipped = activeSkin === skin.id;
                const canAfford = coins >= skin.priceCoins;

                return (
                  <div
                    key={skin.id}
                    className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                      isEquipped
                        ? 'bg-slate-800/95 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-800/70 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      {/* Top badge row */}
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow"
                          style={{ backgroundColor: `${skin.accentColor.toString(16).padStart(6, '0')}40` }}
                        >
                          {skin.id === 'gold' && <Crown className="w-4 h-4 text-amber-400" />}
                          {skin.id === 'santa' && <Gift className="w-4 h-4 text-rose-400" />}
                          {skin.id === 'cyber' && <Zap className="w-4 h-4 text-cyan-400" />}
                          {skin.id === 'default' && <Sparkles className="w-4 h-4 text-amber-400" />}
                        </div>

                        {/* Color swatch previews */}
                        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: `#${skin.cabColor.toString(16).padStart(6, '0')}` }}
                            title="Cab Body"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: `#${skin.bladeColor.toString(16).padStart(6, '0')}` }}
                            title="Plow Blade"
                          />
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-white tracking-wide whitespace-nowrap truncate">
                        {language === 'en' ? (skin.nameEn || skin.name) : (skin.nameKo || skin.name)}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed break-keep">
                        {language === 'en' ? (skin.descEn || skin.desc) : (skin.descKo || skin.desc)}
                      </p>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      {isEquipped ? (
                        <div className="w-full py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <Check className="w-4 h-4 shrink-0" />
                          <span>{t.equipped}</span>
                        </div>
                      ) : isOwned ? (
                        <button
                          onClick={() => onEquipSkin(skin.id)}
                          className="w-full py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow whitespace-nowrap"
                        >
                          {t.equip}
                        </button>
                      ) : (
                        <button
                          onClick={() => onBuySkin(skin.id)}
                          disabled={!canAfford}
                          className={`w-full py-1.5 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow whitespace-nowrap ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                              : 'bg-slate-700/60 text-slate-400 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5 shrink-0" />
                          <span>{skin.priceCoins} {t.coinsUnit}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: FREE REWARDED COINS */}
          {activeTab === 'free' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl mb-3">
                  <Video className="w-7 h-7" />
                </div>

                <h3 className="text-base font-black text-white whitespace-nowrap">
                  {t.freeAdClaim}
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mt-1 mb-4 leading-relaxed break-keep px-2">
                  {t.freeAdClaimDesc}
                </p>

                <button
                  onClick={onWatchAdForCoins}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/30 active:scale-95 transition cursor-pointer flex items-center gap-2 whitespace-nowrap"
                >
                  <Video className="w-4 h-4 fill-slate-950 shrink-0" />
                  <span>{language === 'ko' ? '광고 보고 +50 코인 받기' : 'Watch Ad for +50 Coins'}</span>
                </button>
              </div>

              {/* No-Ads Recommendation Card */}
              {!isNoAds && (
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white break-keep whitespace-nowrap truncate">
                        {language === 'ko' ? '광고 없이 쾌적하게 즐기시겠어요?' : 'Enjoy game completely Ad-Free?'}
                      </h4>
                      <p className="text-[11px] text-slate-400 break-keep leading-snug">
                        {language === 'ko'
                          ? '영구 광고 제거 패스를 구매하시면 모든 전면 광고가 즉시 사라집니다.'
                          : 'Remove all interstitial ads forever with the VIP pass.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onBuyIAP('frostplow.noads')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition active:scale-95 shrink-0 cursor-pointer shadow whitespace-nowrap"
                  >
                    {language === 'ko' ? 'VIP 구매' : 'Get VIP'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0 gap-3">
          <button
            onClick={onRestorePurchases}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer whitespace-nowrap"
          >
            {language === 'ko' ? '구매 복원 (Restore Purchases)' : 'Restore Purchases'}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
          >
            {t.closeSettings}
          </button>
        </div>
      </div>
    </div>
  );
};
