/**
 * Status Modals: Pause Menu and Victory / District Clear Completion Card with i18n support.
 */

import React from 'react';
import {
  Play,
  RotateCcw,
  Home,
  Trophy,
  Sparkles,
  Coins,
  Clock,
  Flame,
  Volume2,
  VolumeX,
  Settings,
  Video,
  ArrowRight,
  Check,
} from 'lucide-react';
import type { GameStats } from '../game/types.ts';
import type { Language } from '../game/i18n.ts';
import { translations } from '../game/i18n.ts';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  language: Language;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onTitle,
  onOpenSettings,
  isMuted,
  language,
  onToggleMute,
}) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/75 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
        <h2 className="text-2xl font-black text-white tracking-wide mb-1 whitespace-nowrap">
          {t.gamePaused}
        </h2>
        <p className="text-xs text-slate-400 mb-6 break-keep leading-relaxed px-2">
          {t.pauseDesc}
        </p>

        <div className="w-full space-y-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-slate-950 shrink-0" />
            <span>{t.resume}</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs tracking-wide transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{t.restartDistrict}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs tracking-wide transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>{t.settingsTitle}</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs tracking-wide transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400 shrink-0" /> : <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{isMuted ? t.unmute : t.mute}</span>
          </button>

          <button
            onClick={onTitle}
            className="w-full py-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs tracking-wide transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>{t.mainMenu}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  stats: GameStats;
  highScore: number;
  language: Language;
  hasClaimedDoubleCoins: boolean;
  isLastDistrict: boolean;
  onDoubleCoinsAd: () => void;
  onNextDistrict: () => void;
  onPlayAgain: () => void;
  onTitle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  highScore,
  language,
  hasClaimedDoubleCoins,
  isLastDistrict,
  onDoubleCoinsAd,
  onNextDistrict,
  onPlayAgain,
  onTitle,
}) => {
  const t = translations[language];
  const isNewHigh = stats.score >= highScore && stats.score > 0;
  const minutes = Math.floor(stats.runTimeSeconds / 60);
  const seconds = Math.floor(stats.runTimeSeconds % 60);
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(245,158,11,0.25)] text-center flex flex-col items-center">
        {/* Trophy icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-2 sm:mb-3 shadow">
          <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide whitespace-nowrap">
          {t.districtCleared}
        </h2>
        <p className="text-xs sm:text-sm text-cyan-300 font-medium mt-0.5 mb-4 break-keep leading-relaxed px-2">
          {t.victoryDesc}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 w-full mb-4 font-mono-numbers">
          <div className="bg-slate-800/80 border border-slate-700/60 p-2.5 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" /> {t.finalScore}
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300 mt-0.5 whitespace-nowrap">
              {stats.score.toLocaleString()}
            </span>
            {isNewHigh && (
              <span className="text-[9px] text-emerald-400 font-bold tracking-wider whitespace-nowrap">
                {t.newBest}
              </span>
            )}
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-2.5 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Coins className="w-3 h-3 text-amber-400 shrink-0" /> {t.frostCoins}
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300 mt-0.5 whitespace-nowrap">
              +{stats.coins}
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-2.5 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Flame className="w-3 h-3 text-rose-400 shrink-0" /> {t.maxCombo}
            </span>
            <span className="text-lg sm:text-xl font-black text-cyan-300 mt-0.5 whitespace-nowrap">
              {stats.highestCombo.toFixed(1)}x
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-2.5 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3 h-3 text-blue-400 shrink-0" /> {t.clearTime}
            </span>
            <span className="text-lg sm:text-xl font-black text-white mt-0.5 whitespace-nowrap">
              {timeFormatted}
            </span>
          </div>
        </div>

        {/* Rewarded Ad 2x Coins Boost CTA (Key Monetization Lever) */}
        {!hasClaimedDoubleCoins && stats.coins > 0 && (
          <button
            onClick={onDoubleCoinsAd}
            className="w-full py-3 px-3 sm:px-4 mb-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 border border-amber-300/40 animate-pulse whitespace-nowrap"
          >
            <Video className="w-4 h-4 fill-slate-950 shrink-0" />
            <span className="truncate">{t.doubleCoinsAd} (+{stats.coins} {t.coinsUnit})</span>
          </button>
        )}

        {hasClaimedDoubleCoins && (
          <div className="w-full py-2 px-3 mb-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap">
            <Check className="w-4 h-4 shrink-0" />
            <span>{t.coinsDoubled}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="w-full space-y-2">
          {!isLastDistrict ? (
            <button
              onClick={onNextDistrict}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>{t.nextDistrict}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          ) : (
            <button
              onClick={onPlayAgain}
              data-start="true"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4 fill-slate-950 shrink-0" />
              <span>{t.playAgain}</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            {!isLastDistrict && (
              <button
                onClick={onPlayAgain}
                className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'ko' ? '재도전' : 'Retry'}</span>
              </button>
            )}

            <button
              onClick={onTitle}
              className={`py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                isLastDistrict ? 'col-span-2' : ''
              }`}
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span>{t.mainMenu}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
