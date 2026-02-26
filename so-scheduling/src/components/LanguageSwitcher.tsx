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
      className="flex items-center px-3 py-2 bg-crust border border-surface0 rounded-lg text-xs font-black text-subtext0 hover:text-accent transition-all uppercase tracking-widest min-w-[40px] justify-center h-full"
    >
      {locale === 'en' ? 'EN' : 'ZH'}
    </button>
  );
}
