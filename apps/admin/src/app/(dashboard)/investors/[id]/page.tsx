'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatTaka, formatDate } from '@yakin/utils'
import { ArrowLeft, Loader2, AlertTriangle, TrendingUp, Edit2, X, Check } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  CLOSED:    'bg-gray-100 text-gray-500 border-gray-200',
}
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'সক্রিয়', PENDING: 'অপেক্ষমান', SUSPENDED: 'স্থগিত', CLOSED: 'বন্ধ',
  UNDER_REVIEW: 'পর্যালোচনাধীন', AGREEMENT_PENDING: 'চুক্তি অপেক্ষমান',
  PAYMENT_PENDING: 'পেমেন্ট অপেক্ষমান', MATURED: 'পরিপক্ব', REJECTED: 'প্রত্যাখ্যাত',
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/30 focus:border-[#0f2d5e] font-bengali'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-400 font-bengali w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[#0e1523] font-bengali">{value}</span>
    </div>
  )
}

interface InvestorDetail {
  id: string; investorNo: string; nidNumber?: string; address?: string;
  bankName?: string; bankAccount?: string; bankBranch?: string;
  totalInvested: number; totalWithdrawn: number; status: string; createdAt: string;
  user: { fullName: string; fullNameBn?: string; phone: string; email?: string };
  investments: Array<{
    id: string; investmentNo: string; principalAmount: number; status: string; startDate: string; endDate?: string;
    plan?: { name: string; nameBn?: string; returnRate?: number };
  }>;
}

export default function InvestorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [editError, setEditError] = useState('')

  const { data: inv, isLoading } = useQuery({
    queryKey: ['investor', id],
    queryFn: () => api.get<{ data: InvestorDetail }>(`/api/investors/${id}`).then(r => r.data.data),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/api/investors/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investor', id] }),
  })

  const editMutation = useMutation({
    mutationFn: (data: Record<string, string>) => api.patch(`/api/investors/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['investor', id] }); setEditing(false); setEditError('') },
    onError: (e: { response?: { data?: { messageBn?: string; message?: string } } }) => {
      setEditError(e.response?.data?.messageBn ?? e.response?.data?.message ?? 'ত্রুটি হয়েছে')
    },
  })

  function startEdit() {
    if (!inv) return
    setEditForm({
      fullName: inv.user.fullName,
      fullNameBn: inv.user.fullNameBn ?? '',
      phone: inv.user.phone,
      email: inv.user.email ?? '',
      nidNumber: inv.nidNumber ?? '',
      address: inv.address ?? '',
      bankName: inv.bankName ?? '',
      bankAccount: inv.bankAccount ?? '',
      bankBranch: inv.bankBranch ?? '',
    })
    setEditing(true)
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0f2d5e]" size={28} /></div>
  if (!inv) return <div className="text-center py-16 text-gray-400 font-bengali"><AlertTriangle size={36} className="mx-auto mb-3" />বিনিয়োগকারী পাওয়া যায়নি</div>

  const totalActive = inv.investments?.filter(i => i.status === 'ACTIVE').reduce((s, i) => s + i.principalAmount, 0) ?? 0

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/investors" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-bold text-[#0e1523] font-bengali">{inv.user.fullNameBn ?? inv.user.fullName}</h1>
            <p className="text-sm text-gray-500 font-mono">{inv.investorNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border font-bengali ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[inv.status] ?? inv.status}
          </span>
          {inv.status === 'ACTIVE' && (
            <button onClick={() => statusMutation.mutate('SUSPENDED')} disabled={statusMutation.isPending}
              className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bengali">
              স্থগিত করুন
            </button>
          )}
          {(inv.status === 'PENDING' || inv.status === 'SUSPENDED') && (
            <button onClick={() => statusMutation.mutate('ACTIVE')} disabled={statusMutation.isPending}
              className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bengali">
              সক্রিয় করুন
            </button>
          )}
          <button onClick={startEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-bengali">
            <Edit2 size={12} /> সম্পাদনা
          </button>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-[#0e1523] font-bengali">তথ্য সম্পাদনা</h3>
              <button onClick={() => { setEditing(false); setEditError('') }}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4">
              {editError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm font-bengali">{editError}</div>}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'fullName', label: 'নাম (ইংরেজি)' },
                  { key: 'fullNameBn', label: 'নাম (বাংলা)' },
                  { key: 'phone', label: 'ফোন' },
                  { key: 'email', label: 'ইমেইল' },
                  { key: 'nidNumber', label: 'NID নম্বর' },
                  { key: 'address', label: 'ঠিকানা' },
                  { key: 'bankName', label: 'ব্যাংক' },
                  { key: 'bankAccount', label: 'অ্যাকাউন্ট নম্বর' },
                  { key: 'bankBranch', label: 'ব্রাঞ্চ' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 font-bengali mb-1">{label}</label>
                    <input className={inputCls} value={editForm[key] ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
              <button onClick={() => { setEditing(false); setEditError('') }} className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50">বাতিল</button>
              <button onClick={() => editMutation.mutate(editForm)} disabled={editMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#0a1c3b] disabled:opacity-50">
                {editMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: investments */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-bengali mb-1">সক্রিয় বিনিয়োগ</p>
              <p className="text-2xl font-bold text-[#0f2d5e]">{formatTaka(totalActive)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-bengali mb-1">মোট বিনিয়োগ</p>
              <p className="text-2xl font-bold text-emerald-600 font-bengali">{inv.investments?.length ?? 0} টি</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#0e1523] font-bengali flex items-center gap-1.5 mb-3">
              <TrendingUp size={15} /> বিনিয়োগ তালিকা
            </h3>
            {!inv.investments?.length ? (
              <p className="text-sm text-gray-400 font-bengali text-center py-8">কোনো বিনিয়োগ নেই</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 font-bengali border-b border-gray-100">
                    <th className="pb-2 text-left">পরিকল্পনা</th>
                    <th className="pb-2 text-left">তারিখ</th>
                    <th className="pb-2 text-right">পরিমাণ</th>
                    <th className="pb-2 text-left">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inv.investments.map(i => (
                    <tr key={i.id}>
                      <td className="py-2.5 font-bengali">{i.plan?.nameBn ?? i.plan?.name ?? '—'}</td>
                      <td className="py-2.5 text-gray-500 text-xs">{formatDate(i.startDate)}</td>
                      <td className="py-2.5 text-right tabular font-semibold">{formatTaka(i.principalAmount)}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bengali ${STATUS_COLORS[i.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABEL[i.status] ?? i.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-bengali">তথ্য</h3>
            <InfoRow label="বাংলা নাম" value={inv.user.fullNameBn} />
            <InfoRow label="ফোন" value={inv.user.phone} />
            <InfoRow label="ইমেইল" value={inv.user.email} />
            <InfoRow label="NID নম্বর" value={inv.nidNumber} />
            <InfoRow label="ঠিকানা" value={inv.address} />
            <InfoRow label="নিবন্ধন" value={formatDate(inv.createdAt)} />
          </div>
          {(inv.bankName || inv.bankAccount) && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-bengali">ব্যাংক তথ্য</h3>
              <InfoRow label="ব্যাংক" value={inv.bankName} />
              <InfoRow label="অ্যাকাউন্ট" value={inv.bankAccount} />
              <InfoRow label="ব্রাঞ্চ" value={inv.bankBranch} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
