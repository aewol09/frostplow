/**
 * 7-Day Winter Daily Login Attendance Calendar Modal:
 * Drastically improves player D1/D7 retention on Google Play Store with escalating rewards.
 */

import React from 'react';
import {
  X,
  Coins,
  Check,
  Crown,
  Calendar,
  Sparkles,
  Lock,
} from 'lucide-react';
import type { Language } from '../game/i18n.ts';
import { translations } from '../game/i18n.ts';
import { DAILY_REWARDS } from '../game/monetization.ts';
import type { DailyRewardState } from '../game/types.ts';

interface DailyRewardModalProps {
  state: DailyRewardState;
  canClaimToday: boolean;
  language: Language;
  onClaim: () => void;
  onClose: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  state,
  canClaimToday,
  language,
  onClaim,
  onClose,
}) => {
  const t = translations[language];
  const nextStreak = canClaimToday ? state.currentStreak + 1 : state.currentStreak;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/95 shrink-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide whitespace-nowrap truncate">
                {t.dailyRewardTitle}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 break-keep line-clamp-1 sm:line-clamp-none">
                {t.dailyRewardSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close daily reward modal"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7-Day Attendance Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-4">
            {DAILY_REWARDS.map((reward) => {
              const isClaimed = state.claimedDays.includes(reward.day);
              const isCurrentDay = canClaimToday && nextStreak === reward.day;
              const isFuture = !isClaimed && !isCurrentDay;
              const isDay7 = reward.day === 7;

              return (
                <div
                  key={reward.day}
                  className={`relative p-3 rounded-2xl border transition flex flex-col items-center justify-between text-center gap-1.5 ${
                    isDay7 ? 'col-span-3 sm:col-span-2' : ''
                  } ${
                    isCurrentDay
                      ? 'bg-gradient-to-b from-amber-500/25 to-slate-800/90 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-102 ring-1 ring-amber-400'
                      : isClaimed
                      ? 'bg-slate-800/40 border-slate-700/40 opacity-70'
                      : 'bg-slate-800/70 border-slate-700/80'
                  }`}
                >
                  {/* Top day badge */}
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider whitespace-nowrap">
                    {reward.day}{t.dayLabel}
                  </span>

                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center my-1 ${
                      isDay7
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : isCurrentDay
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : isClaimed
                        ? 'bg-emerald-950/40 text-emerald-400'
                        : 'bg-slate-700/60 text-slate-400'
                    }`}
                  >
                    {isClaimed ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : isDay7 ? (
                      <Crown className="w-5 h-5 text-amber-300 animate-pulse" />
                    ) : isFuture ? (
                      <Lock className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Coins className="w-5 h-5 text-amber-400" />
                    )}
                  </div>

                  {/* Reward amount */}
                  <div>
                    <span className="text-xs sm:text-sm font-black text-amber-300 font-mono-numbers whitespace-nowrap">
                      +{reward.coins}
                    </span>
                    {reward.specialReward && (
                      <p className="text-[9px] text-amber-200 font-bold mt-0.5 whitespace-nowrap truncate">
                        ★ {reward.specialReward}
                      </p>
                    )}
                  </div>

                  {/* Status chip */}
                  <div className="w-full pt-1 border-t border-slate-700/40 text-[10px] font-bold whitespace-nowrap">
                    {isClaimed ? (
                      <span className="text-emerald-400">{language === 'ko' ? '수령 완료' : 'Claimed'}</span>
                    ) : isCurrentDay ? (
                      <span className="text-amber-300 animate-pulse">{language === 'ko' ? '수령 가능!' : 'Claim!'}</span>
                    ) : (
                      <span className="text-slate-500">{language === 'ko' ? '대기 중' : 'Locked'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Claim Button */}
          <div className="w-full">
            {canClaimToday ? (
              <button
                onClick={onClaim}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-amber-500/30 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 fill-slate-950 shrink-0" />
                <span>{nextStreak}{t.dayLabel} {t.claimReward}</span>
              </button>
            ) : (
              <div className="w-full py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{t.claimedToday} ({language === 'ko' ? '내일 다시 방문하세요!' : 'Come back tomorrow!'})</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
