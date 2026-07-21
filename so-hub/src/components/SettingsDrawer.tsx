'use client';

import React, { useState } from 'react';
import { X, User, Globe, Check, Save } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onSaveName: (name: string) => void;
}

export default function SettingsDrawer({ isOpen, onClose, userName, onSaveName }: SettingsDrawerProps) {
  const t = useTranslations('Hub');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [nameInput, setNameInput] = useState(userName);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onSaveName(nameInput.trim());
    onClose();
  };

  const handleLanguageChange = (newLocale: 'en' | 'zh') => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#11111b]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-[#181825] border-t sm:border border-[#313244] rounded-t-xl sm:rounded-xl p-6 shadow-2xl space-y-6 animate-slideUp">
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
