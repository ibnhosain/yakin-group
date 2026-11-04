'use client'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatTaka, formatDate } from '@yakin/utils'
import { ArrowLeft, Loader2, AlertTriangle, TrendingUp } from 'lucide-react'
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

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-400 font-bengali w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[#0e1523] font-bengali">{value}</span>
    </div>
  )
}

export default function InvestorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: raw, isLoading } = useQuery({
    queryKey: ['investor', id],
    queryFn: () => api.get<{ data: Record<string, unknown> }>(`/api/investors/${id}`).then(r => r.data.data),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/api/investors/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investor', id] }),
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0f2d5e]" size={28} /></div>
  if (!raw) return <div className="text-center py-16 text-gray-400 font-bengali"><AlertTriangle size={36} className="mx-auto mb-3" />বিনিয়োগকারী পাওয়া যায়নি</div>

  const inv = raw as {
    id: string; investorNo: string; fullName: string; fullNameBn?: string;
    phone?: string; email?: string; nidNo?: string; address?: string; addressBn?: string;
    status: string; totalInvestment: number; totalWithdrawn: number; createdAt: string;
    investments: { id: string; amount: number; status: string; createdAt: string; plan?: { nameBn?: string; name: string } }[];
  }

  const totalActive = inv.investments?.filter(i => i.status === 'ACTIVE').reduce((s, i) => s + i.amount, 0) ?? 0

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/investors" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-bold text-[#0e1523] font-bengali">{inv.fullName}</h1>
            <p className="text-sm text-gray-500 font-mono">{inv.investorNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: investments */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-bengali mb-1">সক্রিয় বিনিয়োগ</p>
              <p className="text-2xl font-bold text-[#0f2d5e]">{formatTaka(totalActive)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-bengali mb-1">মোট বিনিয়োগ</p>
              <p className="text-2xl font-bold text-emerald-600">{inv.investments?.length ?? 0} টি</p>
            </div>
          </div>

          {/* Investment list */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0e1523] font-bengali flex items-center gap-1.5">
                <TrendingUp size={15} /> বিনিয়োগ তালিকা
              </h3>
            </div>
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
                      <td className="py-2.5 text-gray-500">{formatDate(i.createdAt)}</td>
                      <td className="py-2.5 text-right tabular font-semibold">{formatTaka(i.amount)}</td>
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
            <InfoRow label="বাংলা নাম" value={inv.fullNameBn} />
            <InfoRow label="ফোন" value={inv.phone} />
            <InfoRow label="ইমেইল" value={inv.email} />
            <InfoRow label="NID নম্বর" value={inv.nidNo} />
            <InfoRow label="ঠিকানা" value={inv.addressBn ?? inv.address} />
            <InfoRow label="নিবন্ধন" value={formatDate(inv.createdAt)} />
          </div>
        </div>
      </div>
    </div>
  )
}
