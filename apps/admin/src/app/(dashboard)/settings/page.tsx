'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Settings, Building2, Users, Bell, Shield, Database, Save } from 'lucide-react'

interface SystemSetting {
  key: string; value: string; description?: string; group: string
}

const TABS = [
  { id: 'general', label: 'সাধারণ', icon: Settings },
  { id: 'company', label: 'প্রতিষ্ঠান', icon: Building2 },
  { id: 'notifications', label: 'বিজ্ঞপ্তি', icon: Bell },
  { id: 'security', label: 'নিরাপত্তা', icon: Shield },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('general')
  const [form, setForm] = useState<Record<string, string>>({})
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () =>
      api.get<{ data: SystemSetting[] }>('/api/settings').then(r => {
        const settings = r.data.data
        const obj: Record<string, string> = {}
        settings.forEach(s => { obj[s.key] = s.value })
        return { settings, obj }
      }),
    onSuccess: ({ obj }) => setForm(obj),
  } as any)

  const saveSettings = useMutation({
    mutationFn: (updates: Record<string, string>) =>
      api.patch('/api/settings', { settings: updates }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0e1523] font-bengali">সিস্টেম সেটিংস</h1>
        <p className="text-sm text-gray-500 font-bengali mt-0.5">সিস্টেম কনফিগারেশন পরিবর্তন করুন</p>
      </div>

      <div className="flex gap-5">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bengali transition ${
                tab === t.id ? 'bg-[#0f2d5e] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 p-6">
          {tab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#0e1523] font-bengali">সাধারণ সেটিংস</h2>
              {[
                { key: 'app_name', label: 'অ্যাপ্লিকেশনের নাম', type: 'text' },
                { key: 'app_name_bn', label: 'অ্যাপের নাম (বাংলা)', type: 'text' },
                { key: 'timezone', label: 'টাইমজোন', type: 'text' },
                { key: 'currency', label: 'মুদ্রা', type: 'text' },
                { key: 'date_format', label: 'তারিখের ফরম্যাট', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-700 font-bengali mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20"
                  />
                </div>
              ))}
              <button
                onClick={() => saveSettings.mutate(form)}
                disabled={saveSettings.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#1a3f7a] transition disabled:opacity-50">
                <Save size={15} /> {saveSettings.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          )}

          {tab === 'company' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#0e1523] font-bengali">প্রতিষ্ঠানের তথ্য</h2>
              {[
                { key: 'company_name', label: 'প্রতিষ্ঠানের নাম', type: 'text' },
                { key: 'company_name_bn', label: 'প্রতিষ্ঠানের নাম (বাংলা)', type: 'text' },
                { key: 'company_address_bn', label: 'ঠিকানা', type: 'textarea' },
                { key: 'company_phone', label: 'ফোন নম্বর', type: 'text' },
                { key: 'company_email', label: 'ইমেইল', type: 'email' },
                { key: 'company_trade_license', label: 'ট্রেড লাইসেন্স', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-700 font-bengali mb-1">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={form[field.key] ?? ''}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20 resize-none"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={form[field.key] ?? ''}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20"
                    />
                  )}
                </div>
              ))}
              <button
                onClick={() => saveSettings.mutate(form)}
                disabled={saveSettings.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#1a3f7a] transition disabled:opacity-50">
                <Save size={15} /> {saveSettings.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#0e1523] font-bengali">বিজ্ঞপ্তি সেটিংস</h2>
              {[
                { key: 'notify_new_member', label: 'নতুন সদস্য যুক্ত হলে বিজ্ঞপ্তি দিন' },
                { key: 'notify_investment', label: 'বিনিয়োগ আবেদন এলে বিজ্ঞপ্তি দিন' },
                { key: 'notify_approval_pending', label: 'অনুমোদন মুলতুবি থাকলে বিজ্ঞপ্তি দিন' },
                { key: 'notify_payroll_due', label: 'বেতন দিন আসলে বিজ্ঞপ্তি দিন' },
              ].map(field => (
                <label key={field.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm font-bengali text-gray-700">{field.label}</span>
                  <input
                    type="checkbox"
                    checked={form[field.key] === 'true'}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.checked ? 'true' : 'false' }))}
                    className="w-4 h-4 text-[#0f2d5e] rounded"
                  />
                </label>
              ))}
              <button
                onClick={() => saveSettings.mutate(form)}
                className="flex items-center gap-2 px-5 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#1a3f7a] transition">
                <Save size={15} /> সংরক্ষণ করুন
              </button>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-[#0e1523] font-bengali">নিরাপত্তা সেটিংস</h2>
              {[
                { key: 'session_timeout', label: 'সেশন টাইমআউট (মিনিট)', type: 'number' },
                { key: 'max_login_attempts', label: 'সর্বোচ্চ লগিন চেষ্টা', type: 'number' },
                { key: 'lockout_duration', label: 'লক সময় (মিনিট)', type: 'number' },
                { key: 'password_min_length', label: 'পাসওয়ার্ড ন্যূনতম দৈর্ঘ্য', type: 'number' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-700 font-bengali mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key] ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20"
                  />
                </div>
              ))}
              <button
                onClick={() => saveSettings.mutate(form)}
                className="flex items-center gap-2 px-5 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#1a3f7a] transition">
                <Save size={15} /> সংরক্ষণ করুন
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
