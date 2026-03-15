'use client';

import React, { useState, useEffect } from 'react';
import { Save, UserPlus, Shield, Users, Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SettingsView() {
  const t = useTranslations('Common');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    adminPassword: '',
    salesAssociates: [] as string[],
    allowedTeamMembers: [] as string[]
  });

  const [saInput, setSaInput] = useState('');
  const [tmInput, setTmInput] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const auth = localStorage.getItem('soaring_admin_session');
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': auth || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const auth = localStorage.getItem('soaring_admin_session');
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth || ''
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert('Settings saved successfully');
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings', err);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const addSalesAssociate = () => {
    const trimmed = saInput.trim();
    if (trimmed) {
      if (settings.salesAssociates.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
        alert('This associate is already in the list.');
        return;
      }
      setSettings({
        ...settings,
        salesAssociates: [...settings.salesAssociates, trimmed]
      });
      setSaInput('');
    }
  };

  const removeSalesAssociate = (index: number) => {
    setSettings({
      ...settings,
      salesAssociates: settings.salesAssociates.filter((_, i) => i !== index)
    });
  };

  const addTeamMember = () => {
    const normalized = tmInput.trim().toLowerCase();
    if (normalized) {
      if (settings.allowedTeamMembers.includes(normalized)) {
        alert('This team member is already in the list.');
        return;
      }
      setSettings({
        ...settings,
        allowedTeamMembers: [...settings.allowedTeamMembers, normalized]
      });
      setTmInput('');
    }
  };

  const removeTeamMember = (index: number) => {
    setSettings({
      ...settings,
      allowedTeamMembers: settings.allowedTeamMembers.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-base">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-text">System Settings</h2>
            <p className="text-subtext0 mt-1">Configure your admin portal and team permissions.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex mx-auto w-full text-center items-center px-6 py-2.5 bg-accent text-crust rounded-xl font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <div className="flex mx-auto">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Save Changes
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Admin Password */}
          <div className="bg-mantle p-6 rounded-2xl border border-surface0 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-accent mb-2">
              <Shield className="w-6 h-6" />
              <h3 className="text-lg font-bold text-text">Security</h3>
            </div>
            <div>
              <label className="block text-xs font-bold text-subtext0 uppercase tracking-wider mb-2">Admin Password</label>
              <input
                type="text"
                value={settings.adminPassword}
                onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                className="w-full bg-crust border border-surface0 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-mono"
              />
              <p className="text-[10px] text-subtext1 mt-2">This password is used to access the admin portal.</p>
            </div>
          </div>

          {/* Sales Associates */}
          <div className="bg-mantle p-6 rounded-2xl border border-surface0 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-accent mb-2">
              <UserPlus className="w-6 h-6" />
              <h3 className="text-lg font-bold text-text">Sales Associates</h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saInput}
                  onChange={(e) => setSaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSalesAssociate()}
                  placeholder="Add associate name..."
                  className="flex-1 bg-crust border border-surface0 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
                <button
                  onClick={addSalesAssociate}
                  className="bg-surface0 text-text p-3 rounded-xl hover:bg-surface1 transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {settings.salesAssociates.map((name, i) => (
                  <span key={i} className="flex items-center gap-2 bg-crust border border-surface0 text-text px-3 py-1.5 rounded-lg text-sm shadow-sm">
                    {name}
                    <button onClick={() => removeSalesAssociate(i)} className="text-subtext0 hover:text-red-400"><X className="w-4 h-4" /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Allowed Team Members */}
          <div className="bg-mantle p-6 rounded-2xl border border-surface0 shadow-sm space-y-4 md:col-span-2">
            <div className="flex items-center gap-3 text-accent mb-2">
              <Users className="w-6 h-6" />
              <h3 className="text-lg font-bold text-text">Allowed Team Members</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-subtext0">List the full names of team members who are permitted to add themselves to shows in the Viewer App.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tmInput}
                  onChange={(e) => setTmInput(e.target.value.toLowerCase())}
                  onKeyDown={(e) => e.key === 'Enter' && addTeamMember()}
                  placeholder="Add team member name..."
                  className="flex-1 bg-crust border border-surface0 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
                <button
                  onClick={addTeamMember}
                  className="bg-surface0 text-text p-3 rounded-xl hover:bg-surface1 transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {settings.allowedTeamMembers.map((name, i) => (
                  <span key={i} className="flex items-center gap-2 bg-crust border border-surface0 text-text px-3 py-1.5 rounded-lg text-sm shadow-sm group">
                    {name}
                    <button onClick={() => removeTeamMember(i)} className="text-subtext0 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                  </span>
                ))}
                {settings.allowedTeamMembers.length === 0 && (
                  <div className="w-full py-4 text-center border-2 border-dashed border-surface0 rounded-2xl text-subtext1 italic">
                    No team members defined. If empty, anyone can add their name in the Viewer App.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
