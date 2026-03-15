'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { EventType } from '@/types';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

const localizer = momentLocalizer(moment);

interface Props {
  events: EventType[];
  onEventClick: (e: EventType) => void;
  selectedDate: string; // "YYYY-MM-DD"
}

export default function CalendarView({ events, onEventClick, selectedDate }: Props) {
  const t = useTranslations('Common');
  const [viewType, setViewType] = useState<View>(Views.WEEK);
  const [currentDate, setCurrentDate] = useState(() => moment.utc(selectedDate, 'YYYY-MM-DD').toDate());
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync with prop if it changes externally
  useEffect(() => {
    setCurrentDate(moment.utc(selectedDate, 'YYYY-MM-DD').toDate());
  }, [selectedDate]);

  // Auto-scroll to current time when view changes or component mounts
  useEffect(() => {
    if (viewType === Views.MONTH) return;

    // Slight delay to ensure DOM has rendered the time slots
    const timer = setTimeout(() => {
      const container = document.querySelector('.rbc-time-content');
      if (!container) return;

      const currentHour = new Date().getHours();
      // Calculate approximate position (each hour is usually around 60px, min is 6am)
      // Or better yet, find the actual DOM element for the current time
      const timeGutter = document.querySelector('.rbc-time-gutter');
      if (timeGutter) {
        const timeGroups = timeGutter.querySelectorAll('.rbc-timeslot-group');
        // Times start at 6am (index 0)
        const targetIndex = Math.max(0, currentHour - 6);

        if (targetIndex < timeGroups.length) {
          const targetElement = timeGroups[targetIndex] as HTMLElement;
          const containerHeight = container.clientHeight;
          const targetTop = targetElement.offsetTop;

          // Center the current time in the view, clamping to min/max scroll
          const scrollTo = Math.max(0, targetTop - (containerHeight / 2) + (targetElement.clientHeight / 2));
          container.scrollTo({ top: scrollTo, behavior: 'smooth' });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [viewType, currentDate]);

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

  const prevDate = () => {
    setCurrentDate(prev => {
      if (viewType === Views.DAY) return moment(prev).subtract(1, 'day').toDate();
      if (viewType === Views.WEEK) return moment(prev).subtract(7, 'days').toDate();
      if (viewType === Views.MONTH) return moment(prev).subtract(1, 'month').toDate();
      return prev;
    });
  };

  const nextDate = () => {
    setCurrentDate(prev => {
      if (viewType === Views.DAY) return moment(prev).add(1, 'day').toDate();
      if (viewType === Views.WEEK) return moment(prev).add(7, 'days').toDate();
      if (viewType === Views.MONTH) return moment(prev).add(1, 'month').toDate();
      return prev;
    });
  };

  const eventStyleGetter = (event: any) => {
    const e = event.resource as EventType;
    const assigned = e.staff?.length || 0;
    const needed = e.neededPeople || 0;

    let backgroundColor = '#313244';

    if (needed > 0) {
      if (assigned >= needed) {
        backgroundColor = 'rgba(166, 227, 161, 0.15)';
      } else if (assigned >= needed / 2) {
        backgroundColor = 'rgba(249, 226, 175, 0.15)';
      } else {
        backgroundColor = 'rgba(243, 139, 168, 0.15)';
      }
    }

    return {
      style: {
        backgroundColor,
        color: '#cdd6f4',
        display: 'block',
        border: 'none',
        borderRadius: '4px'
      }
    };
  };

  return (
    <div className="flex flex-col h-full relative w-full text-text" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-nowrap gap-2 justify-between items-center sm:mb-2 bg-mantle p-3 sm:rounded-md shadow-sm sm:border border-[#313244] shrink-0 overflow-x-auto no-scrollbar">
        <h2 className="text-xl font-bold text-[#cba6f7] shrink-0 hidden sm:block">{t('calendar')}</h2>

        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          <div className="flex bg-[#181825] rounded-md p-1 border border-[#313244]">
            <button onClick={prevDate} className="p-1 rounded text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] transition"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={nextDate} className="p-1 rounded text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244] transition"><ChevronRight className="w-5 h-5" /></button>
          </div>

          <div className="text-[#cdd6f4] font-bold text-[10px] sm:text-sm min-w-[80px] sm:min-w-[150px] text-center">
            {viewType === Views.MONTH
              ? moment(currentDate).format('MMM YYYY')
              : viewType === Views.WEEK && isMobile
                ? `${moment(currentDate).startOf('week').format('MMM D')} - ${moment(currentDate).endOf('week').format('D')}`
                : moment(currentDate).format(isMobile ? 'MMM D, YYYY' : 'dddd, MMM D, YYYY')}
          </div>

          <div className="flex bg-[#181825] rounded-md p-1 border border-[#313244]">
            {[Views.DAY, Views.WEEK, Views.MONTH].map(v => (
              <button
                key={v}
                onClick={() => setViewType(v as View)}
                className={`px-3 py-2 rounded text-[10px] sm:text-sm font-bold transition-colors ${viewType === v ? 'bg-[#313244] text-[#cba6f7] shadow-sm' : 'text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]/50'}`}
              >
                <span className="hidden sm:inline">{v === 'day' ? t('day') : v === 'week' ? t('week') : t('month')}</span>
                <span className="sm:hidden">{v.charAt(0).toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#1e1e2e] sm:rounded-lg shadow-sm border-none sm:border border-[#313244] overflow-hidden relative calendar-container custom-rbc-container" style={{ transform: 'translateZ(0)' }}>
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
          selectable
          longPressThreshold={300}
          eventPropGetter={eventStyleGetter}
          dayPropGetter={(date: Date) => {
            // Identify the DST Spring Forward day (Second Sunday in March) to apply a custom class
            const isSecondSundayOfMarch = date.getMonth() === 2 && date.getDay() === 0 && date.getDate() >= 8 && date.getDate() <= 14;
            if (isSecondSundayOfMarch) {
              return { className: 'dst-spring-day' };
            }
            return {};
          }}
          toolbar={false}
          formats={{
            dayFormat: (date, culture, localizer) => {
              return localizer!.format(date, 'ddd D', culture);
            },
            dayHeaderFormat: (date, culture, localizer) => {
              return localizer!.format(date, 'dddd, MMMM D', culture);
            }
          }}
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .rbc-calendar { background-color: transparent; font-family: inherit; }
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
        .rbc-current-time-indicator { background-color: #f38ba8 !important; }
        .rbc-label { color: #6c7086; font-size: 11px; }
        .rbc-events-container { margin-right: 0 !important; }

        .rbc-day-slot {
          background: repeating-linear-gradient(
            45deg,
            #1e1e2e,
            #1e1e2e 10px,
            #45475a 10px,
            #45475a 20px
          );
        }

        /* Target the specific DST spring forward day column. Since 2AM is missing, push the 3AM group (which falls into the 4th child index behind the events container) down by 48px. */
        .dst-spring-day > .rbc-timeslot-group:nth-child(4) {
          margin-top: 48px !important;
        }

        .rbc-timeslot-group { 
          min-height: 48px !important; 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          background-color: #1e1e2e;
        }
        .rbc-time-slot { min-height: 24px !important; }

        @media (max-width: 767px) {
          .rbc-time-view {
            overflow: auto !important;
            scroll-snap-type: both mandatory;
            scroll-padding-left: 50px;
            scroll-padding-top: 45px;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-x pan-y;
          }
          .rbc-time-header {
            position: sticky;
            top: 0;
            z-index: 105;
            background-color: #1e1e2e;
          }
          .rbc-time-header, .rbc-time-content {
            /* 50px is the gutter width. Container has p-2 (16px total). Leftover space for 3 days is (100vw - 16px - 50px) */
            min-width: calc(50px + (7 * ((100vw - 16px - 50px) / 3))) !important;
          }
          .rbc-time-content {
            overflow-y: visible !important;
          }
          .rbc-header, .rbc-day-slot {
            scroll-snap-align: start;
            min-width: calc((100vw - 16px - 50px) / 3) !important;
            flex-basis: calc((100vw - 16px - 50px) / 3) !important;
          }
          .rbc-time-gutter {
            position: sticky !important;
            left: 0 !important;
            z-index: 100 !important;
            background-color: #181825 !important;
            border-right: 1px solid #313244 !important;
            min-width: 50px !important;
          }
          .rbc-time-gutter .rbc-timeslot-group {
            scroll-snap-align: start;
          }
          .rbc-time-header-gutter {
            position: sticky !important;
            left: 0 !important;
            top: 0 !important;
            z-index: 106 !important;
            background-color: #181825 !important;
            border-right: 1px solid #313244 !important;
            min-width: 50px !important;
          }
        }
      `}</style>
    </div>
  );
}
