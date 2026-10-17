/**
 * Atmospheric Title Screen with inline SVG title lockup,
 * primary start CTA, controls line, sound toggle, and settings button.
 */

import React from 'react';
import {
  Play,
  Volume2,
  VolumeX,
  Sparkles,
  Snowflake,
  Settings,
  ShoppingBag,
  Calendar,
  Coins,
} from 'lucide-react';
import type { Language } from '../game/i18n.ts';
import { translations } from '../game/i18n.ts';

interface TitleScreenProps {
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenShop: () => void;
  onOpenDailyReward: () => void;
  onOpenLuckyWheel: () => void;
  canClaimDailyReward: boolean;
  coins: number;
  highScore: number;
  language: Language;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  isMuted,
  onToggleMute,
  onOpenSettings,
  onOpenShop,
  onOpenDailyReward,
  onOpenLuckyWheel,
  canClaimDailyReward,
  coins,
  highScore,
  language,
}) => {
  const t = translations[language];

  return (
    <div
      onClick={(e) => {
        // If user tapped a specific button (shop, settings, mute, daily, etc.), don't trigger start
        if ((e.target as HTMLElement).closest('button, a, [role="button"]')) return;
        onStart();
      }}
      className="fixed inset-0 z-20 flex flex-col justify-between p-3.5 sm:p-6 md:p-12 pb-5 select-none cursor-pointer"
      style={{
        background: 'radial-gradient(circle at 50% 40%, rgba(15, 23, 42, 0.15) 0%, rgba(11, 21, 40, 0.65) 100%)',
      }}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full pointer-events-auto gap-1 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/80 border border-cyan-500/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-cyan-200 text-[11px] sm:text-xs font-medium tracking-wide shadow-lg shrink-0">
            <Snowflake className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 animate-spin shrink-0" style={{ animationDuration: '10s' }} />
            <span className="hidden md:inline">{t.serviceDistrict}</span>
            <span className="hidden sm:inline md:hidden">{language === 'ko' ? '산골 제1구역' : 'District 1'}</span>
            <span className="sm:hidden font-bold">{language === 'ko' ? '제1구역' : 'Dist 1'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          {/* Coins Display */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/80 border border-amber-500/40 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-lg text-amber-300 font-mono-numbers font-bold text-xs sm:text-sm whitespace-nowrap shrink-0">
            <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
            <span>{coins}</span>
          </div>

          {/* Shop Button */}
          <button
            onClick={onOpenShop}
            aria-label={t.shop}
            className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 border border-amber-500/50 text-amber-300 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-lg cursor-pointer shrink-0"
            title={t.shopTitle}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-amber-400" />
          </button>

          {/* Lucky Wheel Button */}
          <button
            onClick={onOpenLuckyWheel}
            aria-label={t.luckyWheel}
            className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 border border-cyan-500/50 text-cyan-300 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-lg cursor-pointer shrink-0"
            title={t.luckyWheelTitle}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-cyan-400" />
          </button>

          {/* Daily Reward Button with notification pip */}
          <button
            onClick={onOpenDailyReward}
            aria-label={t.dailyReward}
            className="relative flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-lg cursor-pointer shrink-0"
            title={t.dailyRewardTitle}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-slate-300" />
            {canClaimDailyReward && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 border-2 border-slate-900 rounded-full animate-ping" />
            )}
            {canClaimDailyReward && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 border-2 border-slate-900 rounded-full" />
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            aria-label={t.settingsTitle}
            className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-lg cursor-pointer shrink-0"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-slate-300" />
          </button>

          {/* Sound Mute button */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute game audio' : 'Mute game audio'}
            tabIndex={-1}
            className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow-lg cursor-pointer shrink-0"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Hero Center Lockup over negative space */}
      <div className="max-w-xl mx-auto text-center flex flex-col items-center pointer-events-auto my-auto">
        {/* Custom Inline SVG Title Lockup */}
        <div className="mb-4 drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]">
          <svg viewBox="0 0 520 120" className="w-full max-w-[480px] h-auto">
            <defs>
              <linearGradient id="plowGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="snowFrost" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#bae6fd" />
              </linearGradient>
            </defs>

            {/* Snow Drifts Crest */}
            <path
              d="M 60,35 Q 120,10 200,28 Q 280,5 360,25 Q 440,15 480,35"
              fill="none"
              stroke="#e0f2fe"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Top Snow Puffs */}
            <circle cx="160" cy="22" r="7" fill="#ffffff" />
            <circle cx="280" cy="18" r="8" fill="#ffffff" />
            <circle cx="390" cy="24" r="6" fill="#ffffff" />

            {/* Display Text */}
            <text
              x="260"
              y="62"
              textAnchor="middle"
              fill="url(#snowFrost)"
              fontSize={language === 'ko' ? '40' : '46'}
              fontWeight="800"
              letterSpacing={language === 'ko' ? '4' : '6'}
              fontFamily="'Fredoka', sans-serif"
            >
              {language === 'ko' ? '프로스트 플로우' : 'FROST PLOW'}
            </text>

            {/* Sub-Banner Plaque */}
            <rect x="110" y="74" width="300" height="28" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <text
              x="260"
              y="93"
              textAnchor="middle"
              fill="url(#plowGold)"
              fontSize={language === 'ko' ? '14' : '16'}
              fontWeight="700"
              letterSpacing={language === 'ko' ? '2' : '4'}
              fontFamily="'Fredoka', sans-serif"
            >
              {language === 'ko' ? '포근한 겨울 제설 어드벤처' : 'COZY SNOW CLEARANCE'}
            </text>
          </svg>
        </div>

        <p className="text-slate-200 text-xs sm:text-sm md:text-base font-normal max-w-md mx-auto mb-5 sm:mb-6 drop-shadow leading-relaxed px-2">
          {t.titleDescription}
        </p>

        {/* Start Game CTA */}
        <button
          onClick={onStart}
          data-start="true"
          className="group relative inline-flex items-center gap-2.5 sm:gap-3 px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-400 text-slate-950 font-extrabold text-base sm:text-lg tracking-wide shadow-[0_10px_30px_rgba(245,158,11,0.5)] hover:shadow-[0_12px_36px_rgba(245,158,11,0.7)] active:scale-95 transition cursor-pointer whitespace-nowrap animate-pulse"
        >
          <Play className="w-5 h-5 fill-slate-950 text-slate-950 group-hover:scale-110 transition shrink-0" />
          <span className="sm:hidden">{language === 'ko' ? '터치하여 제설 시작하기 ▶' : 'TAP TO START DRIVING ▶'}</span>
          <span className="hidden sm:inline">{t.startCta}</span>
        </button>

        {highScore > 0 && (
          <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs text-amber-300 font-mono-numbers">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{t.bestScore}: {highScore.toLocaleString()} {t.pts}</span>
          </div>
        )}
      </div>

      {/* Flat borderless control-hint line in bottom safe margin */}
      <div className="w-full text-center text-[11px] sm:text-xs md:text-sm text-slate-300/90 font-medium tracking-wide pointer-events-auto px-2">
        <span className="bg-slate-900/80 px-4 py-2 rounded-full border border-cyan-500/40 inline-flex items-center gap-2 shadow-lg">
          <span className="text-cyan-400 font-bold">🎮 {language === 'ko' ? '조작 안내' : 'Controls'}:</span>
          <span className="sm:hidden">
            {language === 'ko'
              ? '화면을 터치해 시작! 주행 시 좌/우 방향키(◀ ▶)와 페달 활성화'
              : 'Tap to start! Driving D-pad (◀ ▶) and pedals active in game'}
          </span>
          <span className="hidden sm:inline">{t.controlHint}</span>
        </span>
      </div>
    </div>
  );
};
