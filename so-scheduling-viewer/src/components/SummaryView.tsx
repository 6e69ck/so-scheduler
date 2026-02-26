'use client';

import React, { useRef, useEffect, useState } from 'react';
import { EventType } from '@/types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, MapPin, Mail, Users, Package, StickyNote, Plus, X } from 'lucide-react';
import moment from 'moment';

type ViewType = 'day' | 'week' | 'month';

interface Props {
  events: EventType[];
  selectedDate: moment.Moment;
  setSelectedDate: (d: moment.Moment) => void;
  highlightedEventId: string | null;
  onAddStaff: (eventId: string, name: string) => Promise<void>;
  onRemoveStaff: (eventId: string, name: string) => Promise<void>;
}

export default function SummaryView({ events, selectedDate, setSelectedDate, highlightedEventId, onAddStaff, onRemoveStaff }: Props) {
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
    const eventDate = moment.utc(e.date);
    if (viewType === 'day') {
      return eventDate.isSame(selectedDate, 'day');
    } else if (viewType === 'week') {
      return eventDate.isSame(selectedDate, 'week');
    } else {
      return eventDate.isSame(selectedDate, 'month');
    }
  }).sort((a, b) => {
    const dateDiff = moment.utc(a.date).diff(moment.utc(b.date));
    if (dateDiff !== 0) return dateDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  const prevRange = () => {
    setSelectedDate(moment(selectedDate).subtract(1, viewType));
  };

  const nextRange = () => {
    setSelectedDate(moment(selectedDate).add(1, viewType));
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
    if (!phone) return 'No phone number';
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const formatRangeLabel = () => {
    if (viewType === 'day') return selectedDate.format('MMMM D, YYYY');
    if (viewType === 'week') {
      const start = moment(selectedDate).startOf('week');
      const end = moment(selectedDate).endOf('week');
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
    }
    return selectedDate.format('MMMM YYYY');
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e2e] rounded-lg shadow-sm border border-[#313244] overflow-hidden text-[#cdd6f4]" onClick={(e) => e.stopPropagation()}>
      <div className="p-4 border-b border-[#313244] bg-[#11111b] flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-xl text-[#cba6f7] flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#cba6f7]" />
            Schedule Summary
          </h2>
          <div className="flex bg-[#181825] rounded-md p-1 border border-[#313244]">
            {(['day', 'week', 'month'] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewType(v)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${viewType === v ? 'bg-[#313244] text-[#cba6f7] shadow-sm' : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]/50'}`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={prevRange} className="p-2 rounded bg-[#313244] text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#45475a] transition border border-[#45475a]"><ChevronLeft className="w-4 h-4"/></button>
          <div className="font-bold text-sm min-w-[150px] text-center">
            {formatRangeLabel()}
          </div>
          <button onClick={nextRange} className="p-2 rounded bg-[#313244] text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#45475a] transition border border-[#45475a]"><ChevronRight className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-[#11111b]/50">
        <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto pb-20">
          {filteredEvents.map((e, i) => {
            const assignedCount = e.staff?.length || 0;
            const neededCount = e.neededPeople || 0;
            const staffColorClass = getStaffColor(assignedCount, neededCount);
            const isHighlighted = highlightedEventId === e._id;
            
            return (
              <div 
                key={e._id || i} 
                ref={isHighlighted ? highlightedRef : null}
                className={`bg-[#181825] border rounded-xl p-0 transition-all duration-500 shadow-lg group relative overflow-hidden flex flex-col
                  ${isHighlighted ? 'border-[#cba6f7] ring-2 ring-[#cba6f7]/20 bg-[#1e1e2e] scale-[1.01] z-10' : 'border-[#313244] hover:border-[#45475a]'}
                `}
              >
                <div className="p-5 flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className={`font-bold text-xl ${isHighlighted ? 'text-[#cba6f7]' : 'text-[#f5e0dc]'}`}>
                        {e.companyName || e.clientName}
                      </h3>
                      {e.companyName && <span className="text-xs text-[#6c7086] italic">({e.clientName})</span>}
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider
                        ${e.status === 'Confirmed' ? 'bg-[#a6e3a1]/10 text-[#a6e3a1]' : 
                          e.status === 'Completed' ? 'bg-[#89b4fa]/10 text-[#89b4fa]' : 
                          e.status === 'Planning' ? 'bg-[#f9e2af]/10 text-[#f9e2af]' : 
                          'bg-[#6c7086]/10 text-[#6c7086]'}
                      `}>{e.status}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                      <div className="flex items-center gap-3 text-[#a6adc8]">
                        <div className="w-8 h-8 rounded-lg bg-[#313244] flex items-center justify-center shrink-0">
                          <CalendarIcon className="w-4 h-4 text-[#cba6f7]" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-tighter text-[#6c7086] font-bold leading-none mb-1">Date & Time</p>
                          <p className="font-medium text-[#cdd6f4]">{moment.utc(e.date).format('ddd, MMM D')} | {e.startTime} - {e.endTime}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-[#a6adc8]">
                        <div className="w-8 h-8 rounded-lg bg-[#313244] flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-[#cba6f7]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-tighter text-[#6c7086] font-bold leading-none mb-1">Location</p>
                          <p className="font-medium text-[#cdd6f4] truncate" title={e.location}>{e.location || 'No location set'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[#a6adc8]">
                        <div className="w-8 h-8 rounded-lg bg-[#313244] flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-[#cba6f7]" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-tighter text-[#6c7086] font-bold leading-none mb-1">Contact Phone</p>
                          {e.clientPhone ? (
                            <a href={`tel:${e.clientPhone}`} className="font-medium text-[#cdd6f4] hover:text-[#cba6f7] transition-colors">{formatPhone(e.clientPhone)}</a>
                          ) : (
                            <p className="font-medium text-[#6c7086]">No phone number</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[#a6adc8]">
                        <div className="w-8 h-8 rounded-lg bg-[#313244] flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4 text-[#cba6f7]" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-tighter text-[#6c7086] font-bold leading-none mb-1">Contact Email</p>
                          {e.clientEmail ? (
                            <a href={`mailto:${e.clientEmail}`} className="font-medium text-[#cdd6f4] hover:text-[#cba6f7] transition-colors truncate block max-w-[180px]" title={e.clientEmail}>{e.clientEmail}</a>
                          ) : (
                            <p className="font-medium text-[#6c7086]">N/A</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-[#313244] pt-4 md:pt-0 md:pl-8 min-w-[200px]">
                    <div className="flex flex-col items-center w-full">
                      <div className="flex items-center gap-3 mb-1">
                        <Users className={`w-6 h-6 ${staffColorClass}`} />
                        <span className={`text-2xl font-black ${staffColorClass}`}>{assignedCount}/{neededCount}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-[#6c7086] font-black mb-3">Staff Assigned</span>
                      
                      <div className="flex flex-wrap justify-center gap-1.5 w-full mb-4">
                        {e.staff && e.staff.length > 0 ? (
                          e.staff.map((s, idx) => (
                            <div key={idx} className="group/staff relative">
                              <span className="text-[10px] bg-[#313244] border border-[#45475a] px-2 py-1 rounded-md text-[#cdd6f4] font-medium shadow-sm flex items-center gap-1">
                                {s}
                                <button 
                                  onClick={() => onRemoveStaff(e._id!, s)}
                                  className="ml-1 text-[#6c7086] hover:text-[#f38ba8] transition-colors"
                                  title="Remove staff member"
                                >
                                  <X className="w-2 h-2" />
                                </button>
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-[#45475a] italic font-medium">None assigned</span>
                        )}
                      </div>

                      {addingStaffTo === e._id ? (
                        <div className="w-full flex gap-1">
                          <input 
                            autoFocus
                            type="text" 
                            placeholder="Your Name" 
                            value={staffName} 
                            onChange={(e) => setStaffName(e.target.value)}
                            onKeyDown={(ev) => ev.key === 'Enter' && handleStaffSubmit(e._id!)}
                            className="bg-[#11111b] border border-[#cba6f7] rounded p-1.5 text-xs w-full outline-none focus:ring-1 focus:ring-[#cba6f7]"
                            disabled={isSubmitting}
                          />
                          <button 
                            onClick={() => handleStaffSubmit(e._id!)}
                            disabled={isSubmitting || !staffName.trim()}
                            className="bg-[#cba6f7] text-[#11111b] p-1.5 rounded transition hover:bg-[#b4befe] disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setAddingStaffTo(e._id!)}
                          className="w-full py-2 bg-[#313244] hover:bg-[#45475a] border border-[#45475a] rounded-lg text-xs font-bold text-[#cba6f7] transition flex items-center justify-center gap-2"
                        >
                          <Plus className="w-3 h-3" />
                          Join Show
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Details Section (Equipment & Notes) */}
                <div className="bg-[#11111b]/30 border-t border-[#313244] p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#cba6f7]">
                      <Package className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-black tracking-widest">Equipment Needed</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {e.gear && e.gear.length > 0 ? (
                        e.gear.map((g, idx) => (
                          <span key={idx} className="px-2.5 py-1.5 bg-[#181825] border border-[#313244] text-xs text-[#a6adc8] rounded-lg flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#cba6f7]"></span>
                            {g}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#45475a] italic">No specific equipment listed.</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#cba6f7]">
                      <StickyNote className="w-4 h-4" />
                      <span className="text-[10px] uppercase font-black tracking-widest">Show Notes</span>
                    </div>
                    <div className="bg-[#181825]/50 border border-[#313244] rounded-lg p-3 min-h-[60px]">
                      {e.notes ? (
                        <p className="text-xs text-[#a6adc8] leading-relaxed whitespace-pre-wrap">{e.notes}</p>
                      ) : (
                        <p className="text-xs text-[#45475a] italic">No notes provided for this show.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredEvents.length === 0 && (
            <div className="py-24 text-center bg-[#181825] rounded-2xl border-2 border-dashed border-[#313244]">
              <CalendarIcon className="w-16 h-16 text-[#313244] mx-auto mb-4" />
              <p className="text-[#6c7086] text-lg font-bold">No shows scheduled for this period.</p>
              <p className="text-[#45475a] text-sm">Select a different date or view mode.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
