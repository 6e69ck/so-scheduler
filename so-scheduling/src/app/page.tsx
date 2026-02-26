'use client';
import { useState, useEffect } from 'react';
import CalendarView from '@/components/CalendarView';
import SpreadsheetView from '@/components/SpreadsheetView';
import SummaryView from '@/components/SummaryView';
import EventModal from '@/components/EventModal';
import ViewEventModal from '@/components/ViewEventModal';
import { EventType } from '@/types';
import { Calendar, Table, FileText } from 'lucide-react';

export default function Home() {
  const [view, setView] = useState<'calendar' | 'spreadsheet' | 'summary'>('calendar');
  const [events, setEvents] = useState<EventType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [viewingEvent, setViewingEvent] = useState<EventType | null>(null);
  const [initialRange, setInitialRange] = useState<{ start?: Date, end?: Date }>({});

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSaveEvent = async (event: EventType) => {
    const isEditing = !!event._id;
    const url = isEditing ? `/api/events/${event._id}` : '/api/events';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingEvent(null);
        fetchEvents();
      } else {
        const data = await res.json();
        alert('Error saving event: ' + data.error);
      }
    } catch (err) {
      console.error('Failed to save event', err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const openNewModal = (start?: Date, end?: Date) => {
    setEditingEvent(null);
    setInitialRange({ start, end });
    setIsModalOpen(true);
  };

  return (
    <div className="h-screen bg-base flex flex-col text-text font-sans">
      {/* Primary Top Bar */}
      <div className="bg-mantle border-b border-surface0 px-2 py-2 flex justify-between items-center shadow-sm shrink-0">
        <h1 className="text-xl font-bold text-accent hidden sm:block">SO Scheduling</h1>
        <div className="flex bg-crust rounded-lg p-1 w-full sm:w-auto border border-surface0">
          <button
            onClick={() => setView('calendar')}
            className={`flex-1 sm:flex-none flex items-center justify-center px-3 py-1.5 rounded-md transition-colors ${view === 'calendar' ? 'bg-surface0 shadow text-accent' : 'text-subtext0 hover:text-text hover:bg-surface1/50'}`}
          >
            <Calendar className="w-4 h-4 sm:mr-2 pointer-events-none" />
            <span className="hidden sm:inline">Calendar</span>
          </button>
          <button
            onClick={() => setView('spreadsheet')}
            className={`flex-1 sm:flex-none flex items-center justify-center px-3 py-1.5 rounded-md transition-colors ${view === 'spreadsheet' ? 'bg-surface0 shadow text-accent' : 'text-subtext0 hover:text-text hover:bg-surface1/50'}`}
          >
            <Table className="w-4 h-4 sm:mr-2 pointer-events-none" />
            <span className="hidden sm:inline">Spreadsheet</span>
          </button>
          <button
            onClick={() => setView('summary')}
            className={`flex-1 sm:flex-none flex items-center justify-center px-3 py-1.5 rounded-md transition-colors ${view === 'summary' ? 'bg-surface0 shadow text-accent' : 'text-subtext0 hover:text-text hover:bg-surface1/50'}`}
          >
            <FileText className="w-4 h-4 sm:mr-2 pointer-events-none" />
            <span className="hidden sm:inline">Summary</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-2 overflow-hidden flex flex-col min-h-0">
        {view === 'calendar' ? (
          <CalendarView events={events} onEditEvent={(e) => { setEditingEvent(e); setIsModalOpen(true); }} onCreateEvent={openNewModal} onViewEvent={(e) => setViewingEvent(e)} />
        ) : view === 'spreadsheet' ? (
          <SpreadsheetView events={events} onEditEvent={(e) => { setEditingEvent(e); setIsModalOpen(true); }} onViewEvent={(e) => setViewingEvent(e)} />
        ) : (
          <SummaryView events={events} onViewEvent={(e) => setViewingEvent(e)} />
        )}
      </div>

      {/* View Details Modal */}
      {viewingEvent && (
        <ViewEventModal 
          event={viewingEvent} 
          onClose={() => setViewingEvent(null)} 
          onEdit={(e) => {
            setViewingEvent(null);
            setEditingEvent(e);
            setIsModalOpen(true);
          }}
        />
      )}

      {/* Event Modal */}
      {isModalOpen && (
        <EventModal
          event={editingEvent}
          initialRange={initialRange}
          onClose={() => { setIsModalOpen(false); setEditingEvent(null); }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}
