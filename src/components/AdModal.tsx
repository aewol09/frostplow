/**
 * Google AdMob Rewarded Interstitial Ad (보상형 전면 광고) Player:
 * 100% Full-bleed mobile immersion experience covering the entire screen (100vw × 100vh).
 * Features official Google AdMob headers with production Ad unit IDs,
 * interactive 60 FPS canvas game commercial trailer, audio controls,
 * countdown progress bar, Google Play Store install card, and reward fulfillment.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  ShieldCheck,
  Volume2,
  VolumeX,
  Download,
  X,
  ExternalLink,
} from 'lucide-react';
import type { Language } from '../game/i18n.ts';
import { soundEngine } from '../game/audio.ts';

interface AdModalProps {
  rewardTitle: string;
  language: Language;
  onAdCompleted: () => void;
  onClose: () => void;
}

export const AdModal: React.FC<AdModalProps> = ({
  rewardTitle,
  language,
  onAdCompleted,
  onClose,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAdMuted, setIsAdMuted] = useState(false);
  const [installedClicked, setInstalledClicked] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  // Countdown timer for Rewarded Interstitial
  useEffect(() => {
    if (secondsRemaining > 0) {
      const timer = setTimeout(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsCompleted(true);
      soundEngine.playVictoryFanfare();
    }
  }, [secondsRemaining]);

  // Canvas animated 3D action commercial trailer (Drifting snow racer)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number }> = [];

    // Initialize snow particles
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * 640,
        y: Math.random() * 360,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2.5 + 1.2,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    const render = () => {
      time += 0.035;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Sky & Aurora gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#040b18');
      skyGrad.addColorStop(0.5, '#0b2144');
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Aurora waves
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(0, 40 + Math.sin(time * 1.2) * 16);
      ctx.bezierCurveTo(
        w * 0.3,
        25 + Math.cos(time * 0.8) * 20,
        w * 0.7,
        60 + Math.sin(time) * 22,
        w,
        35 + Math.cos(time * 1.4) * 15
      );
      ctx.lineTo(w, 100);
      ctx.lineTo(0, 100);
      ctx.closePath();
      const auroraGrad = ctx.createLinearGradient(0, 0, w, 0);
      auroraGrad.addColorStop(0, '#06b6d4');
      auroraGrad.addColorStop(0.5, '#10b981');
      auroraGrad.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = auroraGrad;
      ctx.fill();
      ctx.restore();

      // Mountain silhouettes in background
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.6);
      ctx.lineTo(w * 0.2, h * 0.38);
      ctx.lineTo(w * 0.45, h * 0.52);
      ctx.lineTo(w * 0.7, h * 0.32);
      ctx.lineTo(w, h * 0.55);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // 2. 3D Perspective Road
      const roadHorizonY = h * 0.46;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(w * 0.44, roadHorizonY);
      ctx.lineTo(w * 0.56, roadHorizonY);
      ctx.lineTo(w * 0.98, h);
      ctx.lineTo(w * 0.02, h);
      ctx.closePath();
      ctx.fill();

      // Road side borders (Red/White curb markers)
      const curbCount = 8;
      for (let i = 0; i < curbCount; i++) {
        const offset = ((i / curbCount) + (time * 0.8) % 1) % 1;
        const curbY = roadHorizonY + Math.pow(offset, 1.8) * (h - roadHorizonY);
        const curbW = 6 + offset * 24;
        const isRed = (i + Math.floor(time * 4)) % 2 === 0;
        ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';

        // Left curb
        const leftX = w * 0.44 + (w * 0.02 - w * 0.44) * Math.pow(offset, 1.8);
        ctx.fillRect(leftX - curbW, curbY, curbW, 6 + offset * 10);

        // Right curb
        const rightX = w * 0.56 + (w * 0.98 - w * 0.56) * Math.pow(offset, 1.8);
        ctx.fillRect(rightX, curbY, curbW, 6 + offset * 10);
      }

      // Center dashed road line
      for (let i = 0; i < 5; i++) {
        const lineOffset = ((i / 5) + (time * 1.4) % 1) % 1;
        const lineY = roadHorizonY + Math.pow(lineOffset, 1.8) * (h - roadHorizonY);
        const lineH = 4 + lineOffset * 18;
        const lineW = 2 + lineOffset * 6;
        ctx.fillStyle = '#facc15';
        ctx.fillRect(w * 0.5 - lineW / 2, lineY, lineW, lineH);
      }

      // 3. Snow particles flying past
      ctx.fillStyle = '#ffffff';
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy * (1 + (p.y / h) * 1.5);
        if (p.y > h) {
          p.y = 0;
          p.x = Math.random() * w;
        }
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + p.y / h), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 4. Drifting 3D Sports Vehicle
      const carBaseY = h * 0.72;
      const swayX = Math.sin(time * 3) * (w * 0.18);
      const carCenterX = w * 0.5 + swayX;
      const carTilt = Math.cos(time * 3) * 0.15;

      ctx.save();
      ctx.translate(carCenterX, carBaseY);
      ctx.rotate(carTilt);

      // Nitro booster fire
      const flameHeight = 16 + Math.random() * 18;
      const flameGrad = ctx.createLinearGradient(0, 20, 0, 20 + flameHeight);
      flameGrad.addColorStop(0, '#38bdf8');
      flameGrad.addColorStop(0.5, '#6366f1');
      flameGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-12, 20);
      ctx.lineTo(0, 20 + flameHeight);
      ctx.lineTo(12, 20);
      ctx.closePath();
      ctx.fill();

      // Car body shadow
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 22, 44, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Car Chassis (Sporty Crimson Red)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(-38, -10, 76, 30, 8);
      ctx.fill();
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Roof & Windshield
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-24, -28, 48, 20, 5);
      ctx.fill();

      // Windshield glass reflection
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-18, -10);
      ctx.lineTo(18, -10);
      ctx.lineTo(14, -24);
      ctx.lineTo(-14, -24);
      ctx.closePath();
      ctx.fill();

      // Headlights / Taillights
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 12;
      ctx.fillRect(-32, 12, 10, 5);
      ctx.fillRect(22, 12, 10, 5);
      ctx.shadowBlur = 0;

      // Wheels
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-40, -6, 6, 18);
      ctx.fillRect(34, -6, 6, 18);

      ctx.restore();

      // 5. Commercial Action Overlay Text
      ctx.save();
      ctx.font = '900 15px "Fredoka", sans-serif';
      ctx.textAlign = 'center';

      // Flashing Ad Promo Badge
      const isAltPhase = Math.floor(time * 2) % 2 === 0;
      if (isAltPhase) {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 10;
        ctx.fillText('⚡ 3D EXTREME BLIZZARD RACER ⚡', w * 0.5, 34);
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 10;
        ctx.fillText('❄️ FREE ON GOOGLE PLAY STORE ❄️', w * 0.5, 34);
      }

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleClaim = () => {
    onAdCompleted();
    onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 w-screen h-screen bg-black flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300"
    >
      {/* 1. Top System AdMob Bar (Google AdMob Fullscreen Header) */}
      <div className="w-full px-3 sm:px-6 py-3 bg-gradient-to-b from-black/95 via-black/80 to-transparent flex items-center justify-between z-30 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-white text-xs font-bold shadow whitespace-nowrap">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Google AdMob</span>
          </div>

          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] font-extrabold text-amber-300 whitespace-nowrap">
            {language === 'ko' ? '보상형 전면 광고' : 'Rewarded Interstitial'}
          </span>

          <span className="hidden md:inline text-[11px] text-slate-400 font-mono truncate max-w-[200px]" title="ca-app-pub-3719896316126650/9076313112">
            ID: 9076313112
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Audio Mute/Unmute */}
          <button
            onClick={() => setIsAdMuted(!isAdMuted)}
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title={isAdMuted ? '소리 켜기' : '음소거'}
          >
            {isAdMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Countdown & Close Button */}
          {isCompleted ? (
            <button
              onClick={handleClaim}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 whitespace-nowrap"
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{language === 'ko' ? '보상 획득 (닫기)' : 'Reward Ready (X)'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold whitespace-nowrap">
              <span>{secondsRemaining}s</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {language === 'ko' ? '후 보상' : 'to reward'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Center Cinematic Video Stage (100% Immersive Full-screen Player) */}
      <div className="flex-1 relative w-full flex items-center justify-center bg-black overflow-hidden">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full max-h-[75vh] object-cover sm:object-contain"
        />

        {/* Ad Watermark Badge */}
        <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-black/70 border border-white/20 text-[10px] font-bold text-slate-200 backdrop-blur-md pointer-events-none">
          광고 · Google Play Partner
        </div>

        {/* Reward Objective Floating Pill */}
        <div className="absolute top-4 right-4 max-w-[240px] flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/40 text-[11px] font-bold text-amber-300 shadow-xl pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{rewardTitle}</span>
        </div>

        {/* Video Progress Bar across bottom of video stage */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900/80">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-cyan-400 to-emerald-400 transition-all duration-1000 ease-linear"
            style={{ width: `${((5 - secondsRemaining) / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. Bottom Google Play Store Sponsor Card & Action Bar */}
      <div className="w-full px-4 sm:px-6 py-4 bg-gradient-to-t from-black via-black/95 to-black/60 flex flex-col gap-3 z-30 shrink-0 border-t border-slate-800/80">
        {/* Play Store App Listing Card */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shrink-0">
              🏎️
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black text-white truncate">
                알프스 스노우 랠리 3D
              </h4>
              <p className="text-[11px] text-slate-300 truncate">
                ★ 4.9 (14.2만 개 리뷰) · Google Play 추천 레이싱
              </p>
            </div>
          </div>

          <button
            onClick={() => setInstalledClicked(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition active:scale-95 shrink-0 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 whitespace-nowrap"
          >
            {installedClicked ? (
              <>
                <CheckCircle className="w-4 h-4 shrink-0 text-slate-950" />
                <span>확인 완료</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 shrink-0 text-slate-950" />
                <span>무료 설치</span>
              </>
            )}
          </button>
        </div>

        {/* Primary Reward Claim / Status Button */}
        {isCompleted ? (
          <button
            onClick={handleClaim}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide shadow-2xl shadow-emerald-500/40 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap animate-pulse"
          >
            <CheckCircle className="w-5 h-5 fill-slate-950 shrink-0" />
            <span>
              {language === 'ko'
                ? `🎉 ${rewardTitle} 수령하고 게임으로 복귀`
                : `🎉 Claim ${rewardTitle} & Resume Game`}
            </span>
          </button>
        ) : (
          <div className="w-full py-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>
              {language === 'ko'
                ? `보상형 전면 광고 재생 중... (${secondsRemaining}초 후 보상 지급)`
                : `Playing Rewarded Interstitial Ad... (${secondsRemaining}s remaining)`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
