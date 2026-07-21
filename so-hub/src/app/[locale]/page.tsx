'use client';

import { useState, useEffect } from 'react';
import MobileShell from '@/components/MobileShell';
import { EventType } from '@/types';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

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
    const interval = setInterval(fetchEvents, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[#11111b] flex items-center justify-center text-[#cdd6f4]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[#cba6f7] animate-spin" />
          <p className="font-bold text-sm text-[#a6adc8] animate-pulse">Loading Soaring Eagles Hub...</p>
        </div>
      </div>
    );
  }

  return <MobileShell initialEvents={events} />;
}
