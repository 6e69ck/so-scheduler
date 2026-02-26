'use client';

import React from 'react';
import { EventType } from '@/types';
import { Edit2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import moment from 'moment';

interface Props {
  events: EventType[];
  onEditEvent: (e: EventType) => void;
  onViewEvent?: (e: EventType) => void;
}

export default function SpreadsheetView({ events, onEditEvent, onViewEvent }: Props) {
  const t = useTranslations('Common');

  return (
    <div className="bg-mantle rounded-lg shadow-sm border border-surface0 overflow-auto h-full w-full text-text">
      <table className="min-w-full text-left text-sm whitespace-nowrap border-collapse border-b border-surface0">
        <thead className="uppercase tracking-wider bg-crust text-subtext0 font-semibold sticky top-0 z-10 border-b border-surface0">
          <tr className="divide-x divide-surface0">
            <th className="px-4 py-3 bg-crust border-surface0 align-top">{t('showName')}</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">{t('date')}</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">{t('performanceTime')}</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">{t('location')}</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">{t('notes')}</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">{t('equipment')}</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">{t('status')}</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">{t('salesAssoc')}</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">{t('clientPhone')}</th>
            <th className="px-4 py-3 bg-crust border-surface0 align-top">{t('clientEmail')}</th>
            <th className="px-4 py-3 bg-crust text-right border-surface0 align-top">{t('totalPrice')}</th>
            <th className="px-4 py-3 bg-crust text-right border-surface0 align-top">{t('tips')}</th>
            <th className="px-4 py-3 bg-crust text-right border-surface0 align-top">{t('paidBalance')}</th>
            <th className="px-4 py-3 bg-crust text-right border-surface0 align-top">{t('remainingBalance')}</th>
            <th className="px-4 py-3 bg-crust text-center border-surface0 align-top">{t('actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface0 border-b border-surface0">
          {events.map((e, i) => {
            const dateStr = moment.utc(e.date).format('YYYY-MM-DD');
            const remaining = (e.totalPrice || 0) - (e.paidBalance || 0);
            return (
              <tr key={e._id || i} onClick={() => onViewEvent?.(e)} className="hover:bg-surface0/50 transition-colors cursor-pointer divide-x divide-surface0 border-b border-surface0">
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
                    {t(`statuses.${e.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-subtext1 align-top">{e.salesAssoc}</td>
                <td className="px-4 py-3 text-subtext1 align-top">{e.clientPhone}</td>
                <td className="px-4 py-3 text-subtext1 align-top">{e.clientEmail}</td>
                <td className="px-4 py-3 text-right text-text align-top">${e.totalPrice?.toFixed(2) || '0.00'}</td>
                <td className="px-4 py-3 text-right text-text align-top italic text-subtext0">${e.tips?.toFixed(2) || '0.00'}</td>
                <td className="px-4 py-3 text-right text-text align-top">${e.paidBalance?.toFixed(2) || '0.00'}</td>
                <td className="px-4 py-3 text-right font-bold text-accent align-top">${remaining.toFixed(2)}</td>
                <td className="px-4 py-3 text-center align-top" onClick={(ev) => ev.stopPropagation()}>
                  <button onClick={() => onEditEvent(e)} className="p-1.5 hover:bg-surface1 rounded-md text-accent transition" title={t('editDetails')}>
                    <Edit2 className="w-4 h-4 pointer-events-none" />
                  </button>
                </td>
              </tr>
            );
          })}
          {events.length === 0 && (
            <tr><td colSpan={15} className="px-4 py-12 text-center text-subtext0 bg-mantle">{t('noEvents')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
