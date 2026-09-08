'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Globe, Check, Save, Bell, BellRing, Loader2, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import {
  isPushNotificationSupported,
  getExistingSubscription,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  playNotificationChime,
} from '@/lib/pushClient';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onSaveName: (name: string) => void;
  onNotificationsDisabled?: () => void;
}

export default function SettingsDrawer({
  isOpen,
  onClose,
  userName,
  onSaveName,
  onNotificationsDisabled,
}: SettingsDrawerProps) {
  const t = useTranslations('Hub');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [nameInput, setNameInput] = useState(userName);
  const [pushSupported, setPushSupported] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setNameInput(userName);
  }, [userName]);

  useEffect(() => {
    if (!isOpen) return;

    const checkSubscription = async () => {
      const supported = isPushNotificationSupported();
      setPushSupported(supported);
      if (supported) {
        const sub = await getExistingSubscription();
        setIsSubscribed(!!sub);
      }
    };

    checkSubscription();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onSaveName(nameInput.trim().toLowerCase());
    onClose();
  };

  const handleLanguageChange = (newLocale: 'en' | 'zh') => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleTogglePush = async () => {
    setPushLoading(true);
    setStatusMessage(null);
    try {
      if (isSubscribed) {
        await unsubscribeUserFromPush();
        setIsSubscribed(false);
        localStorage.removeItem('so_hub_push_enabled');
        sessionStorage.removeItem('so_hub_notif_session_dismissed');
        setStatusMessage(t('pushDisabledSuccess'));
        if (onNotificationsDisabled) {
          onNotificationsDisabled();
        }
      } else {
        const res = await subscribeUserToPush(userName);
        if (res.success) {
          setIsSubscribed(true);
          localStorage.setItem('so_hub_push_enabled', 'true');
          setStatusMessage(t('pushEnabledSuccess'));
        } else {
          setStatusMessage(res.error || 'Failed to enable notifications');
        }
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error updating notifications');
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTest = async () => {
    setTestSending(true);
    setStatusMessage(null);
    try {
      const sub = await getExistingSubscription();
      if (!sub) {
        setStatusMessage(t('noActiveSub'));
        return;
      }

      playNotificationChime();

      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (res.ok) {
        setStatusMessage(t('testSentSuccess'));
      } else {
        const data = await res.json();
        setStatusMessage(data.error || 'Failed to send test alert');
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error sending test');
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#11111b]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-[#181825] border-t sm:border border-[#313244] rounded-t-xl sm:rounded-xl p-6 shadow-2xl space-y-6 animate-slideUp max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#cdd6f4]">
            {t('settingsTitle')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#313244] text-[#a6adc8] hover:text-[#cdd6f4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Change Registered Name */}
        <form onSubmit={handleSaveName} className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#a6adc8]">
            {t('yourName')}
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#7f849c]" />
            <input
              type="text"
              required
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#11111b] border border-[#45475a] focus:border-[#cba6f7] rounded-xl text-sm text-[#cdd6f4] outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] font-bold text-xs transition-colors border border-[#45475a]/50"
          >
            <Save className="w-4 h-4 text-[#cba6f7]" />
            <span>{t('saveName')}</span>
          </button>
        </form>

        <hr className="border-[#313244]" />

        {/* Push Notifications Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#a6adc8] flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#cba6f7]" />
              <span>{t('notifications')}</span>
            </label>
            {isSubscribed ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#a6e3a1] bg-[#a6e3a1]/10 px-2 py-0.5 rounded-full border border-[#a6e3a1]/20">
                <ShieldCheck className="w-3 h-3" />
                {t('notificationsEnabled')}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-[#6c7086] bg-[#11111b] px-2 py-0.5 rounded-full border border-[#313244]">
                {pushSupported ? t('notificationsDisabled') : t('notificationsUnsupported')}
              </span>
            )}
          </div>

          <div className="bg-[#11111b] border border-[#313244] rounded-xl p-3.5 space-y-3">
            <p className="text-xs text-[#a6adc8] leading-relaxed">
              {t('notifyPromptSubtitle')}
            </p>

            {statusMessage && (
              <p className="text-xs font-medium text-[#cba6f7] bg-[#cba6f7]/10 p-2 rounded-lg border border-[#cba6f7]/20">
                {statusMessage}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {pushSupported ? (
                <button
                  type="button"
                  disabled={pushLoading}
                  onClick={handleTogglePush}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all shadow ${
                    isSubscribed
                      ? 'bg-[#313244] hover:bg-[#45475a] text-[#f38ba8] border border-[#45475a]'
                      : 'bg-[#cba6f7] text-[#11111b] hover:bg-[#b4befe]'
                  }`}
                >
                  {pushLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <BellRing className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubscribed ? t('turnOffAlerts') : t('enableNotificationsBtn')}</span>
                </button>
              ) : (
                <p className="text-xs text-[#6c7086] italic">
                  {t('notificationsUnsupported')}
                </p>
              )}

              {isSubscribed && (
                <button
                  type="button"
                  disabled={testSending}
                  onClick={handleSendTest}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#181825] hover:bg-[#313244] text-[#cdd6f4] border border-[#45475a] text-xs font-bold transition"
                >
                  {testSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-[#cba6f7]" />
                  )}
                  <span>{testSending ? t('sendingTest') : t('testNotification')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <hr className="border-[#313244]" />

        {/* Language Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#a6adc8]">
            {t('language')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                locale === 'en'
                  ? 'bg-[#cba6f7]/20 border-[#cba6f7] text-[#cba6f7]'
                  : 'bg-[#11111b] border-[#45475a] text-[#subtext1] hover:bg-[#313244]'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>English</span>
              {locale === 'en' && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>

            <button
              onClick={() => handleLanguageChange('zh')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                locale === 'zh'
                  ? 'bg-[#cba6f7]/20 border-[#cba6f7] text-[#cba6f7]'
                  : 'bg-[#11111b] border-[#45475a] text-[#subtext1] hover:bg-[#313244]'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>中文 (Chinese)</span>
              {locale === 'zh' && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
