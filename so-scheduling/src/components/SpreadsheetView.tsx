import React from 'react';
import { EventType } from '@/types';
import { Edit2 } from 'lucide-react';

interface Props {
  events: EventType[];
  onEditEvent: (e: EventType) => void;
  onViewEvent: (e: EventType) => void;
}

export default function SpreadsheetView({ events, onEditEvent, onViewEvent }: Props) {
  return (
    <div className="bg-mantle rounded-lg shadow-sm border border-surface0 overflow-auto h-full w-full text-text">
      <table className="min-w-full text-left text-sm whitespace-nowrap border-collapse border-b border-surface0">
        <thead className="uppercase tracking-wider bg-crust text-subtext0 font-semibold sticky top-0 z-10 border-b border-surface0">
          <tr className="divide-x divide-surface0">
            <th className="px-4 py-3 bg-crust border-surface0 align-top">Show</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">Date</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">Time Range</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">Location</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">Notes</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">Equipment</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">Status</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">Sales Associate</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">Client Phone</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">Client Email</th>
            <th className="px-4 py-3 bg-crust text-right border-surface0 align-top">Total Price</th>
            <th className="px-4 py-3 bg-crust text-right border-surface0 align-top">Tips</th>
            <th className="px-4 py-3 bg-crust text-right border-surface0 align-top">Paid Balance</th>
            <th className="px-4 py-3 bg-crust text-right border-surface0 align-top">Remaining</th>
            <th className="px-4 py-3 bg-crust text-center border-surface0 align-top">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface0 border-b border-surface0">
          {events.map((e, i) => {
            const dateStr = new Date(e.date).toLocaleDateString();
            return (
              <tr key={e._id || i} onClick={() => onViewEvent(e)} className="hover:bg-surface0/50 transition-colors cursor-pointer divide-x divide-surface0 border-b border-surface0">
                <td className="px-4 py-3 font-medium text-text align-top">{e.show}</td>
                <td className="px-4 py-3 text-subtext1 align-top">{dateStr}</td>
                <td className="px-4 py-3 text-subtext1 align-top">{e.startTime} - {e.endTime}</td>
                <td className="px-4 py-3 text-subtext1 truncate max-w-[150px] align-top" title={e.location}>{e.location}</td>
                <td className="px-4 py-3 text-subtext0 truncate max-w-[150px] align-top whitespace-normal" title={e.notes}>{e.notes}</td>
                <td className="px-4 py-3 text-subtext0 align-top">
                  {e.gear && e.gear.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {e.gear.map((g, idx) => (
                        <span key={idx} className="block w-full truncate max-w-[150px]" title={g}>• {g}</span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 align-top">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block
                    ${e.status === 'Confirmed' ? 'bg-[#a6e3a1]/20 text-[#a6e3a1]' : 
                      e.status === 'Completed' ? 'bg-[#89b4fa]/20 text-[#89b4fa]' : 
                      e.status === 'Planning' ? 'bg-[#f9e2af]/20 text-[#f9e2af]' : 
                      'bg-surface1 text-text'}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-subtext1 align-top">{e.salesAssoc}</td>
                <td className="px-4 py-3 text-subtext1 align-top">{e.clientPhone}</td>
                <td className="px-4 py-3 text-subtext1 align-top">{e.clientEmail}</td>
                <td className="px-4 py-3 text-right text-text align-top">${e.totalPrice?.toFixed(2) || '0.00'}</td>
                <td className="px-4 py-3 text-right text-text align-top italic text-subtext0">${e.tips?.toFixed(2) || '0.00'}</td>
                <td className="px-4 py-3 text-right text-text align-top">${e.paidBalance?.toFixed(2) || '0.00'}</td>
                <td className="px-4 py-3 text-right font-bold text-accent align-top">${e.remainingBalance?.toFixed(2) || '0.00'}</td>
                <td className="px-4 py-3 text-center align-top" onClick={(ev) => ev.stopPropagation()}>
                  <button onClick={() => onEditEvent(e)} className="p-1.5 hover:bg-surface1 rounded-md text-accent transition" title="Edit">
                    <Edit2 className="w-4 h-4 pointer-events-none" />
                  </button>
                </td>
              </tr>
            );
          })}
          {events.length === 0 && (
            <tr><td colSpan={14} className="px-4 py-12 text-center text-subtext0 bg-mantle">No events found. Switch to the Calendar view to create one.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
