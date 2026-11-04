'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatTaka, formatDate } from '@yakin/utils'
import { ArrowLeft, Loader2, AlertTriangle, Building2, Phone, Mail, MapPin } from 'lucide-react'
import Link from 'next/link'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-400 font-bengali w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[#0e1523] font-bengali">{value}</span>
    </div>
  )
}

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: raw, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: () => api.get<{ data: Record<string, unknown> }>(`/api/businesses/${id}`).then(r => r.data.data),
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0f2d5e]" size={28} /></div>
  if (!raw) return <div className="text-center py-16 text-gray-400 font-bengali"><AlertTriangle size={36} className="mx-auto mb-3" />ব্যবসা পাওয়া যায়নি</div>

  const biz = raw as {
    id: string; name: string; nameBn?: string; status: string;
    description?: string; descriptionBn?: string;
    phone?: string; email?: string; address?: string; addressBn?: string;
    tradeLicense?: string; establishedDate?: string; createdAt: string;
    category?: { name: string; nameBn?: string };
    investments: { id: string; amount: number; createdAt: string; investor?: { fullName: string; fullNameBn?: string } }[];
  }

  const totalInvestment = biz.investments?.reduce((s, i) => s + i.amount, 0) ?? 0

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/businesses" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-bold text-[#0e1523] font-bengali">{biz.nameBn ?? biz.name}</h1>
            <p className="text-sm text-gray-400">{biz.name}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold font-bengali border ${biz.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {biz.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: investments */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-bengali mb-1">মোট বিনিয়োগ</p>
              <p className="text-2xl font-bold text-[#0f2d5e]">{formatTaka(totalInvestment)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-bengali mb-1">বিনিয়োগকারী সংখ্যা</p>
              <p className="text-2xl font-bold text-emerald-600">{biz.investments?.length ?? 0} জন</p>
            </div>
          </div>

          {biz.descriptionBn && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-[#0e1523] font-bengali mb-2">বিবরণ</h3>
              <p className="text-sm text-gray-600 font-bengali leading-relaxed">{biz.descriptionBn}</p>
            </div>
          )}

          {/* Investment list */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#0e1523] font-bengali mb-3 flex items-center gap-1.5">
              <Building2 size={15} /> বিনিয়োগ তালিকা
            </h3>
            {!biz.investments?.length ? (
              <p className="text-sm text-gray-400 font-bengali text-center py-8">কোনো বিনিয়োগ নেই</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 font-bengali border-b border-gray-100">
                    <th className="pb-2 text-left">বিনিয়োগকারী</th>
                    <th className="pb-2 text-left">তারিখ</th>
                    <th className="pb-2 text-right">পরিমাণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {biz.investments.map(inv => (
                    <tr key={inv.id}>
                      <td className="py-2.5 font-bengali">{inv.investor?.fullNameBn ?? inv.investor?.fullName ?? '—'}</td>
                      <td className="py-2.5 text-gray-500">{formatDate(inv.createdAt)}</td>
                      <td className="py-2.5 text-right tabular font-semibold">{formatTaka(inv.amount)}</td>
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
            <InfoRow label="ক্যাটাগরি" value={biz.category?.nameBn ?? biz.category?.name} />
            <InfoRow label="প্রতিষ্ঠা" value={biz.establishedDate ? formatDate(biz.establishedDate) : null} />
            <InfoRow label="ট্রেড লাইসেন্স" value={biz.tradeLicense} />
            <InfoRow label="ফোন" value={biz.phone} />
            <InfoRow label="ইমেইল" value={biz.email} />
            <InfoRow label="ঠিকানা" value={biz.addressBn ?? biz.address} />
          </div>
        </div>
      </div>
    </div>
  )
}
