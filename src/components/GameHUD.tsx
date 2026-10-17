/**
 * Low-occlusion, world-matched Game HUD with tabular-nums readouts,
 * combo multiplier meter, boost gauge, settings button, and mobile touch controls.
 * Fully optimized for mobile screens without button clipping or awkward text wrapping.
 */

import React from 'react';
import {
  Coins,
  Pause,
  Volume2,
  VolumeX,
  Wrench,
  Zap,
  Snowflake,
  Flame,
  Settings,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import type { ComboState, GameStats, VehicleState } from '../game/types.ts';
import type { Language } from '../game/i18n.ts';
import { translations } from '../game/i18n.ts';

interface GameHUDProps {
  stats: GameStats;
  combo: ComboState;
  vehicle: VehicleState;
  targetPercentage: number;
  districtName?: string;
  isMuted: boolean;
  language: Language;
  onToggleMute: () => void;
  onOpenUpgrades: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  onPause: () => void;
  // Touch event callbacks
  onTouchThrottle: (val: number) => void;
  onTouchSteer: (val: number) => void;
  onTouchBoost: (val: boolean) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  combo,
  vehicle,
  targetPercentage,
  districtName,
  isMuted,
  language,
  onToggleMute,
  onOpenUpgrades,
  onOpenShop,
  onOpenSettings,
  onPause,
  onTouchThrottle,
  onTouchSteer,
  onTouchBoost,
}) => {
  const t = translations[language];
  const speedDisplay = Math.round(Math.abs(vehicle.speed) * 3.6); // km/h
  const clearPercent = stats.clearPercentage;
  const isTargetMet = clearPercent >= targetPercentage;

  // Localized tier name
  let tierLabel = combo.tierName;
  if (language === 'ko') {
    if (combo.multiplier >= 4.5) tierLabel = '눈보라 전설!';
    else if (combo.multiplier >= 3.5) tierLabel = '블리자드 질주!';
    else if (combo.multiplier >= 2.5) tierLabel = '드리프트 마스터!';
    else if (combo.multiplier >= 1.8) tierLabel = '제설 전문가';
    else if (combo.multiplier > 1.0) tierLabel = '쾌속 제설';
  }

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none">
      {/* TOP ROW: District / Clearance Progress & Action Buttons */}
      <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 flex items-start justify-between gap-1.5 sm:gap-2">
        {/* Top-Left: District & Clearance Progress */}
        <div className="flex flex-col gap-0.5 sm:gap-1 pointer-events-auto bg-slate-900/90 border border-slate-700/70 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl min-w-0 max-w-[120px] sm:max-w-[240px] md:max-w-[280px] shrink">
          <div className="flex items-center justify-between gap-1 text-[9px] sm:text-xs text-slate-300 font-semibold tracking-wider whitespace-nowrap">
            <span className="flex items-center gap-1 text-cyan-300 truncate min-w-0">
              <Snowflake className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">{districtName || t.districtName}</span>
            </span>
            <span className="text-amber-400 font-mono-numbers text-[9px] sm:text-xs shrink-0 font-bold">
              {targetPercentage}%
            </span>
          </div>

          {/* Clearance Progress Bar */}
          <div className="relative w-full h-2 sm:h-3.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-300 ${
                isTargetMet
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-cyan-500 to-sky-400'
              }`}
              style={{ width: `${Math.min(clearPercent, 100)}%` }}
            />
            {/* Target Marker Needle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow"
              style={{ left: `${targetPercentage}%` }}
              title={`${t.goal}: ${targetPercentage}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] sm:text-xs font-mono-numbers pt-0.5 whitespace-nowrap gap-1">
            <span className="text-white font-bold text-[10px] sm:text-sm shrink-0">
              {clearPercent}% <span className="text-slate-400 text-[8px] sm:text-xs font-normal">{t.cleared}</span>
            </span>
            <span className="text-amber-300 font-bold text-[10px] sm:text-sm shrink-0">
              {stats.score.toLocaleString()} <span className="text-slate-400 text-[8px] sm:text-xs font-normal">{t.pts}</span>
            </span>
          </div>
        </div>

        {/* Top-Right: Coins & Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 pointer-events-auto shrink-0">
          {/* Coin Purse */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 border border-amber-500/40 px-1.5 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-2xl shadow-xl text-amber-300 font-mono-numbers font-bold text-[11px] sm:text-sm whitespace-nowrap shrink-0">
            <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            <span>{stats.coins}</span>
          </div>

          {/* Shop Button */}
          <button
            onClick={onOpenShop}
            aria-label={t.shop}
            className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 bg-slate-900/90 border border-amber-500/50 hover:bg-slate-800 text-amber-300 hover:text-white rounded-lg sm:rounded-2xl shadow-xl transition active:scale-95 cursor-pointer shrink-0"
            title={t.shopTitle}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </button>

          {/* Garage Upgrades Button */}
          <button
            onClick={onOpenUpgrades}
            aria-label={t.garage}
            className="flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 w-7 h-7 sm:w-auto sm:px-3 sm:py-2 bg-slate-900/90 border border-sky-500/40 hover:bg-slate-800 text-sky-200 hover:text-white rounded-lg sm:rounded-2xl shadow-xl transition active:scale-95 cursor-pointer text-xs font-bold shrink-0"
          >
            <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
            <span className="hidden sm:inline">{t.garage}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            aria-label={t.settingsTitle}
            className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 bg-slate-900/90 border border-slate-700/60 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg sm:rounded-2xl shadow-xl transition active:scale-95 cursor-pointer shrink-0"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
          </button>

          {/* Mute Audio */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? t.unmute : t.mute}
            className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 bg-slate-900/90 border border-slate-700/60 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg sm:rounded-2xl shadow-xl transition active:scale-95 cursor-pointer shrink-0"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
          </button>

          {/* Pause */}
          <button
            onClick={onPause}
            aria-label={t.gamePaused}
            className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 bg-slate-900/90 border border-slate-700/60 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg sm:rounded-2xl shadow-xl transition active:scale-95 cursor-pointer shrink-0"
          >
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Floating Combo Multiplier Meter (Centered cleanly, zero collision with header items) */}
      {combo.multiplier > 1.0 && (
        <div className="absolute top-16 sm:top-18 left-1/2 -translate-x-1/2 pointer-events-auto transform animate-in fade-in zoom-in duration-200 z-20">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-amber-500/50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-[0_8px_20px_rgba(245,158,11,0.25)] whitespace-nowrap">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-bounce" />
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-black text-amber-400 font-mono-numbers tracking-tight">
                  {combo.multiplier.toFixed(1)}x
                </span>
                <span className="text-[10px] sm:text-xs font-extrabold text-cyan-300 tracking-wider">
                  {tierLabel}
                </span>
              </div>
              {/* Combo Decay Timer Gauge */}
              <div className="w-24 sm:w-28 h-1 sm:h-1.5 bg-slate-700/80 rounded-full overflow-hidden mt-0.5 sm:mt-1">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${Math.max(0, combo.gauge * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CENTER-BOTTOM: Vehicle Telemetry & Nitro Boost Gauge */}
      <div className="fixed bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto z-20">
        <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-xl flex flex-col items-center gap-1">
          <div className="flex items-center gap-2.5 sm:gap-3 text-xs font-mono-numbers whitespace-nowrap">
            {/* Speed readout */}
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold text-white">{speedDisplay}</span>
              <span className="text-slate-400 text-[8px] sm:text-[9px]">{t.speedKm}</span>
            </div>

            <div className="h-3 w-px bg-slate-700" />

            {/* Nitro Boost Status */}
            <div className="flex items-center gap-1">
              <Zap className={`w-3 h-3 ${vehicle.isBoosting ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-300">
                {t.nitroMobile || 'NITRO'}
              </span>
            </div>
          </div>

          {/* Nitro Charge Bar */}
          <div className="w-24 sm:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-75 ${
                vehicle.isBoosting
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
              }`}
              style={{ width: `${vehicle.boostCharge}%` }}
            />
          </div>
        </div>
      </div>

      {/* LEFT-BOTTOM: On-Screen Steering D-Pad (Left Thumb) */}
      <div
        className="fixed z-30 pointer-events-auto flex items-center gap-2 sm:gap-3 select-none touch-none"
        style={{
          left: 'max(12px, env(safe-area-inset-left, 12px))',
          bottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        }}
      >
        {/* Steer Left Button */}
        <button
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onTouchSteer(-1); }}
          onPointerUp={(e) => { e.preventDefault(); onTouchSteer(0); }}
          onPointerCancel={(e) => { e.preventDefault(); onTouchSteer(0); }}
          onPointerLeave={() => onTouchSteer(0)}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Steer left"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/95 border-2 border-cyan-400/90 flex flex-col items-center justify-center text-cyan-300 active:bg-cyan-500/40 active:scale-95 active:border-cyan-200 shadow-[0_4px_18px_rgba(6,182,212,0.4)] transition cursor-pointer select-none touch-none"
        >
          <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8 pointer-events-none stroke-[2.5]" />
          <span className="text-[7px] font-extrabold text-cyan-200 uppercase tracking-tighter">LEFT</span>
        </button>

        {/* Steer Right Button */}
        <button
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onTouchSteer(1); }}
          onPointerUp={(e) => { e.preventDefault(); onTouchSteer(0); }}
          onPointerCancel={(e) => { e.preventDefault(); onTouchSteer(0); }}
          onPointerLeave={() => onTouchSteer(0)}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Steer right"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/95 border-2 border-cyan-400/90 flex flex-col items-center justify-center text-cyan-300 active:bg-cyan-500/40 active:scale-95 active:border-cyan-200 shadow-[0_4px_18px_rgba(6,182,212,0.4)] transition cursor-pointer select-none touch-none"
        >
          <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8 pointer-events-none stroke-[2.5]" />
          <span className="text-[7px] font-extrabold text-cyan-200 uppercase tracking-tighter">RIGHT</span>
        </button>
      </div>

      {/* RIGHT-BOTTOM: On-Screen Driving Pedals (Right Thumb) */}
      <div
        className="fixed z-30 pointer-events-auto flex items-center gap-2 sm:gap-2.5 select-none touch-none"
        style={{
          right: 'max(12px, env(safe-area-inset-right, 12px))',
          bottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        }}
      >
        {/* Reverse / Brake Pedal */}
        <button
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onTouchThrottle(-1); }}
          onPointerUp={(e) => { e.preventDefault(); onTouchThrottle(0); }}
          onPointerCancel={(e) => { e.preventDefault(); onTouchThrottle(0); }}
          onPointerLeave={() => onTouchThrottle(0)}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Reverse"
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-900/95 border-2 border-rose-500/70 flex flex-col items-center justify-center text-rose-300 active:bg-rose-500/40 active:scale-95 active:border-rose-300 shadow-[0_4px_16px_rgba(244,63,94,0.35)] transition cursor-pointer select-none touch-none"
        >
          <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none stroke-[2.5]" />
          <span className="text-[7px] font-black uppercase tracking-tight text-rose-300">REV</span>
        </button>

        {/* Forward Drive / Gas Pedal (Primary) */}
        <button
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onTouchThrottle(1); }}
          onPointerUp={(e) => { e.preventDefault(); onTouchThrottle(0); }}
          onPointerCancel={(e) => { e.preventDefault(); onTouchThrottle(0); }}
          onPointerLeave={() => onTouchThrottle(0)}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Drive Forward"
          className="w-15 h-15 sm:w-17 sm:h-17 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 border-2 border-emerald-300 flex flex-col items-center justify-center text-white active:scale-95 shadow-[0_6px_24px_rgba(16,185,129,0.55)] transition cursor-pointer select-none touch-none"
        >
          <ArrowUp className="w-7 h-7 sm:w-8 sm:h-8 pointer-events-none stroke-[3]" />
          <span className="text-[8px] font-black uppercase tracking-wider text-emerald-100">GAS</span>
        </button>

        {/* Nitro Boost Pedal */}
        <button
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onTouchBoost(true); }}
          onPointerUp={(e) => { e.preventDefault(); onTouchBoost(false); }}
          onPointerCancel={(e) => { e.preventDefault(); onTouchBoost(false); }}
          onPointerLeave={() => onTouchBoost(false)}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Nitro Boost"
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-orange-500 border-2 border-amber-200 flex flex-col items-center justify-center text-slate-950 active:scale-95 shadow-[0_4px_18px_rgba(245,158,11,0.5)] transition cursor-pointer select-none touch-none"
        >
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950 text-slate-950 pointer-events-none" />
          <span className="text-[7px] font-black uppercase text-slate-950">BOOST</span>
        </button>
      </div>
    </div>
  );
};
