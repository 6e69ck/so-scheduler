'use client';
import { CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface StripeButtonProps {
  amount: number;
  clientName: string;
  invoiceId: string;
}

export default function StripeButton({ amount, clientName, invoiceId }: StripeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          clientName,
          invoiceId,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Stripe integration requires API keys. Please configure STRIPE_SECRET_KEY in your .env file.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Failed to initiate payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePayment}
      disabled={loading}
      className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 shadow-2xl flex items-center transition transform hover:scale-105 active:scale-95 border-2 border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-5 h-5 mr-2 pointer-events-none" />
      )}
      Pay with Stripe
    </button>
  );
}
