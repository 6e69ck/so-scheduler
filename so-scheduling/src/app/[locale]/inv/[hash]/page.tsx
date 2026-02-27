'use client';


import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { InvoiceType } from '@/types';
import { Loader2, Phone, Mail, Clock, MapPin, Printer } from 'lucide-react';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';

function InvHeader({ children }: { children: React.ReactNode }) {
  return (<h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 border-b-1 border-gray-400 pb-1">{children}</h3>)
}

export default function InvoicePage() {
  const params = useParams();
  const t = useTranslations('Common');
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
        if (invRes.ok) setInvoice(await resToJSON(invRes));
        if (termsRes.ok) {
          const data = await resToJSON(termsRes);
          setTerms(data.content);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const resToJSON = (res: Response) => res.json();
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

  return (
    <div className="min-h-screen bg-gray-400 py-12 px-4 sm:px-6 font-sans text-gray-900 print:bg-white print:py-0 print:px-0">

      {/* Floating Print Button */}
      <button
        onClick={() => window.print()}
        className="fixed bottom-8 right-8 z-[150] no-print flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-full font-black uppercase text-sm tracking-widest hover:bg-black transition shadow-2xl scale-100 hover:scale-105 active:scale-95 duration-200 border-2 border-white/10"
      >
        <Printer className="w-5 h-5" /> {t('print')}
      </button>

      <div className="max-w-full mx-auto space-y-12 print:space-y-0 flex flex-col items-center pb-24 print:pb-0">

        {/* Invoice Page */}
        <div className="bg-white shadow-2xl w-[8.5in] h-[11in] print:w-full print:h-screen print:shadow-none print:border-none printable-area flex flex-col shrink-0 overflow-hidden relative p-[0.75in] print:p-[0.5in]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-6">
                <img src="/logo.jpg" alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex flex-col">
                  <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">The <span className="text-pink-700">Soaring Eagles</span></h1>
                  <p className="text-[11px] text-gray-500 font-black tracking-[0.2em] mt-2 uppercase">Lion & Dragon Dance</p>
                </div>
              </div>
              <div className="text-right flex flex-col">
                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none text-gray-900">
                  {t('invoice')} #{String(snapshot.eventNumber || 0).padStart(4, '0')}
                </h2>
                <p className="text-[11px] text-gray-400 font-black tracking-[0.2em] mt-2 uppercase">
                  {moment(invoice.createdAt).format('MMMM D, YYYY')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-16 mb-12">
              <div>
                <InvHeader>{t('billTo')}</InvHeader>
                <div className="space-y-3 text-xs">
                  {snapshot.companyName && (
                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Company</span>
                      <p className="font-bold text-gray-900">{snapshot.companyName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Client Name</span>
                    <p className="font-bold text-gray-900">{snapshot.clientName}</p>
                  </div>
                  {snapshot.clientPhone && (
                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Phone Number</span>
                      <p className="font-medium text-gray-700">{snapshot.clientPhone}</p>
                    </div>
                  )}
                  {snapshot.clientEmail && (
                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Email Address</span>
                      <p className="font-medium text-gray-700">{snapshot.clientEmail}</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <InvHeader>{t('eventDetails')}</InvHeader>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Show / Performance</span>
                    <p className="font-bold text-gray-900">{snapshot.show}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Performance Date</span>
                    <p className="font-bold text-gray-900">{moment.utc(snapshot.date).format('dddd, MMMM D, YYYY')}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Performance Time</span>
                    <p className="font-bold text-gray-900">{snapshot.startTime} - {snapshot.endTime}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Location</span>
                    <p className="font-medium text-gray-700">{snapshot.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-1 border-gray-400">
                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('description')}</th>
                    <th className="py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineItems.map((item, i) => (
                    <tr key={i}>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-base">{item.desc}</span>
                          {item.subtext && <span className="text-[11px] text-gray-400 font-medium mt-1 uppercase tracking-wider">{item.subtext}</span>}
                        </div>
                      </td>
                      <td className="py-8 text-right font-black text-gray-900 text-lg">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-8">
              <div className="w-full max-w-[280px] border-t-1 border-gray-400">
                <div className="flex justify-between items-center py-2">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('totalDue')}</span>
                  <span className="text-2xl font-black text-gray-900">${finalDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col gap-2">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('contractAgreement')}</h4>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic">{t('contractText')}</p>
            </div>
          </div>
        </div>

        {/* Terms Page */}
        <div className="bg-white shadow-2xl w-[8.5in] h-[11in] print:w-full print:h-screen print:shadow-none print:border-none print:break-before-page printable-area flex flex-col shrink-0 overflow-hidden relative p-[0.75in] print:p-[0.5in]">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="border-b-1 border-gray-700 pb-4 mb-1 flex justify-between items-end shrink-0">
              <h2 className="text-3xl font-black uppercase tracking-tighter">{t('termsTitle')}</h2>
              {/* <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Page 2 / 2</span> */}
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="terms-markdown-container">
                <ReactMarkdown>{terms}</ReactMarkdown>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-lg opacity-50 grayscale" />
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">The Soaring Eagles</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .terms-markdown-container {
          font-family: var(--font-roboto), ui-sans-serif, system-ui, sans-serif;
          font-size: 10px;
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
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: #111827;
        }
        .terms-markdown-container h1 { font-size: 1.25em; }
        .terms-markdown-container h2 { font-size: 1.1em; }
        .terms-markdown-container h3 { font-size: 1em; }
        .terms-markdown-container p { margin-bottom: 0.75em; text-align: justify; }
        .terms-markdown-container ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .terms-markdown-container li { margin-bottom: 0.4em; }

        @media screen {
          .printable-area {
            transform-origin: top center;
          }
          @media (max-width: 8.5in) {
            .printable-area { transform: scale(calc(100vw / 850)); }
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
    </div>
  );
}
