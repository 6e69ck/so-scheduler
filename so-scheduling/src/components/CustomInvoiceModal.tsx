'use client';

import React, { useState } from 'react';
import { EventType, InvoiceLineItem } from '@/types';
import { X, Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  event: EventType;
  onClose: () => void;
  onGenerate: (items: InvoiceLineItem[]) => Promise<void>;
}

export default function CustomInvoiceModal({ event, onClose, onGenerate }: Props) {
  const t = useTranslations('Common');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: event.show, amount: event.totalPrice }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

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
    if (lineItems.length === 0) return;
    setIsGenerating(true);
    await onGenerate(lineItems);
    setIsGenerating(false);
  };

  const total = lineItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="fixed inset-0 bg-base/95 flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
      <div className="bg-mantle border border-surface0 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-surface0 flex justify-between items-center bg-mantle shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold">Configure Custom Invoice</h2>
          </div>
          <button onClick={onClose} className="text-subtext0 hover:text-red-400 transition text-2xl">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {lineItems.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-end bg-base p-3 rounded-xl border border-surface0 group">
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase text-subtext0 mb-1">Description</label>
                <input 
                  type="text" 
                  value={item.description} 
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  className="w-full bg-mantle border border-surface1 rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                  placeholder="Item description..."
                />
              </div>
              <div className="w-32">
                <label className="block text-[10px] font-black uppercase text-subtext0 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext0 text-sm">$</span>
                  <input 
                    type="number" 
                    value={item.amount} 
                    onChange={(e) => updateItem(idx, 'amount', parseFloat(e.target.value))}
                    className="w-full bg-mantle border border-surface1 rounded-lg py-2 pl-7 pr-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                  />
                </div>
              </div>
              <button 
                onClick={() => removeItem(idx)}
                className="p-2.5 text-subtext0 hover:text-red transition bg-surface0 rounded-lg mb-0.5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button 
            onClick={addItem}
            className="w-full py-3 border-2 border-dashed border-surface1 rounded-xl text-subtext0 hover:text-accent hover:border-accent/50 hover:bg-accent/5 transition flex items-center justify-center gap-2 font-bold text-sm"
          >
            <Plus className="w-4 h-4" /> Add Line Item
          </button>
        </div>

        <div className="p-5 border-t border-surface0 bg-mantle flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-bold text-subtext1 uppercase tracking-widest">Total Invoice Amount</span>
            <span className="text-2xl font-black text-accent">${total.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose} className="py-3 bg-surface0 hover:bg-surface1 rounded-xl font-bold text-sm transition">
              Cancel
            </button>
            <button 
              disabled={isGenerating || lineItems.length === 0}
              onClick={handleSubmit}
              className="py-3 bg-accent text-crust rounded-xl font-black uppercase text-xs tracking-widest hover:bg-accent-hover transition flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Generate & Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
