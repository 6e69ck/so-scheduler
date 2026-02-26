'use client';

import React, { useState } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { EventType } from '@/types';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';

const localizer = momentLocalizer(moment);

interface Props {
  events: EventType[];
  onEventClick: (e: EventType) => void;
}

export default function CalendarView({ events, onEventClick }: Props) {
  const [viewType, setViewType] = useState<View>(Views.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const rbcEvents = events.map(e => {
    const d = new Date(e.date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();
    const [startH, startM] = e.startTime.split(':').map(Number);
    const [endH, endM] = e.endTime.split(':').map(Number);
    
    return {
      id: e._id,
      title: e.companyName || e.clientName || e.show,
      start: new Date(year, month, day, startH, startM),
      end: new Date(year, month, day, endH, endM),
      resource: e,
    };
  });

  const prevDate = () => {
    if (viewType === Views.DAY) setCurrentDate(moment(currentDate).subtract(1, 'day').toDate());
    if (viewType === Views.WEEK) setCurrentDate(moment(currentDate).subtract(1, 'week').toDate());
    if (viewType === Views.MONTH) setCurrentDate(moment(currentDate).subtract(1, 'month').toDate());
  };

  const nextDate = () => {
    if (viewType === Views.DAY) setCurrentDate(moment(currentDate).add(1, 'day').toDate());
    if (viewType === Views.WEEK) setCurrentDate(moment(currentDate).add(1, 'week').toDate());
    if (viewType === Views.MONTH) setCurrentDate(moment(currentDate).add(1, 'month').toDate());
  };

  const eventStyleGetter = (event: any) => {
    const e = event.resource as EventType;
    const assigned = e.staff?.length || 0;
    const needed = e.neededPeople || 0;
    
    let backgroundColor = '#313244';
    let borderColor = '#45475a';
    
    if (needed > 0) {
      if (assigned >= needed) {
        backgroundColor = 'rgba(166, 227, 161, 0.1)'; 
        borderColor = 'rgba(166, 227, 161, 0.5)';
      } else if (assigned >= needed / 2) {
        backgroundColor = 'rgba(249, 226, 175, 0.1)'; 
        borderColor = 'rgba(249, 226, 175, 0.5)';
      } else {
        backgroundColor = 'rgba(243, 139, 168, 0.1)'; 
        borderColor = 'rgba(243, 139, 168, 0.5)';
      }
    }

    return {
      style: {
        backgroundColor,
        color: '#cdd6f4',
        borderRadius: '4px',
        border: `1px solid ${borderColor}`,
        display: 'block'
      }
    };
  };

  return (
    <div className="flex flex-col h-full relative w-full text-[#cdd6f4]" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4 bg-[#11111b] p-3 rounded-lg shadow-sm border border-[#313244] shrink-0">
        <h2 className="text-xl font-bold text-[#cba6f7]">Team Calendar</h2>

        <div className="flex items-center space-x-2">
          <div className="flex bg-[#181825] rounded-md p-1 border border-[#313244]">
            <button onClick={prevDate} className="p-1 rounded text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] transition"><ChevronLeft className="w-5 h-5"/></button>
            <button onClick={nextDate} className="p-1 rounded text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] transition"><ChevronRight className="w-5 h-5"/></button>
          </div>
          
          <div className="text-[#cdd6f4] font-bold text-sm min-w-[150px] text-center">
            {moment(currentDate).format(viewType === Views.MONTH ? 'MMMM YYYY' : 'MMM D, YYYY')}
          </div>

          <div className="flex bg-[#181825] rounded-md p-1 border border-[#313244]">
            {[Views.DAY, Views.WEEK, Views.MONTH].map(v => (
              <button 
                key={v}
                onClick={() => setViewType(v)} 
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${viewType === v ? 'bg-[#313244] text-[#cba6f7] shadow-sm' : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]/50'}`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#1e1e2e] rounded-lg shadow-sm border border-[#313244] overflow-hidden relative calendar-container p-2 custom-rbc-container">
        <Calendar
          localizer={localizer}
          events={rbcEvents}
          view={viewType as any}
          date={currentDate}
          onNavigate={(d) => setCurrentDate(d)}
          onView={(v) => setViewType(v as View)}
          onSelectEvent={(event) => onEventClick(event.resource)}
          step={30}
          timeslots={2}
          min={new Date(0, 0, 0, 6, 0, 0)}
          max={new Date(0, 0, 0, 23, 59, 59)}
          eventPropGetter={eventStyleGetter}
          toolbar={false}
          components={{
            event: (props: any) => {
              const e = props.event.resource as EventType;
              const assigned = e.staff?.length || 0;
              const needed = e.neededPeople || 0;
              return (
                <div className="w-full h-full p-1 text-[10px] sm:text-xs overflow-hidden flex flex-col gap-0.5 cursor-pointer">
                  <strong className="block truncate">{props.title}</strong>
                  <div className="flex items-center gap-1 opacity-80">
                    <Users className="w-3 h-3 shrink-0" />
                    <span>({assigned}/{needed})</span>
                  </div>
                </div>
              );
            }
          }}
        />
      </div>
      
      <style jsx global>{`
        .rbc-calendar { background-color: transparent; }
        .rbc-header { border-bottom: 1px solid #313244 !important; padding: 10px 0 !important; font-weight: bold; color: #a6adc8; border-left: 1px solid #313244 !important; }
        .rbc-header:first-child { border-left: none !important; }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid #313244 !important; border-radius: 8px; overflow: hidden; }
        .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row, .rbc-time-content > * + * > *, .rbc-time-header-content { border-left: 1px solid #313244 !important; }
        .rbc-time-content { border-top: 1px solid #313244 !important; }
        .rbc-timeslot-group { border-bottom: 1px solid #313244 !important; min-height: 40px !important; }
        .rbc-time-slot { border-top: 1px solid #1e1e2e !important; }
        .rbc-time-gutter .rbc-timeslot-group { border-right: 1px solid #313244 !important; }
        .rbc-off-range-bg { background: #11111b !important; }
        .rbc-today { background-color: rgba(203, 166, 247, 0.05) !important; }
        .rbc-event { padding: 0 !important; margin: 0 !important; transition: transform 0.1s ease; }
        .rbc-event:hover { transform: scale(1.02); z-index: 10; }
        .rbc-time-view .rbc-allday-cell { display: none; }
        .rbc-current-time-indicator { background-color: #f38ba8 !important; }
        .rbc-label { color: #6c7086; font-size: 11px; }
      `}</style>
    </div>
  );
}
