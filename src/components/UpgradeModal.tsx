/**
 * Cozy Alpine Garage & Upgrades Workshop Modal.
 * Allows purchasing blade width, engine, thermo-melt, salt spreader, and nitro boost tiers with i18n.
 */

import React from 'react';
import {
  X,
  Coins,
  Shield,
  Zap,
  Flame,
  Sparkles,
  Wind,
  CheckCircle,
} from 'lucide-react';
import type { PlayerUpgrades, UpgradeCategory } from '../game/types.ts';
import type { Language } from '../game/i18n.ts';
import { translations } from '../game/i18n.ts';
import { UPGRADE_CONFIGS, canAffordUpgrade } from '../game/rules.ts';

interface UpgradeModalProps {
  upgrades: PlayerUpgrades;
  coins: number;
  language: Language;
  onBuyUpgrade: (category: UpgradeCategory) => void;
  onClose: () => void;
}

const ICONS: Record<string, React.ElementType> = {
  Shield,
  Zap,
  Flame,
  Sparkles,
  Wind,
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  upgrades,
  coins,
  language,
  onBuyUpgrade,
  onClose,
}) => {
  const t = translations[language];
  const categories: UpgradeCategory[] = ['blade', 'engine', 'heater', 'salt', 'boost'];

  const getCategoryTitle = (cat: UpgradeCategory): string => {
    switch (cat) {
      case 'blade': return t.bladeName;
      case 'engine': return t.engineName;
      case 'heater': return t.heaterName;
      case 'salt': return t.saltName;
      case 'boost': return t.boostName;
    }
  };

  const getTierLocalized = (cat: UpgradeCategory, level: number) => {
    const keyName = `tier${cat.charAt(0).toUpperCase() + cat.slice(1)}${level}` as keyof typeof t;
    const keyDesc = `tier${cat.charAt(0).toUpperCase() + cat.slice(1)}${level}Desc` as keyof typeof t;
    return {
      name: (t[keyName] as string) || `Tier ${level}`,
      desc: (t[keyDesc] as string) || '',
    };
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/75 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-slate-800 bg-slate-900/90 shrink-0 gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-bold text-white tracking-wide whitespace-nowrap truncate">
              {t.garageTitle}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 break-keep leading-snug truncate max-w-[150px] sm:max-w-none">
              {t.garageSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800 border border-amber-500/30 text-amber-300 font-mono-numbers font-bold text-xs sm:text-sm whitespace-nowrap shrink-0 shadow">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span>{coins}</span>
            </div>

            <button
              onClick={onClose}
              aria-label="Close upgrades workshop"
              className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Upgrade Cards List */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-2.5 sm:space-y-3.5">
          {categories.map((catKey) => {
            const config = UPGRADE_CONFIGS[catKey];
            const currentLevel = upgrades[catKey];
            const currentTier = config.tiers[currentLevel - 1];
            const nextTier = config.tiers[currentLevel];
            const isMaxed = !nextTier;
            const { canBuy, cost } = canAffordUpgrade(coins, catKey, currentLevel);
            const IconComp = ICONS[config.icon] || Shield;

            const localizedCurrent = getTierLocalized(catKey, currentLevel);
            const localizedNext = nextTier ? getTierLocalized(catKey, currentLevel + 1) : null;

            return (
              <div
                key={catKey}
                className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-slate-800/80 border border-slate-700/70 hover:border-slate-600 transition gap-2 sm:gap-3.5"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                  <div
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shadow shrink-0"
                    style={{ backgroundColor: `${config.color}20`, color: config.color }}
                  >
                    <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
                      <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate whitespace-nowrap">
                        {getCategoryTitle(catKey)}
                      </h3>
                      <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-mono-numbers font-semibold bg-slate-700/80 text-cyan-300 shrink-0 whitespace-nowrap">
                        LVL {currentLevel}/4
                      </span>
                    </div>

                    <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 truncate whitespace-nowrap">
                      <span className="font-semibold text-white">{localizedCurrent.name}</span> ·{' '}
                      <span className="text-slate-400">{currentTier?.statLabel}</span>
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 break-keep line-clamp-1 sm:line-clamp-none leading-relaxed">
                      {localizedCurrent.desc}
                    </p>

                    {nextTier && localizedNext && (
                      <p className="text-[10px] sm:text-[11px] text-amber-300/90 mt-0.5 sm:mt-1 break-keep truncate">
                        <span className="font-semibold whitespace-nowrap">{t.nextStats}:</span> {localizedNext.name} ({nextTier.statLabel})
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Buy Button / Maxed Tag */}
                <div className="shrink-0">
                  {isMaxed ? (
                    <div className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>{t.maxLevel}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onBuyUpgrade(catKey)}
                      disabled={!canBuy}
                      aria-label={`${t.buyFor} ${getCategoryTitle(catKey)} ${cost} ${t.coinsUnit}`}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition active:scale-95 shadow cursor-pointer whitespace-nowrap ${
                        canBuy
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                          : 'bg-slate-700/60 text-slate-400 border border-slate-600 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      <span>{cost} {t.coinsUnit}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
          >
            {t.returnToPlow}
          </button>
        </div>
      </div>
    </div>
  );
};
