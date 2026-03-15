'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EventType, TransactionType, TransactionAccount, TransactionIntent } from '@/types';
import { Edit2, Plus, Receipt, Wallet, DollarSign, ChevronDown, ChevronRight, ChevronUp, Image as ImageIcon, Trash2, Calendar as CalendarIcon, Briefcase, ArrowLeftRight, Check, X, MoreVertical, Loader2, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import moment from 'moment';

interface Props {
  events: EventType[];
  onEditEvent: (e: EventType) => void;
  onViewEvent?: (e: EventType) => void;
  onSaveEvent: (e: EventType) => Promise<void>;
  onTriggerAdHoc: () => void;
}

export default function LedgerView({ events, onEditEvent, onViewEvent, onSaveEvent, onTriggerAdHoc }: Props) {
  const t = useTranslations('Common');
  const [standaloneTransactions, setTransactions] = useState<TransactionType[]>([]);
  const [isAddingStandalone, setIsAddingStandalone] = useState<boolean>(false);
  const [addingToEventId, setAddingToEventId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());

  const [activeMenu, setActiveMenu] = useState<{ id: string, type: 'event' | 'transaction', x: number, y: number, data: any } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Form State
  const [amountInput, setAmountInput] = useState('');
  const [type, setType] = useState<'cash' | 'cheque' | 'e-transfer' | 'credit'>('e-transfer');
  const [intent, setIntent] = useState<TransactionIntent>('payment');
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTransactions = async () => {
    const auth = localStorage.getItem('soaring_admin_session') || '';
    try {
      const res = await fetch('/api/transactions', {
        headers: { 'Authorization': auth }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (events.length > 0 && expandedEventIds.size === 0) {
      setExpandedEventIds(new Set(events.map(e => e._id!)));
    }
  }, [events]);

  const evalExpression = (expr: string): number => {
    try {
      const cleanExpr = String(expr).replace(/\$/g, '').replace(/[^\d.+\-*/()]/g, '');
      if (!cleanExpr) return 0;
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${cleanExpr}`)();
      return typeof result === 'number' ? result : 0;
    } catch {
      return 0;
    }
  };

  const handleSaveTransaction = async () => {
    const amount = evalExpression(amountInput);
    if (amount === 0 && amountInput !== '0') return;
    if (!notes.trim()) {
      alert('Description is required');
      return;
    }

    setIsSaving(true);
    const auth = localStorage.getItem('soaring_admin_session') || '';

    // Automated Internal Mapping
    let category: 'revenue' | 'reimbursement' = 'revenue';
    let account: TransactionAccount = 'Bank';

    if (intent === 'payment') { category = 'revenue'; account = 'Bank'; }
    else if (intent === 'tip') { category = 'revenue'; account = 'Tips'; }
    else if (intent === 'fee') { category = 'reimbursement'; account = 'Fees'; }
    else if (intent === 'reimbursement') { category = 'reimbursement'; account = 'Member Reimbursements'; }

    const payload = {
      amount,
      type,
      category,
      account,
      intent,
      date: moment.utc(date).toDate(),
      notes,
      receiptUrl,
      eventId: addingToEventId || (editingTransactionId ? standaloneTransactions.find(tr => tr._id === editingTransactionId)?.eventId : null)
    };

    try {
      const url = editingTransactionId ? `/api/transactions/${editingTransactionId}` : '/api/transactions';
      const method = editingTransactionId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (addingToEventId) setExpandedEventIds(prev => new Set(prev).add(addingToEventId));
        await fetchTransactions();
        resetForm();
      }
    } catch (err) {
      console.error('Failed to save transaction', err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const auth = localStorage.getItem('soaring_admin_session') || '';
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': auth }
      });
      if (res.ok) fetchTransactions();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const startEditTransaction = (tr: TransactionType) => {
    setEditingTransactionId(tr._id!);
    setAmountInput(tr.amount.toString());
    setType(tr.type);
    setIntent(tr.intent || 'payment');
    setDate(moment.utc(tr.date).format('YYYY-MM-DD'));
    setNotes(tr.notes || '');
    setReceiptUrl(tr.receiptUrl || '');
    setAddingToEventId(null);
    setIsAddingStandalone(false);
    setActiveMenu(null);
  };

  const resetForm = () => {
    setAmountInput('');
    setNotes('');
    setReceiptUrl('');
    setIsAddingStandalone(false);
    setAddingToEventId(null);
    setEditingTransactionId(null);
    setIntent('payment');
    setIsSaving(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedEventIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedEventIds(newSet);
  };

  const formatAmount = (amount: number, prefix: '+' | '-') => {
    const absVal = Math.abs(amount).toFixed(2);
    const sign = amount >= 0 ? prefix : (prefix === '+' ? '-' : '+');
    return `${sign}$${absVal}`;
  };

  const handleTouchStart = (e: React.TouchEvent, id: string, type: 'event' | 'transaction', data: any) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    longPressTimer.current = setTimeout(() => {
      setActiveMenu({ id, type, x, y, data });
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const eventNodes = events.map(e => {
    // For linked children, show parent's transactions (since all transactions are redirected to parent)
    const effectiveId = e.linkedId || e._id;
    const children = standaloneTransactions.filter(tr => tr.eventId === effectiveId);
    return {
      id: e._id!,
      date: moment.utc(e.date).format('YYYY-MM-DD'),
      title: e.show,
      subtitle: e.companyName || e.clientName,
      revenue: children.filter(tr => tr.category === 'revenue').reduce((acc, curr) => acc + curr.amount, 0),
      expense: children.filter(tr => tr.category === 'reimbursement').reduce((acc, curr) => acc + curr.amount, 0),
      source: 'event' as const,
      data: e,
      children: children.sort((a, b) => moment(b.date).diff(moment(a.date))),
      linkedId: e.linkedId || null,
    };
  });

  const standaloneNodes = standaloneTransactions
    .filter(tr => !tr.eventId)
    .map(tr => ({
      id: tr._id!,
      date: moment.utc(tr.date).format('YYYY-MM-DD'),
      title: tr.notes || t(`intents.${tr.intent || 'payment'}`),
      subtitle: tr.account || 'General',
      revenue: tr.category === 'revenue' ? tr.amount : 0,
      expense: tr.category === 'reimbursement' ? tr.amount : 0,
      source: 'transaction' as const,
      data: tr,
      children: []
    }));

  const allNodes = [...eventNodes, ...standaloneNodes].sort((a, b) => b.date.localeCompare(a.date));

  const intentOptions: TransactionIntent[] = ['payment', 'tip', 'fee', 'reimbursement'];

  return (
    <div className="bg-base rounded-lg shadow-sm border border-surface0 overflow-hidden h-full w-full text-text flex flex-col font-sans relative" onClick={() => setActiveMenu(null)}>
      <div className="px-4 py-2 border-b border-surface0 bg-mantle flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-accent" />
          <h2 className="font-bold text-sm uppercase tracking-widest">{t('ledger')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerAdHoc}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface0 text-text border border-surface1 rounded-lg text-[10px] font-black hover:bg-surface1 transition uppercase tracking-widest"
          >
            <FileText className="w-3 h-3" /> Custom Invoice
          </button>
          <button
            onClick={() => { resetForm(); setIsAddingStandalone(true); setIntent('reimbursement'); setDate(moment().format('YYYY-MM-DD')); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent text-crust rounded-lg text-[10px] font-black hover:bg-accent-hover transition uppercase tracking-widest"
          >
            <Plus className="w-3 h-3" /> Entry
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar overflow-x-hidden">
        {(isAddingStandalone || addingToEventId || editingTransactionId) && (
          <div className="p-3 bg-mantle border-b border-surface0 animate-in fade-in slide-in-from-top-1 duration-200 sticky top-0 z-30 shadow-lg">
            <div className="max-w-5xl mx-auto bg-base border border-accent/20 p-3 rounded-xl shadow-2xl space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-[10px] text-accent flex items-center gap-1.5">
                  {editingTransactionId ? <Edit2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {editingTransactionId ? 'Amend' : (addingToEventId ? `Add to Event` : 'General')}
                </h3>
                <div
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm transition-all duration-300"
                  style={{
                    backgroundColor: (['payment', 'tip'].includes(intent)) ? 'rgba(166, 227, 161, 0.1)' : 'rgba(243, 139, 168, 0.1)',
                    color: (['payment', 'tip'].includes(intent)) ? '#a6e3a1' : '#f38ba8',
                    borderColor: (['payment', 'tip'].includes(intent)) ? 'rgba(166, 227, 161, 0.3)' : 'rgba(243, 139, 168, 0.3)',
                  }}
                >
                  {(['payment', 'tip'].includes(intent)) ? 'Revenue Entry' : 'Expense Entry'}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                <div className="col-span-1">
                  <label className="block text-[8px] font-black uppercase text-subtext0 mb-0.5 ml-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-subtext0 font-bold text-xs">$</span>
                    <input
                      disabled={isSaving}
                      autoFocus
                      type="text"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      onBlur={() => {
                        const num = evalExpression(amountInput);
                        // If result is 0 and input wasn't literally '0' or expressions like '0+0', clear it.
                        // This removes generic text like "abc".
                        if (num === 0 && !/^0([+\-*/()]0)*$/.test(amountInput.replace(/\s/g, ''))) {
                          setAmountInput('');
                        } else {
                          setAmountInput(num.toString());
                        }
                      }}
                      className="w-full bg-mantle border border-surface1 rounded-lg py-1.5 px-2 pl-5 text-xs font-bold text-text focus:ring-1 focus:ring-accent outline-none disabled:opacity-50"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="block text-[8px] font-black uppercase text-subtext0 mb-0.5 ml-1">Type</label>
                  <select disabled={isSaving} value={intent} onChange={(e) => setIntent(e.target.value as any)} className="w-full bg-mantle border border-surface1 rounded-lg py-1.5 px-2 text-[10px] font-bold text-text focus:ring-1 focus:ring-accent outline-none disabled:opacity-50">
                    {intentOptions.map(opt => <option key={opt} value={opt}>{t(`intents.${opt}`)}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[8px] font-black uppercase text-subtext0 mb-0.5 ml-1">Method</label>
                  <select disabled={isSaving} value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-mantle border border-surface1 rounded-lg py-1.5 px-2 text-[10px] font-bold text-text focus:ring-1 focus:ring-accent outline-none disabled:opacity-50">
                    <option value="e-transfer">{t('eTransfer')}</option>
                    <option value="cash">{t('cash')}</option>
                    <option value="cheque">{t('cheque')}</option>
                    <option value="credit">{t('credit')}</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[8px] font-black uppercase text-subtext0 mb-0.5 ml-1">Date</label>
                  <input disabled={isSaving} type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-mantle border border-surface1 rounded-lg py-1 px-2 text-[10px] font-bold text-text focus:ring-1 focus:ring-accent outline-none [color-scheme:dark] disabled:opacity-50" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[8px] font-black uppercase text-subtext0 mb-0.5 ml-1">Description <span className="text-red-500">*</span></label>
                  <input required disabled={isSaving} type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={`w-full bg-mantle border rounded-lg py-1.5 px-2 text-[10px] font-medium text-text focus:ring-1 outline-none disabled:opacity-50 ${!notes.trim() ? 'border-red-500/50 focus:ring-red-500' : 'border-surface1 focus:ring-accent'}`} placeholder="Required..." />
                </div>
                <div className="col-span-1">
                  <label className="block text-[8px] font-black uppercase text-subtext0 mb-0.5 ml-1">Receipt</label>
                  <label className={`flex items-center justify-center gap-2 w-full h-[29px] bg-mantle border border-dashed border-surface1 rounded-lg cursor-pointer hover:bg-surface0 transition overflow-hidden ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {receiptUrl ? <img src={receiptUrl} alt="Receipt" className="w-full h-full object-cover" /> : <ImageIcon className="w-3 h-3 text-subtext0" />}
                    <input disabled={isSaving} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button disabled={isSaving} onClick={resetForm} className="px-3 py-1.5 bg-surface0 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-surface1 disabled:opacity-50">Cancel</button>
                <button disabled={isSaving || !notes.trim()} onClick={handleSaveTransaction} className="px-4 py-1.5 bg-accent text-crust rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-accent-hover transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSaving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</> : (editingTransactionId ? <><Check className="w-3 h-3" /> Update</> : 'Save')}
                </button>
              </div>
            </div>
          </div>
        )}

        <table className="min-w-full text-left text-xs border-collapse table-fixed">
          <thead className="uppercase tracking-wider bg-crust text-subtext0 font-black sticky top-0 z-10 border-b border-surface0">
            <tr>
              <th className="w-6 sm:w-8 px-1 py-3"></th>
              <th className="w-20 sm:w-24 px-1 py-3">Date</th>
              <th className="px-2 py-3">Description</th>
              <th className="w-20 sm:w-24 px-2 py-3 text-right">Revenue (+)</th>
              <th className="w-20 sm:w-24 px-2 py-3 text-right">Expense (-)</th>
              <th className="w-20 sm:w-24 px-2 py-3 text-right">Gross</th>
              <th className="hidden sm:table-cell w-24 px-4 py-3 text-center">Method</th>
              <th className="hidden sm:table-cell w-20 px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface0">
            {allNodes.map((node) => {
              const isExpanded = expandedEventIds.has(node.id);
              const gross = node.revenue - node.expense;
              return (
                <React.Fragment key={node.id}>
                  {/* Parent Row */}
                  <tr
                    className={`hover:bg-surface0/30 transition-colors group ${node.source === 'event' ? 'font-bold bg-mantle/30 border-l-2 border-accent/20' : 'border-l-2 border-transparent'}`}
                    onTouchStart={(e) => handleTouchStart(e, node.id, node.source, node.data)}
                    onTouchEnd={handleTouchEnd}
                    onContextMenu={(e) => { e.preventDefault(); setActiveMenu({ id: node.id, type: node.source, x: e.clientX, y: e.clientY, data: node.data }); }}
                  >
                    <td className="px-1 py-3 text-center">
                      {node.source === 'event' && (
                        <button onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }} className="p-0.5 hover:bg-surface1 rounded text-subtext0">
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      )}
                    </td>
                    <td className="px-1 py-3 font-mono text-[10px] text-subtext1 whitespace-nowrap">{node.date}</td>
                    <td className="px-2 py-3 truncate">
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{node.title}</span>
                        <span className="text-[8px] text-subtext0 font-normal uppercase tracking-tighter truncate">{node.subtitle}</span>
                      </div>
                    </td>
                    <td className={`px-2 py-3 text-right font-bold text-[10px] sm:text-xs ${node.revenue > 0 ? 'text-green bg-green/5' : 'text-subtext0 opacity-30'}`}>
                      {node.revenue !== 0 ? formatAmount(node.revenue, '+') : '-'}
                    </td>
                    <td className={`px-2 py-3 text-right font-bold text-[10px] sm:text-xs ${node.expense > 0 ? 'text-red bg-red/5' : 'text-subtext0 opacity-30'}`}>
                      {node.expense !== 0 ? formatAmount(node.expense, '-') : '-'}
                    </td>
                    <td className={`px-2 py-3 text-right font-bold text-[10px] sm:text-xs ${gross > 0 ? 'text-blue' : (gross < 0 ? 'text-mauve' : 'text-subtext0 opacity-30')}`}>
                      {gross > 0 ? `$${gross.toFixed(2)}` : (gross < 0 ? `-$${Math.abs(gross).toFixed(2)}` : '-')}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-center">
                      {node.source === 'event' ? <span className="text-[8px] text-overlay0 font-bold uppercase tracking-widest border border-overlay0/20 px-1 rounded">SHOW</span> : (
                        <span className="text-[8px] uppercase font-bold text-subtext0 border border-surface1 px-1 rounded">
                          {t((node.data as TransactionType).type === 'e-transfer' ? 'eTransfer' : (node.data as TransactionType).type)}
                        </span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {node.source === 'event' ? (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); resetForm(); setAddingToEventId(node.id); setIntent('payment'); setDate(node.date); }} className="p-1.5 hover:bg-green/10 text-green rounded transition" title="Add Payment"><Plus className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); onEditEvent(node.data as EventType); }} className="p-1.5 hover:bg-accent/10 text-accent rounded transition"><Edit2 className="w-3.5 h-3.5" /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); startEditTransaction(node.data as TransactionType); }} className="p-1.5 hover:bg-accent/10 text-accent rounded transition"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteTransaction(node.id); }} className="p-1.5 hover:bg-red/10 text-red rounded transition opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && node.children.map((child) => (
                    <tr
                      key={child._id}
                      className="bg-crust/40 border-l-2 border-accent/10 hover:bg-surface0/20 transition-colors group/child"
                      onTouchStart={(e) => handleTouchStart(e, child._id!, 'transaction', child)}
                      onTouchEnd={handleTouchEnd}
                      onContextMenu={(e) => { e.preventDefault(); setActiveMenu({ id: child._id!, type: 'transaction', x: e.clientX, y: e.clientY, data: child }); }}
                    >
                      <td className="px-1 py-3 text-center relative">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent/10 -translate-x-1/2" />
                      </td>
                      <td className="px-1 py-2 font-mono text-subtext0 text-[9px] pl-2 whitespace-nowrap">{moment.utc(child.date).format('MM-DD')}</td>
                      <td className="px-2 py-2 truncate">
                        <div className="flex flex-col min-w-0">
                          <span className="text-subtext1 italic text-[9px] truncate block">
                            {child.notes || t(`intents.${child.intent || 'payment'}`)}
                          </span>
                          <span className="text-[7px] uppercase font-black tracking-widest text-subtext0 opacity-50">{t(`accounts.${child.account || 'Bank'}`)}</span>
                        </div>
                      </td>
                      <td className={`px-2 py-2 text-right text-[9px] font-bold ${child.category === 'revenue' ? (child.amount >= 0 ? 'text-green/70' : 'text-red/70') : 'text-subtext0 opacity-10'}`}>
                        {child.category === 'revenue' ? formatAmount(child.amount, '+') : '-'}
                      </td>
                      <td className={`px-2 py-2 text-right text-[9px] font-bold ${child.category === 'reimbursement' ? (child.amount >= 0 ? 'text-red/70' : 'text-green/70') : 'text-subtext0 opacity-10'}`}>
                        {child.category === 'reimbursement' ? formatAmount(child.amount, '-') : '-'}
                      </td>
                      <td className="px-2 py-2 text-right"></td>
                      <td className="hidden sm:table-cell px-4 py-2 text-center">
                        <span className="text-[8px] uppercase font-bold text-subtext0 border border-surface1 px-1 rounded">{t(child.type === 'e-transfer' ? 'eTransfer' : child.type)}</span>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEditTransaction(child)} className="p-1 text-subtext0 hover:text-accent transition opacity-0 group-hover/child:opacity-100"><Edit2 className="w-3 h-3" /></button>
                          {child.receiptUrl && <button onClick={() => window.open(child.receiptUrl, '_blank')} className="p-1 text-subtext0 hover:text-accent transition"><ImageIcon className="w-3 h-3" /></button>}
                          <button onClick={() => deleteTransaction(child._id!)} className="p-1 text-subtext0 hover:text-red transition opacity-0 group-hover/child:opacity-100"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeMenu && (
        <div
          className="fixed z-[200] bg-mantle border border-surface1 rounded-lg shadow-2xl p-1 animate-in zoom-in duration-100 min-w-[120px]"
          style={{ top: Math.min(activeMenu.y, window.innerHeight - 100), left: Math.min(activeMenu.x, window.innerWidth - 130) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-0.5">
            {activeMenu.type === 'event' ? (
              <>
                <button onClick={() => { resetForm(); setAddingToEventId(activeMenu.id); setIntent('payment'); setDate(moment.utc(activeMenu.data.date).format('YYYY-MM-DD')); setActiveMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-surface0 rounded-md text-[10px] font-bold text-green">
                  <Plus className="w-3 h-3" /> Add Payment
                </button>
                <button onClick={() => { onEditEvent(activeMenu.data); setActiveMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-surface0 rounded-md text-[10px] font-bold text-accent">
                  <Edit2 className="w-3 h-3" /> Edit Show
                </button>
              </>
            ) : (
              <>
                <button onClick={() => startEditTransaction(activeMenu.data)} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-surface0 rounded-md text-[10px] font-bold text-accent">
                  <Edit2 className="w-3 h-3" /> Amend
                </button>
                <button onClick={() => { deleteTransaction(activeMenu.id); setActiveMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-surface0 rounded-md text-[10px] font-bold text-red">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
