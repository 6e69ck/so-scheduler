'use client';
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import CalendarView from '@/components/CalendarView';
import LedgerView from '@/components/LedgerView';
import SummaryView from '@/components/SummaryView';
import EventModal from '@/components/EventModal';
import ViewEventModal from '@/components/ViewEventModal';
import AdHocInvoiceModal from '@/components/AdHocInvoiceModal';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SettingsView from '@/components/SettingsView';
import { EventType, TransactionType } from '@/types';
import { Calendar, LayoutGrid, FileText, Loader2, Menu as MenuIcon, X as CloseIcon, Settings } from 'lucide-react';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import AuthWrapper from '@/components/AuthWrapper';

function AdminDashboard() {
  const t = useTranslations('Common');
  const [view, setView] = useState<'calendar' | 'spreadsheet' | 'summary' | 'settings'>('calendar');
  const [events, setEvents] = useState<EventType[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdHocModalOpen, setIsAdHocModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [viewingEvent, setViewingEvent] = useState<EventType | null>(null);
  const [initialRange, setInitialRange] = useState<{ start: Date, end: Date } | undefined>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [salesAssociates, setSalesAssociates] = useState<string[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRef = useRef<HTMLDivElement>(null);

  // Use local date string for selectedDate to match calendar display
  const [selectedDate, setSelectedDate] = useState<string>(moment().format('YYYY-MM-DD'));

  const fetchData = async () => {
    try {
      const auth = localStorage.getItem('soaring_admin_session');
      if (!auth) {
        setLoading(false);
        return;
      }

      const [eRes, tRes, sRes] = await Promise.all([
        fetch('/api/events', { headers: { 'Authorization': auth } }),
        fetch('/api/transactions', { headers: { 'Authorization': auth } }),
        fetch('/api/settings', { headers: { 'Authorization': auth } })
      ]);

      if (!eRes.ok || !tRes.ok) {
        if (eRes.status === 401 || tRes.status === 401) {
          localStorage.removeItem('soaring_admin_session');
          window.location.reload();
          return;
        }
        const eData = !eRes.ok ? await eRes.json().catch(() => ({})) : {};
        const tData = !tRes.ok ? await tRes.json().catch(() => ({})) : {};
        alert(`Failed to fetch data: ${eData.error || tData.error || 'Unknown error'}`);
        return;
      }

      setEvents(await eRes.json());
      setTransactions(await tRes.json());
      const sData = await sRes.json();
      setSalesAssociates(sData.salesAssociates || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
      alert('Network error while fetching data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    const activeBtn = navRef.current?.querySelector('[data-active="true"]') as HTMLElement;
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1
      });
    }
  }, [view, loading]);

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

  const handleGenerateAdHoc = async (details: any, items: any[]) => {
    try {
      const auth = localStorage.getItem('soaring_admin_session') || '';
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth
        },
        body: JSON.stringify({
          details,
          customLineItems: items,
          type: 'custom'
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Construct the hash-based public link
        const url = `/${window.location.pathname.split('/')[1]}/inv/${data.hash}`;
        window.open(url, '_blank');
        setIsAdHocModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to generate ad-hoc invoice', err);
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
      <div className="bg-mantle border-b border-surface0 px-4 py-2 sm:px-6 sm:py-4 flex flex-row justify-between items-center gap-2 sm:gap-4 shrink-0 shadow-lg relative z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-crust" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black tracking-tighter text-text uppercase leading-none">Soaring<span className="text-accent">Eagles</span></h1>
            <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-subtext0 font-bold mt-0.5 sm:mt-1 whitespace-nowrap">{t('adminTerminal')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />

          {/* Desktop Navigation */}
          <div ref={navRef} className="hidden sm:flex bg-crust rounded-xl p-1 border border-surface0 shadow-inner relative">
            {/* Sliding Indicator */}
            <div
              className="absolute bg-accent rounded-lg transition-all duration-300 ease-in-out shadow-md"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                top: '4px',
                bottom: '4px',
                opacity: indicatorStyle.opacity,
                zIndex: 0
              }}
            />
            <button
              onClick={() => setView('calendar')}
              data-active={view === 'calendar'}
              className={`relative z-10 flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${view === 'calendar' ? 'text-crust' : 'text-subtext0 hover:text-text hover:bg-surface0/50'}`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t('calendar')}
            </button>
            <button
              onClick={() => setView('summary')}
              data-active={view === 'summary'}
              className={`relative z-10 flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${view === 'summary' ? 'text-crust' : 'text-subtext0 hover:text-text hover:bg-surface0/50'}`}
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('summary')}
            </button>
            <button
              onClick={() => setView('spreadsheet')}
              data-active={view === 'spreadsheet'}
              className={`relative z-10 flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${view === 'spreadsheet' ? 'text-crust' : 'text-subtext0 hover:text-text hover:bg-surface0/50'}`}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              {t('list')}
            </button>
            <button
              onClick={() => setView('settings')}
              data-active={view === 'settings'}
              className={`relative z-10 flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${view === 'settings' ? 'text-crust' : 'text-subtext0 hover:text-text hover:bg-surface0/50'}`}
            >
              <Settings className="w-4 h-4 mr-2" />
              {t('settings')}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-2 bg-crust border border-surface0 rounded-xl text-subtext0 hover:text-accent transition-all duration-200"
          >
            {isMenuOpen ? <CloseIcon className="w-6 h-6 text-red-400" /> : <MenuIcon className="w-6 h-6 text-accent" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-mantle border-b border-surface0 p-4 flex flex-col gap-2 sm:hidden shadow-2xl animate-in slide-in-from-top duration-200">
            <button
              onClick={() => { setView('calendar'); setIsMenuOpen(false); }}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'calendar' ? 'bg-accent text-crust' : 'text-subtext0 bg-crust border border-surface0'}`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              {t('calendar')}
            </button>
            <button
              onClick={() => { setView('summary'); setIsMenuOpen(false); }}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'summary' ? 'bg-accent text-crust' : 'text-subtext0 bg-crust border border-surface0'}`}
            >
              <FileText className="w-5 h-5 mr-3" />
              {t('summary')}
            </button>
            <button
              onClick={() => { setView('spreadsheet'); setIsMenuOpen(false); }}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'spreadsheet' ? 'bg-accent text-crust' : 'text-subtext0 bg-crust border border-surface0'}`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              {t('list')}
            </button>
            <button
              onClick={() => { setView('settings'); setIsMenuOpen(false); }}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${view === 'settings' ? 'bg-accent text-crust' : 'text-subtext0 bg-crust border border-surface0'}`}
            >
              <Settings className="w-5 h-5 mr-3" />
              {t('settings')}
            </button>
          </div>
        )}
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
          ) : view === 'spreadsheet' ? (
            <LedgerView
              events={events}
              onEditEvent={(e) => { setEditingEvent(e); setIsModalOpen(true); }}
              onViewEvent={handleViewEvent}
              onSaveEvent={handleSaveEvent}
              onTriggerAdHoc={() => setIsAdHocModalOpen(true)}
            />
          ) : (
            <SettingsView />
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
          events={events}
          transactions={transactions}
          initialRange={initialRange}
          onClose={() => { setIsModalOpen(false); setEditingEvent(null); }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          salesAssociates={salesAssociates}
        />
      )}

      {isAdHocModalOpen && (
        <AdHocInvoiceModal
          onClose={() => setIsAdHocModalOpen(false)}
          onGenerate={handleGenerateAdHoc}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AuthWrapper>
      <AdminDashboard />
    </AuthWrapper>
  );
}
