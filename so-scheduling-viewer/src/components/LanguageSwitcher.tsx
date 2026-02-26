'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === 'en' ? 'zh' : 'en';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 bg-[#181825] border border-[#313244] rounded-lg text-xs font-bold text-[#a6adc8] hover:text-[#cba6f7] transition-all uppercase tracking-widest"
    >
      <Languages className="w-3.5 h-3.5" />
      {locale === 'en' ? 'EN' : 'ZH'}
    </button>
  );
}
