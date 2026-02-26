'use client';
import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 shadow-2xl flex items-center transition transform hover:scale-105 active:scale-95 border-2 border-white/10"
    >
      <Printer className="w-5 h-5 mr-2 pointer-events-none" /> Print Invoice
    </button>
  );
}
