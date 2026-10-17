/**
 * Settings Modal with Korean / English language switcher and audio controls.
 */

import React from 'react';
import {
  X,
  Languages,
  Volume2,
  VolumeX,
  HelpCircle,
  AlertCircle,
  Check,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import type { Language } from '../game/i18n.ts';
import { translations } from '../game/i18n.ts';

interface SettingsModalProps {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  language,
  onSelectLanguage,
  isMuted,
  onToggleMute,
  onClose,
}) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2 whitespace-nowrap">
            <span>⚙️</span>
            <span>{t.settingsTitle}</span>
          </h2>

          <button
            onClick={onClose}
            aria-label={t.closeSettings}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* 1. Language Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 whitespace-nowrap">
              <Languages className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{t.languageSelect}</span>
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onSelectLanguage('ko')}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition active:scale-95 cursor-pointer font-bold text-sm whitespace-nowrap ${
                  language === 'ko'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span>🇰🇷 한국어</span>
                {language === 'ko' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>

              <button
                onClick={() => onSelectLanguage('en')}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition active:scale-95 cursor-pointer font-bold text-sm whitespace-nowrap ${
                  language === 'en'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span>🇺🇸 English</span>
                {language === 'en' && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>
            </div>
          </div>

          {/* 2. Audio Settings */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 whitespace-nowrap">
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t.soundSettings}</span>
            </label>

            <button
              onClick={onToggleMute}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition active:scale-95 cursor-pointer font-medium text-sm gap-2 ${
                isMuted
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2.5 whitespace-nowrap min-w-0">
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400 shrink-0" /> : <Volume2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                <span className="truncate">{isMuted ? (language === 'ko' ? '음소거 됨' : 'Audio Muted') : (language === 'ko' ? '사운드 켜짐' : 'Audio Active')}</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-700/80 text-slate-300 font-semibold whitespace-nowrap shrink-0">
                {isMuted ? (language === 'ko' ? '소리 켜기' : 'Unmute') : (language === 'ko' ? '음소거' : 'Mute')} [M]
              </span>
            </button>
          </div>

          {/* 3. Road Boundary Notice (User feedback clarity) */}
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed break-keep">
              <p className="font-bold text-amber-300 mb-0.5 whitespace-nowrap">{t.boundaryNotice}</p>
              <p>{t.boundaryNoticeDetail}</p>
            </div>
          </div>

          {/* 4. Controls reminder */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed break-keep">
              <p className="font-bold text-cyan-300 mb-0.5 whitespace-nowrap">{t.controlsGuide}</p>
              <p>{t.controlsGuideDetail}</p>
            </div>
          </div>

          {/* 5. Privacy Policy Link (Google Play Console Policy Requirement) */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{language === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}</span>
            </span>
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'ko' ? '전문 보기' : 'View Policy'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition active:scale-95 cursor-pointer shadow whitespace-nowrap"
          >
            {t.closeSettings}
          </button>
        </div>
      </div>
    </div>
  );
};
