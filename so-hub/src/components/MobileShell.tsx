'use client';

import React, { useState, useEffect } from 'react';
import { EventType } from '@/types';
import { Sparkles, Calendar, Receipt, CalendarCheck, Settings, Radio, CheckCircle2 } from 'lucide-react';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import ActiveShowCard from './ActiveShowCard';
import OpenShowsView from './OpenShowsView';
import ReimbursementView from './ReimbursementView';
import MyScheduleView from './MyScheduleView';
import OnboardingModal from './OnboardingModal';
import SettingsDrawer from './SettingsDrawer';

type TabType = 'active' | 'open' | 'reimbursement' | 'schedule';

interface MobileShellProps {
  initialEvents: EventType[];
}

export default function MobileShell({ initialEvents }: MobileShellProps) {
  const t = useTranslations('Hub');
  const [events, setEvents] = useState<EventType[]>(initialEvents);
  const [userName, setUserName] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load saved name from localStorage
  useEffect(() => {
    const savedName = (localStorage.getItem('so_hub_user_name') || '').trim().toLowerCase();
    setUserName(savedName);
    if (savedName) {
      localStorage.setItem('so_hub_user_name', savedName);
    }
    setIsInitialized(true);
  }, []);

  // Save name helper
  const handleSaveName = (name: string) => {
    const lowerName = name.trim().toLowerCase();
    setUserName(lowerName);
    localStorage.setItem('so_hub_user_name', lowerName);
  };

  // Check if current user has an active show TODAY
  const todayShow = events.find(e => {
    if (!userName.trim()) return false;
    const isToday = moment.utc(e.date).isSame(moment(), 'day');
    const isUserRegistered = e.staff && e.staff.some(s => s.trim().toLowerCase() === userName.trim().toLowerCase());
    return isToday && isUserRegistered;
  });

  // Default active tab: 'active' if user has a show today, else 'open'
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [hasInitializedTab, setHasInitializedTab] = useState(false);

  useEffect(() => {
    if (!hasInitializedTab && isInitialized) {
      if (todayShow) {
        setActiveTab('active');
      }
      setHasInitializedTab(true);
    }
  }, [todayShow, isInitialized, hasInitializedTab]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Refresh events list
  const refreshEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to refresh events', err);
    }
  };

  // Sign up handler - stays on current tab and triggers success toast
  const handleSignUp = async (eventId: string) => {
    const targetShow = events.find(e => e._id === eventId);
    const res = await fetch(`/api/events/${eventId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userName }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Failed to sign up');
      return;
    }
    await refreshEvents();
    if (targetShow) {
      triggerToast(t('signUpSuccess', { show: targetShow.show }));
    }
  };

  // Withdraw handler
  const handleWithdraw = async (eventId: string) => {
    const res = await fetch(`/api/events/${eventId}/staff/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userName }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Failed to withdraw');
      return;
    }
    await refreshEvents();
  };

  // Count open shows needing staff that user hasn't signed up for
  const openCount = events.filter(e => {
    if (!userName.trim()) return false;
    const isSignedUp = e.staff && e.staff.some(s => s.trim().toLowerCase() === userName.trim().toLowerCase());
    const needed = e.neededPeople || 0;
    const currentStaffCount = e.staff ? e.staff.length : 0;
    const isConfirmed = e.status === 'Confirmed';
    const isFutureOrToday = moment.utc(e.date).isSameOrAfter(moment.utc().startOf('day'), 'day');
    return isConfirmed && isFutureOrToday && !isSignedUp && (needed === 0 || currentStaffCount < needed);
  }).length;

  if (!isInitialized) return null;

  return (
    <div className="min-h-screen bg-[#11111b] text-[#cdd6f4] flex flex-col font-sans selection:bg-[#cba6f7] selection:text-[#11111b] relative">
      {/* Show Onboarding modal if user name is not set */}
      {!userName && <OnboardingModal onSaveName={handleSaveName} />}

      {/* Floating Success Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#a6e3a1] text-[#11111b] font-bold text-sm shadow-2xl border border-[#a6e3a1] animate-slideDown">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-[#11111b]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar with centered max-w-7xl container matching so-scheduling-viewer */}
      <header className="sticky top-0 z-30 bg-[#181825] border-b border-[#313244] shadow-lg shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#cba6f7] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(203,166,247,0.3)]">
              <Radio className="w-6 h-6 text-[#11111b]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tighter text-[#cdd6f4]">
                SOARING<span className="text-[#cba6f7]">EAGLES</span> <span className="text-[#6c7086] font-light">HUB</span>
              </h1>
              {userName && (
                <p className="text-xs text-[#a6adc8] font-medium">
                  {t('greeting')} <span className="text-[#cba6f7] font-semibold">{userName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Desktop Tab Navigation Switcher */}
          <div className="hidden md:flex bg-[#11111b] rounded-xl p-1 border border-[#313244] shadow-inner items-center gap-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                activeTab === 'active'
                  ? 'bg-[#cba6f7] text-[#11111b] shadow-lg'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4]'
              }`}
            >
              {todayShow && (
                <span className="w-2 h-2 rounded-full bg-[#a6e3a1] animate-ping" />
              )}
              <Radio className="w-4 h-4" />
              <span>{t('navActive')}</span>
            </button>

            <button
              onClick={() => setActiveTab('open')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                activeTab === 'open'
                  ? 'bg-[#cba6f7] text-[#11111b] shadow-lg'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{t('navOpen')}</span>
              {openCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#f38ba8] text-[#11111b] font-black text-[10px]">
                  {openCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reimbursement')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                activeTab === 'reimbursement'
                  ? 'bg-[#cba6f7] text-[#11111b] shadow-lg'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4]'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>{t('navReimbursement')}</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                activeTab === 'schedule'
                  ? 'bg-[#cba6f7] text-[#11111b] shadow-lg'
                  : 'text-[#a6adc8] hover:text-[#cdd6f4]'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{t('navSchedule')}</span>
            </button>
          </div>

          {/* Settings button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#11111b] hover:bg-[#313244] text-[#cdd6f4] font-bold text-xs border border-[#313244] transition-all shadow"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-[#cba6f7]" />
            <span className="hidden sm:inline">{t('settingsTitle')}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Centered max-w-7xl Column matching so-scheduling-viewer */}
      <main className="flex-1 w-full bg-[#11111b] overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-8">
          {activeTab === 'active' && (
            todayShow ? (
              <ActiveShowCard event={todayShow} userName={userName} />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 sm:p-16 bg-[#181825]/80 rounded-xl border border-[#313244] text-center space-y-3 max-w-2xl mx-auto shadow-2xl">
                <Radio className="w-12 h-12 text-[#7f849c]" />
                <h3 className="text-xl font-bold text-[#cdd6f4]">
                  {t('noActiveShow')}
                </h3>
                <p className="text-sm text-[#a6adc8]">
                  {t('noActiveShowSub')}
                </p>
              </div>
            )
          )}

          {activeTab === 'open' && (
            <OpenShowsView
              events={events}
              userName={userName}
              onSignUp={handleSignUp}
            />
          )}

          {activeTab === 'reimbursement' && (
            <ReimbursementView userName={userName} />
          )}

          {activeTab === 'schedule' && (
            <MyScheduleView
              events={events}
              userName={userName}
              onWithdraw={handleWithdraw}
            />
          )}
        </div>
      </main>

      {/* Fixed Mobile Bottom Navigation Bar (Visible on mobile screens < md) */}
      <nav className="fixed bottom-0 inset-x-0 w-full md:hidden bg-[#181825]/95 backdrop-blur-md border-t border-[#313244] px-2 py-2.5 z-40 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('active')}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'active'
              ? 'text-[#cba6f7] font-bold bg-[#cba6f7]/10'
              : 'text-[#6c7086] hover:text-[#bac2de]'
          }`}
        >
          {todayShow && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#a6e3a1] animate-ping" />
          )}
          <Radio className="w-5 h-5" />
          <span className="text-[10px]">{t('navActive')}</span>
        </button>

        <button
          onClick={() => setActiveTab('open')}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'open'
              ? 'text-[#cba6f7] font-bold bg-[#cba6f7]/10'
              : 'text-[#6c7086] hover:text-[#bac2de]'
          }`}
        >
          {openCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#f38ba8] text-[#11111b] font-black text-[9px]">
              {openCount}
            </span>
          )}
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">{t('navOpen')}</span>
        </button>

        <button
          onClick={() => setActiveTab('reimbursement')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'reimbursement'
              ? 'text-[#cba6f7] font-bold bg-[#cba6f7]/10'
              : 'text-[#6c7086] hover:text-[#bac2de]'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px]">{t('navReimbursement')}</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'schedule'
              ? 'text-[#cba6f7] font-bold bg-[#cba6f7]/10'
              : 'text-[#6c7086] hover:text-[#bac2de]'
          }`}
        >
          <CalendarCheck className="w-5 h-5" />
          <span className="text-[10px]">{t('navSchedule')}</span>
        </button>
      </nav>

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userName={userName}
        onSaveName={handleSaveName}
      />
    </div>
  );
}
