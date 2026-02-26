import React, { useState, KeyboardEvent } from 'react';
import { EventType } from '@/types';
import { X, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  event: EventType | null;
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
      <span {...attributes} {...listeners} className="cursor-grab text-subtext0 hover:text-text touch-none"><GripVertical className="w-3 h-3 pointer-events-none"/></span>
      {item}
      <button type="button" onClick={() => onRemove(item)} className="text-subtext0 hover:text-red-400 focus:outline-none"><X className="w-3 h-3 pointer-events-none"/></button>
    </span>
  );
};

export default function EventModal({ event, initialRange, onClose, onSave, onDelete }: Props) {
  const getInitialDate = () => {
    if (event?.date) return new Date(event.date).toISOString().split('T')[0];
    if (initialRange?.start) {
      const d = initialRange.start;
      return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
    }
    return new Date().toISOString().split('T')[0];
  };

  const getInitialTime = (date?: Date, defaultTime: string = '10:00') => {
    if (!date) return defaultTime;
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState<EventType>(event ? {
    ...event,
    clientName: event.clientName || '',
    companyName: event.companyName || ''
  } : {
    show: '', clientName: '', companyName: '', date: getInitialDate(), 
    startTime: getInitialTime(initialRange?.start, '10:00'), 
    endTime: getInitialTime(initialRange?.end, '11:00'),
    location: '', notes: '', status: 'None', salesAssoc: '', clientPhone: '', clientEmail: '',
    totalPrice: 0, paidBalance: 0, gear: [], staff: [], neededPeople: 0
  });

  React.useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        clientName: event.clientName || '',
        companyName: event.companyName || ''
      });
      setTotalPriceStr(event.totalPrice?.toString() || '');
      setPaidBalanceStr(event.paidBalance?.toString() || '');
      setTipsStr(event.tips?.toString() || '');
    }
  }, [event]);

  const [totalPriceStr, setTotalPriceStr] = useState(event?.totalPrice?.toString() || '');
  const [paidBalanceStr, setPaidBalanceStr] = useState(event?.paidBalance?.toString() || '');
  const [tipsStr, setTipsStr] = useState(event?.tips?.toString() || '');
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
    const cleanValue = totalPriceStr.replace('$', '').trim();
    const num = parseFloat(cleanValue) || 0;
    setTotalPriceStr(num ? num.toString() : '');
    setFormData(prev => ({ ...prev, totalPrice: num }));
  };

  const handlePaidBalanceBlurOrEnter = () => {
    let val = paidBalanceStr.replace('$', '').trim();
    const tPrice = parseFloat(totalPriceStr) || 0;
    
    if (val.endsWith('%')) {
      const pct = parseFloat(val.replace('%', ''));
      if (!isNaN(pct)) {
        val = ((pct / 100) * tPrice).toFixed(2);
      }
    }
    
    const num = parseFloat(val) || 0;
    setPaidBalanceStr(num ? num.toString() : '');
    setFormData(prev => ({ ...prev, paidBalance: num }));
  };

  const handleTipsBlurOrEnter = () => {
    const cleanValue = tipsStr.replace('$', '').trim();
    const num = parseFloat(cleanValue) || 0;
    setTipsStr(num ? num.toString() : '');
    setFormData(prev => ({ ...prev, tips: num }));
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

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id && formData.gear) {
      const oldIndex = formData.gear.indexOf(active.id);
      const newIndex = formData.gear.indexOf(over.id);
      setFormData({ ...formData, gear: arrayMove(formData.gear, oldIndex, newIndex) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // ensure last-minute strings are captured
    let finalPaid = parseFloat(paidBalanceStr) || 0;
    const tPrice = parseFloat(totalPriceStr) || 0;
    if (paidBalanceStr.trim().endsWith('%')) {
      const pct = parseFloat(paidBalanceStr.replace('%', ''));
      if (!isNaN(pct)) finalPaid = (pct / 100) * tPrice;
    }
    const finalTips = parseFloat(tipsStr) || 0;
    
    await onSave({ ...formData, totalPrice: tPrice, paidBalance: finalPaid, tips: finalTips });
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if(confirm('Are you sure you want to delete this event?')) {
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
          <h2 className="text-xl font-bold text-text">{event ? 'Edit Event Details' : 'Create New Event'}</h2>
          <button type="button" onClick={(e) => { e.preventDefault(); setTimeout(onClose, 0); }} disabled={isSaving || isDeleting} className="text-subtext0 hover:text-red-400 text-3xl leading-none transition disabled:opacity-50">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar bg-mantle">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-subtext1 mb-1">Show Name <span className="text-red-500">*</span></label>
              <input required name="show" value={formData.show} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition placeholder:text-surface2 hover:border-surface2" placeholder="Enter show name" />
            </div>

            <div>
              <label className="block text-sm font-bold text-subtext1 mb-1">Client Name <span className="text-red-500">*</span></label>
              <input required name="clientName" value={formData.clientName} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition placeholder:text-surface2 hover:border-surface2" placeholder="Enter client name" />
            </div>

            <div>
              <label className="block text-sm font-bold text-subtext1 mb-1">Company Name</label>
              <input name="companyName" value={formData.companyName} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition placeholder:text-surface2 hover:border-surface2" placeholder="Enter company name (optional)" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-subtext1 mb-1">Date <span className="text-red-500">*</span></label>
              <input required type="date" name="date" value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition [color-scheme:dark] hover:border-surface2" />
            </div>
            
            <div className="flex space-x-3">
              <div className="flex-1">
                <label className="block text-sm font-bold text-subtext1 mb-1">Start Time <span className="text-red-500">*</span></label>
                <input required type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition [color-scheme:dark] hover:border-surface2" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-subtext1 mb-1">End Time <span className="text-red-500">*</span></label>
                <input required type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition [color-scheme:dark] hover:border-surface2" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-subtext1 mb-1">Location</label>
              <input name="location" value={formData.location} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition placeholder:text-surface2 hover:border-surface2" placeholder="123 Party Lane, City, ST" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-subtext1 mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition hover:border-surface2">
                <option value="None">None</option>
                <option value="Planning">Planning</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-subtext1 mb-1">Sales Associate</label>
              <select name="salesAssoc" value={formData.salesAssoc} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition hover:border-surface2">
                <option value="">Select Associate...</option>
                {salesAssociates.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-subtext1 mb-1">Client Phone</label>
              <input name="clientPhone" value={formData.clientPhone} onChange={handleChange} onBlur={handlePhoneBlur} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition placeholder:text-surface2 hover:border-surface2" placeholder="(555) 123-4567" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-subtext1 mb-1">Client Email</label>
              <input type="email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition placeholder:text-surface2 hover:border-surface2" placeholder="client@example.com" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-subtext1 mb-1">Total Price ($)</label>
              <input type="text" name="totalPrice" value={totalPriceStr} 
                onChange={(e) => setTotalPriceStr(e.target.value)} 
                onBlur={handleTotalPriceBlurOrEnter}
                onKeyDown={(e) => handleInputKeyDown(e, handleTotalPriceBlurOrEnter)}
                className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition hover:border-surface2" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-subtext1 mb-1">Paid Balance ($, or %)</label>
              <input type="text" name="paidBalance" value={paidBalanceStr} 
                onChange={(e) => setPaidBalanceStr(e.target.value)} 
                onBlur={handlePaidBalanceBlurOrEnter}
                onKeyDown={(e) => handleInputKeyDown(e, handlePaidBalanceBlurOrEnter)}
                className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition hover:border-surface2" />
            </div>

            <div>
              <label className="block text-sm font-bold text-subtext1 mb-1">Tips ($)</label>
              <input type="text" name="tips" value={tipsStr} 
                onChange={(e) => setTipsStr(e.target.value)} 
                onBlur={handleTipsBlurOrEnter}
                onKeyDown={(e) => handleInputKeyDown(e, handleTipsBlurOrEnter)}
                className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition hover:border-surface2" placeholder="0.00" />
            </div>

            <div>
              <label className="block text-sm font-bold text-subtext1 mb-1">Needed People</label>
              <input type="number" name="neededPeople" value={formData.neededPeople} 
                onChange={handleChange}
                className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition hover:border-surface2" placeholder="0" />
            </div>
            
            <div className="md:col-span-2 bg-crust border border-surface0 text-accent p-3 rounded-lg flex justify-between items-center">
              <span className="font-bold text-sm text-subtext1">Remaining Balance:</span>
              <span className="font-bold text-lg">${((parseFloat(totalPriceStr) || 0) - (formData.paidBalance || 0)).toFixed(2)}</span>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-subtext1 mb-1">Staffing (Press Enter to add, drag to reorder)</label>
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
                    {formData.staff?.map((s) => (
                      <SortableEquipmentItem key={s} id={s} item={s} onRemove={removeStaff} />
                    ))}
                  </SortableContext>
                </DndContext>
                <input type="text" value={staffInput} onChange={(e) => setStaffInput(e.target.value)} onKeyDown={handleStaffKeyDown} className="flex-1 bg-transparent border-none outline-none text-text text-sm min-w-[100px] placeholder:text-surface2" placeholder="Add staff member..." />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-subtext1 mb-1">Equipment Details (Press Enter to add, drag to reorder)</label>
              <div className="w-full bg-surface0 border border-surface1 rounded-lg p-2 flex flex-wrap gap-2 focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition min-h-[46px] hover:border-surface2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={formData.gear || []} strategy={horizontalListSortingStrategy}>
                    {formData.gear?.map((g) => (
                      <SortableEquipmentItem key={g} id={g} item={g} onRemove={removeGear} />
                    ))}
                  </SortableContext>
                </DndContext>
                <input type="text" value={gearInput} onChange={(e) => setGearInput(e.target.value)} onKeyDown={handleGearKeyDown} className="flex-1 bg-transparent border-none outline-none text-text text-sm min-w-[100px] placeholder:text-surface2" placeholder="Add equipment item..." />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-subtext1 mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full bg-surface0 border border-surface1 text-text rounded-lg p-2.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition resize-none hover:border-surface2"></textarea>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-between pt-5 border-t border-surface0 gap-3 sm:gap-0 mt-6 bg-mantle">
            {event && event._id ? (
              <button type="button" disabled={isSaving || isDeleting} onClick={handleDelete} className="w-full sm:w-auto px-5 py-2.5 bg-[#f38ba8]/10 text-[#f38ba8] border border-[#f38ba8]/20 font-bold rounded-lg hover:bg-[#f38ba8]/20 transition disabled:opacity-50">
                {isDeleting ? 'Deleting...' : 'Delete Event'}
              </button>
            ) : <div className="hidden sm:block"></div>}
            <div className="flex space-x-3 w-full sm:w-auto">
              <button type="button" disabled={isSaving || isDeleting} onClick={(e) => { e.preventDefault(); setTimeout(onClose, 0); }} className="flex-1 sm:flex-none px-5 py-2.5 bg-surface0 border border-surface1 text-text font-bold rounded-lg hover:bg-surface1 hover:text-accent transition disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isSaving || isDeleting} className="flex-1 sm:flex-none px-5 py-2.5 bg-accent text-crust font-bold rounded-lg hover:bg-accent-hover shadow-md shadow-accent/10 transition disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
