'use client';

import React, { useState } from 'react';
import { EventType } from '@/types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, MapPin, Mail, Users, Package, StickyNote } from 'lucide-react';
import moment from 'moment';
import { useTranslations } from 'next-intl';

type ViewType = 'day' | 'week' | 'month';

interface Props {
  events: EventType[];
  onViewEvent: (e: EventType) => void;
  selectedDate: string; // "YYYY-MM-DD"
  setSelectedDate: (date: string) => void;
}

export default function SummaryView({ events, onViewEvent, selectedDate, setSelectedDate }: Props) {
  const t = useTranslations('Common');
  const [viewType, setViewType] = useState<ViewType>('day');

  const filteredEvents = events.filter(e => {
    // Standardize to UTC for filtering to prevent local timezone shifts
    const eventDateStr = moment.utc(e.date).format('YYYY-MM-DD');
    const targetMoment = moment.utc(selectedDate, 'YYYY-MM-DD');
    const eventMoment = moment.utc(eventDateStr, 'YYYY-MM-DD');
    
    if (viewType === 'day') {
      return eventDateStr === selectedDate;
    } else if (viewType === 'week') {
      return eventMoment.isSame(targetMoment, 'week');
    } else {
      return eventMoment.isSame(targetMoment, 'month');
    }
  }).sort((a, b) => {
    const dateA = moment.utc(a.date).format('YYYY-MM-DD');
    const dateB = moment.utc(b.date).format('YYYY-MM-DD');
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return a.startTime.localeCompare(b.startTime);
  });

  const prevRange = () => {
    const newDate = moment.utc(selectedDate, 'YYYY-MM-DD').subtract(1, viewType).format('YYYY-MM-DD');
    setSelectedDate(newDate);
  };

  const nextRange = () => {
    const newDate = moment.utc(selectedDate, 'YYYY-MM-DD').add(1, viewType).format('YYYY-MM-DD');
    setSelectedDate(newDate);
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    return phone;
  };

  const formatRangeLabel = () => {
    const mDate = moment.utc(selectedDate, 'YYYY-MM-DD');
    if (viewType === 'day') return mDate.format('dddd, MMM D, YYYY');
    if (viewType === 'week') {
      const start = moment(mDate).startOf('week');
      const end = moment(mDate).endOf('week');
      return `${start.format('MMM D')} - ${end.format('D, YYYY')}`;
    }
    return mDate.format('MMMM YYYY');
  };

  return (
    <div className="flex flex-col h-full w-full bg-base rounded-lg shadow-sm border border-surface0 overflow-hidden text-text font-sans">
      <div className="p-3 border-b border-surface0 bg-mantle flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-lg text-text flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-accent" />
            {t('adminSummary')}
          </h2>
          <div className="flex bg-crust rounded-md p-0.5 border border-surface0">
            {(['day', 'week', 'month'] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewType(v)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${viewType === v ? 'bg-surface0 text-accent shadow-sm' : 'text-subtext0 hover:text-text'}`}
              >
                {v === 'day' ? t('day') : v === 'week' ? t('week') : t('month')}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={prevRange} className="p-1.5 rounded bg-surface0 text-subtext0 hover:text-text hover:bg-surface1 transition border border-surface1"><ChevronLeft className="w-4 h-4"/></button>
          <div className="font-bold text-sm min-w-[150px] text-center text-text">
            {formatRangeLabel()}
          </div>
          <button onClick={nextRange} className="p-1.5 rounded bg-surface0 text-subtext0 hover:text-text hover:bg-surface1 transition border border-surface1"><ChevronRight className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 custom-scrollbar bg-base">
        <div className="grid grid-cols-1 gap-3 max-w-7xl mx-auto">
          {filteredEvents.map((e, i) => {
            const assignedCount = e.staff?.length || 0;
            const neededCount = e.neededPeople || 0;
            const remaining = (e.totalPrice || 0) - (e.paidBalance || 0);
            
            const statusColor = neededCount > 0 && assignedCount < neededCount ? '#f38ba8' : '#a6e3a1';
            
            return (
              <div 
                key={e._id || i} 
                onClick={() => onViewEvent(e)}
                className="bg-mantle border border-surface0 rounded-lg p-3 hover:border-accent/50 transition-all cursor-pointer group shadow-sm flex flex-col gap-3"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-bold text-base text-text group-hover:text-accent group-hover:underline transition-colors">
                        {e.show}
                      </h3>
                      {(e.companyName || e.clientName) && (
                        <span className="text-[10px] text-subtext0 italic">
                          ({e.companyName ? `${e.companyName} - ` : ''}{e.clientName})
                        </span>
                      )}
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border
                        ${e.status === 'Confirmed' ? 'bg-green/10 text-green border-green/20' : 
                          e.status === 'Completed' ? 'bg-blue/10 text-blue border-blue/20' : 
                          e.status === 'Planning' ? 'bg-yellow/10 text-yellow border-yellow/20' : 
                          'bg-surface1 text-subtext1 border-surface2'}
                      `}>{t(`statuses.${e.status}`)}</span>
                      <span className="text-[10px] text-subtext0 font-mono">#{String(e.eventNumber || 0).padStart(4, '0')}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-subtext1">
                        <CalendarIcon className="w-3.5 h-3.5 text-accent" />
                        <span className="font-medium text-text">{moment.utc(e.date).format('MMM D')} | {e.startTime} - {e.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-subtext1">
                        <MapPin className="w-3.5 h-3.5 text-accent" />
                        <span className="truncate max-w-[150px] text-text" title={e.location}>{e.location || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-subtext1">
                        <Phone className="w-3.5 h-3.5 text-accent" />
                        <span className="text-text">{formatPhone(e.clientPhone)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-subtext1">
                        <Mail className="w-3.5 h-3.5 text-accent" />
                        <span className="truncate max-w-[150px] text-text" title={e.clientEmail}>{e.clientEmail || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 bg-surface0/50 border border-surface1/30 rounded-md p-2 grid grid-cols-2 lg:grid-cols-4 gap-2 items-center">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-subtext0 font-bold">{t('totalPrice')}</span>
                      <span className="text-xs font-bold text-text">${e.totalPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-subtext0 font-bold">{t('paidBalance')}</span>
                      <span className="text-xs font-bold text-[#a6e3a1]">${e.paidBalance?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-subtext0 font-bold">{t('remainingBalance')}</span>
                      <span className="text-xs font-bold text-accent">${remaining.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-subtext0 font-bold">{t('tips')}</span>
                      <span className="text-xs italic text-subtext1">${e.tips?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-start justify-center lg:border-l border-surface0 lg:pl-6 min-w-[240px]">
                    <div className="flex items-center gap-4 w-full">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Users className="w-5 h-5" style={{ color: statusColor }} />
                        <span className="text-xl font-black" style={{ color: statusColor }}>
                          {assignedCount}/{neededCount}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 items-center overflow-hidden">
                        {e.staff?.map((s, idx) => (
                          <span key={idx} className="text-[10px] bg-surface2/60 px-2 py-1 rounded-md text-text border border-surface1 shadow-sm font-bold whitespace-nowrap">{s}</span>
                        ))}
                        {assignedCount === 0 && <span className="text-[10px] text-surface2 italic">{t('noEvents')}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-surface0/50">
                  <div className="flex-1 flex gap-2 items-start">
                    <Package className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {e.gear && e.gear.length > 0 ? e.gear.map((g, idx) => (
                        <span key={idx} className="text-[10px] bg-surface0 border border-surface1 px-1.5 py-0.5 rounded text-text font-medium">{g}</span>
                      )) : <span className="text-[10px] text-surface2 italic">No gear</span>}
                    </div>
                  </div>
                  <div className="flex-[1.5] flex gap-2 items-start border-t sm:border-t-0 sm:border-l border-surface0/50 sm:pl-4">
                    <StickyNote className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    <p className="text-[10px] text-text italic line-clamp-2">{e.notes || 'No notes'}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredEvents.length === 0 && (
            <div className="py-12 text-center bg-mantle rounded-lg border border-dashed border-surface0">
              <CalendarIcon className="w-10 h-10 text-surface1 mx-auto mb-2" />
              <p className="text-subtext0 text-sm font-medium">{t('noEvents')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
