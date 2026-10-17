/**
 * Interactive Lucky Spin Wheel Modal:
 * Features a dynamic physics-simulated SVG prize wheel with 6 sectors,
 * mathematically verified center-landing alignment, decelerating tick audio,
 * celebratory fanfare, and verified coin claiming.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Sparkles,
  Trophy,
  Video,
  RotateCw,
  Coins,
  CheckCircle,
} from 'lucide-react';
import type { Language } from '../game/i18n.ts';
import { translations } from '../game/i18n.ts';
import { LUCKY_WHEEL_PRIZES } from '../game/monetization.ts';
import type { LuckyWheelPrize } from '../game/types.ts';
import { soundEngine } from '../game/audio.ts';

interface LuckyWheelModalProps {
  canSpinFree: boolean;
  language: Language;
  onSpinWin: (prize: LuckyWheelPrize) => void;
  onWatchAdToSpin: () => void;
  onClose: () => void;
}

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  canSpinFree,
  language,
  onSpinWin,
  onWatchAdToSpin,
  onClose,
}) => {
  const t = translations[language];
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [wonPrize, setWonPrize] = useState<LuckyWheelPrize | null>(null);
  const [isClaimed, setIsClaimed] = useState(false);

  const timeoutsRef = useRef<number[]>([]);
  const wonPrizeRef = useRef<LuckyWheelPrize | null>(null);
  const isClaimedRef = useRef(false);

  wonPrizeRef.current = wonPrize;
  isClaimedRef.current = isClaimed;

  const sectorCount = LUCKY_WHEEL_PRIZES.length;
  const sectorAngle = 360 / sectorCount; // 60 degrees per sector

  // Cleanup pending audio timers on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      // Ensure won prize is awarded if user closes before clicking claim button
      if (wonPrizeRef.current && !isClaimedRef.current) {
        onSpinWin(wonPrizeRef.current);
      }
    };
  }, [onSpinWin]);

  const handleClose = () => {
    if (wonPrize && !isClaimed) {
      onSpinWin(wonPrize);
      setIsClaimed(true);
    }
    onClose();
  };

  const startSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrize(null);
    setIsClaimed(false);

    // Pick random prize with weighted probability
    const totalWeight = LUCKY_WHEEL_PRIZES.reduce((acc, p) => acc + p.weight, 0);
    let rand = Math.random() * totalWeight;
    let winningIndex = 0;
    for (let i = 0; i < LUCKY_WHEEL_PRIZES.length; i++) {
      rand -= LUCKY_WHEEL_PRIZES[i].weight;
      if (rand <= 0) {
        winningIndex = i;
        break;
      }
    }

    const prize = LUCKY_WHEEL_PRIZES[winningIndex];

    /**
     * Exact Geometric Alignment Math:
     * - In SVG coordinates, (100, 100) is center, 0° is 3 o'clock.
     * - Top indicator needle is fixed at 12 o'clock, which is 270° in SVG space.
     * - Sector i center is: (i * 60° + 30°).
     * - Rotating clockwise by R degrees places sector i at: (30° + i * 60° + R) mod 360.
     * - To land squarely under the 12 o'clock (270°) needle:
     *     R = 270° - (30° + i * 60°) = (240° - i * 60°) mod 360.
     */
    const targetMod = ((240 - winningIndex * sectorAngle) % 360 + 360) % 360;
    const currentMod = ((rotationDegrees % 360) + 360) % 360;

    // Always rotate forward clockwise by at least full spins + delta
    let delta = (targetMod - currentMod) % 360;
    if (delta <= 0) {
      delta += 360;
    }

    const fullSpins = 360 * 5; // 5 complete high-speed revolutions
    // Small safe jitter (±4°) to keep needle centered away from ±30° sector boundary lines
    const safeJitter = Math.floor((Math.random() - 0.5) * 8);
    const targetAngle = rotationDegrees + fullSpins + delta + safeJitter;

    setRotationDegrees(targetAngle);

    // Clear previous audio timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // Schedule decelerating mechanical ticker clicks
    const tickDelays = [
      70, 140, 210, 280, 350, 430, 510, 600, 700, 810,
      930, 1060, 1200, 1350, 1510, 1690, 1890, 2110, 2350, 2620,
      2920, 3250, 3550, 3820,
    ];

    tickDelays.forEach((delay, idx) => {
      const tId = window.setTimeout(() => {
        soundEngine.playWheelTick(idx % 2 === 0);
      }, delay);
      timeoutsRef.current.push(tId);
    });

    // Landing sequence at 4.0 seconds
    const endTimer = window.setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(prize);
      soundEngine.playVictoryFanfare();
    }, 4000);
    timeoutsRef.current.push(endTimer);
  };

  const handleClaimPrize = () => {
    if (!wonPrize || isClaimed) return;
    soundEngine.playCoinJingle();
    onSpinWin(wonPrize);
    setIsClaimed(true);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm select-none animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm bg-slate-900 border border-amber-500/50 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col items-center p-5 sm:p-6 text-center">
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close lucky wheel"
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-1 shadow whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{t.luckyWheel}</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-wide whitespace-nowrap">
            {t.luckyWheelTitle}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 break-keep leading-relaxed px-2">
            {t.luckyWheelSubtitle}
          </p>
        </div>

        {/* Wheel Assembly Container */}
        <div className="relative w-60 h-60 sm:w-64 sm:h-64 my-1 flex items-center justify-center">
          {/* Top Indicator Needle Pointer (Points DOWN into 12 o'clock sector) */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
            <div className={`w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[22px] border-t-amber-400 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] transition-transform duration-75 ${isSpinning ? 'scale-110 -rotate-3' : ''}`} />
          </div>

          {/* Rotating SVG Wheel */}
          <div
            className="w-full h-full rounded-full shadow-[0_0_35px_rgba(245,158,11,0.3)] border-4 border-amber-400/80 overflow-hidden"
            style={{
              transform: `rotate(${rotationDegrees}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.12, 0.95, 0.2, 1)' : 'none',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {LUCKY_WHEEL_PRIZES.map((prize, idx) => {
                const startAngle = (idx * sectorAngle * Math.PI) / 180;
                const endAngle = ((idx + 1) * sectorAngle * Math.PI) / 180;

                const x1 = 100 + 100 * Math.cos(startAngle);
                const y1 = 100 + 100 * Math.sin(startAngle);
                const x2 = 100 + 100 * Math.cos(endAngle);
                const y2 = 100 + 100 * Math.sin(endAngle);

                // Label position in center of sector
                const textAngle = idx * sectorAngle + sectorAngle / 2;
                const textRad = (textAngle * Math.PI) / 180;
                const textX = 100 + 64 * Math.cos(textRad);
                const textY = 100 + 64 * Math.sin(textRad);

                return (
                  <g key={prize.id}>
                    {/* Sector slice */}
                    <path
                      d={`M 100,100 L ${x1},${y1} A 100,100 0 0,1 ${x2},${y2} Z`}
                      fill={prize.color}
                      stroke="#0f172a"
                      strokeWidth="2.5"
                    />

                    {/* Sector Text & Icon */}
                    <g transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}>
                      <text
                        x={textX}
                        y={textY - 3}
                        fill="#0f172a"
                        fontSize="11"
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        +{prize.coins}
                      </text>
                      <text
                        x={textX}
                        y={textY + 9}
                        fill="#0f172a"
                        fontSize="7"
                        fontWeight="800"
                        textAnchor="middle"
                        dominantBaseline="central"
                        opacity="0.8"
                      >
                        COINS
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Trophy Hub */}
          <div className="absolute w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-xl z-20 pointer-events-none">
            <Trophy className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
          </div>
        </div>

        {/* Winner Prize Notification & Claim Section */}
        {wonPrize && (
          <div className="mt-3 w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border border-amber-400/60 shadow-lg text-center animate-in zoom-in-95 duration-200">
            <div className="text-[11px] text-amber-300 font-extrabold flex items-center justify-center gap-1.5 whitespace-nowrap mb-1">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t.spinCongrats}</span>
            </div>

            <div className="text-lg font-black text-white flex items-center justify-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="text-amber-300">+{wonPrize.coins} {t.coinsUnit}</span>
              <span className="text-xs text-slate-300 font-medium">({wonPrize.name})</span>
            </div>

            {/* Explicit Claim Button */}
            {!isClaimed ? (
              <button
                onClick={handleClaimPrize}
                className="mt-2.5 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/30 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 animate-pulse"
              >
                <Coins className="w-4 h-4 shrink-0" />
                <span>{wonPrize.coins} {t.claimPrizeCoins}</span>
              </button>
            ) : (
              <div className="mt-2 text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>+{wonPrize.coins} {t.coinsUnit} {t.claimedDone}</span>
              </div>
            )}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="w-full mt-3.5 space-y-2">
          {isSpinning ? (
            <div className="w-full py-3.5 rounded-2xl bg-slate-800 border border-amber-500/30 text-amber-300 font-bold text-sm tracking-wide flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin shrink-0" />
              <span>{t.spinning}</span>
            </div>
          ) : canSpinFree ? (
            <button
              onClick={startSpin}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/30 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <RotateCw className="w-4 h-4 shrink-0" />
              <span>{t.spinFree}</span>
            </button>
          ) : (
            <button
              onClick={onWatchAdToSpin}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/30 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Video className="w-4 h-4 fill-slate-950 shrink-0" />
              <span>{wonPrize ? t.spinAgainAd : t.spinAd}</span>
            </button>
          )}

          {wonPrize && isClaimed && (
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              {language === 'ko' ? '닫기' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
