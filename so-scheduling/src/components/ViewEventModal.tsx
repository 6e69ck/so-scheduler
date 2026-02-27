'use client';

import React, { useState } from 'react';
import { EventType, TransactionType, InvoiceLineItem } from '@/types';
import { X, Calendar as CalendarIcon, MapPin, Phone, Mail, Clock, Package, StickyNote, FileText, ExternalLink, RefreshCw, Plus, Edit2 } from 'lucide-react';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import CustomInvoiceModal from './CustomInvoiceModal';

interface Props {
  event: EventType;
  transactions: TransactionType[];
  onClose: () => void;
  onEdit: (e: EventType) => void;
  onRefresh: () => void;
}

export default function ViewEventModal({ event, transactions, onClose, onEdit, onRefresh }: Props) {
  const t = useTranslations('Common');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const linkedTransactions = transactions.filter(tr => tr.eventId === event._id);
  const totalPaid = linkedTransactions
    .filter(tr => tr.category === 'revenue')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const remaining = (event.totalPrice || 0) - totalPaid;

  const openInvoice = (hash: string) => {
    const url = `/${window.location.pathname.split('/')[1]}/inv/${hash}`;
    window.open(url, '_blank');
  };

  const generateInvoice = async (type: 'deposit' | 'remaining' | 'custom', customLineItems?: InvoiceLineItem[]) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId: event._id, 
          type,
          customLineItems,
          customTotal: customLineItems?.reduce((acc, curr) => acc + curr.amount, 0)
        })
      });
      if (res.ok) {
        const data = await res.json();
        openInvoice(data.hash);
        if (type === 'custom') setShowCustomModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to generate invoice', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-base/90 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-mantle border border-surface0 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-text flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-surface0 flex justify-between items-center bg-mantle shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight">{event.show}</h2>
          </div>
          <button onClick={onClose} className="text-subtext0 hover:text-red-400 transition text-2xl">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-subtext0 tracking-widest">{t('clientName')}</span>
              <p className="font-bold text-sm">{event.clientName || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-subtext0 tracking-widest">{t('companyName')}</span>
              <p className="font-bold text-sm">{event.companyName || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 bg-base/50 p-4 rounded-xl border border-surface0">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-accent" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-subtext0">{t('date')} & {t('time')}</span>
                <span className="text-sm font-medium">{moment.utc(event.date).format('MMMM D, YYYY')} | {event.startTime} - {event.endTime}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-accent" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-subtext0">{t('location')}</span>
                <span className="text-sm font-medium">{event.location || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-crust p-4 rounded-xl border border-surface0">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-black text-subtext0">{t('totalPrice')}</span>
              <span className="text-sm font-black">${event.totalPrice?.toFixed(2)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-black text-subtext0">{t('paidBalance')}</span>
              <span className="text-sm font-black text-green">${totalPaid.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-black text-subtext0 tracking-widest flex items-center gap-2">
              <Package className="w-3 h-3" /> {t('equipment')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {event.gear?.map((g, i) => (
                <span key={i} className="px-2 py-1 bg-surface0 border border-surface1 rounded text-[10px] font-bold">{g}</span>
              )) || <span className="text-[10px] text-surface2 italic">None</span>}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-black text-subtext0 tracking-widest flex items-center gap-2">
              <StickyNote className="w-3 h-3" /> {t('notes')}
            </span>
            <p className="text-xs italic bg-base p-3 rounded-lg border border-surface0">{event.notes || 'No notes'}</p>
          </div>
        </div>

        <div className="p-5 border-t border-surface0 bg-mantle grid grid-cols-3 gap-3 shrink-0">
          <button onClick={() => onEdit(event)} className="col-span-3 py-3 bg-surface0 hover:bg-surface1 border border-surface1 rounded-xl font-black uppercase text-xs tracking-widest transition flex items-center justify-center gap-2">
            <Edit2 className="w-3 h-3" /> {t('editDetails')}
          </button>
          <button onClick={() => generateInvoice('deposit')} className="flex items-center justify-center gap-2 py-3 bg-green/10 text-green border border-green/20 hover:bg-green/20 rounded-xl font-black uppercase text-[10px] tracking-widest transition">
            <FileText className="w-3 h-3" /> {t('depositInv')}
          </button>
          <button onClick={() => generateInvoice('remaining')} className="flex items-center justify-center gap-2 py-3 bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 rounded-xl font-black uppercase text-[10px] tracking-widest transition">
            <FileText className="w-3 h-3" /> {t('remInv')}
          </button>
          <button onClick={() => setShowCustomModal(true)} className="flex items-center justify-center gap-2 py-3 bg-blue/10 text-blue border border-blue/20 hover:bg-blue/20 rounded-xl font-black uppercase text-[10px] tracking-widest transition">
            <Plus className="w-3 h-3" /> Custom
          </button>
        </div>
      </div>

      {showCustomModal && (
        <CustomInvoiceModal 
          event={event} 
          onClose={() => setShowCustomModal(false)} 
          onGenerate={(items) => generateInvoice('custom', items)}
        />
      )}
    </div>
  );
}
