'use client';

import React, { useState } from 'react';
import { User, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OnboardingModalProps {
  onSaveName: (name: string) => void;
}

export default function OnboardingModal({ onSaveName }: OnboardingModalProps) {
  const t = useTranslations('Hub');
  const [inputName, setInputName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    onSaveName(inputName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#11111b]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#181825] border border-[#cba6f7]/40 rounded-xl p-6 shadow-2xl space-y-5 animate-scaleIn">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-xl bg-[#cba6f7]/20 border border-[#cba6f7]/40 flex items-center justify-center mx-auto text-[#cba6f7]">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-[#cdd6f4] tracking-tight">
            {t('onboardingTitle')}
          </h2>
          <p className="text-xs text-[#bac2de] leading-relaxed">
            {t('onboardingSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#7f849c]" />
            <input
              type="text"
              required
              autoFocus
              placeholder={t('namePlaceholder')}
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#11111b] border border-[#45475a] focus:border-[#cba6f7] rounded-xl text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!inputName.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#cba6f7] text-[#11111b] font-bold text-sm hover:bg-[#b4befe] transition-all shadow-lg active:scale-[0.99] disabled:opacity-50"
          >
            <span>{t('getStarted')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
