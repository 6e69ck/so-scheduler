'use client';

import React, { useState } from 'react';
import { InvoiceLineItem } from '@/types';
import { X, Plus, Trash2, FileText, Loader2, User, Building, MapPin, Calendar as CalendarIcon, Clock } from 'lucide-react';
import moment from 'moment';

interface Props {
  onClose: () => void;
  onGenerate: (details: any, items: InvoiceLineItem[]) => Promise<void>;
}

export default function AdHocInvoiceModal({ onClose, onGenerate }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Header details
  const [details, setDetails] = useState({
    show: '',
    clientName: '',
    companyName: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: '', amount: 0 }
  ]);

  const updateDetail = (field: string, value: string) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setLineItems([...lineItems, { description: '', amount: 0 }]);
  };

  const removeItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof InvoiceLineItem, value: any) => {
    const newItems = [...lineItems];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setLineItems(newItems);
  };

  const handleSubmit = async () => {
    if (!details.show || lineItems.length === 0) {
      alert('Please provide at least a show name and one line item.');
      return;
    }
    setIsGenerating(true);
    // Filter out empty details before sending
    const cleanDetails = Object.fromEntries(
      Object.entries(details).filter(([_, v]) => v !== '')
    );
    await onGenerate(cleanDetails, lineItems);
    setIsGenerating(false);
  };

  const total = lineItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="fixed inset-0 bg-base/95 flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
      <div className="bg-mantle border border-surface0 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-5 border-b border-surface0 flex justify-between items-center bg-mantle shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Create Ad-Hoc Invoice</h2>
              <p className="text-[10px] text-subtext0 font-bold uppercase tracking-widest">Manual Entry Mode</p>
            </div>
          </div>
          <button onClick={onClose} className="text-subtext0 hover:text-red-400 transition text-2xl p-2">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8">
          {/* Header Details Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent border-b border-accent/20 pb-2">1. Invoice Details (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full md:col-span-1">
                <label className="block text-[10px] font-black uppercase text-subtext0 mb-1 ml-1">Show / Performance Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtext0" />
                  <input 
                    type="text" 
                    value={details.show} 
                    onChange={(e) => updateDetail('show', e.target.value)}
                    className="w-full bg-base border border-surface1 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-accent outline-none transition"
                    placeholder="Required show name..."
                  />
                </div>
              </div>
              <div className="col-span-full md:col-span-1">
                <label className="block text-[10px] font-black uppercase text-subtext0 mb-1 ml-1">Client Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtext0" />
                  <input 
                    type="text" 
                    value={details.clientName} 
                    onChange={(e) => updateDetail('clientName', e.target.value)}
                    className="w-full bg-base border border-surface1 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-accent outline-none transition"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="col-span-full md:col-span-1">
                <label className="block text-[10px] font-black uppercase text-subtext0 mb-1 ml-1">Company Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtext0" />
                  <input 
                    type="text" 
                    value={details.companyName} 
                    onChange={(e) => updateDetail('companyName', e.target.value)}
                    className="w-full bg-base border border-surface1 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-accent outline-none transition"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="col-span-full md:col-span-1">
                <label className="block text-[10px] font-black uppercase text-subtext0 mb-1 ml-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtext0" />
                  <input 
                    type="text" 
                    value={details.location} 
                    onChange={(e) => updateDetail('location', e.target.value)}
                    className="w-full bg-base border border-surface1 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-accent outline-none transition"
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              <div className="col-span-full md:col-span-2 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-subtext0 mb-1 ml-1">Date</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtext0" />
                    <input 
                      type="date" 
                      value={details.date} 
                      onChange={(e) => updateDetail('date', e.target.value)}
                      className="w-full bg-base border border-surface1 rounded-xl py-2 pl-10 pr-2 text-xs font-bold focus:ring-2 focus:ring-accent outline-none transition [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-subtext0 mb-1 ml-1">Start</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtext0" />
                    <input 
                      type="time" 
                      value={details.startTime} 
                      onChange={(e) => updateDetail('startTime', e.target.value)}
                      className="w-full bg-base border border-surface1 rounded-xl py-2 pl-10 pr-2 text-xs font-bold focus:ring-2 focus:ring-accent outline-none transition [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-subtext0 mb-1 ml-1">End</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtext0" />
                    <input 
                      type="time" 
                      value={details.endTime} 
                      onChange={(e) => updateDetail('endTime', e.target.value)}
                      className="w-full bg-base border border-surface1 rounded-xl py-2 pl-10 pr-2 text-xs font-bold focus:ring-2 focus:ring-accent outline-none transition [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-accent/20 pb-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">2. Line Items</h3>
              <span className="text-[10px] font-black text-subtext0 uppercase">{lineItems.length} {lineItems.length === 1 ? 'Item' : 'Items'}</span>
            </div>
            
            <div className="space-y-3">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-end bg-base p-4 rounded-2xl border border-surface0 group relative animate-in zoom-in-95 duration-200">
                  <div className="flex-1">
                    <label className="block text-[9px] font-black uppercase text-subtext0 mb-1.5 ml-1">Item Description</label>
                    <input 
                      type="text" 
                      value={item.description} 
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full bg-mantle border border-surface1 rounded-xl py-2.5 px-4 text-sm font-bold focus:ring-2 focus:ring-accent outline-none transition"
                      placeholder="E.g. Performance Fee"
                    />
                  </div>
                  <div className="w-36">
                    <label className="block text-[9px] font-black uppercase text-subtext0 mb-1.5 ml-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-subtext0 font-black text-sm">$</span>
                      <input 
                        type="number" 
                        value={isNaN(item.amount) ? '' : item.amount} 
                        onChange={(e) => updateItem(idx, 'amount', parseFloat(e.target.value))}
                        className="w-full bg-mantle border border-surface1 rounded-xl py-2.5 pl-8 pr-4 text-sm font-black focus:ring-2 focus:ring-accent outline-none transition"
                      />
                    </div>
                  </div>
                  {lineItems.length > 1 && (
                    <button 
                      onClick={() => removeItem(idx)}
                      className="p-2.5 text-subtext0 hover:text-red transition bg-surface0 hover:bg-red/10 rounded-xl mb-0"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={addItem}
              className="w-full py-4 border-2 border-dashed border-surface1 rounded-2xl text-subtext0 hover:text-accent hover:border-accent/50 hover:bg-accent/5 transition flex items-center justify-center gap-3 font-black uppercase text-xs tracking-widest"
            >
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-surface0 bg-mantle flex flex-col gap-5 shrink-0">
          <div className="flex justify-between items-center px-4 py-3 bg-base rounded-2xl border border-surface0 shadow-inner">
            <span className="text-[10px] font-black text-subtext1 uppercase tracking-[0.2em]">Grand Total Balance</span>
            <span className="text-3xl font-black text-accent">${total.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onClose} 
              className="py-4 bg-surface0 hover:bg-surface1 rounded-2xl font-black uppercase text-xs tracking-widest transition border border-surface1"
            >
              Cancel
            </button>
            <button 
              disabled={isGenerating || lineItems.length === 0 || !details.show}
              onClick={handleSubmit}
              className="py-4 bg-accent text-crust rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-accent-hover transition flex items-center justify-center gap-3 shadow-xl shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              Generate & Open Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
