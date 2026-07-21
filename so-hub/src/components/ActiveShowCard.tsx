'use client';

import React, { useState } from 'react';
import { EventType } from '@/types';
import { MapPin, Phone, Mail, Clock, ShieldAlert, CheckSquare, Square, Users, Navigation, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ActiveShowCardProps {
  event: EventType;
  userName: string;
}

export default function ActiveShowCard({ event, userName }: ActiveShowCardProps) {
  const t = useTranslations('Hub');
  const [checkedGear, setCheckedGear] = useState<Record<number, boolean>>({});

  const toggleGear = (index: number) => {
    setCheckedGear(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location || event.show)}`;

  const formatPhone = (phone?: string) => {
    if (!phone) return null;
    const cleaned = ('' + phone).replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }
    return phone;
  };

  const formattedPhone = formatPhone(event.clientPhone);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Active Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#cba6f7]/20 via-[#313244] to-[#181825] border border-[#cba6f7]/40 p-6 md:px-8 md:pb-8 shadow-xl">
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#cba6f7] text-[#11111b] font-bold text-xs shadow-md">
          <Sparkles className="w-3.5 h-3.5" />
          {t('activeShowTag')}
        </div>

        <h2
          className="text-2xl md:text-4xl font-black text-rosewater tracking-tight mb-3"
          style={{ color: '#f5e0dc' }}
        >
          {event.show}
        </h2>

        <div className="flex flex-wrap items-center gap-3 text-sm text-[#bac2de] mb-6">
          <div className="flex items-center gap-1.5 bg-[#1e1e2e]/80 px-3 py-1.5 rounded-xl border border-[#45475a]/50">
            <Clock className="w-4 h-4 text-[#cba6f7]" />
            <span className="font-semibold text-[#cdd6f4]">{event.startTime} - {event.endTime}</span>
          </div>
          {event.status && (
            <div className="flex items-center gap-1.5 bg-[#a6e3a1]/20 text-[#a6e3a1] px-3 py-1.5 rounded-xl border border-[#a6e3a1]/30 text-xs font-semibold">
              Status: {event.status}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location & Navigation */}
          {event.location && (
            <div className="bg-[#181825]/90 rounded-xl p-4 border border-[#45475a]/40 flex flex-col justify-between">
              <div className="flex items-start gap-2 text-[#subtext1] mb-3">
                <MapPin className="w-5 h-5 text-[#f38ba8] shrink-0 mt-0.5" />
                <span className="text-sm text-[#cdd6f4] font-medium leading-snug">{event.location}</span>
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#cba6f7] text-[#11111b] font-bold text-sm hover:bg-[#b4befe] transition-colors shadow"
              >
                <Navigation className="w-4 h-4" />
                {t('openMaps')}
              </a>
            </div>
          )}

          {/* Client Contact Details */}
          {(event.clientName || event.clientPhone || event.clientEmail) && (
            <div className="bg-[#181825]/90 rounded-xl p-4 border border-[#45475a]/40 space-y-2 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#a6adc8] mb-1">
                  {t('clientContact')}
                </p>
                {event.clientName && (
                  <p className="text-base font-bold text-[#cdd6f4]">{event.clientName}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {event.clientPhone && (
                  <a
                    href={`tel:${event.clientPhone}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#313244] hover:bg-[#45475a] text-[#a6e3a1] text-xs font-bold transition-colors border border-[#45475a]/60"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {t('call')} ({formattedPhone})
                  </a>
                )}
                {event.clientEmail && (
                  <a
                    href={`mailto:${event.clientEmail}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#313244] hover:bg-[#45475a] text-[#89b4fa] text-xs font-bold transition-colors border border-[#45475a]/60"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {t('email')}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Gear & Notes Interactive Checklist */}
        {((event.gear && event.gear.length > 0) || event.notes) && (
          <div className="bg-[#181825]/80 rounded-xl p-4 border border-[#313244] space-y-3">
            <div className="flex items-center gap-2 text-[#cba6f7] font-bold text-sm">
              <CheckSquare className="w-4 h-4" />
              <span>{t('gearChecklist')}</span>
            </div>

            {event.notes && (
              <div className="bg-[#313244]/50 p-3 rounded-lg text-xs text-[#bac2de] border border-[#45475a]/30">
                <span className="font-semibold text-[#cdd6f4]">Notes: </span>
                {event.notes}
              </div>
            )}

            {event.gear && event.gear.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {event.gear.map((item, idx) => {
                  const isChecked = !!checkedGear[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleGear(idx)}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-medium text-left transition-all border ${isChecked
                        ? 'bg-[#a6e3a1]/10 text-[#a6e3a1] border-[#a6e3a1]/30 line-through opacity-80'
                        : 'bg-[#313244]/40 text-[#cdd6f4] border-[#45475a]/40 hover:bg-[#313244]'
                        }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#a6e3a1] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#7f849c] shrink-0" />
                      )}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* On-site Team Roster */}
        {event.staff && event.staff.length > 0 && (
          <div className="bg-[#181825]/80 rounded-xl p-4 border border-[#313244] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#89b4fa] font-bold text-sm">
                <Users className="w-4 h-4" />
                <span>{t('teamRoster')}</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#313244] text-[#bac2de]">
                {event.staff.length} {event.neededPeople ? `/ ${event.neededPeople}` : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {event.staff.map((member, idx) => {
                const isMe = member.trim().toLowerCase() === userName.trim().toLowerCase();
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border ${isMe
                      ? 'bg-[#cba6f7]/20 border-[#cba6f7]/50 text-[#cba6f7] font-bold'
                      : 'bg-[#313244]/40 border-[#45475a]/30 text-[#cdd6f4]'
                      }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isMe ? 'bg-[#cba6f7]' : 'bg-[#a6e3a1]'}`} />
                    <span className="truncate">{member} {isMe ? '(You)' : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
