/**
 * In-App PWA Install Button and iOS/Android Store installation guide.
 */

import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import type { Language } from '../game/i18n.ts';

interface PWAInstallButtonProps {
  language?: Language;
  variant?: 'compact' | 'full';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language = 'ko',
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showStoreGuide, setShowStoreGuide] = useState(false);

  // If already running standalone (e.g. installed app or TWA)
  if (isInstalled) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold ${className}`}>
        <Check className="w-3.5 h-3.5" />
        <span>{language === 'ko' ? '앱 설치 완료됨' : 'App Installed'}</span>
      </div>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowStoreGuide(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowStoreGuide(true);
    }
  };

  const label = language === 'ko' ? '모바일 앱 설치' : 'Install Mobile App';

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={label}
        className={`flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold transition active:scale-95 shadow-[0_4px_16px_rgba(2,132,199,0.35)] cursor-pointer ${
          variant === 'full' ? 'w-full justify-center py-3 text-sm' : 'px-3.5 py-1.5 text-xs'
        } ${className}`}
      >
        <Smartphone className="w-4 h-4" />
        <span>{label}</span>
      </button>

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 select-none animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>{language === 'ko' ? '아이폰/아이패드 앱 설치' : 'Install on iPhone / iPad'}</span>
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <Share2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <p>
                  {language === 'ko' ? (
                    <>
                      1. Safari 브라우저 하단의 <strong>공유 (Share)</strong> 버튼을 누릅니다.
                    </>
                  ) : (
                    <>
                      1. Tap the <strong>Share</strong> button in Safari toolbar.
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <PlusSquare className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  {language === 'ko' ? (
                    <>
                      2. 목록을 내려 <strong>'홈 화면에 추가' (Add to Home Screen)</strong>를 누르면 스토어 앱처럼 홈 화면에 설치됩니다!
                    </>
                  ) : (
                    <>
                      2. Scroll down and tap <strong>'Add to Home Screen'</strong> to install.
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
            >
              {language === 'ko' ? '확인' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* Android & Google Play Store Packaging Guide Modal */}
      {showStoreGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 select-none animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ko' ? '모바일 설치 및 스토어 등록' : 'Install & App Store Package'}</span>
              </h3>
              <button
                onClick={() => setShowStoreGuide(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-cyan-300">
                {language === 'ko'
                  ? '📱 즉시 모바일 홈 화면 설치:'
                  : '📱 Immediate Mobile Home Screen Install:'}
              </p>
              <p>
                {language === 'ko'
                  ? 'Chrome/Samsung 인터넷 메뉴 (⋮)에서 "홈 화면에 앱 추가" 또는 "앱 설치"를 누르면 전체 화면 네이티브 앱으로 바로 즐길 수 있습니다.'
                  : 'In Chrome/Browser menu (⋮), tap "Add to Home screen" or "Install app" to play in fullscreen.'}
              </p>

              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 mt-2">
                <p className="font-bold text-amber-300 mb-1">
                  {language === 'ko'
                    ? '🛍️ 구글 플레이스토어 / 원스토어 등록 방법 (TWA):'
                    : '🛍️ Google Play Store Packaging (TWA):'}
                </p>
                <p>
                  {language === 'ko'
                    ? '이 게임은 표준 Web App Manifest와 아이콘, 서비스 워커가 완벽하게 구성되어 있어 PWABuilder(pwabuilder.com) 또는 Google Bubblewrap CLI를 통해 1분 만에 Android APK / AAB 패키지로 변환하여 구글 플레이 콘솔에 바로 업로드할 수 있습니다.'
                    : 'This app is 100% PWA compliant. You can generate an Android AAB/APK for Google Play Console via pwabuilder.com in 1 minute!'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowStoreGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow"
            >
              {language === 'ko' ? '확인' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
