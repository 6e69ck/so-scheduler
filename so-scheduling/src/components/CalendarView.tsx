import React, { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { EventType } from '@/types';
import { Plus, Printer, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

const localizer = momentLocalizer(moment);

interface Props {
  events: EventType[];
  onEditEvent: (e: EventType) => void;
  onCreateEvent: (start?: Date, end?: Date) => void;
  onViewEvent: (e: EventType) => void;
}

export default function CalendarView({ events, onEditEvent, onCreateEvent, onViewEvent }: Props) {
  const [viewType, setViewType] = useState<View>(Views.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date, end: Date } | null>(null);
  
  // Format events for react-big-calendar
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

  const handleEventClick = (event: any, e: React.SyntheticEvent) => {
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

  const changeView = (v: any) => {
    setViewType(v);
  };

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
    if (event.id === 'temp-selection') {
      return {
        className: 'temp-selection-event',
        style: {
          backgroundColor: '#cba6f7', // Solid Catppuccin Mauve
          color: '#11111b',
          pointerEvents: 'none' as 'none',
          borderRadius: '6px',
          opacity: 0.9,
          display: 'block'
        }
      };
    }

    let backgroundColor = '#f38ba8'; // Catppuccin Mocha Red
    let color = '#11111b';

    return {
      style: {
        backgroundColor,
        color,
        border: '0px',
        borderRadius: '6px',
        opacity: 0.9,
        display: 'block'
      }
    };
  };

  return (
    <div className="flex flex-col h-full relative w-full text-text">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-2 bg-mantle p-2 rounded-lg shadow-sm border border-surface0 shrink-0">
        <button 
          id="new-event-btn"
          onClick={() => {
            onCreateEvent(selectedRange?.start, selectedRange?.end);
            setSelectedRange(null);
          }} 
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md flex items-center transition font-medium text-crust
            ${selectedRange ? 'bg-accent hover:bg-accent-hover animate-pulse-fast ring-2 ring-accent ring-offset-2 ring-offset-mantle shadow-[0_0_15px_rgba(203,166,247,0.5)]' : 'bg-accent hover:bg-accent-hover'}
          `}
        >
          <Plus className="w-4 h-4 sm:mr-2 pointer-events-none" /> 
          <span className="hidden sm:inline">New Event</span>
        </button>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {viewType === Views.DAY && (
            <div className="text-subtext1 font-bold text-xs sm:text-sm text-center shrink-0 mr-1 sm:mr-2">
              {moment(currentDate).format('MMM D, YYYY')}
            </div>
          )}

          <div className="flex bg-crust rounded-md p-1 border border-surface0">
            <button onClick={prevDate} className="p-1 rounded text-subtext0 hover:text-text hover:bg-surface0 transition"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"/></button>
            <button onClick={nextDate} className="p-1 rounded text-subtext0 hover:text-text hover:bg-surface0 transition"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"/></button>
          </div>
          
          {viewType === Views.MONTH && (
            <div className="text-subtext1 font-bold text-xs sm:text-sm text-center w-24 sm:w-32 shrink-0 ml-1 sm:ml-2">
              {moment(currentDate).format('MMMM YYYY')}
            </div>
          )}

          <div className="flex bg-crust rounded-md p-1 border border-surface0">
            <button onClick={() => changeView(Views.DAY)} className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-bold transition-colors ${viewType === Views.DAY ? 'bg-surface0 text-accent shadow-sm' : 'text-subtext0 hover:text-text hover:bg-surface0/50'}`}><span className="hidden sm:inline">Day</span><span className="sm:hidden">D</span></button>
            <button onClick={() => changeView(Views.WEEK)} className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-bold transition-colors ${viewType === Views.WEEK ? 'bg-surface0 text-accent shadow-sm' : 'text-subtext0 hover:text-text hover:bg-surface0/50'}`}><span className="hidden sm:inline">Week</span><span className="sm:hidden">W</span></button>
            <button onClick={() => changeView(Views.MONTH)} className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-bold transition-colors ${viewType === Views.MONTH ? 'bg-surface0 text-accent shadow-sm' : 'text-subtext0 hover:text-text hover:bg-surface0/50'}`}><span className="hidden sm:inline">Month</span><span className="sm:hidden">M</span></button>
          </div>
        </div>

        <button onClick={() => window.print()} className="hidden md:flex bg-surface0 text-text px-3 py-1.5 rounded-md items-center hover:bg-surface1 transition font-medium border border-surface1 hover:text-accent">
          <Printer className="w-4 h-4 mr-2 pointer-events-none" /> <span>Print</span>
        </button>
      </div>

      <div className="flex-1 bg-mantle rounded-lg shadow-sm border border-surface0 overflow-hidden relative calendar-container p-1 custom-rbc-container">
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
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleEventClick}
          onDrillDown={() => {}} // Disable drilling down to prevent click interference
          onSelecting={(range) => {
            if (selectedRange) setSelectedRange(null);
            return true;
          }}
          eventPropGetter={eventStyleGetter}
          toolbar={false}
          dayLayoutAlgorithm="no-overlap"
          formats={{
            dayFormat: (date, culture, loc) => localizer.format(date, 'ddd (YYYY/MM/DD)', culture)
          }}
          components={{
            event: (props) => {
              return (
                <div 
                  className="w-full h-full p-1 text-xs overflow-hidden flex flex-col lg:flex-row lg:items-start lg:gap-2 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (props.event.id === 'temp-selection') return;
                    setHoverInfo(null);
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    setTimeout(() => onViewEvent(props.event.resource), 0);
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
                  <strong className="block truncate shrink-0 pointer-events-none">{props.title}</strong>
                  {props.event.resource.location && (
                    <div className="truncate opacity-80 flex items-center gap-1 min-w-0 lg:flex-1 pointer-events-none">
                      <MapPin className="w-3 h-3 shrink-0 hidden lg:block pointer-events-none" />
                      <span className="truncate pointer-events-none">{props.event.resource.location}</span>
                    </div>
                  )}
                </div>
              );
            }
          }}
        />
      </div>

      {hoverInfo && (
        <div
          className="fixed z-[60] bg-crust text-text text-sm p-3 rounded-lg shadow-xl pointer-events-none max-w-xs border border-surface0"
          style={{ top: hoverInfo.y + 15, left: hoverInfo.x + 15 }}
        >
          <p className="font-bold text-base mb-1 text-text">{hoverInfo.event.show}</p>
          {hoverInfo.event.location && <p className="text-subtext1 truncate">📍 {hoverInfo.event.location}</p>}
          <p className="text-subtext1">⏱️ {hoverInfo.event.startTime} - {hoverInfo.event.endTime}</p>
          {(hoverInfo.event.clientPhone || hoverInfo.event.clientEmail) && (
            <p className="text-subtext0 mt-1 pt-1 border-t border-surface0">👤 {hoverInfo.event.clientPhone} {hoverInfo.event.clientEmail}</p>
          )}
        </div>
      )}
    </div>
  );
}
