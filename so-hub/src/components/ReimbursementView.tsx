'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Receipt, CheckCircle2, Loader2, Calendar, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ReimbursementItem {
  id: string;
  startDate?: string;
  endDate?: string;
  dateRange?: string;
  name?: string;
  amount?: string;
  status: string;
  rawRow: string[];
}

interface ReimbursementViewProps {
  userName: string;
}

const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScvH9scZH6mJE5sOfxVKR0fNB5WOA3DGdnB4Ew9D9JwM15G4A/viewform";

export default function ReimbursementView({ userName }: ReimbursementViewProps) {
  const t = useTranslations('Hub');
  const [reimbursements, setReimbursements] = useState<ReimbursementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProcessedReimbursements = async (isManualRefresh = false) => {
    if (!userName.trim()) return;
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch(`/api/reimbursements?user=${encodeURIComponent(userName)}`);
      if (res.ok) {
        const data = await res.json();
        setReimbursements(data.reimbursements || []);
      }
    } catch (err) {
      console.error('Failed to fetch reimbursements from Google Sheets', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProcessedReimbursements();
  }, [userName]);

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto py-2">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-[#cdd6f4] tracking-tight">
          {t('reimbursementTitle')}
        </h2>
        <p className="text-xs md:text-sm text-[#a6adc8]">
          {t('reimbursementSub')}
        </p>
      </div>

      {/* Clean Google Form Action Card */}
      <div className="bg-[#181825] rounded-xl p-6 md:p-8 border border-[#313244] shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 rounded-xl bg-[#cba6f7]/20 border border-[#cba6f7]/40 flex items-center justify-center mx-auto text-[#cba6f7] shadow-[0_0_20px_rgba(203,166,247,0.2)]">
          <Receipt className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg md:text-xl font-bold text-[#cdd6f4]">
            Submit Expenses
          </h3>
          <p className="text-xs md:text-sm text-[#bac2de] max-w-md mx-auto leading-relaxed">
            Click below to open the official Google Reimbursement Form in a new tab.
          </p>
        </div>

        <a
          href={FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto py-3 px-8 rounded-xl bg-[#cba6f7] text-[#11111b] font-black text-sm hover:bg-[#b4befe] transition-all shadow-xl active:scale-[0.99]"
        >
          <ExternalLink className="w-4 h-4" />
          <span>{t('openGoogleForm')}</span>
        </a>
      </div>

      {/* Processed Reimbursements Section from Google Sheets */}
      <div className="space-y-4 pt-4 border-t border-[#313244]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base md:text-lg font-bold text-[#f5e0dc]">
              Processed Reimbursements
            </h3>
            <p className="text-xs text-[#a6adc8]">
              Reimbursements sent for <span className="text-[#cba6f7] font-semibold">{userName}</span>
            </p>
          </div>

          <button
            onClick={() => fetchProcessedReimbursements(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181825] hover:bg-[#313244] text-[#bac2de] hover:text-[#cdd6f4] border border-[#313244] text-xs font-semibold transition-all disabled:opacity-50"
            title="Refresh Processed Reimbursements"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#cba6f7]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8 bg-[#181825]/60 rounded-xl border border-[#313244] text-[#a6adc8] space-x-2 text-xs">
            <Loader2 className="w-4 h-4 text-[#cba6f7] animate-spin" />
            <span>Fetching processed reimbursements from Google Sheets...</span>
          </div>
        ) : reimbursements.length === 0 ? (
          <div className="p-8 bg-[#181825]/60 rounded-xl border border-[#313244] text-center space-y-1">
            <p className="text-xs font-semibold text-[#bac2de]">
              No processed reimbursements found yet.
            </p>
            <p className="text-[11px] text-[#6c7086]">
              When your expense claim is marked as "Sent" in the team sheet, it will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reimbursements.map((item) => (
              <div
                key={item.id}
                className="bg-[#181825] rounded-xl p-4 border border-[#313244] hover:border-[#45475a] transition-all space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#a6e3a1]/15 text-[#a6e3a1] border border-[#a6e3a1]/30 font-bold text-[10px] uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3 text-[#a6e3a1]" />
                      <span>Sent / Processed</span>
                    </span>
                  </div>

                  {item.amount && (
                    <div className="text-right shrink-0">
                      <span className="text-lg font-black text-[#a6e3a1]">
                        {item.amount}
                      </span>
                    </div>
                  )}
                </div>

                {item.dateRange && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-[#313244]/60 text-xs text-[#a6adc8] font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#89b4fa]" />
                    <span>{item.dateRange}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
