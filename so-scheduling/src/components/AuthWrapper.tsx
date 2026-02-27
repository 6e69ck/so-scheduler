'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check localStorage for a persistent session
    const auth = localStorage.getItem('soaring_admin_session');
    // For this simple case, we just check if it exists. 
    // You could also store a timestamp and check if it's too old.
    if (auth === 'authenticated_session_v1') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('soaring_admin_session', data.token);
        setIsAuthenticated(true);
      } else {
        setError(true);
        setPassword('');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-base flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    );
  }

  const isPublicRoute = pathname.includes('/inv/');

  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="h-screen bg-crust flex items-center justify-center p-4 font-sans">
        <div className="bg-mantle border border-surface0 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-black text-text mb-2 tracking-tighter uppercase">
            Admin <span className="text-accent">Access</span>
          </h1>
          <p className="text-subtext0 text-sm mb-8">Please enter the administrative password.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                autoFocus
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className={`w-full bg-base border ${error ? 'border-red animate-shake' : 'border-surface1'} text-text rounded-xl p-4 outline-none focus:ring-2 focus:ring-accent/50 transition text-center text-lg tracking-widest`}
              />
              {error && <p className="text-red text-xs mt-2 font-bold uppercase tracking-widest">Incorrect Password</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent-hover text-crust font-black py-4 rounded-xl transition shadow-lg shadow-accent/20 uppercase tracking-widest disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-surface0 text-[10px] uppercase tracking-widest text-overlay0">
            Secure Terminal v1.1.0
          </div>
        </div>
        
        <style jsx global>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
