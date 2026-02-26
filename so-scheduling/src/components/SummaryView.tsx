'use client';

import React, { useState } from 'react';
import { EventType } from '@/types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, MapPin, Mail, Users, Package, StickyNote, DollarSign, Wallet, Receipt } from 'lucide-react';
import moment from 'moment';

export default function SummaryView({ events, onViewEvent }: { events: EventType[], onViewEvent: (e: EventType) => void }) {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));

  const filteredEvents = events.filter(e => {
    return moment(e.date).format('YYYY-MM-DD') === selectedDate;
  });

  const prevDate = () => {
    setSelectedDate(moment(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'));
  };

  const nextDate = () => {
    setSelectedDate(moment(selectedDate).add(1, 'day').format('YYYY-MM-DD'));
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    return phone;
  };

  return (
    <div className="flex flex-col h-full w-full bg-base rounded-lg shadow-sm border border-surface0 overflow-hidden text-text font-sans">
      <div className="p-3 border-b border-surface0 bg-mantle flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-accent" />
          <h2 className="font-bold text-lg text-text">Daily Admin Summary</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevDate} className="p-1.5 rounded bg-surface0 text-subtext0 hover:text-text hover:bg-surface1 transition border border-surface1"><ChevronLeft className="w-4 h-4"/></button>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="bg-surface0 border border-surface1 text-text rounded-md p-1.5 text-sm focus:ring-1 focus:ring-accent outline-none [color-scheme:dark]"
          />
          <button onClick={nextDate} className="p-1.5 rounded bg-surface0 text-subtext0 hover:text-text hover:bg-surface1 transition border border-surface1"><ChevronRight className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 custom-scrollbar">
        <div className="grid grid-cols-1 gap-3 max-w-7xl mx-auto">
          {filteredEvents.map((e, i) => {
            const assignedCount = e.staff?.length || 0;
            const neededCount = e.neededPeople || 0;
            const remaining = (e.totalPrice || 0) - (e.paidBalance || 0);
            
            // Explicitly bright colors for mocha Red and Green
            const statusColor = neededCount > 0 && assignedCount < neededCount ? '#f38ba8' : '#a6e3a1';
            
            return (
              <div 
                key={e._id || i} 
                onClick={() => onViewEvent(e)}
                className="bg-mantle border border-surface0 rounded-lg p-3 hover:border-accent/50 transition-all cursor-pointer group shadow-sm flex flex-col gap-3"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  {/* Left Column: Basic Info */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-bold text-base text-text group-hover:text-accent group-hover:underline transition-colors">
                        {e.companyName || e.clientName}
                      </h3>
                      {e.companyName && <span className="text-[10px] text-subtext0 italic">({e.clientName})</span>}
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border
                        ${e.status === 'Confirmed' ? 'bg-green/10 text-green border-green/20' : 
                          e.status === 'Completed' ? 'bg-blue/10 text-blue border-blue/20' : 
                          e.status === 'Planning' ? 'bg-yellow/10 text-yellow border-yellow/20' : 
                          'bg-surface1 text-subtext1 border-surface2'}
                      `}>{e.status}</span>
                      <span className="text-[10px] text-subtext0 font-mono">#{String(e.eventNumber || 0).padStart(4, '0')}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-subtext1">
                        <CalendarIcon className="w-3.5 h-3.5 text-accent" />
                        <span className="font-medium">{e.startTime} - {e.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-subtext1">
                        <MapPin className="w-3.5 h-3.5 text-accent" />
                        <span className="truncate max-w-[150px]" title={e.location}>{e.location || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-subtext1">
                        <Phone className="w-3.5 h-3.5 text-accent" />
                        <span>{formatPhone(e.clientPhone)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-subtext1">
                        <Mail className="w-3.5 h-3.5 text-accent" />
                        <span className="truncate max-w-[150px]" title={e.clientEmail}>{e.clientEmail || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Financials (Compact) */}
                  <div className="flex-1 bg-surface0/50 border border-surface1/30 rounded-md p-2 grid grid-cols-2 lg:grid-cols-4 gap-2 items-center">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-subtext0 font-bold">Total</span>
                      <span className="text-xs font-bold text-text">${e.totalPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-subtext0 font-bold">Paid</span>
                      <span className="text-xs font-bold text-green">${e.paidBalance?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-subtext0 font-bold">Remain</span>
                      <span className="text-xs font-bold text-accent">${remaining.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase text-subtext0 font-bold">Tips</span>
                      <span className="text-xs italic text-subtext1">${e.tips?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>

                  {/* Right Column: Staffing - Aligned with <icon> <count> <person boxes here> */}
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
                          <span key={idx} className="text-[10px] bg-surface2/60 px-2 py-1 rounded-md text-text border border-surface1 shadow-sm font-bold whitespace-nowrap">
                            {s}
                          </span>
                        ))}
                        {assignedCount === 0 && <span className="text-[10px] text-surface2 italic">No staff assigned</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Gear & Notes (Very Compact) */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-surface0/50">
                  <div className="flex-1 flex gap-2 items-start">
                    <Package className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {e.gear && e.gear.length > 0 ? e.gear.map((g, idx) => (
                        <span key={idx} className="text-[10px] bg-surface0 border border-surface1 px-1.5 py-0.5 rounded text-subtext1">{g}</span>
                      )) : <span className="text-[10px] text-surface2 italic">No gear</span>}
                    </div>
                  </div>
                  <div className="flex-[1.5] flex gap-2 items-start border-t sm:border-t-0 sm:border-l border-surface0/50 sm:pl-4">
                    <StickyNote className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    <p className="text-[10px] text-subtext1 italic line-clamp-2">{e.notes || 'No notes'}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredEvents.length === 0 && (
            <div className="py-12 text-center bg-mantle rounded-lg border border-dashed border-surface0">
              <CalendarIcon className="w-10 h-10 text-surface1 mx-auto mb-2" />
              <p className="text-subtext0 text-sm font-medium">No events for {selectedDate}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
