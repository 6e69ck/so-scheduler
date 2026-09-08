'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Share,
  PlusSquare,
  Sparkles,
  Smartphone,
  Download,
  X,
  Loader2,
  MoreVertical,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  isIOS,
  isAndroid,
  isDesktop,
  isStandalonePWA,
  subscribeUserToPush,
} from '@/lib/pushClient';

interface NotificationPromptModalProps {
  userName: string;
  onClose: () => void;
  onSubscribed?: () => void;
}

export default function NotificationPromptModal({
  userName,
  onClose,
  onSubscribed,
}: NotificationPromptModalProps) {
  const t = useTranslations('Hub');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Device detection states
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isPWA, setIsPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if window already captured beforeinstallprompt
    if (typeof window !== 'undefined' && (window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    // 2. Listen to custom event dispatched by PwaRegister
    const handlePromptReady = () => {
      if ((window as any).deferredInstallPrompt) {
        setDeferredPrompt((window as any).deferredInstallPrompt);
      }
    };
    window.addEventListener('pwa_prompt_ready', handlePromptReady);

    // 3. Fallback direct beforeinstallprompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const isInstalled = isStandalonePWA();
    setIsPWA(isInstalled);

    if (isIOS()) {
      setDeviceType('ios');
    } else if (isAndroid()) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    return () => {
      window.removeEventListener('pwa_prompt_ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleEnablePush = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // If on Android, trigger PWA install prompt if available
      const promptToUse = deferredPrompt || (typeof window !== 'undefined' ? (window as any).deferredInstallPrompt : null);
      if (promptToUse) {
        try {
          await promptToUse.prompt();
          await promptToUse.userChoice;
          (window as any).deferredInstallPrompt = null;
          setDeferredPrompt(null);
        } catch (promptErr) {
          console.warn('Native install prompt failed or dismissed:', promptErr);
        }
      }

      const res = await subscribeUserToPush(userName);
      if (res.success) {
        localStorage.setItem('so_hub_push_enabled', 'true');
        if (onSubscribed) onSubscribed();
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to enable notifications.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error requesting notification permission.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#11111b]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#181825] border border-[#cba6f7]/40 rounded-2xl p-6 shadow-2xl space-y-5 animate-scaleIn relative overflow-hidden">
        {/* Ambient glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#cba6f7]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-[#6c7086] hover:text-[#cdd6f4] transition p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* --- 1. iOS in Safari Browser: Guided Installation Instructions --- */}
        {deviceType === 'ios' && !isPWA ? (
          <div className="space-y-4 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-[#cba6f7]/15 border border-[#cba6f7]/30 flex items-center justify-center mx-auto text-[#cba6f7] shadow-lg shadow-[#cba6f7]/10">
              <Smartphone className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-black text-[#cdd6f4] tracking-tight">
                {t('iosPromptTitle')}
              </h2>
              <p className="text-xs text-[#a6adc8] leading-relaxed">
                {t('iosPromptSubtitle')}
              </p>
            </div>

            {/* Step by step install instructions for iOS */}
            <div className="bg-[#11111b] border border-[#313244] rounded-xl p-3.5 space-y-2.5 text-xs text-[#cdd6f4]">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#cba6f7]/20 text-[#cba6f7] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  {t('iosStep1')}{' '}
                  <strong className="text-[#cba6f7] inline-flex items-center gap-1 font-semibold">
                    <Share className="w-3.5 h-3.5 inline" /> {t('iosShareBtn')}
                  </strong>
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#cba6f7]/20 text-[#cba6f7] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  {t('iosStep2')}{' '}
                  <strong className="text-[#cba6f7] inline-flex items-center gap-1 font-semibold">
                    <PlusSquare className="w-3.5 h-3.5 inline" /> {t('iosAddToHomeBtn')}
                  </strong>
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#cba6f7]/20 text-[#cba6f7] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>{t('iosStep3')}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleSkip}
                className="w-full py-3 px-4 rounded-xl bg-[#cba6f7] text-[#11111b] font-bold text-sm hover:bg-[#b4befe] transition-all shadow-lg active:scale-[0.99]"
              >
                {t('gotIt')}
              </button>
              <button
                onClick={handleSkip}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-[#a6adc8] hover:text-[#cdd6f4] transition text-center"
              >
                {t('maybeLater')}
              </button>
            </div>
          </div>
        ) : deviceType === 'android' && !isPWA ? (
          /* --- 2. Android: Suggest Installation + Enable Notifications --- */
          <div className="space-y-4 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-[#cba6f7]/15 border border-[#cba6f7]/30 flex items-center justify-center mx-auto text-[#cba6f7] shadow-lg shadow-[#cba6f7]/10 relative">
              <Download className="w-7 h-7 animate-bounce" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#a6e3a1] animate-ping" />
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-black text-[#cdd6f4] tracking-tight">
                {t('androidPromptTitle')}
              </h2>
              <p className="text-xs text-[#a6adc8] leading-relaxed">
                {t('androidPromptSubtitle')}
              </p>
            </div>

            {/* If native install prompt event is not directly available, provide the 2-step menu guidance */}
            {!deferredPrompt && (
              <div className="bg-[#11111b] border border-[#313244] rounded-xl p-3.5 space-y-2 text-xs text-[#cdd6f4]">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#cba6f7]/20 text-[#cba6f7] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    {t('androidStep1')}{' '}
                    <strong className="text-[#cba6f7] inline-flex items-center gap-0.5 font-semibold">
                      <MoreVertical className="w-3.5 h-3.5 inline" /> {t('androidMenuBtn')}
                    </strong>
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#cba6f7]/20 text-[#cba6f7] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    {t('androidStep2')}{' '}
                    <strong className="text-[#cba6f7] font-semibold">{t('androidInstallBtn')}</strong>
                  </span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#f38ba8]/10 border border-[#f38ba8]/20 text-xs text-[#f38ba8] text-center">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleEnablePush}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#cba6f7] text-[#11111b] font-bold text-sm hover:bg-[#b4befe] transition-all shadow-lg shadow-[#cba6f7]/20 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('enabling')}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{deferredPrompt ? t('installAndEnableBtn') : t('enableNotificationsBtn')}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSkip}
                disabled={loading}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-[#a6adc8] hover:text-[#cdd6f4] transition text-center"
              >
                {t('maybeLater')}
              </button>
            </div>
          </div>
        ) : (
          /* --- 3. Desktop (or already installed PWA): Pure Notifications (No install suggestion) --- */
          <div className="space-y-4 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-[#cba6f7]/15 border border-[#cba6f7]/30 flex items-center justify-center mx-auto text-[#cba6f7] shadow-lg shadow-[#cba6f7]/10 relative">
              <BellRing className="w-7 h-7 animate-bounce" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#a6e3a1] animate-ping" />
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-black text-[#cdd6f4] tracking-tight">
                {t('desktopPromptTitle')}
              </h2>
              <p className="text-xs text-[#a6adc8] leading-relaxed">
                {t('desktopPromptSubtitle')}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#f38ba8]/10 border border-[#f38ba8]/20 text-xs text-[#f38ba8] text-center">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleEnablePush}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#cba6f7] text-[#11111b] font-bold text-sm hover:bg-[#b4befe] transition-all shadow-lg shadow-[#cba6f7]/20 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('enabling')}</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>{t('enableNotificationsBtn')}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSkip}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#a6adc8] hover:text-[#cdd6f4] transition text-center"
              >
                {t('maybeLater')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
