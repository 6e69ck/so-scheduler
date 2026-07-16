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
      setExpandedEventIds(new Set(events.map(e => e.linkedId || e._id!)));
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



  // Group events by linked relationship
  const eventGroups = new Map<string, EventType[]>();
  events.forEach(e => {
    const groupId = e.linkedId || e._id!;
    if (!eventGroups.has(groupId)) eventGroups.set(groupId, []);
    eventGroups.get(groupId)!.push(e);
  });

  const eventNodes = Array.from(eventGroups.entries()).map(([groupId, groupEvents]) => {
    // Sort by date to get the earliest one for the main row display
    const sortedGroup = [...groupEvents].sort((a, b) => moment(a.date).diff(moment(b.date)));
    const parentEvent = sortedGroup.find(e => !e.linkedId) || sortedGroup[0];
    
    // Combine names
    const combinedNames = sortedGroup.map(e => e.show).join(', ');
    
    // Transactions are attached to the groupId (the parent _id)
    const children = standaloneTransactions.filter(tr => tr.eventId === groupId);
    
    return {
      id: groupId, // Use groupId for row uniqueness and transaction association
      date: moment.utc(parentEvent.date).format('YYYY-MM-DD'),
      title: combinedNames,
      subtitle: parentEvent.companyName || parentEvent.clientName,
      revenue: children.filter(tr => tr.category === 'revenue').reduce((acc, curr) => acc + curr.amount, 0),
      expense: children.filter(tr => tr.category === 'reimbursement').reduce((acc, curr) => acc + curr.amount, 0),
      source: 'event' as const,
      data: parentEvent, // Use parent for edit/view actions
      children: children.sort((a, b) => moment(b.date).diff(moment(a.date))),
      linkedId: parentEvent.linkedId || null,
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
    <div className="bg-base rounded-lg shadow-sm border border-surface0 overflow-hidden h-full w-full text-text flex flex-col font-sans relative">
      <div className="px-4 py-2 border-b border-surface0 bg-mantle flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-accent" />
          <h2 className="font-bold text-sm uppercase tracking-widest">{t('transactions')}</h2>
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
          <tbody className="divide-y divide-surface1">
            {allNodes.map((node) => {
              const isExpanded = expandedEventIds.has(node.id);
              const gross = node.revenue - node.expense;
              return (
                <React.Fragment key={node.id}>
                  {/* Parent Row */}
                  <tr
                    className={`hover:bg-surface0/30 transition-colors group cursor-pointer ${node.source === 'event' ? 'font-bold bg-mantle/30 border-l-2 border-accent/20' : 'border-l-2 border-transparent'}`}
                    onClick={() => {
                      if (node.source === 'event') {
                        resetForm();
                        setAddingToEventId(node.id);
                        setIntent('payment');
                        setDate(node.date);
                      } else {
                        startEditTransaction(node.data as TransactionType);
                      }
                    }}
                  >
                    <td className="px-1 py-3 text-center border-b border-surface1">
                      {node.source === 'event' && (
                        <button onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }} className="p-0.5 hover:bg-surface1 rounded text-subtext0">
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      )}
                    </td>
                    <td className="px-1 py-3 font-mono text-[10px] text-subtext1 whitespace-nowrap border-b border-surface1">{node.date}</td>
                    <td className="px-2 py-3 truncate border-b border-surface1">
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{node.title}</span>
                        <span className="text-[8px] text-subtext0 font-normal uppercase tracking-tighter truncate">{node.subtitle}</span>
                      </div>
                    </td>
                    <td className={`px-2 py-3 text-right font-bold text-[10px] sm:text-xs border-b border-surface1 ${node.revenue > 0 ? 'text-green bg-green/5' : 'text-subtext0 opacity-30'}`}>
                      {node.revenue !== 0 ? formatAmount(node.revenue, '+') : '-'}
                    </td>
                    <td className={`px-2 py-3 text-right font-bold text-[10px] sm:text-xs border-b border-surface1 ${node.expense > 0 ? 'text-red bg-red/5' : 'text-subtext0 opacity-30'}`}>
                      {node.expense !== 0 ? formatAmount(node.expense, '-') : '-'}
                    </td>
                    <td className={`px-2 py-3 text-right font-bold text-[10px] sm:text-xs border-b border-surface1 ${gross > 0 ? 'text-blue' : (gross < 0 ? 'text-mauve' : 'text-subtext0 opacity-30')}`}>
                      {gross > 0 ? `$${gross.toFixed(2)}` : (gross < 0 ? `-$${Math.abs(gross).toFixed(2)}` : '-')}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-center border-b border-surface1">
                      {node.source === 'event' ? <span className="text-[8px] text-overlay0 font-bold uppercase tracking-widest border border-overlay0/20 px-1 rounded">SHOW</span> : (
                        <span className="text-[8px] uppercase font-bold text-subtext0 border border-surface1 px-1 rounded">
                          {t((node.data as TransactionType).type === 'e-transfer' ? 'eTransfer' : (node.data as TransactionType).type)}
                        </span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-center border-b border-surface1">
                      <div className="flex items-center justify-center gap-0.5">
                        {node.source === 'event' ? (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); onEditEvent(node.data as EventType); }} className="p-1.5 hover:bg-accent/10 text-accent rounded transition" title="Edit Show"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); resetForm(); setAddingToEventId(node.id); setIntent('payment'); setDate(node.date); }} className="p-1.5 hover:bg-green/10 text-green rounded transition" title="Add Payment"><Plus className="w-3.5 h-3.5" /></button>
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
                      className="bg-crust/40 border-l-2 border-accent/10 hover:bg-surface0/20 transition-colors group/child cursor-pointer"
                      onClick={() => startEditTransaction(child)}
                    >
                      <td className="px-1 py-3 text-center relative border-b border-surface1/30">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent/10 -translate-x-1/2" />
                      </td>
                      <td className="px-1 py-2 font-mono text-subtext0 text-[9px] pl-2 whitespace-nowrap border-b border-surface1/30">{moment.utc(child.date).format('MM-DD')}</td>
                      <td className="px-2 py-2 truncate border-b border-surface1/30">
                        <div className="flex flex-col min-w-0">
                          <span className="text-subtext1 italic text-[9px] truncate block">
                            {child.notes || t(`intents.${child.intent || 'payment'}`)}
                          </span>
                          <span className="text-[7px] uppercase font-black tracking-widest text-subtext0 opacity-50">{t(`accounts.${child.account || 'Bank'}`)}</span>
                        </div>
                      </td>
                      <td className={`px-2 py-2 text-right text-[9px] font-bold border-b border-surface1/30 ${child.category === 'revenue' ? (child.amount >= 0 ? 'text-green/70' : 'text-red/70') : 'text-subtext0 opacity-10'}`}>
                        {child.category === 'revenue' ? formatAmount(child.amount, '+') : '-'}
                      </td>
                      <td className={`px-2 py-2 text-right text-[9px] font-bold border-b border-surface1/30 ${child.category === 'reimbursement' ? (child.amount >= 0 ? 'text-red/70' : 'text-green/70') : 'text-subtext0 opacity-10'}`}>
                        {child.category === 'reimbursement' ? formatAmount(child.amount, '-') : '-'}
                      </td>
                      <td className="px-2 py-2 text-right border-b border-surface1/30"></td>
                      <td className="hidden sm:table-cell px-4 py-2 text-center border-b border-surface1/30">
                        <span className="text-[8px] uppercase font-bold text-subtext0 border border-surface1 px-1 rounded">{t(child.type === 'e-transfer' ? 'eTransfer' : child.type)}</span>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-2 text-center border-b border-surface1/30">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEditTransaction(child)} className="p-1 text-subtext0 hover:text-accent transition" title="Edit Transaction"><Edit2 className="w-3.5 h-3.5" /></button>
                          {child.receiptUrl ? (
                            <button onClick={() => window.open(child.receiptUrl, '_blank')} className="p-1 text-subtext0 hover:text-accent transition" title="View Receipt"><ImageIcon className="w-3.5 h-3.5" /></button>
                          ) : (
                            <div className="w-[22px]" />
                          )}
                          <button onClick={() => deleteTransaction(child._id!)} className="p-1 text-subtext0 hover:text-red transition opacity-0 group-hover/child:opacity-100" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* Transaction Modal */}
      {(isAddingStandalone || addingToEventId || editingTransactionId) && (
        <div className="fixed inset-0 bg-base/90 flex items-center justify-center z-[150] p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-mantle border border-surface0 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-text flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-surface0 flex justify-between items-center bg-mantle shrink-0">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-accent flex items-center gap-1.5">
                  {editingTransactionId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}
                </h2>
                {addingToEventId && (
                  <p className="text-[10px] text-subtext0 font-semibold mt-1">
                    For Show: <span className="text-text">{events.find(e => e.linkedId === addingToEventId || e._id === addingToEventId)?.show || 'Selected Event'}</span>
                  </p>
                )}
                {!addingToEventId && !editingTransactionId && (
                  <p className="text-[10px] text-subtext0 font-semibold mt-1">General Transaction</p>
                )}
                {editingTransactionId && (
                  <p className="text-[10px] text-subtext0 font-semibold mt-1">
                    {(() => {
                      const tr = standaloneTransactions.find(t => t._id === editingTransactionId);
                      if (tr?.eventId) {
                        const eventName = events.find(e => e.linkedId === tr.eventId || e._id === tr.eventId)?.show;
                        return eventName ? `For Show: ${eventName}` : 'Associated Show';
                      }
                      return 'General Transaction';
                    })()}
                  </p>
                )}
              </div>
              <button onClick={resetForm} className="text-subtext0 hover:text-red-400 transition text-2xl">&times;</button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              {/* Category Selector (Revenue / Expense) */}
              <div className="flex bg-crust rounded-xl p-1 border border-surface0">
                <button
                  type="button"
                  onClick={() => {
                    setIntent('payment');
                  }}
                  className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all ${
                    ['payment', 'tip'].includes(intent)
                      ? 'bg-green/10 text-green border border-green/20'
                      : 'text-subtext0 hover:text-text'
                  }`}
                >
                  Revenue (Entry)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIntent('reimbursement');
                  }}
                  className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all ${
                    ['reimbursement', 'fee'].includes(intent)
                      ? 'bg-red/10 text-red border border-red/20'
                      : 'text-subtext0 hover:text-text'
                  }`}
                >
                  Expense (Expense)
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-subtext1 mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext0 font-bold text-sm">$</span>
                    <input
                      disabled={isSaving}
                      autoFocus
                      type="text"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      onBlur={() => {
                        const num = evalExpression(amountInput);
                        if (num === 0 && !/^0([+\-*/()]0)*$/.test(amountInput.replace(/\s/g, ''))) {
                          setAmountInput('');
                        } else {
                          setAmountInput(num.toString());
                        }
                      }}
                      className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 pl-7 text-sm font-bold focus:ring-1 focus:ring-accent outline-none hover:border-surface2"
                      placeholder="Amount"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-subtext1 mb-1">Transaction Category</label>
                  <select
                    disabled={isSaving}
                    value={intent}
                    onChange={(e) => setIntent(e.target.value as any)}
                    className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-accent outline-none hover:border-surface2"
                  >
                    {['payment', 'tip'].includes(intent) ? (
                      <>
                        <option value="payment">Payment</option>
                        <option value="tip">Tip</option>
                      </>
                    ) : (
                      <>
                        <option value="reimbursement">Reimbursement</option>
                        <option value="fee">Fee</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-subtext1 mb-1">Payment Method</label>
                  <select
                    disabled={isSaving}
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-accent outline-none hover:border-surface2"
                  >
                    <option value="e-transfer">{t('eTransfer')}</option>
                    <option value="cash">{t('cash')}</option>
                    <option value="cheque">{t('cheque')}</option>
                    <option value="credit">{t('credit')}</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-subtext1 mb-1">Date</label>
                  <input
                    disabled={isSaving}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-accent outline-none [color-scheme:dark] hover:border-surface2"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-subtext1 mb-1">Description <span className="text-red-500">*</span></label>
                  <input
                    required
                    disabled={isSaving}
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full bg-surface0 border text-text rounded-lg p-2.5 text-xs font-medium focus:ring-1 outline-none hover:border-surface2 ${
                      !notes.trim() ? 'border-red-500/50 focus:ring-red-500' : 'border-surface1 focus:ring-accent'
                    }`}
                    placeholder="Description notes..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-subtext1 mb-1">Receipt Attachment</label>
                  <label className="flex items-center justify-center gap-2 w-full h-[60px] bg-surface0 border border-dashed border-surface1 rounded-xl cursor-pointer hover:bg-surface1 transition overflow-hidden">
                    {receiptUrl ? (
                      <img src={receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-subtext0">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-[9px] uppercase tracking-wider font-bold">Upload image</span>
                      </div>
                    )}
                    <input disabled={isSaving} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-surface0 bg-mantle flex justify-between items-center shrink-0">
              {editingTransactionId ? (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this transaction?')) {
                      deleteTransaction(editingTransactionId);
                      resetForm();
                    }
                  }}
                  className="px-4 py-2 bg-red/10 text-red hover:bg-red/20 rounded-xl text-xs font-bold uppercase tracking-widest transition"
                >
                  Delete
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <button
                  disabled={isSaving}
                  onClick={resetForm}
                  className="px-4 py-2 bg-surface0 hover:bg-surface1 rounded-xl text-xs font-bold uppercase tracking-widest transition"
                >
                  Cancel
                </button>
                <button
                  disabled={isSaving || !notes.trim()}
                  onClick={handleSaveTransaction}
                  className="px-5 py-2 bg-accent text-crust hover:bg-accent-hover rounded-xl text-xs font-bold uppercase tracking-widest transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
