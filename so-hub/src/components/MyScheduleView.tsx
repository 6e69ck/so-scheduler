'use client';

import React, { useState } from 'react';
import { EventType } from '@/types';
import { Calendar, Clock, MapPin, Trash2, Loader2, Info, Eye, EyeOff } from 'lucide-react';
import moment from 'moment';
import { useTranslations } from 'next-intl';

interface MyScheduleViewProps {
  events: EventType[];
  userName: string;
  onWithdraw: (eventId: string) => Promise<void>;
}

export default function MyScheduleView({ events, userName, onWithdraw }: MyScheduleViewProps) {
  const t = useTranslations('Hub');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [includePast, setIncludePast] = useState(false);

  const myEvents = events.filter(e => {
    const isUserStaff = e.staff && e.staff.some(s => s.trim().toLowerCase() === userName.trim().toLowerCase());
    if (!isUserStaff) return false;

    const eventMoment = moment.utc(e.date);
    const isPast = eventMoment.isBefore(moment.utc().startOf('day'), 'day');

    if (!includePast && isPast) return false;
    return true;
  }).sort((a, b) => {
    const dateA = moment.utc(a.date).format('YYYY-MM-DD');
    const dateB = moment.utc(b.date).format('YYYY-MM-DD');
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return a.startTime.localeCompare(b.startTime);
  });

  const handleWithdraw = async (eventId: string) => {
    if (!confirm("Are you sure you want to withdraw from this show?")) return;
    setWithdrawingId(eventId);
    try {
      await onWithdraw(eventId);
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#cdd6f4] tracking-tight">
            {t('myScheduleTitle')}
          </h2>
          <p className="text-xs text-[#a6adc8]">
            {t('myScheduleSubtitle')} ({userName})
          </p>
        </div>

        {/* Toggle Past Shows Eye / EyeOff Button */}
        <button
          onClick={() => setIncludePast(!includePast)}
          className={`self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow ${
            includePast
              ? 'bg-[#cba6f7]/10 border-[#cba6f7] text-[#cba6f7]'
              : 'bg-[#181825] border-[#313244] text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244]'
          }`}
        >
          {includePast ? <Eye className="w-4 h-4 text-[#cba6f7]" /> : <EyeOff className="w-4 h-4" />}
          <span>{includePast ? t('hidePastShows') : t('showPastShows')}</span>
        </button>
      </div>

      {myEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-[#181825]/60 rounded-xl border border-[#313244] text-center space-y-2">
          <Info className="w-8 h-8 text-[#a6e3a1]" />
          <p className="text-sm font-semibold text-[#cdd6f4]">
            {t('noMySchedule')}
          </p>
          <p className="text-xs text-[#a6adc8]">
            Go to the Open Shows tab to sign up for upcoming shows.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {myEvents.map((event) => {
            const dateMoment = moment.utc(event.date);
            const dateStr = dateMoment.format('ddd, MMM D, YYYY');
            const isToday = dateMoment.isSame(moment(), 'day');
            const isPast = dateMoment.isBefore(moment.utc().startOf('day'), 'day');
            const isLoading = withdrawingId === event._id;

            return (
              <div
                key={event._id}
                className={`bg-[#181825]/90 rounded-xl p-4 border transition-all space-y-3 shadow-md ${
                  isToday
                    ? 'border-[#cba6f7] ring-1 ring-[#cba6f7]/50'
                    : isPast
                    ? 'border-[#313244]/60 opacity-80'
                    : 'border-[#313244] hover:border-[#45475a]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {isToday && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#cba6f7] text-[#11111b] mb-1">
                        Active Today
                      </span>
                    )}
                    {isPast && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#313244] text-[#a6adc8] mb-1">
                        {t('pastBadge')}
                      </span>
                    )}
                    <h3
                      className="text-base sm:text-lg font-bold text-rosewater leading-snug"
                      style={{ color: '#f5e0dc' }}
                    >
                      {event.show}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#cba6f7] font-semibold mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  {/* Top Right Withdraw Action */}
                  {!isToday && !isPast && (
                    <button
                      onClick={() => handleWithdraw(event._id!)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-[#f38ba8]/10 hover:bg-[#f38ba8]/20 text-[#f38ba8] font-semibold text-xs border border-[#f38ba8]/30 transition-colors shrink-0 disabled:opacity-50"
                      title="Withdraw from show"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>{isLoading ? t('withdrawing') : t('withdraw')}</span>
                    </button>
                  )}
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

                {/* Team Roster Badges */}
                <div className="pt-2 border-t border-[#313244]/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#a6adc8]">
                    <span>Team Roster ({event.staff ? event.staff.length : 0}/{event.neededPeople || '∞'}):</span>
                  </div>
                  {event.staff && event.staff.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {event.staff.map((member, idx) => {
                        const isMe = member.trim().toLowerCase() === userName.trim().toLowerCase();
                        return (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded-lg font-medium flex items-center gap-1 border ${
                              isMe
                                ? 'bg-[#cba6f7]/20 border-[#cba6f7]/60 text-[#cba6f7] font-bold'
                                : 'bg-[#313244] border-[#45475a]/60 text-[#cdd6f4]'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isMe ? 'bg-[#cba6f7]' : 'bg-[#a6e3a1]'}`} />
                            <span>{member} {isMe ? '(You)' : ''}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
