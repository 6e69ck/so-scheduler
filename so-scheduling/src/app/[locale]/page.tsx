'use client';
import { useState, useEffect } from 'react';
import CalendarView from '@/components/CalendarView';
import LedgerView from '@/components/LedgerView';
import SummaryView from '@/components/SummaryView';
import EventModal from '@/components/EventModal';
import ViewEventModal from '@/components/ViewEventModal';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { EventType, TransactionType } from '@/types';
import { Calendar, LayoutGrid, FileText, Loader2 } from 'lucide-react';
import moment from 'moment';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('Common');
  const [view, setView] = useState<'calendar' | 'spreadsheet' | 'summary'>('calendar');
  const [events, setEvents] = useState<EventType[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [viewingEvent, setViewingEvent] = useState<EventType | null>(null);
  const [initialRange, setInitialRange] = useState<{ start: Date, end: Date } | undefined>();
  
  // Use local date string for selectedDate to match calendar display
  const [selectedDate, setSelectedDate] = useState<string>(moment().format('YYYY-MM-DD'));

  const fetchData = async () => {
    try {
      const auth = localStorage.getItem('soaring_admin_session') || '';
      const [eRes, tRes] = await Promise.all([
        fetch('/api/events', { headers: { 'Authorization': auth } }),
        fetch('/api/transactions', { headers: { 'Authorization': auth } })
      ]);
      if (eRes.ok) setEvents(await eRes.json());
      if (tRes.ok) setTransactions(await tRes.json());
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveEvent = async (event: EventType) => {
    const method = event._id ? 'PUT' : 'POST';
    const url = event._id ? `/api/events/${event._id}` : '/api/events';
    const auth = localStorage.getItem('soaring_admin_session') || '';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': auth
        },
        body: JSON.stringify(event),
      });

      if (res.ok) {
        fetchData();
        setIsModalOpen(false);
        setEditingEvent(null);
        setViewingEvent(null);
      }
    } catch (err) {
      console.error('Failed to save event', err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const auth = localStorage.getItem('soaring_admin_session') || '';
    try {
      const res = await fetch(`/api/events/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': auth }
      });
      if (res.ok) {
        fetchData();
        setIsModalOpen(false);
        setEditingEvent(null);
        setViewingEvent(null);
      }
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  const handleViewEvent = (event: EventType) => {
    // Jump to the day of the event using local format string
    // but DON'T switch the view instantly
    const dateStr = moment(event.date).format('YYYY-MM-DD');
    setSelectedDate(dateStr);
    setViewingEvent(event);
  };

  const handleDeleteTransaction = async (id: string) => {
    const auth = localStorage.getItem('soaring_admin_session') || '';
    try {
      const res = await fetch(`/api/transactions/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': auth }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete transaction', err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-base flex items-center justify-center text-text">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-base flex flex-col text-text font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-mantle border-b border-surface0 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 shadow-lg relative z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
            <Calendar className="w-6 h-6 text-crust" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-text uppercase leading-none">Soaring<span className="text-accent">Eagles</span></h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-subtext0 font-bold mt-1">Admin Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          <div className="flex bg-crust rounded-xl p-1 border border-surface0 shadow-inner">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${view === 'calendar' ? 'bg-accent text-crust shadow-md' : 'text-subtext0 hover:text-text hover:bg-surface0'}`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t('calendar')}
            </button>
            <button
              onClick={() => setView('summary')}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${view === 'summary' ? 'bg-accent text-crust shadow-md' : 'text-subtext0 hover:text-text hover:bg-surface0'}`}
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('summary')}
            </button>
            <button
              onClick={() => setView('spreadsheet')}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${view === 'spreadsheet' ? 'bg-accent text-crust shadow-md' : 'text-subtext0 hover:text-text hover:bg-surface0'}`}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              {t('list')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-0 sm:p-4 md:p-6 overflow-hidden flex flex-col min-h-0 bg-base relative z-10">
        <div className="flex-1 bg-mantle sm:rounded-2xl border-none sm:border border-surface0 shadow-2xl overflow-hidden relative">
          {view === 'calendar' ? (
            <CalendarView 
              events={events} 
              onEditEvent={(e) => { setEditingEvent(e); setIsModalOpen(true); }}
              onViewEvent={handleViewEvent}
              onCreateEvent={(start, end) => {
                setInitialRange(start && end ? { start, end } : undefined);
                setEditingEvent(null);
                setIsModalOpen(true);
              }}
            />
          ) : view === 'summary' ? (
            <SummaryView 
              events={events} 
              transactions={transactions}
              onViewEvent={setViewingEvent}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          ) : (
            <LedgerView 
              events={events} 
              onEditEvent={(e) => { setEditingEvent(e); setIsModalOpen(true); }} 
              onViewEvent={handleViewEvent}
              onSaveEvent={handleSaveEvent}
            />
          )}
        </div>
      </div>

      {viewingEvent && (
        <ViewEventModal 
          event={viewingEvent} 
          transactions={transactions}
          onClose={() => setViewingEvent(null)} 
          onEdit={(e) => { setViewingEvent(null); setEditingEvent(e); setIsModalOpen(true); }} 
          onRefresh={() => fetchData()}
        />
      )}

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
