'use client';

import { useState, useEffect } from 'react';
import CalendarView from '@/components/CalendarView';
import SummaryView from '@/components/SummaryView';
import { EventType } from '@/types';
import { Calendar, FileText, Loader2, Eye, EyeOff } from 'lucide-react';
import moment from 'moment';

export default function Home() {
  const [view, setView] = useState<'calendar' | 'summary'>('summary');
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(moment.utc().format('YYYY-MM-DD'));
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [showPending, setShowPending] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEventClick = (event: EventType) => {
    // Jump to the day of the event using UTC to ensure absolute consistency
    const dateStr = moment.utc(event.date).format('YYYY-MM-DD');
    setSelectedDate(dateStr);
    setHighlightedEventId(event._id || null);
    setView('summary');
  };

  const handleAddStaff = async (eventId: string, name: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add name');
      }
    } catch (err) {
      console.error('Error adding staff', err);
    }
  };

  const handleRemoveStaff = async (eventId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this show?`)) return;
    
    try {
      const res = await fetch(`/api/events/${eventId}/staff/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove name');
      }
    } catch (err) {
      console.error('Error removing staff', err);
    }
  };

  const clearHighlight = () => {
    setHighlightedEventId(null);
  };

  const filteredEvents = events.filter(e => {
    if (showPending) return true;
    return e.status === 'Confirmed' || e.status === 'Completed';
  });

  if (loading) {
    return (
      <div className="h-screen bg-[#11111b] flex items-center justify-center text-[#cdd6f4]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#cba6f7] animate-spin" />
          <p className="font-bold text-lg animate-pulse">Loading Schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#11111b] flex flex-col text-[#cdd6f4] font-sans" onClick={clearHighlight}>
      {/* Header */}
      <div className="bg-[#181825] border-b border-[#313244] px-4 py-2 sm:px-6 sm:py-4 flex justify-between items-center shadow-lg shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-10 h-10 bg-[#cba6f7] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(203,166,247,0.3)]">
            <Calendar className="w-6 h-6 text-[#11111b]" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-[#cdd6f4]">
            SOARING<span className="text-[#cba6f7]">EAGLES</span> <span className="text-[#6c7086] font-light">VIEWER</span>
          </h1>
        </div>

        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-4">
          <button 
            onClick={() => setShowPending(!showPending)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all border ${showPending ? 'bg-[#cba6f7]/10 border-[#cba6f7] text-[#cba6f7]' : 'bg-[#1e1e2e] border-[#313244] text-[#6c7086]'}`}
          >
            {showPending ? <Eye className="w-3 h-3 sm:w-4 h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 h-4" />}
            <span>{showPending ? 'All' : 'Confirmed'}</span>
          </button>

          <div className="flex bg-[#11111b] rounded-xl p-1 border border-[#313244] shadow-inner">
            <button
              onClick={() => setView('summary')}
              className={`flex items-center justify-center px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${view === 'summary' ? 'bg-[#cba6f7] text-[#11111b] shadow-lg' : 'text-[#a6adc8] hover:text-[#cdd6f4]'}`}
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Summary
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center justify-center px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-300 ${view === 'calendar' ? 'bg-[#cba6f7] text-[#11111b] shadow-lg' : 'text-[#a6adc8] hover:text-[#cdd6f4]'}`}
            >
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-0 sm:p-6 overflow-hidden flex flex-col min-h-0 bg-[#11111b]">
        <div className="flex-1 bg-[#1e1e2e] border-none sm:border border-[#313244] sm:rounded-2xl shadow-2xl overflow-hidden relative">
          {view === 'calendar' ? (
            <CalendarView 
              events={filteredEvents} 
              onEventClick={handleEventClick} 
            />
          ) : (
            <SummaryView 
              events={filteredEvents} 
              selectedDate={selectedDate} 
              setSelectedDate={setSelectedDate} 
              highlightedEventId={highlightedEventId}
              onAddStaff={handleAddStaff}
              onRemoveStaff={handleRemoveStaff}
            />
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-[#11111b] px-6 py-2 border-t border-[#313244] flex justify-between items-center text-[8px] sm:text-[10px] uppercase tracking-widest text-[#6c7086] font-bold shrink-0">
        <div>Team Access</div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Live
        </div>
        <div>v1.2.1</div>
      </div>
    </div>
  );
}
