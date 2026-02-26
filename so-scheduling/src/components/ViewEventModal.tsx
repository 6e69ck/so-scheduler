'use client';

import React, { useState, useEffect } from 'react';
import { EventType } from '@/types';
import { Loader2, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import moment from 'moment';

interface Props {
  event: EventType;
  onClose: () => void;
  onEdit: (e: EventType) => void;
}

export default function ViewEventModal({ event, onClose, onEdit }: Props) {
  const t = useTranslations('Common');
  const [depositHash, setDepositHash] = useState<string | null>(null);
  const [remainingHash, setRemainingHash] = useState<string | null>(null);
  const [loadingType, setLoadingType] = useState<'deposit' | 'remaining' | null>(null);

  useEffect(() => {
    const fetchHashes = async () => {
      try {
        const [dRes, rRes] = await Promise.all([
          fetch(`/api/invoices?eventId=${event._id}&type=deposit`),
          fetch(`/api/invoices?eventId=${event._id}&type=remaining`)
        ]);
        const dData = await dRes.json();
        const rData = await rRes.json();
        setDepositHash(dData.hash);
        setRemainingHash(rData.hash);
      } catch (err) {
        console.error('Failed to fetch invoice hashes', err);
      }
    };
    if (event._id) fetchHashes();
  }, [event._id]);

  const generateInvoice = async (type: 'deposit' | 'remaining', isRegen = false) => {
    if (isRegen) {
      const confirmRegen = confirm(t('confirmRegen', { type }));
      if (!confirmRegen) return;
    }

    setLoadingType(type);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event._id, type })
      });
      const data = await res.json();
      if (data.hash) {
        if (type === 'deposit') setDepositHash(data.hash);
        else setRemainingHash(data.hash);
        window.open(`/inv/${data.hash}`, '_blank');
      }
    } catch (err) {
      console.error('Failed to generate invoice', err);
    } finally {
      setLoadingType(null);
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone;
  };

  return (
    <div className="fixed inset-0 bg-base/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans" onClick={() => onClose()}>
      <div 
        className="bg-mantle border border-surface0 p-6 rounded-xl shadow-2xl w-full max-w-md text-text opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <h3 className="font-bold text-2xl leading-tight text-text">
              {event.companyName || event.clientName}
            </h3>
            <span className="text-xs text-subtext0 mt-1 uppercase tracking-widest font-bold">
              {t('showName')}: {event.show}
            </span>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ml-2 shrink-0
            ${event.status === 'Confirmed' ? 'bg-[#a6e3a1]/20 text-[#a6e3a1]' : 
              event.status === 'Completed' ? 'bg-[#89b4fa]/20 text-[#89b4fa]' : 
              event.status === 'Planning' ? 'bg-[#f9e2af]/20 text-[#f9e2af]' : 
              'bg-surface1 text-text'}
          `}>{t(`statuses.${event.status}`)}</span>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-subtext1">
            <strong className="text-text block mb-0.5">{t('location')}:</strong> 
            {event.location || 'N/A'}
          </p>
          <p className="text-sm text-subtext1">
            <strong className="text-text block mb-0.5">{t('time')}:</strong> 
            {event.startTime} - {event.endTime}
          </p>

          {event.tips !== undefined && event.tips > 0 && (
            <p className="text-sm text-subtext1">
              <strong className="text-text block mb-0.5">{t('tips')}:</strong> 
              ${event.tips.toFixed(2)}
            </p>
          )}
          
          {(event.clientName || event.clientPhone || event.clientEmail) && (
            <div className="text-sm text-subtext1">
              <strong className="text-text block mb-0.5">{t('phone')}:</strong> 
              {event.companyName && <div className="text-subtext0 font-medium mb-0.5">{event.clientName}</div>}
              {event.clientPhone && (
                <div className="text-subtext0">
                  <a href={`tel:${event.clientPhone}`} className="hover:text-accent transition-colors underline decoration-accent/30">{formatPhone(event.clientPhone)}</a>
                </div>
              )}
              {event.clientEmail && (
                <div className="text-subtext0 truncate">
                  <a href={`mailto:${event.clientEmail}`} title={event.clientEmail} className="hover:text-accent transition-colors underline decoration-accent/30">{event.clientEmail}</a>
                </div>
              )}
              {!event.clientPhone && !event.clientEmail && !event.companyName && <div className="text-subtext0 italic">No contact info</div>}
            </div>
          )}

          <p className="text-sm text-subtext1">
            <strong className="text-text block mb-0.5">{t('staffing')}:</strong> 
            {event.staff?.length || 0} / {event.neededPeople || 0}
            {event.staff && event.staff.length > 0 && (
              <span className="block text-xs text-subtext0 mt-1 italic">({event.staff.join(', ')})</span>
            )}
          </p>

          {event.gear && event.gear.length > 0 && (
            <div className="text-sm text-subtext1">
               <strong className="text-text block mb-1">{t('equipment')}:</strong>
               <div className="flex flex-wrap gap-1.5 mt-1">
                 {event.gear.map((g: string, i: number) => <span key={i} className="px-2.5 py-1 bg-surface0 text-text text-xs rounded-md border border-surface1">{g}</span>)}
               </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-5 mt-2 border-t border-surface0">
          <div className="flex bg-surface0 rounded-md border border-surface1 overflow-hidden group h-10">
            {depositHash ? (
              <>
                <a href={`/inv/${depositHash}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-accent text-xs font-bold hover:bg-surface1 transition text-center flex-1 flex items-center justify-center">
                  {t('depositInv')}
                </a>
                <button onClick={() => generateInvoice('deposit', true)} disabled={loadingType !== null} className="px-2.5 py-2 border-l border-surface1 hover:bg-surface1 transition text-subtext0 hover:text-accent flex items-center justify-center">
                  {loadingType === 'deposit' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                </button>
              </>
            ) : (
              <button onClick={() => generateInvoice('deposit')} disabled={loadingType !== null} className="px-3 py-2 text-subtext1 text-xs font-bold hover:bg-surface1 hover:text-text transition text-center flex-1">
                {loadingType === 'deposit' ? <Loader2 className="w-3 h-3 mx-auto animate-spin" /> : t('genDeposit')}
              </button>
            )}
          </div>

          <div className="flex bg-surface0 rounded-md border border-surface1 overflow-hidden group h-10">
            {remainingHash ? (
              <>
                <a href={`/inv/${remainingHash}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-accent text-xs font-bold hover:bg-surface1 transition text-center flex-1 flex items-center justify-center">
                  {t('remInv')}
                </a>
                <button onClick={() => generateInvoice('remaining', true)} disabled={loadingType !== null} className="px-2.5 py-2 border-l border-surface1 hover:bg-surface1 transition text-subtext0 hover:text-accent flex items-center justify-center">
                  {loadingType === 'remaining' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                </button>
              </>
            ) : (
              <button onClick={() => generateInvoice('remaining')} disabled={loadingType !== null} className="px-3 py-2 text-subtext1 text-xs font-bold hover:bg-surface1 hover:text-text transition text-center flex-1">
                {loadingType === 'remaining' ? <Loader2 className="w-3 h-3 mx-auto animate-spin" /> : t('genRemaining')}
              </button>
            )}
          </div>

          <button onClick={() => onClose()} className="h-10 px-4 py-2 bg-surface0 rounded-md text-sm font-bold hover:bg-surface1 border border-surface1 transition hover:text-accent flex items-center justify-center">
            {t('close')}
          </button>
          
          <button onClick={() => onEdit(event)} className="h-10 px-4 py-2 bg-accent text-crust rounded-md text-sm font-bold hover:bg-accent-hover transition shadow-md shadow-accent/10 flex items-center justify-center">
            {t('editDetails')}
          </button>
        </div>
      </div>
    </div>
  );
}
