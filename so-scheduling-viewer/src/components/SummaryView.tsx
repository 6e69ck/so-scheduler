'use client';

import React, { useRef, useEffect, useState } from 'react';
import { EventType } from '@/types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, MapPin, Mail, Users, Package, StickyNote, Plus, X } from 'lucide-react';
import moment from 'moment';
import { useTranslations } from 'next-intl';

type ViewType = 'day' | 'week' | 'month';

interface Props {
  events: EventType[];
  selectedDate: string; // "YYYY-MM-DD"
  setSelectedDate: (date: string) => void;
  highlightedEventId: string | null;
  onAddStaff: (eventId: string, name: string) => Promise<void>;
  onRemoveStaff: (eventId: string, name: string) => Promise<void>;
}

export default function SummaryView({ events, selectedDate, setSelectedDate, highlightedEventId, onAddStaff, onRemoveStaff }: Props) {
  const t = useTranslations('Common');
  const [viewType, setViewType] = useState<ViewType>('day');
  const [addingStaffTo, setAddingStaffTo] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const highlightedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedEventId && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedEventId]);

  const filteredEvents = events.filter(e => {
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

  const getStaffColor = (assigned: number, needed: number) => {
    if (needed === 0) return 'text-[#6c7086]';
    if (assigned >= needed) return 'text-[#a6e3a1] font-bold';
    if (assigned >= needed / 2) return 'text-[#f9e2af] font-bold';
    return 'text-[#f38ba8] font-bold';
  };

  const handleStaffSubmit = async (eventId: string) => {
    if (!staffName.trim()) return;
    setIsSubmitting(true);
    await onAddStaff(eventId, staffName);
    setIsSubmitting(false);
    setStaffName('');
    setAddingStaffTo(null);
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'N/A';
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const formatRangeLabel = () => {
    const mDate = moment.utc(selectedDate, 'YYYY-MM-DD');
    if (viewType === 'day') return mDate.format('MMM D, YYYY');
    if (viewType === 'week') {
      const start = moment(mDate).startOf('week');
      const end = moment(mDate).endOf('week');
      return `${start.format('MMM D')} - ${end.format('D, YYYY')}`;
    }
    return mDate.format('MMMM YYYY');
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e2e] border-none sm:border border-[#313244] sm:rounded-lg overflow-hidden text-[#cdd6f4]" onClick={(e) => e.stopPropagation()}>
      <div className="p-3 border-b border-[#313244] bg-[#11111b] flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-sm sm:text-xl text-[#cba6f7] flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#cba6f7] hidden sm:block" />
            {t('summary')}
          </h2>
          <div className="flex bg-[#181825] rounded-md p-0.5 border border-[#313244]">
            {(['day', 'week', 'month'] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewType(v)}
                className={`px-2 py-1 rounded text-[10px] sm:text-xs font-bold transition-all ${viewType === v ? 'bg-[#313244] text-[#cba6f7] shadow-sm' : 'text-[#a6adc8] hover:text-[#cdd6f4]'}`}
              >
                {v === 'day' ? t('day') : v === 'week' ? t('week') : t('month')}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={prevRange} className="p-1.5 rounded bg-[#313244] text-[#a6adc8] hover:text-[#cdd6f4] border border-[#45475a]"><ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4"/></button>
          <div className="font-bold text-[11px] sm:text-sm min-w-[100px] sm:min-w-[150px] text-center">
            {formatRangeLabel()}
          </div>
          <button onClick={nextRange} className="p-1.5 rounded bg-[#313244] text-[#a6adc8] hover:text-[#cdd6f4] border border-[#45475a]"><ChevronRight className="w-3 h-3 sm:w-4 sm:h-4"/></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 sm:p-4 custom-scrollbar bg-[#11111b]/50">
        <div className="grid grid-cols-1 gap-3 sm:gap-6 max-w-5xl mx-auto pb-20">
          {filteredEvents.map((e, i) => {
            const assignedCount = e.staff?.length || 0;
            const neededCount = e.neededPeople || 0;
            const staffColorClass = getStaffColor(assignedCount, neededCount);
            const isHighlighted = highlightedEventId === e._id;
            
            return (
              <div 
                key={e._id || i} 
                ref={isHighlighted ? highlightedRef : null}
                className={`bg-[#181825] border rounded-lg sm:rounded-xl p-0 transition-all duration-500 shadow-lg group relative overflow-hidden flex flex-col
                  ${isHighlighted ? 'border-[#cba6f7] ring-1 ring-[#cba6f7]/20 bg-[#1e1e2e] scale-[1.01] z-10' : 'border-[#313244]'}
                `}
              >
                <div className="p-3 sm:p-5 flex flex-col md:flex-row justify-between gap-3 sm:gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <h3 className={`font-bold text-sm sm:text-xl ${isHighlighted ? 'text-[#cba6f7]' : 'text-[#f5e0dc]'}`}>
                        {e.companyName || e.clientName}
                      </h3>
                      {e.companyName && <span className="text-[10px] sm:text-xs text-[#6c7086] italic">({e.clientName})</span>}
                      <span className={`text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider
                        ${e.status === 'Confirmed' ? 'bg-[#a6e3a1]/10 text-[#a6e3a1]' : 
                          e.status === 'Completed' ? 'bg-[#89b4fa]/10 text-[#89b4fa]' : 
                          e.status === 'Planning' ? 'bg-[#f9e2af]/10 text-[#f9e2af]' : 
                          'bg-[#6c7086]/10 text-[#6c7086]'}
                      `}>{t(`statuses.${e.status}`)}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 sm:gap-y-3 gap-x-8 text-[11px] sm:text-sm">
                      <div className="flex items-baseline gap-2 text-[#a6adc8]">
                        <CalendarIcon className="hidden sm:block w-4 h-4 text-[#cba6f7] shrink-0" />
                        <span className="text-[9px] uppercase font-bold text-[#6c7086] w-10 sm:hidden">{t('time')}:</span>
                        <p className="font-medium text-[#cdd6f4]">{moment.utc(e.date).format('MMM D')} | {e.startTime} - {e.endTime}</p>
                      </div>
                      
                      <div className="flex items-baseline gap-2 text-[#a6adc8]">
                        <MapPin className="hidden sm:block w-4 h-4 text-[#cba6f7] shrink-0" />
                        <span className="text-[9px] uppercase font-bold text-[#6c7086] w-10 sm:hidden">{t('loc')}:</span>
                        <p className="font-medium text-[#cdd6f4] truncate" title={e.location}>{e.location || 'N/A'}</p>
                      </div>

                      <div className="flex items-baseline gap-2 text-[#a6adc8]">
                        <Phone className="hidden sm:block w-4 h-4 text-[#cba6f7] shrink-0" />
                        <span className="text-[9px] uppercase font-bold text-[#6c7086] w-10 sm:hidden">{t('phone')}:</span>
                        {e.clientPhone ? (
                          <a href={`tel:${e.clientPhone}`} className="font-medium text-[#cdd6f4] hover:text-[#cba6f7] underline decoration-accent/20 transition-colors">{formatPhone(e.clientPhone)}</a>
                        ) : (
                          <p className="font-medium text-[#6c7086]">N/A</p>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2 text-[#a6adc8]">
                        <Mail className="hidden sm:block w-4 h-4 text-[#cba6f7] shrink-0" />
                        <span className="text-[9px] uppercase font-bold text-[#6c7086] w-10 sm:hidden">{t('email')}:</span>
                        {e.clientEmail ? (
                          <a href={`mailto:${e.clientEmail}`} className="font-medium text-[#cdd6f4] hover:text-[#cba6f7] transition-colors truncate block max-w-[180px] underline decoration-accent/20" title={e.clientEmail}>{e.clientEmail}</a>
                        ) : (
                          <p className="font-medium text-[#6c7086]">N/A</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-[#313244] pt-2 sm:pt-0 sm:pl-8 min-w-[140px] sm:min-w-[200px]">
                    <div className="flex flex-col items-center w-full">
                      <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                        <Users className={`w-4 h-4 sm:w-6 h-6 ${staffColorClass}`} />
                        <span className={`text-lg sm:text-2xl font-black ${staffColorClass}`}>{assignedCount}/{neededCount}</span>
                      </div>
                      <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-[#6c7086] font-black mb-2">{t('staffAssigned')}</span>
                      
                      <div className="flex flex-wrap justify-center gap-1 w-full mb-3">
                        {e.staff && e.staff.length > 0 ? (
                          e.staff.map((s, idx) => (
                            <div key={idx} className="group/staff relative">
                              <span className="text-[9px] sm:text-[10px] bg-[#313244] border border-[#45475a] px-1.5 py-0.5 rounded text-[#cdd6f4] font-medium flex items-center gap-1">
                                {s}
                                <button onClick={() => onRemoveStaff(e._id!, s)} className="text-[#6c7086] hover:text-[#f38ba8]"><X className="w-2 h-2" /></button>
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[9px] text-[#45475a] italic">{t('noneAssigned')}</span>
                        )}
                      </div>

                      {addingStaffTo === e._id ? (
                        <div className="w-full flex gap-1">
                          <input autoFocus type="text" placeholder={t('yourName')} value={staffName} onChange={(e) => setStaffName(e.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && handleStaffSubmit(e._id!)} className="bg-[#11111b] border border-[#cba6f7] rounded px-1.5 py-1 text-[10px] w-full outline-none" />
                          <button onClick={() => handleStaffSubmit(e._id!)} className="bg-[#cba6f7] text-[#11111b] px-2 rounded"><Plus className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingStaffTo(e._id!)} className="w-full py-1 sm:py-2 bg-[#313244] rounded text-[10px] sm:text-xs font-bold text-[#cba6f7] border border-[#45475a]">{t('joinShow')}</button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Details Section */}
                <div className="bg-[#11111b]/30 border-t border-[#313244] p-3 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="hidden sm:block w-4 h-4 text-[#cba6f7]" />
                      <span className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-[#cba6f7]">{t('equipment')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {e.gear && e.gear.length > 0 ? (
                        e.gear.map((g, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-[#181825] border border-[#313244] text-[10px] sm:text-xs text-[#a6adc8] rounded-md">{g}</span>
                        ))
                      ) : (
                        <span className="text-[10px] text-[#45475a] italic">{t('none')}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <StickyNote className="hidden sm:block w-4 h-4 text-[#cba6f7]" />
                      <span className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-[#cba6f7]">{t('notes')}</span>
                    </div>
                    <div className="bg-[#181825]/50 border border-[#313244] rounded p-2 min-h-[40px]">
                      {e.notes ? (
                        <p className="text-[10px] sm:text-xs text-[#a6adc8] leading-tight">{e.notes}</p>
                      ) : (
                        <p className="text-[10px] text-[#45475a] italic">{t('none')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredEvents.length === 0 && (
            <div className="py-20 text-center bg-[#181825] rounded-lg border-2 border-dashed border-[#313244]">
              <p className="text-[#6c7086] font-bold">{t('noShows')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
