import React from 'react';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import { notFound } from 'next/navigation';
import PrintButton from './PrintButton';
import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';

export default async function InvoicePage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ type?: string }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  await dbConnect();
  
  let event;
  try {
    event = await Event.findById(params.id);
  } catch (err) {
    notFound();
  }

  if (!event) {
    notFound();
  }

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const isDeposit = searchParams.type === 'deposit';
  const invoiceType = isDeposit ? 'Deposit' : 'Remaining Balance';
  const idSuffix = isDeposit ? 'a' : 'b';
  
  const totalPrice = event.totalPrice || 0;
  const paidBalance = event.paidBalance || 0;
  let amountDue = 0;
  if (isDeposit) {
    amountDue = totalPrice * 0.25;
  } else {
    amountDue = totalPrice - paidBalance;
  }

  // Format date correctly from stored string mapping to UTC
  const d = new Date(event.date);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  const dateStr = new Date(year, month, day).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let termsContent = '';
  try {
    const termsPath = path.join(process.cwd(), 'Terms.md');
    termsContent = fs.readFileSync(termsPath, 'utf8');
  } catch (err) {
    termsContent = 'Terms and Conditions not available.';
  }

  return (
    <div className="min-h-screen bg-gray-200 text-gray-900 font-sans print:bg-white p-0 sm:p-8 print:p-0 flex flex-col items-center">
      {/* Page 1: Invoice */}
      <div className="bg-white shadow-2xl print:shadow-none w-full max-w-[8.5in] h-auto min-h-[11in] print:h-[11in] p-12 sm:p-16 print:p-16 flex flex-col justify-between box-border relative print:m-0 mb-8 overflow-hidden">
        <div>
          <div className="flex justify-between items-start mb-12 border-b-2 border-gray-200 pb-8">
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 overflow-hidden rounded-xl shadow-sm border border-gray-100">
                <img 
                  src="/logo.jpg" 
                  alt="Soaring Eagles Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tighter text-gray-900 uppercase leading-none">INVOICE</h1>
                <p className="text-xl text-gray-500 mt-3 font-semibold tracking-tight">{invoiceType}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">The Soaring Eagles</h2>
              <p className="text-gray-500 mt-1 text-sm font-medium">Invoice Date: {new Date().toLocaleDateString('en-US')}</p>
              <div className="mt-4 text-right">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 block mb-1">Invoice ID</span>
                <span className="text-3xl font-bold text-gray-900 tracking-tighter">#{String(event.eventNumber ?? 1).padStart(4, '0')}{idSuffix}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-12 mb-12">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-4">Bill To</h3>
              <div className="space-y-1">
                {event.companyName && (
                  <span className="font-bold text-xl text-gray-900 leading-tight block">
                    {event.companyName}
                  </span>
                )}
                <span className={`${event.companyName ? 'text-gray-700 text-lg font-semibold' : 'font-bold text-xl text-gray-900'} leading-tight block`}>
                  {event.clientName}
                </span>
                <div className="pt-6 flex flex-col gap-4 text-sm text-gray-600 font-medium">
                  {event.clientPhone && (
                    <div>
                      <strong className="block text-gray-400 text-[10px] uppercase tracking-widest mb-1 font-semibold">Phone</strong>
                      <span className="text-gray-900">{formatPhone(event.clientPhone)}</span>
                    </div>
                  )}
                  {event.clientEmail && (
                    <div>
                      <strong className="block text-gray-400 text-[10px] uppercase tracking-widest mb-1 font-semibold">Email</strong>
                      <span className="text-gray-900">{event.clientEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-4">Event Details</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <strong className="block text-gray-400 text-[10px] uppercase tracking-widest mb-1 font-semibold">Date</strong>
                  <span className="text-gray-900 font-semibold text-lg">{dateStr}</span>
                </div>
                <div>
                  <strong className="block text-gray-400 text-[10px] uppercase tracking-widest mb-1 font-semibold">Performance Time</strong>
                  <span className="text-gray-900 font-semibold text-lg">{event.startTime} - {event.endTime}</span>
                </div>
                {event.location && (
                  <div>
                    <strong className="block text-gray-400 text-[10px] uppercase tracking-widest mb-1 font-semibold">Location</strong>
                    <span className="text-gray-900 font-semibold text-lg">{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {event.notes && (
            <div className="mb-10">
               <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-3">Notes</h3>
               <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-5 rounded-lg border border-gray-100 print:bg-transparent print:p-0 print:border-none leading-relaxed">
                 {event.notes}
               </div>
            </div>
          )}

          <div className="mt-12">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-3 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Description</th>
                  <th className="py-3 text-right font-bold text-gray-400 uppercase text-[10px] tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50">
                  <td className="py-6">
                    <div className="font-bold text-gray-900 text-base">{invoiceType}</div>
                    <div className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-tight">
                      {isDeposit 
                        ? `Calculated as 25% of the total amount ($${totalPrice.toFixed(2)})`
                        : `Calculated as total amount ($${totalPrice.toFixed(2)}) minus paid balance ($${paidBalance.toFixed(2)})`
                      }
                    </div>
                  </td>
                  <td className="py-6 text-right font-bold text-gray-900 text-xl">${amountDue.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-end mt-16 border-t border-gray-100 pt-8 print:border-gray-200">
           <div className="text-[10px] leading-relaxed text-gray-400 max-w-sm font-medium italic">
             <strong className="text-gray-500 not-italic block mb-1">CONTRACT AGREEMENT:</strong>
             Upon payment of this invoice, the client officially agrees to the full Terms and Conditions listed on the following page.
           </div>
           <div className="text-right w-full max-w-xs">
             <div className="flex justify-between text-sm mb-1 text-gray-500 font-medium">
               <span>SUBTOTAL</span>
               <span>${amountDue.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-2xl font-bold text-gray-900 mt-1">
               <span>TOTAL DUE</span>
               <span>${amountDue.toFixed(2)}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Page 2: Terms and Conditions */}
      <div className="bg-white shadow-2xl print:shadow-none w-full max-w-[8.5in] h-auto min-h-[11in] print:h-[11in] p-12 sm:p-16 print:p-16 box-border print:break-before-page relative overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Terms and Conditions</h2>
        </div>
        <div className="invoice-terms flex-1">
          <ReactMarkdown>{termsContent}</ReactMarkdown>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-50 text-[9px] text-gray-400 text-center uppercase font-medium tracking-widest">
          © {new Date().getFullYear()} The Soaring Eagles Association. All rights reserved.
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 print:hidden z-50">
        <PrintButton />
      </div>
    </div>
  );
}
