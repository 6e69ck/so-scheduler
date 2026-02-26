import React from 'react';
import { EventType } from '@/types';

interface Props {
  event: EventType;
  onClose: () => void;
  onEdit: (e: EventType) => void;
}

export default function ViewEventModal({ event, onClose, onEdit }: Props) {
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
    <div className="fixed inset-0 bg-base/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans" onClick={(e) => { e.stopPropagation(); setTimeout(onClose, 0); }}>
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
              Show: {event.show}
            </span>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ml-2 shrink-0
            ${event.status === 'Confirmed' ? 'bg-[#a6e3a1]/20 text-[#a6e3a1]' : 
              event.status === 'Completed' ? 'bg-[#89b4fa]/20 text-[#89b4fa]' : 
              event.status === 'Planning' ? 'bg-[#f9e2af]/20 text-[#f9e2af]' : 
              'bg-surface1 text-text'}
          `}>{event.status}</span>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-subtext1">
            <strong className="text-text block mb-0.5">Location:</strong> 
            {event.location || 'N/A'}
          </p>
          <p className="text-sm text-subtext1">
            <strong className="text-text block mb-0.5">Time:</strong> 
            {event.startTime} - {event.endTime}
          </p>

          {event.tips !== undefined && event.tips > 0 && (
            <p className="text-sm text-subtext1">
              <strong className="text-text block mb-0.5">Tips:</strong> 
              ${event.tips.toFixed(2)}
            </p>
          )}
          
          {(event.clientName || event.clientPhone || event.clientEmail) && (
            <div className="text-sm text-subtext1">
              <strong className="text-text block mb-0.5">Contact:</strong> 
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
            <strong className="text-text block mb-0.5">Staffing:</strong> 
            {event.staff?.length || 0} / {event.neededPeople || 0} assigned
            {event.staff && event.staff.length > 0 && (
              <span className="block text-xs text-subtext0 mt-1 italic">({event.staff.join(', ')})</span>
            )}
          </p>

          {event.gear && event.gear.length > 0 && (
            <div className="text-sm text-subtext1">
               <strong className="text-text block mb-1">Equipment:</strong>
               <div className="flex flex-wrap gap-1.5 mt-1">
                 {event.gear.map((g: string, i: number) => <span key={i} className="px-2.5 py-1 bg-surface0 text-text text-xs rounded-md border border-surface1">{g}</span>)}
               </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center pt-5 mt-2 border-t border-surface0 gap-3">
          <div className="flex space-x-2 w-full sm:w-auto">
            <a 
              href={`/invoice/${event._id}?type=deposit`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex-1 sm:flex-none px-3 py-2 bg-surface0 text-subtext1 rounded-md text-xs font-bold hover:bg-surface1 hover:text-text transition text-center border border-surface1"
            >
              Deposit Inv.
            </a>
            <a 
              href={`/invoice/${event._id}?type=remaining`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex-1 sm:flex-none px-3 py-2 bg-surface0 text-subtext1 rounded-md text-xs font-bold hover:bg-surface1 hover:text-text transition text-center border border-surface1"
            >
              Remaining Inv.
            </a>
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button onClick={(e) => { e.preventDefault(); setTimeout(onClose, 0); }} className="flex-1 sm:flex-none px-4 py-2 bg-surface0 rounded-md text-sm font-bold hover:bg-surface1 transition hover:text-accent">Close</button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setTimeout(() => onEdit(event), 0);
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-accent text-crust rounded-md text-sm font-bold hover:bg-accent-hover transition shadow-md shadow-accent/10"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
