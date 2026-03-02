'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export default function TOSPage() {
  const [terms, setTerms] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/terms');
        if (res.ok) {
          const data = await res.json();
          setTerms(data.content);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white text-gray-900">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 font-sans text-gray-900 print:bg-white print:py-0 print:px-0">
      
      {/* Floating Buttons */}
      <div className="fixed bottom-8 right-8 z-[150] no-print flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-full font-black uppercase text-sm tracking-widest hover:bg-black transition shadow-2xl border-2 border-white/10"
        >
          <Printer className="w-5 h-5" /> Print
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 print:shadow-none print:border-none p-8 sm:p-12 md:p-16">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 border-b border-gray-100 pb-8">
            <div className="flex items-center gap-4">
              <img src="/logo.jpg" alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <h1 className="text-2xl font-black uppercase leading-none">The <span className="text-pink-700">Soaring Eagles</span></h1>
                <p className="text-gray-400 font-bold tracking-[0.2em] mt-1 text-[10px] uppercase">Lion & Dragon Dance</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-xl font-bold uppercase tracking-tighter text-gray-900">Terms & Conditions</h2>
              <p className="text-gray-400 text-xs font-bold mt-1 uppercase">Effective February 2026</p>
            </div>
          </div>

          <div className="terms-container">
            <ReactMarkdown>{terms}</ReactMarkdown>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em]">
              © {new Date().getFullYear()} The Soaring Eagles Lion & Dragon Dance Arts
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .terms-container {
          font-family: var(--font-roboto), ui-sans-serif, system-ui, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #374151;
        }
        .terms-container h1 {
          font-size: 1.5rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          color: #111827;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 0.5rem;
        }
        .terms-container h1:first-child {
          margin-top: 0;
        }
        .terms-container p {
          margin-bottom: 1.25rem;
          text-align: justify;
        }
        .terms-container ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .terms-container li {
          margin-bottom: 0.75rem;
        }
        
        @media print {
          @page { margin: 1in; size: letter; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .shadow-xl { box-shadow: none !important; }
          .rounded-2xl { border-radius: 0 !important; }
          .border { border: none !important; }
          .p-8, .p-12, .p-16 { padding: 0 !important; }
          .min-h-screen { min-height: 0 !important; }
          .py-12 { padding-top: 0 !important; padding-bottom: 0 !important; }
        }
      `}</style>
    </div>
  );
}
