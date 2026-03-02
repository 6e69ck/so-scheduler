'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { InvoiceType } from '@/types';
import { Loader2, Phone, Mail, Clock, MapPin, Printer } from 'lucide-react';
import moment from 'moment';
import ReactMarkdown from 'react-markdown';

const InvTopDetailHeader = React.memo(({ children }: { children: React.ReactNode }) => {
  // Using pt for physical size consistency
  return (<h3 className="text-[10pt] font-bold text-gray-400 uppercase mb-2 border-b border-gray-400 pb-1">{children}</h3>)
});
InvTopDetailHeader.displayName = 'InvTopDetailHeader';

const InvTopDetailItem = React.memo(({ label, value, variant = 'bold' }: { label: string, value: string | React.ReactNode, variant?: 'bold' | 'medium' }) => {
  if (!value) return null;
  return (
    <div className="mb-1">
      <span className="text-[9pt] font-bold text-gray-400 uppercase">{label}</span>
      <p className={`text-[9pt] ${variant === 'bold' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{value}</p>
    </div>
  );
});
InvTopDetailItem.displayName = 'InvTopDetailItem';

const formatPhone = (phone: string) => {
  if (!phone) return '';
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return phone;
};

export default function InvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<InvoiceType | null>(null);
  const [terms, setTerms] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, termsRes] = await Promise.all([
          fetch(`/api/invoices?hash=${params.hash}`),
          fetch('/api/terms')
        ]);
        if (invRes.ok) setInvoice(await invRes.json());
        if (termsRes.ok) {
          const data = await termsRes.json();
          setTerms(data.content);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.hash]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white text-gray-900"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!invoice) return <div className="h-screen flex items-center justify-center bg-white text-gray-900">Invoice not found</div>;

  const { snapshot, type, customLineItems, customTotal } = invoice;
  const agreedTotal = snapshot.totalPrice || 0;

  let lineItems: { desc: string, subtext?: string, amount: number }[] = [];
  let finalDue = 0;

  if (type === 'deposit') {
    lineItems = [{
      desc: `Security Deposit`,
      subtext: `25% of Agreed Contract Total ($${agreedTotal.toFixed(2)})`,
      amount: agreedTotal * 0.25
    }];
    finalDue = agreedTotal * 0.25;
  } else if (type === 'remaining') {
    lineItems = [{
      desc: `Final Performance Balance`,
      subtext: `75% of Agreed Contract Total ($${agreedTotal.toFixed(2)})`,
      amount: agreedTotal * 0.75
    }];
    finalDue = agreedTotal * 0.75;
  } else if (type === 'custom') {
    lineItems = (customLineItems || []).map(li => ({ desc: li.description, amount: li.amount }));
    finalDue = customTotal || lineItems.reduce((acc, curr) => acc + curr.amount, 0);
  }

  // Determine if sections should show
  const hasBillTo = snapshot.companyName || snapshot.clientName || snapshot.clientPhone || snapshot.clientEmail;
  const hasEventDetails = snapshot.date || snapshot.startTime || snapshot.location;

  return (
    <div className="min-h-screen bg-gray-400 py-12 px-0 sm:px-6 font-sans text-gray-900 print:bg-white print:py-0 print:px-0">

      {/* Floating Print Button */}
      <button
        onClick={() => window.print()}
        className="fixed bottom-8 right-8 z-[150] no-print flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-full font-black uppercase text-sm tracking-widest hover:bg-black transition shadow-2xl scale-100 hover:scale-105 active:scale-95 duration-200 border-2 border-white/10"
      >
        <Printer className="w-5 h-5" /> Print
      </button>

      <div className="w-full max-w-full mx-auto space-y-8 sm:space-y-12 print:space-y-0 flex flex-col items-center pb-24 print:pb-0">

        {/* Invoice Page Wrapper */}
        <div className="w-full overflow-x-auto flex justify-start sm:justify-center pb-4 custom-scrollbar px-4 sm:px-0">
          {/* Invoice Page */}
          <div className="bg-white shadow-2xl w-[8.5in] h-[11in] print:shadow-none print:border-none printable-area flex flex-col shrink-0 overflow-hidden relative p-[0.5in]">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-6">
                  <img src="/logo.jpg" alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                  <div className="flex flex-col">
                    <h1 className="text-[18pt] font-black uppercase leading-none">The <span className="text-pink-700">Soaring Eagles</span></h1>
                    <p className="text-gray-500 font-black tracking-[0.2em] mt-2 uppercase">Lion & Dragon Dance</p>
                  </div>
                </div>
                <div className="text-right flex flex-col">
                  <h2 className="text-[18pt] font-bold tracking-tighter uppercase leading-none text-gray-900">
                    INVOICE {snapshot.eventNumber > 0 ? `#${String(snapshot.eventNumber).padStart(4, '0')}` : ''} <span className="font-normal text-gray-400">({invoice.shortHash})</span>
                  </h2>
                  <p className="text-gray-400 font-bold mt-2 uppercase">
                    {moment(invoice.createdAt).format('MMMM D, YYYY')}
                  </p>
                </div>
              </div>

              {(hasBillTo || hasEventDetails) && (
                <div className={`grid ${hasBillTo && hasEventDetails ? 'grid-cols-2 gap-16' : 'grid-cols-1'} mb-4`}>
                  {hasBillTo && (
                    <div>
                      <InvTopDetailHeader>Bill To</InvTopDetailHeader>
                      <div className="space-y-3" style={{ fontSize: '10pt' }}>
                        <InvTopDetailItem label="Company" value={snapshot.companyName} />
                        <InvTopDetailItem label="Client Name" value={snapshot.clientName} />
                        <InvTopDetailItem label="Phone Number" value={formatPhone(snapshot.clientPhone)} variant="medium" />
                        <InvTopDetailItem label="Email Address" value={snapshot.clientEmail} variant="medium" />
                      </div>
                    </div>
                  )}
                  {hasEventDetails && (
                    <div>
                      <InvTopDetailHeader>Event Details</InvTopDetailHeader>
                      <div className="space-y-3" style={{ fontSize: '10pt' }}>
                        <InvTopDetailItem label="Show / Performance" value={snapshot.show || 'N/A'} />
                        <InvTopDetailItem label="Performance Date" value={snapshot.date ? moment.utc(snapshot.date).format('dddd, MMMM D, YYYY') : null} />
                        <InvTopDetailItem label="Performance Time" value={snapshot.startTime ? `${snapshot.startTime} - ${snapshot.endTime}` : null} />
                        <InvTopDetailItem label="Location" value={snapshot.location || 'N/A'} variant="medium" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items Table */}
              <div className="flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-400">
                      <th className="py-2 font-black text-gray-400 uppercase tracking-widest" style={{ fontSize: '10pt' }}>Description</th>
                      <th className="py-2 text-right font-black text-gray-400 uppercase tracking-widest" style={{ fontSize: '10pt' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lineItems.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2">
                          <div className="flex flex-col">
                            <span className="text-[11pt] font-bold text-gray-900">{item.desc}</span>
                            {item.subtext && <span className="text-[7pt] text-gray-400 font-medium mt-1 uppercase tracking-wider">{item.subtext}</span>}
                          </div>
                        </td>
                        <td className="text-right font-bold font-[12pt] text-gray-900">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-full max-w-[220px] border-t border-gray-400">
                    <div className="flex justify-between items-center py-2">
                      <span className="font-bold font-[12pt] text-gray-400 uppercase tracking-[0.1em]">Total Due</span>
                      <span className="text-[12pt] font-bold text-gray-900">${finalDue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {snapshot.notes && (
                  <div className="mt-4 pt-2 border-t border-gray-100">
                    <h4 className="text-[10pt] font-bold text-gray-400 uppercase mb-2">Notes</h4>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded-lg border border-gray-100 print:bg-transparent print:p-0 print:border-none leading-relaxed">
                      {snapshot.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-2 border-t border-gray-100 flex flex-col gap-2">
                <h4 className="font-black text-gray-400 uppercase tracking-widest" style={{ fontSize: '10pt' }}>CONTRACT AGREEMENT</h4>
                <p className="text-gray-500 font-medium leading-relaxed italic" style={{ fontSize: '10pt' }}>Upon payment of this invoice, the client officially agrees to the full Terms and Conditions listed on the following page.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms Page Wrapper */}
        <div className="w-full overflow-x-auto flex justify-start sm:justify-center pb-4 custom-scrollbar px-4 sm:px-0">
          {/* Terms Page */}
          <div className="bg-white shadow-2xl w-[8.5in] h-[11in] print:shadow-none print:border-none print:break-before-page printable-area flex flex-col shrink-0 overflow-hidden relative p-[0.5in]">
            <div className="flex flex-col h-full overflow-hidden">
              <div className="border-b border-gray-700 pb-4 mb-1 flex justify-between items-end shrink-0">
                <h2 className="font-black uppercase tracking-tighter" style={{ fontSize: '24pt' }}>Terms and Conditions</h2>
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="terms-markdown-container">
                  <ReactMarkdown>{terms}</ReactMarkdown>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-lg opacity-50 grayscale" />
                  <span className="font-black text-gray-300 uppercase tracking-[0.3em]" style={{ fontSize: '10pt' }}>The Soaring Eagles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .terms-markdown-container {
          font-family: var(--font-roboto), ui-sans-serif, system-ui, sans-serif;
          font-size: 8.5pt;
          line-height: 1.4;
          color: #374151;
        }
        .terms-markdown-container h1, 
        .terms-markdown-container h2, 
        .terms-markdown-container h3, 
        .terms-markdown-container h4 {
          font-family: var(--font-roboto), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 1em;
          margin-bottom: 0.1em;
          color: #111827;
        }
        .terms-markdown-container h1 { font-size: 1.25em; }
        .terms-markdown-container h2 { font-size: 1.1em; }
        .terms-markdown-container h3 { font-size: 1em; }
        .terms-markdown-container p { margin-bottom: 0.75em; text-align: justify; }
        .terms-markdown-container ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .terms-markdown-container li { margin-bottom: 0.4em; }

        @media screen {
          .custom-scrollbar::-webkit-scrollbar {
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.05);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
          }
        }

        @media print {
          @page {
            margin: 0;
            size: letter;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-area {
            width: 8.5in !important;
            height: 11in !important;
            min-width: 8.5in !important;
            min-height: 11in !important;
            margin: 0 !important;
            padding: 0.5in !important;
            box-shadow: none !important;
            transform: none !important;
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
          }
        }
      `}</style>
    </div >
  );
}
