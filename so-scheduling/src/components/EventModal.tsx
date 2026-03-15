'use client';

import React, { useState, KeyboardEvent } from 'react';
import { EventType, TransactionType } from '@/types';
import { X, GripVertical, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';
import moment from 'moment';

interface Props {
  event: EventType | null;
  events: EventType[];
  transactions: TransactionType[];
  initialRange?: { start?: Date, end?: Date };
  onClose: () => void;
  onSave: (e: EventType) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

const SortableEquipmentItem = ({ id, item, onRemove }: { id: string, item: string, onRemove: (i: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <span ref={setNodeRef} style={style} className={`flex items-center gap-1 bg-surface1 text-text px-2 py-1 rounded-md text-sm ${isDragging ? 'shadow-lg ring-1 ring-accent' : ''}`}>
      <span {...attributes} {...listeners} className="cursor-grab text-subtext0 hover:text-text touch-none"><GripVertical className="w-3 h-3 pointer-events-none" /></span>
      {item}
      <button type="button" onClick={() => onRemove(item)} className="text-subtext0 hover:text-red-400 focus:outline-none"><X className="w-3 h-3 pointer-events-none" /></button>
    </span>
  );
};

export default function EventModal({ event, events, transactions, initialRange, onClose, onSave, onDelete }: Props) {
  const t = useTranslations('Common');

  const getInitialDate = () => {
    if (event?.date) return new Date(event.date).toISOString().split('T')[0];
    if (initialRange?.start) {
      const d = initialRange.start;
      return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    }
    return new Date().toISOString().split('T')[0];
  };

  const getInitialTime = (date?: Date, defaultTime: string = '10:00') => {
    if (!date) return defaultTime;
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const evalExpression = (expr: string): number => {
    try {
      const cleanExpr = expr.replace(/\$/g, '').replace(/[^\d.+\-*/()]/g, '');
      if (!cleanExpr) return 0;
      const result = new Function(`return ${cleanExpr}`)();
      return typeof result === 'number' ? result : 0;
    } catch {
      return 0;
    }
  };

  const [formData, setFormData] = useState<EventType>(() => {
    if (event) {
      return {
        ...event,
        clientName: event.clientName || '',
        companyName: event.companyName || '',
      };
    }
    return {
      show: '', clientName: '', companyName: '', date: getInitialDate(),
      startTime: getInitialTime(initialRange?.start, '10:00'),
      endTime: getInitialTime(initialRange?.end, '11:00'),
      location: '', notes: '', status: 'None', salesAssoc: '', clientPhone: '', clientEmail: '',
      totalPrice: 0, paidBalance: 0, gear: [], staff: [], neededPeople: 0, linkedId: ''
    };
  });

  const hasTransactions = event?._id ? transactions.some((tr: TransactionType) => tr.eventId === event._id) : false;
  const isLinked = !!formData.linkedId;
  const parentEvent = isLinked ? events.find((e: EventType) => e._id === formData.linkedId) : null;

  React.useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        clientName: event.clientName || '',
        companyName: event.companyName || '',
      });
      setTotalPriceStr(event.totalPrice?.toString() || '');
    }
  }, [event]);

  const [totalPriceStr, setTotalPriceStr] = useState(event?.totalPrice?.toString() || '');
  const [gearInput, setGearInput] = useState('');
  const [staffInput, setStaffInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const salesAssociates = (process.env.NEXT_PUBLIC_SALES_ASSOCIATES || '').split(',').map(s => s.trim()).filter(Boolean);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhoneBlur = () => {
    const sanitized = formData.clientPhone.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, clientPhone: sanitized }));
  };

  const handleTotalPriceBlurOrEnter = () => {
    const num = evalExpression(totalPriceStr);
    setTotalPriceStr(num ? num.toString() : '');
    setFormData(prev => ({ ...prev, totalPrice: num }));
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>, handler: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handler();
    }
  };

  const handleGearKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = gearInput.trim();
      if (val && !formData.gear?.includes(val)) {
        setFormData({ ...formData, gear: [...(formData.gear || []), val] });
        setGearInput('');
      }
    }
  };

  const handleStaffKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = staffInput.trim();
      if (val && !formData.staff?.includes(val)) {
        setFormData({ ...formData, staff: [...(formData.staff || []), val] });
        setStaffInput('');
      }
    }
  };

  const removeGear = (item: string) => {
    setFormData({ ...formData, gear: (formData.gear || []).filter(g => g !== item) });
  };

  const removeStaff = (item: string) => {
    setFormData({ ...formData, staff: (formData.staff || []).filter(s => s !== item) });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const tPrice = evalExpression(totalPriceStr);
    await onSave({ ...formData, totalPrice: tPrice });
    setIsSaving(false);
  };

  const handleLinkChange = (parentId: string) => {
    if (!parentId) {
      setFormData(prev => ({ ...prev, linkedId: '' }));
      return;
    }

    if (hasTransactions) {
      alert("Cannot link a show that already has transactions in the ledger.");
      return;
    }

    const parent = events.find(e => e._id === parentId);
    if (parent && confirm(`Are you sure you want to link this show to "${parent.show}"? This will overwrite contact and financial details.`)) {
      setFormData(prev => ({
        ...prev,
        linkedId: parentId,
        clientName: parent.clientName,
        companyName: parent.companyName || '',
        clientPhone: parent.clientPhone,
        clientEmail: parent.clientEmail,
        totalPrice: parent.totalPrice,
        salesAssoc: parent.salesAssoc,
        eventNumber: parent.eventNumber,
      }));
      setTotalPriceStr(parent.totalPrice?.toString() || '');
    }
  };

  const renderLockedInput = ({ label, name, value, type = 'text', required = false, component: Component = 'input' as any, options = [] }: any) => {
    const isShared = isLinked && ['clientName', 'companyName', 'clientPhone', 'clientEmail', 'totalPrice', 'salesAssoc'].includes(name);

    return (
      <div className={name === 'show' ? 'md:col-span-2' : ''}>
        <label className="flex items-center gap-1.5 text-sm font-bold text-subtext1 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
          {isShared && <LinkIcon className="w-3 h-3 text-accent" />}
        </label>
        {Component === 'select' ? (
          <select
            name={name}
            value={value}
            onChange={handleChange}
            disabled={isShared}
            className={`w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition hover:border-surface2 ${isShared ? 'bg-surface1/50 text-subtext0 cursor-not-allowed opacity-80' : ''}`}
          >
            {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : Component === 'textarea' ? (
          <textarea
            name={name}
            value={value}
            onChange={handleChange}
            rows={3}
            readOnly={isShared}
            className={`w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition resize-none hover:border-surface2 ${isShared ? 'bg-surface1/50 text-subtext0 cursor-not-allowed opacity-80' : ''}`}
          />
        ) : (
          <input
            required={required}
            type={type}
            name={name}
            value={value}
            onChange={name === 'totalPrice' ? (e) => setTotalPriceStr(e.target.value) : handleChange}
            onBlur={name === 'clientPhone' ? handlePhoneBlur : (name === 'totalPrice' ? handleTotalPriceBlurOrEnter : undefined)}
            onKeyDown={name === 'totalPrice' ? (e) => handleInputKeyDown(e, handleTotalPriceBlurOrEnter) : undefined}
            readOnly={isShared}
            className={`w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition placeholder:text-surface2 hover:border-surface2 ${isShared ? 'bg-surface1/50 text-subtext0 cursor-not-allowed opacity-80' : ''} ${type === 'date' || type === 'time' ? '[color-scheme:dark]' : ''}`}
          />
        )}
      </div>
    );
  };

  const handleDelete = async () => {
    if (confirm(t('confirmDelete'))) {
      setIsDeleting(true);
      await onDelete(event!._id!);
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-base/95 flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-mantle border border-surface0 rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden text-text opacity-100">
        <div className="p-5 border-b border-surface0 flex justify-between items-center bg-mantle shrink-0">
          <h2 className="text-xl font-bold text-text">{event ? t('editDetails') : t('newShow')}</h2>
          <button type="button" onClick={(e) => { e.preventDefault(); setTimeout(onClose, 0); }} disabled={isSaving || isDeleting} className="text-subtext0 hover:text-red-400 text-3xl leading-none transition disabled:opacity-50">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar bg-mantle">
          {/* Link Section */}
          <div className="bg-surface0/30 border border-surface1 p-3 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-widest text-subtext1 flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5 text-accent" />
                Linked to Existing Show
              </label>
              {isLinked && (
                <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold uppercase">Linked</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={formData.linkedId || ''}
                onChange={(e) => handleLinkChange(e.target.value)}
                className="flex-1 bg-surface1 border border-surface2 text-text rounded-lg p-2 text-xs focus:ring-1 focus:ring-accent outline-none"
              >
                <option value="">(Not Linked)</option>
                {events
                  .filter(e => e._id !== event?._id && !e.linkedId)
                  .sort((a, b) => moment(b.date).diff(moment(a.date)))
                  .map(e => (
                    <option key={e._id} value={e._id}>
                      #{String(e.eventNumber || 0).padStart(4, '0')} - {e.show} ({moment.utc(e.date).format('MMM D, YYYY')})
                    </option>
                  ))
                }
              </select>
              {isLinked && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, linkedId: '' }))}
                  className="px-3 py-2 bg-red-400/10 text-red-400 border border-red-400/20 rounded-lg text-xs font-bold hover:bg-red-400/20 transition"
                >
                  Unlink
                </button>
              )}
            </div>
            {hasTransactions && !isLinked && (
              <div className="flex items-center gap-2 text-[10px] text-yellow-500 font-bold bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                <AlertCircle className="w-3 h-3" />
                This show has ledger entries and cannot be linked.
              </div>
            )}
            {isLinked && (
              <div className="text-[10px] text-accent font-medium italic">
                Shared fields (Contact & Financials) are locked and synced with parent show #{String(parentEvent?.eventNumber || 0).padStart(4, '0')}.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderLockedInput({ label: t('showName'), name: "show", value: formData.show, required: true })}

            {renderLockedInput({ label: t('clientName'), name: "clientName", value: formData.clientName, required: true })}

            {renderLockedInput({ label: t('companyName'), name: "companyName", value: formData.companyName })}

            <div className="">
              <label className="block text-sm font-bold text-subtext1 mb-1">{t('date')} <span className="text-red-500">*</span></label>
              <input required type="date" name="date" value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition [color-scheme:dark] hover:border-surface2" />
            </div>

            <div className="flex space-x-3">
              <div className="flex-1">
                <label className="block text-sm font-bold text-subtext1 mb-1">{t('startTime')} <span className="text-red-500">*</span></label>
                <input required type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition [color-scheme:dark] hover:border-surface2" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-subtext1 mb-1">{t('endTime')} <span className="text-red-500">*</span></label>
                <input required type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition [color-scheme:dark] hover:border-surface2" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-subtext1 mb-1">{t('location')}</label>
              <input name="location" value={formData.location} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition placeholder:text-surface2 hover:border-surface2" />
            </div>

            {renderLockedInput({ label: t('status'), name: "status", value: formData.status, component: "select", options: ['None', 'Planning', 'Confirmed', 'Completed'].map(s => ({ value: s, label: s })) })}

            {renderLockedInput({ label: t('salesAssoc'), name: "salesAssoc", value: formData.salesAssoc, component: "select", options: [{ value: '', label: 'Select associate...' }, ...salesAssociates.map(s => ({ value: s, label: s }))] })}

            {renderLockedInput({ label: t('clientPhone'), name: "clientPhone", value: formData.clientPhone })}

            {renderLockedInput({ label: t('clientEmail'), name: "clientEmail", value: formData.clientEmail, type: "email" })}

            <div className="md:col-span-2">
              <label className="flex items-center gap-1.5 text-sm font-bold text-subtext1 mb-1">
                Contract Amount / {t('totalPrice')} ($)
                {isLinked && <LinkIcon className="w-3 h-3 text-accent" />}
              </label>
              <input
                type="text"
                name="totalPrice"
                value={totalPriceStr}
                onChange={(e) => setTotalPriceStr(e.target.value)}
                onBlur={handleTotalPriceBlurOrEnter}
                onKeyDown={(e) => handleInputKeyDown(e, handleTotalPriceBlurOrEnter)}
                readOnly={isLinked}
                className={`w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition hover:border-surface2 ${isLinked ? 'bg-surface1/50 text-subtext0 cursor-not-allowed opacity-80' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-subtext1 mb-1">{t('neededPeople')}</label>
              <input type="number" name="neededPeople" value={formData.neededPeople} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition hover:border-surface2" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-subtext1 mb-1">{t('staffing')}</label>
              <div className="w-full bg-surface0 border border-surface1 rounded-lg p-2 flex flex-wrap gap-2 focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition min-h-[46px] hover:border-surface2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                  const { active, over } = e;
                  if (active.id !== over?.id && formData.staff) {
                    const oldIndex = formData.staff.indexOf(active.id as string);
                    const newIndex = formData.staff.indexOf(over!.id as string);
                    setFormData({ ...formData, staff: arrayMove(formData.staff, oldIndex, newIndex) });
                  }
                }}>
                  <SortableContext items={formData.staff || []} strategy={horizontalListSortingStrategy}>
                    {formData.staff?.map((s) => <SortableEquipmentItem key={s} id={s} item={s} onRemove={removeStaff} />)}
                  </SortableContext>
                </DndContext>
                <input type="text" value={staffInput} onChange={(e) => setStaffInput(e.target.value)} onKeyDown={handleStaffKeyDown} className="flex-1 bg-transparent border-none outline-none text-text text-sm min-w-[100px] placeholder:text-surface2" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-subtext1 mb-1">{t('equipment')}</label>
              <div className="w-full bg-surface0 border border-surface1 rounded-lg p-2 flex flex-wrap gap-2 focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition min-h-[46px] hover:border-surface2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                  const { active, over } = e;
                  if (active.id !== over?.id && formData.gear) {
                    const oldIndex = formData.gear.indexOf(active.id as string);
                    const newIndex = formData.gear.indexOf(over!.id as string);
                    setFormData({ ...formData, gear: arrayMove(formData.gear, oldIndex, newIndex) });
                  }
                }}>
                  <SortableContext items={formData.gear || []} strategy={horizontalListSortingStrategy}>
                    {formData.gear?.map((g) => <SortableEquipmentItem key={g} id={g} item={g} onRemove={removeGear} />)}
                  </SortableContext>
                </DndContext>
                <input type="text" value={gearInput} onChange={(e) => setGearInput(e.target.value)} onKeyDown={handleGearKeyDown} className="flex-1 bg-transparent border-none outline-none text-text text-sm min-w-[100px] placeholder:text-surface2" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-subtext1 mb-1">{t('notes')}</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition resize-none hover:border-surface2"></textarea>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between pt-5 border-t border-surface0 gap-3 sm:gap-0 mt-6 bg-mantle">
            {event && event._id ? (
              <button type="button" disabled={isSaving || isDeleting} onClick={handleDelete} className="w-full sm:w-auto px-5 py-2.5 bg-[#f38ba8]/10 text-[#f38ba8] border border-[#f38ba8]/20 font-bold rounded-lg hover:bg-[#f38ba8]/20 transition disabled:opacity-50">
                {isDeleting ? t('loading') : t('deleteEvent')}
              </button>
            ) : <div className="hidden sm:block"></div>}
            <div className="flex space-x-3 w-full sm:w-auto">
              <button type="button" disabled={isSaving || isDeleting} onClick={(e) => { e.preventDefault(); setTimeout(onClose, 0); }} className="flex-1 sm:flex-none px-5 py-2.5 bg-surface0 border border-surface1 text-text font-bold rounded-lg hover:bg-surface1 hover:text-accent transition disabled:opacity-50">{t('cancel')}</button>
              <button type="submit" disabled={isSaving || isDeleting} className="flex-1 sm:flex-none px-5 py-2.5 bg-accent text-crust font-bold rounded-lg hover:bg-accent-hover shadow-md shadow-accent/10 transition disabled:opacity-50">
                {isSaving ? t('loading') : t('saveChanges')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
