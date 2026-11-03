'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AccountListItem, MonthlyFinancial } from '@yakin/types'
import { formatTaka, toBengaliNumber } from '@yakin/utils'
import { Calculator, BookOpen, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে']

export default function AccountingPage() {
  const [tab, setTab] = useState<'overview' | 'accounts' | 'journal'>('overview')

  const { data: monthly } = useQuery({
    queryKey: ['monthly-financials'],
    queryFn: () => api.get<{ data: MonthlyFinancial[] }>('/api/dashboard/monthly-financials').then(r => r.data.data),
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get<{ data: AccountListItem[] }>('/api/accounting/accounts').then(r => r.data.data),
    enabled: tab === 'accounts',
  })

  const { data: trialBalance } = useQuery({
    queryKey: ['trial-balance'],
    queryFn: () => api.get<{ data: { totalDebit: number; totalCredit: number; accounts: AccountListItem[] } }>('/api/accounting/trial-balance').then(r => r.data.data),
    enabled: tab === 'overview',
  })

  const chartData = (monthly ?? []).map(m => ({
    name: MONTHS_BN[(m.month - 1) % 12],
    আয়: Math.round(m.income / 100),
    ব্যয়: Math.round(m.expense / 100),
    মুনাফা: Math.round((m.income - m.expense) / 100),
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0e1523] font-bengali">হিসাব ব্যবস্থাপনা</h1>
        <p className="text-sm text-gray-500 font-bengali mt-0.5">ডাবল-এন্ট্রি বুককিপিং সিস্টেম</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['overview', 'accounts', 'journal'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold font-bengali transition ${tab === t ? 'bg-white shadow-sm text-[#0f2d5e]' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'overview' ? 'সারসংক্ষেপ' : t === 'accounts' ? 'চার্ট অব অ্যাকাউন্টস' : 'জার্নাল এন্ট্রি'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'মোট সম্পদ', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50', value: trialBalance?.accounts.filter(a => a.code.startsWith('1')).reduce((s, a) => s + a.balance, 0) ?? 0 },
              { label: 'মোট দায়', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50', value: trialBalance?.accounts.filter(a => a.code.startsWith('2')).reduce((s, a) => s + a.balance, 0) ?? 0 },
              { label: 'মোট আয়', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', value: trialBalance?.accounts.filter(a => a.code.startsWith('4')).reduce((s, a) => s + a.balance, 0) ?? 0 },
              { label: 'মোট ব্যয়', icon: Calculator, color: 'text-amber-600', bg: 'bg-amber-50', value: trialBalance?.accounts.filter(a => a.code.startsWith('5')).reduce((s, a) => s + a.balance, 0) ?? 0 },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <card.icon size={18} className={card.color} />
                </div>
                <p className="text-xs text-gray-500 font-bengali mb-1">{card.label}</p>
                <p className={`text-lg font-bold font-bengali ${card.color}`}>{formatTaka(card.value)}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#0e1523] font-bengali mb-4">মাসিক আয়-ব্যয় বিশ্লেষণ</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Hind Siliguri' }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, '']} />
                <Bar dataKey="আয়" fill="#0f2d5e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ব্যয়" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'accounts' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">কোড</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">অ্যাকাউন্টের নাম</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">ধরন</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase font-bengali">ব্যালেন্স</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(accounts ?? []).map(acc => (
                  <tr key={acc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{acc.code}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-[#0e1523] font-bengali" style={{ paddingLeft: acc.level ? `${acc.level * 16}px` : 0 }}>
                        {acc.nameBn || acc.name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 font-bengali">
                      {acc.type === 'ASSET' ? 'সম্পদ' : acc.type === 'LIABILITY' ? 'দায়' : acc.type === 'EQUITY' ? 'ইকুইটি' : acc.type === 'INCOME' ? 'আয়' : 'ব্যয়'}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-semibold font-bengali text-sm ${acc.balance >= 0 ? 'text-[#0f2d5e]' : 'text-red-600'}`}>
                      {formatTaka(Math.abs(acc.balance))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'journal' && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <BookOpen size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-bengali font-medium">জার্নাল এন্ট্রি সিস্টেম</p>
          <p className="text-gray-400 text-sm font-bengali mt-1">ডাবল-এন্ট্রি বুককিপিং — নতুন লেনদেন যুক্ত করুন</p>
          <button className="mt-4 px-5 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#1a3f7a] transition">
            নতুন জার্নাল এন্ট্রি
          </button>
        </div>
      )}
    </div>
  )
}
