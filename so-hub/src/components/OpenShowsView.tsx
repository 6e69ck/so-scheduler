'use client';

import React, { useState } from 'react';
import { EventType } from '@/types';
import { Calendar, Clock, MapPin, Users, UserPlus, Check, Loader2, Info } from 'lucide-react';
import moment from 'moment';
import { useTranslations } from 'next-intl';

interface OpenShowsViewProps {
  events: EventType[];
  userName: string;
  onSignUp: (eventId: string) => Promise<void>;
}

export default function OpenShowsView({ events, userName, onSignUp }: OpenShowsViewProps) {
  const t = useTranslations('Hub');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Filter shows that are in the future/today AND staff is needed AND current user hasn't signed up yet
  const openShows = events.filter(e => {
    const isSignedUp = e.staff && e.staff.some(s => s.trim().toLowerCase() === userName.trim().toLowerCase());
    const needed = e.neededPeople || 0;
    const currentStaffCount = e.staff ? e.staff.length : 0;

    // Check if event date is today or in the future
    const eventMoment = moment.utc(e.date);
    const isFutureOrToday = eventMoment.isSameOrAfter(moment.utc().startOf('day'), 'day');
    
    // Include if show is in the future/today, user is not signed up, and staff is still needed
    return isFutureOrToday && !isSignedUp && (needed === 0 || currentStaffCount < needed);
  }).sort((a, b) => {
    const dateA = moment.utc(a.date).format('YYYY-MM-DD');
    const dateB = moment.utc(b.date).format('YYYY-MM-DD');
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return a.startTime.localeCompare(b.startTime);
  });

  const handleSignUp = async (eventId: string) => {
    if (!userName.trim()) {
      alert("Please enter your name first in settings.");
      return;
    }
    setSubmittingId(eventId);
    try {
      await onSignUp(eventId);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-[#cdd6f4] tracking-tight">
          {t('openShowsTitle')}
        </h2>
        <p className="text-xs text-[#a6adc8]">
          {t('openShowsSubtitle')}
        </p>
      </div>

      {openShows.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-[#181825]/60 rounded-xl border border-[#313244] text-center space-y-2">
          <Info className="w-8 h-8 text-[#89b4fa]" />
          <p className="text-sm font-semibold text-[#cdd6f4]">
            {t('noOpenShows')}
          </p>
          <p className="text-xs text-[#a6adc8]">
            Check back later for new shows added to the schedule.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {openShows.map((event) => {
            const dateStr = moment.utc(event.date).format('ddd, MMM D, YYYY');
            const assigned = event.staff ? event.staff.length : 0;
            const needed = event.neededPeople || 0;
            const isLoading = submittingId === event._id;

            return (
              <div
                key={event._id}
                className="bg-[#181825]/90 rounded-xl p-4 border border-[#313244] hover:border-[#45475a] transition-all space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3
                      className="text-base sm:text-lg font-bold text-rosewater leading-snug hover:text-mauve transition-colors"
                      style={{ color: '#f5e0dc' }}
                    >
                      {event.show}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#cba6f7] font-semibold mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#313244] text-xs font-semibold shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#f9e2af]" />
                    <span className="text-[#f9e2af]">{assigned}</span>
                    <span className="text-[#6c7086]">/</span>
                    <span className="text-[#cdd6f4]">{needed || '∞'}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#bac2de]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#89b4fa]" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#f38ba8] shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                </div>

                {/* Signed Up Staff Roster */}
                <div className="pt-2 border-t border-[#313244]/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#a6adc8]">
                    <span className="flex items-center gap-1.5 text-[#89b4fa]">
                      <Users className="w-3.5 h-3.5" />
                      <span>Signed Up ({assigned}/{needed || '∞'}):</span>
                    </span>
                  </div>
                  {event.staff && event.staff.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {event.staff.map((member, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-[#313244] border border-[#45475a]/60 px-2 py-0.5 rounded-lg text-[#cdd6f4] font-medium flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#a6e3a1]" />
                          <span>{member}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6c7086] italic">No staff signed up yet</p>
                  )}
                </div>

                <button
                  onClick={() => handleSignUp(event._id!)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#cba6f7] text-[#11111b] font-bold text-xs hover:bg-[#b4befe] active:scale-[0.99] transition-all shadow disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('signingUp')}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{t('signUp')}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
