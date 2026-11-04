'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AccountListItem, MonthlyFinancial } from '@yakin/types'
import { formatTaka, formatDate, toBengaliNumber } from '@yakin/utils'
import { Calculator, BookOpen, TrendingUp, TrendingDown, DollarSign, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে']

interface JournalLine { accountId: string; debit: string; credit: string; narration: string }
interface JournalEntryItem {
  id: string; refNo: string; date: string; description: string; descriptionBn?: string
  voucherType: string; isPosted: boolean; createdAt: string
  lines: Array<{ account: { code: string; name: string; nameBn?: string }; debit: number; credit: number }>
}

const VOUCHER_TYPE_BN: Record<string, string> = {
  JOURNAL: 'জার্নাল', PAYMENT: 'পেমেন্ট', RECEIPT: 'রসিদ', CONTRA: 'কন্ট্রা',
}

export default function AccountingPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'overview' | 'accounts' | 'journal'>('overview')
  const [showForm, setShowForm] = useState(false)
  const [jForm, setJForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '', descriptionBn: '', voucherType: 'JOURNAL',
  })
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: '', debit: '', credit: '', narration: '' },
    { accountId: '', debit: '', credit: '', narration: '' },
  ])
  const [jError, setJError] = useState('')

  const { data: monthly } = useQuery({
    queryKey: ['monthly-financials'],
    queryFn: () => api.get<{ data: MonthlyFinancial[] }>('/api/dashboard/monthly-financials').then(r => r.data.data),
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get<{ data: AccountListItem[] }>('/api/accounting/accounts').then(r => r.data.data),
    enabled: tab === 'accounts' || (tab === 'journal' && showForm),
  })

  const { data: journalEntries } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => api.get<{ data: JournalEntryItem[] }>('/api/accounting/journal-entries').then(r => r.data.data),
    enabled: tab === 'journal',
  })

  const postMutation = useMutation({
    mutationFn: (entryId: string) => api.post(`/api/accounting/journal-entries/${entryId}/post`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-entries'] }),
  })

  const journalMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/api/accounting/journal-entries', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-entries'] })
      setShowForm(false)
      setJForm({ date: new Date().toISOString().slice(0, 10), description: '', descriptionBn: '', voucherType: 'JOURNAL' })
      setLines([{ accountId: '', debit: '', credit: '', narration: '' }, { accountId: '', debit: '', credit: '', narration: '' }])
      setJError('')
    },
    onError: (e: { response?: { data?: { messageBn?: string; message?: string } } }) => {
      setJError(e.response?.data?.messageBn ?? e.response?.data?.message ?? 'ত্রুটি হয়েছে')
    },
  })

  function submitJournal() {
    setJError('')
    if (!jForm.description) { setJError('বিবরণ আবশ্যক'); return }
    const linesData = lines.map(l => ({
      accountId: l.accountId,
      debit: l.debit ? Math.round(parseFloat(l.debit) * 100) : 0,
      credit: l.credit ? Math.round(parseFloat(l.credit) * 100) : 0,
      narration: l.narration || undefined,
    }))
    const totalDebit = linesData.reduce((s, l) => s + l.debit, 0)
    const totalCredit = linesData.reduce((s, l) => s + l.credit, 0)
    if (totalDebit !== totalCredit) { setJError(`ডেবিট (${formatTaka(totalDebit)}) ও ক্রেডিট (${formatTaka(totalCredit)}) সমান নয়`); return }
    if (linesData.some(l => !l.accountId)) { setJError('সব লাইনে অ্যাকাউন্ট বেছে নিন'); return }
    journalMutation.mutate({ ...jForm, lines: linesData })
  }

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
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0e1523] font-bengali">জার্নাল এন্ট্রিসমূহ</h2>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#0a1c3b] transition">
              <Plus size={14} /> নতুন এন্ট্রি
            </button>
          </div>

          {/* Journal entries list */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {(!journalEntries || journalEntries.length === 0) ? (
              <div className="p-10 text-center">
                <BookOpen size={36} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 font-bengali">কোনো জার্নাল এন্ট্রি নেই</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {journalEntries.map(je => (
                  <div key={je.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-gray-400">{je.refNo}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bengali">{VOUCHER_TYPE_BN[je.voucherType] ?? je.voucherType}</span>
                          {je.isPosted
                            ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bengali flex items-center gap-1"><CheckCircle2 size={10} />পোস্টেড</span>
                            : <button onClick={() => postMutation.mutate(je.id)} disabled={postMutation.isPending}
                                className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 font-bengali transition">
                                পোস্ট করুন
                              </button>
                          }
                        </div>
                        <p className="text-sm font-medium text-[#0e1523] font-bengali mt-0.5">{je.descriptionBn ?? je.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(je.date)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400 font-bengali">মোট ডেবিট</p>
                        <p className="text-sm font-bold text-[#0f2d5e] font-bengali">
                          {formatTaka(je.lines.reduce((s, l) => s + l.debit, 0))}
                        </p>
                      </div>
                    </div>
                    <table className="w-full text-xs mt-2">
                      <thead>
                        <tr className="text-gray-400">
                          <th className="text-left pb-1 font-normal font-bengali">অ্যাকাউন্ট</th>
                          <th className="text-right pb-1 font-normal font-bengali">ডেবিট</th>
                          <th className="text-right pb-1 font-normal font-bengali">ক্রেডিট</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {je.lines.map((line, i) => (
                          <tr key={i}>
                            <td className="py-0.5 font-bengali text-[#0e1523]">
                              <span className="font-mono text-gray-400 mr-1">{line.account.code}</span>
                              {line.account.nameBn ?? line.account.name}
                            </td>
                            <td className="py-0.5 text-right text-emerald-700">{line.debit ? formatTaka(line.debit) : '—'}</td>
                            <td className="py-0.5 text-right text-red-600">{line.credit ? formatTaka(line.credit) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New entry form modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-[#0e1523] font-bengali">নতুন জার্নাল এন্ট্রি</h3>
                  <button onClick={() => { setShowForm(false); setJError('') }} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
                </div>
                <div className="p-6 space-y-4">
                  {jError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm font-bengali">{jError}</div>}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 font-bengali mb-1">তারিখ <span className="text-red-500">*</span></label>
                      <input type="date" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/30"
                        value={jForm.date} onChange={e => setJForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 font-bengali mb-1">ভাউচার ধরন</label>
                      <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/30 font-bengali"
                        value={jForm.voucherType} onChange={e => setJForm(f => ({ ...f, voucherType: e.target.value }))}>
                        {Object.entries(VOUCHER_TYPE_BN).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-1" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 font-bengali mb-1">বিবরণ (ইংরেজি) <span className="text-red-500">*</span></label>
                    <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/30"
                      value={jForm.description} onChange={e => setJForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 font-bengali mb-1">বিবরণ (বাংলা)</label>
                    <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/30 font-bengali"
                      value={jForm.descriptionBn} onChange={e => setJForm(f => ({ ...f, descriptionBn: e.target.value }))} placeholder="বাংলায় বিবরণ" />
                  </div>

                  {/* Lines */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-600 font-bengali uppercase tracking-wide">লেনদেন লাইন</label>
                      <button onClick={() => setLines(ls => [...ls, { accountId: '', debit: '', credit: '', narration: '' }])}
                        className="text-xs text-[#0f2d5e] font-bengali flex items-center gap-1 hover:underline">
                        <Plus size={12} /> লাইন যুক্ত করুন
                      </button>
                    </div>
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs text-gray-500">
                            <th className="px-3 py-2 text-left font-semibold font-bengali">অ্যাকাউন্ট</th>
                            <th className="px-3 py-2 text-right font-semibold font-bengali w-28">ডেবিট (৳)</th>
                            <th className="px-3 py-2 text-right font-semibold font-bengali w-28">ক্রেডিট (৳)</th>
                            <th className="w-8" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {lines.map((line, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">
                                <select className="w-full text-sm border-0 bg-transparent focus:outline-none font-bengali"
                                  value={line.accountId}
                                  onChange={e => setLines(ls => ls.map((l, j) => j === i ? { ...l, accountId: e.target.value } : l))}>
                                  <option value="">— অ্যাকাউন্ট বাছাই করুন —</option>
                                  {(accounts ?? []).map(a => (
                                    <option key={a.id} value={a.id}>{a.code} — {a.nameBn ?? a.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" min="0" step="0.01"
                                  className="w-full text-sm text-right border-0 bg-transparent focus:outline-none"
                                  placeholder="0.00" value={line.debit}
                                  onChange={e => setLines(ls => ls.map((l, j) => j === i ? { ...l, debit: e.target.value, credit: e.target.value ? '' : l.credit } : l))} />
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" min="0" step="0.01"
                                  className="w-full text-sm text-right border-0 bg-transparent focus:outline-none"
                                  placeholder="0.00" value={line.credit}
                                  onChange={e => setLines(ls => ls.map((l, j) => j === i ? { ...l, credit: e.target.value, debit: e.target.value ? '' : l.debit } : l))} />
                              </td>
                              <td className="px-2 py-2">
                                {lines.length > 2 && (
                                  <button onClick={() => setLines(ls => ls.filter((_, j) => j !== i))}
                                    className="text-gray-300 hover:text-red-500 transition">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 text-xs font-semibold text-gray-600">
                            <td className="px-3 py-2 font-bengali">মোট</td>
                            <td className="px-3 py-2 text-right text-emerald-700">
                              {formatTaka(lines.reduce((s, l) => s + (l.debit ? Math.round(parseFloat(l.debit) * 100) : 0), 0))}
                            </td>
                            <td className="px-3 py-2 text-right text-red-600">
                              {formatTaka(lines.reduce((s, l) => s + (l.credit ? Math.round(parseFloat(l.credit) * 100) : 0), 0))}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
                  <button onClick={() => { setShowForm(false); setJError('') }}
                    className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50">
                    বাতিল
                  </button>
                  <button onClick={submitJournal} disabled={journalMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#0a1c3b] disabled:opacity-50 transition">
                    {journalMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                    সংরক্ষণ করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
