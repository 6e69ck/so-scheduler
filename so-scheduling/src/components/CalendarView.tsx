'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { EventType } from '@/types';
import { Plus, Printer, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

const localizer = momentLocalizer(moment);

interface Props {
  events: EventType[];
  onEditEvent: (e: EventType) => void;
  onCreateEvent: (start?: Date, end?: Date) => void;
  onViewEvent: (e: EventType) => void;
}

export default function CalendarView({ events, onEditEvent, onCreateEvent, onViewEvent }: Props) {
  const t = useTranslations('Common');
  const [viewType, setViewType] = useState<View>(Views.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date, end: Date } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const rbcEvents = events.map(e => {
    const d = new Date(e.date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();
    const [startH, startM] = e.startTime.split(':').map(Number);
    const [endH, endM] = e.endTime.split(':').map(Number);
    
    return {
      id: e._id,
      title: e.show,
      start: new Date(year, month, day, startH, startM),
      end: new Date(year, month, day, endH, endM),
      resource: e,
    };
  });

  if (selectedRange) {
    const startStr = moment(selectedRange.start).format('h:mm A');
    const endStr = moment(selectedRange.end).format('h:mm A');
    rbcEvents.push({
      id: 'temp-selection',
      title: `${startStr} - ${endStr}`,
      start: selectedRange.start,
      end: selectedRange.end,
      resource: { status: 'Selection' } as any,
    });
  }

  const [hoverInfo, setHoverInfo] = useState<{ event: any, x: number, y: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedRange({ start: slotInfo.start, end: slotInfo.end });
  };

  const handleEventClick = (event: any) => {
    if (event.id === 'temp-selection') return;
    setHoverInfo(null);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setTimeout(() => onViewEvent(event.resource), 0);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#new-event-btn') && !target.closest('.rbc-event') && !target.closest('.rbc-slot-selection')) {
        setSelectedRange(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const prevDate = () => {
    if (viewType === Views.DAY) setCurrentDate(moment(currentDate).subtract(1, 'day').toDate());
    if (viewType === Views.WEEK) {
      setCurrentDate(moment(currentDate).subtract(isMobile ? 3 : 7, 'days').toDate());
    }
    if (viewType === Views.MONTH) setCurrentDate(moment(currentDate).subtract(1, 'month').toDate());
  };

  const nextDate = () => {
    if (viewType === Views.DAY) setCurrentDate(moment(currentDate).add(1, 'day').toDate());
    if (viewType === Views.WEEK) {
      setCurrentDate(moment(currentDate).add(isMobile ? 3 : 7, 'days').toDate());
    }
    if (viewType === Views.MONTH) setCurrentDate(moment(currentDate).add(1, 'month').toDate());
  };

  const eventStyleGetter = (event: any) => {
    if (event.id === 'temp-selection') {
      return {
        className: 'temp-selection-event',
        style: {
          backgroundColor: '#cba6f7', 
          color: '#11111b',
          display: 'block'
        }
      };
    }
    return {
      style: {
        backgroundColor: '#f38ba8', 
        color: '#11111b',
        border: '0px',
        borderRadius: '6px',
        display: 'block'
      }
    };
  };

  return (
    <div className="flex flex-col h-full relative w-full text-text font-sans">
      <div className="flex flex-nowrap gap-2 justify-between items-center mb-2 bg-mantle p-2 rounded-lg shadow-sm border border-surface0 shrink-0 overflow-x-auto no-scrollbar">
        <button 
          id="new-event-btn"
          onClick={() => {
            onCreateEvent(selectedRange?.start, selectedRange?.end);
            setSelectedRange(null);
          }} 
          className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-accent hover:bg-accent-hover rounded-md flex items-center transition font-bold text-crust shrink-0"
        >
          <Plus className="w-4 h-4 sm:mr-2 pointer-events-none" /> 
          <span className="hidden sm:inline">{t('newShow')}</span>
        </button>

        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          <div className="flex bg-crust rounded-md p-1 border border-surface0">
            <button onClick={prevDate} className="p-1 rounded text-subtext0 hover:text-text hover:bg-surface0 transition"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5"/></button>
            <button onClick={nextDate} className="p-1 rounded text-subtext0 hover:text-text hover:bg-surface0 transition"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5"/></button>
          </div>
          
          <div className="text-subtext1 font-bold text-[10px] sm:text-sm text-center min-w-[80px] sm:min-w-[200px]">
            {viewType === Views.MONTH 
              ? moment(currentDate).format('MMM YYYY') 
              : viewType === Views.WEEK && isMobile 
                ? `${moment(currentDate).format('MMM D')} - ${moment(currentDate).add(2, 'days').format('D')}`
                : moment(currentDate).format(isMobile ? 'MMM D, YYYY' : 'dddd, MMM D, YYYY')}
          </div>

          <div className="flex bg-crust rounded-md p-1 border border-surface0">
            <button onClick={() => setViewType(Views.DAY)} className={`px-2 sm:px-3 py-1 rounded text-[10px] sm:text-sm font-bold transition-colors ${viewType === Views.DAY ? 'bg-surface0 text-accent shadow-sm' : 'text-subtext0 hover:text-text hover:bg-surface0/50'}`}>
              <span className="hidden sm:inline">{t('day')}</span><span className="sm:hidden">D</span>
            </button>
            <button onClick={() => setViewType(Views.WEEK)} className={`px-2 sm:px-3 py-1 rounded text-[10px] sm:text-sm font-bold transition-colors ${viewType === Views.WEEK ? 'bg-surface0 text-accent shadow-sm' : 'text-subtext0 hover:text-text hover:bg-surface0/50'}`}>
              <span className="hidden sm:inline">{t('week')}</span><span className="sm:hidden">W</span>
            </button>
            <button onClick={() => setViewType(Views.MONTH)} className={`px-2 sm:px-3 py-1 rounded text-[10px] sm:text-sm font-bold transition-colors ${viewType === Views.MONTH ? 'bg-surface0 text-accent shadow-sm' : 'text-subtext0 hover:text-text hover:bg-surface0/50'}`}>
              <span className="hidden sm:inline">{t('month')}</span><span className="sm:hidden">M</span>
            </button>
          </div>
        </div>

        <button onClick={() => window.print()} className="hidden md:flex bg-surface0 text-text px-3 py-1.5 rounded-md items-center hover:bg-surface1 transition font-bold border border-surface1 hover:text-accent shrink-0">
          <Printer className="w-4 h-4 mr-2 pointer-events-none" /> <span>{t('print')}</span>
        </button>
      </div>

      <div className="flex-1 bg-mantle rounded-lg shadow-sm overflow-hidden relative calendar-container p-1 custom-rbc-container">
        <Calendar
          localizer={localizer}
          events={rbcEvents}
          view={viewType as any}
          date={currentDate}
          onNavigate={(d) => setCurrentDate(d)}
          onView={(v) => setViewType(v)}
          step={15}
          timeslots={4}
          min={new Date(0, 0, 0, 6, 0, 0)}
          max={new Date(0, 0, 0, 23, 59, 59)}
          selectable
          longPressThreshold={300}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleEventClick}
          toolbar={false}
          eventPropGetter={eventStyleGetter}
          formats={{
            dayFormat: (date, culture, localizer) => {
              return localizer!.format(date, 'ddd D', culture);
            },
            dayHeaderFormat: (date, culture, localizer) => {
              return localizer!.format(date, 'dddd, MMMM D', culture);
            }
          }}
          components={{
            event: (props) => (
              <div 
                className="w-full h-full p-1 text-[10px] sm:text-xs overflow-hidden flex flex-col lg:flex-row lg:items-start lg:gap-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventClick(props.event);
                }}
                onMouseEnter={(e) => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                  hoverTimeoutRef.current = setTimeout(() => {
                    setHoverInfo({ event: props.event.resource, x: e.clientX, y: e.clientY });
                  }, 250);
                }}
                onMouseLeave={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                  setHoverInfo(null);
                }}
              >
                <strong className="block truncate shrink-0">{props.title}</strong>
                {props.event.resource.location && (
                  <div className="truncate opacity-80 flex items-center gap-1 min-w-0 lg:flex-1">
                    <MapPin className="w-3 h-3 shrink-0 hidden lg:block" />
                    <span className="truncate">{props.event.resource.location}</span>
                  </div>
                )}
              </div>
            )
          }}
        />
      </div>

      {hoverInfo && (
        <div className="fixed z-[60] bg-crust text-text text-sm p-3 rounded-lg shadow-xl pointer-events-none max-w-xs border border-surface0" style={{ top: hoverInfo.y + 15, left: hoverInfo.x + 15 }}>
          <p className="font-bold text-base mb-1 text-text">{hoverInfo.event.show}</p>
          {hoverInfo.event.location && <p className="text-subtext1 truncate">📍 {hoverInfo.event.location}</p>}
          <p className="text-subtext1">⏱️ {hoverInfo.event.startTime} - {hoverInfo.event.endTime}</p>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .rbc-calendar { background-color: transparent; }
        .rbc-header { 
          border-bottom: 1px solid #313244 !important; 
          padding: 10px 0 !important; 
          font-weight: bold; 
          color: #a6adc8; 
          border-left: 1px solid #313244 !important; 
        }
        .rbc-header:first-child { border-left: none !important; }
        .rbc-month-view, .rbc-time-view { 
          border: 1px solid #313244 !important; 
          border-radius: 8px; 
          overflow: hidden; 
        }
        .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row, .rbc-time-content > * + * > *, .rbc-time-header-content { 
          border-left: 1px solid #313244 !important; 
        }
        .rbc-time-content { border-top: 1px solid #313244 !important; }
        .rbc-timeslot-group { border-bottom: 1px solid #313244 !important; min-height: 48px !important; }
        .rbc-time-slot { border-top: 1px solid rgba(49, 50, 68, 0.2) !important; }
        .rbc-time-gutter .rbc-timeslot-group { border-right: 1px solid #313244 !important; }
        .rbc-off-range-bg { background: #11111b !important; }
        .rbc-today { background-color: transparent !important; }
        .rbc-event { padding: 0 !important; margin: 0 !important; }
        .rbc-event-label { display: none !important; }
        .rbc-time-view .rbc-allday-cell { display: none; }
        .rbc-current-time-indicator { background-color: #cba6f7 !important; }
        .rbc-label { color: #6c7086; font-size: 11px; }
        .rbc-events-container { margin-right: 0 !important; }

        @media (max-width: 767px) {
          .rbc-time-view {
            overflow-x: auto !important;
            overflow-y: hidden !important;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
          }
          .rbc-time-header, .rbc-time-content {
            min-width: 233.33% !important; /* Forces 3 days to fit viewport width */
          }
          .rbc-time-content {
            overflow-y: auto !important;
            touch-action: pan-y;
          }
          .rbc-header, .rbc-day-slot {
            scroll-snap-align: start;
            scroll-margin-left: 50px;
          }
          .rbc-time-gutter, .rbc-time-header-gutter {
            position: sticky !important;
            left: 0 !important;
            z-index: 100 !important;
            background-color: #181825 !important;
            border-right: 1px solid #313244 !important;
            min-width: 50px !important;
          }
        }
      `}</style>
    </div>
  );
}
