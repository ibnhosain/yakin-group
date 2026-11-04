'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatTaka, formatDate, getStatusLabelBn } from '@yakin/utils'
import { ArrowLeft, User, Phone, Mail, MapPin, Shield, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  EXPIRED:   'bg-gray-100 text-gray-600 border-gray-200',
  REJECTED:  'bg-red-100 text-red-800 border-red-300',
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-400 font-bengali w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[#0e1523] font-bengali">{value}</span>
    </div>
  )
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const [statusNote, setStatusNote] = useState('')
  const [showStatusModal, setShowStatusModal] = useState<string | null>(null)

  const { data: raw, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => api.get<{ data: Record<string, unknown> }>(`/api/members/${id}`).then(r => r.data.data),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/api/members/${id}/status`, { status, note: statusNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member', id] })
      qc.invalidateQueries({ queryKey: ['members'] })
      setShowStatusModal(null)
      setStatusNote('')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#0f2d5e]" size={28} />
      </div>
    )
  }

  if (!raw) {
    return (
      <div className="text-center py-16 text-gray-400 font-bengali">
        <AlertTriangle size={36} className="mx-auto mb-3" />
        সদস্য পাওয়া যায়নি
      </div>
    )
  }

  const m = raw as {
    id: string; memberNo: string; status: string; membershipDate: string;
    nidNumber?: string; dateOfBirth?: string; gender?: string; address?: string; permanentAddress?: string;
    nomineeName?: string; nomineeRelation?: string; nomineePhone?: string;
    totalShares: number; totalInvested: number;
    user: { fullName: string; fullNameBn?: string; email?: string; phone?: string };
    category: { nameBn?: string; name: string };
    shares: { id: string; quantity: number; pricePerShare: number; purchaseDate: string }[];
    payments: { id: string; amount: number; paymentDate: string; paymentType: string; referenceNo?: string }[];
  }

  const genderLabel = m.gender === 'MALE' ? 'পুরুষ' : m.gender === 'FEMALE' ? 'মহিলা' : m.gender === 'OTHER' ? 'অন্যান্য' : null

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/members" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#0e1523] font-bengali">{m.user.fullName}</h1>
            <p className="text-sm text-gray-500 font-mono">{m.memberNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border font-bengali ${STATUS_COLORS[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {getStatusLabelBn(m.status)}
          </span>
          {m.status !== 'SUSPENDED' && (
            <button onClick={() => setShowStatusModal('SUSPENDED')}
              className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bengali transition">
              স্থগিত করুন
            </button>
          )}
          {m.status === 'PENDING' && (
            <button onClick={() => setShowStatusModal('ACTIVE')}
              className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bengali transition">
              অনুমোদন করুন
            </button>
          )}
          {m.status === 'SUSPENDED' && (
            <button onClick={() => setShowStatusModal('ACTIVE')}
              className="px-3 py-1.5 text-xs rounded-lg bg-[#0f2d5e] text-white hover:bg-[#0a1c3b] font-bengali transition">
              পুনরায় সক্রিয় করুন
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-bengali mb-1">মোট শেয়ার</p>
              <p className="text-2xl font-bold text-[#0f2d5e] tabular">{m.totalShares.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-bengali mb-1">মোট বিনিয়োগ</p>
              <p className="text-2xl font-bold text-emerald-600">{formatTaka(m.totalInvested)}</p>
            </div>
          </div>

          {/* Share history */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#0e1523] font-bengali mb-3">শেয়ার ইতিহাস</h3>
            {m.shares.length === 0 ? (
              <p className="text-sm text-gray-400 font-bengali text-center py-6">কোনো শেয়ার নেই</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 font-bengali border-b border-gray-100">
                    <th className="pb-2 text-left">তারিখ</th>
                    <th className="pb-2 text-right">পরিমাণ</th>
                    <th className="pb-2 text-right">প্রতি শেয়ার মূল্য</th>
                    <th className="pb-2 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {m.shares.map(s => (
                    <tr key={s.id}>
                      <td className="py-2 text-gray-600">{formatDate(s.purchaseDate)}</td>
                      <td className="py-2 text-right tabular">{s.quantity.toLocaleString()}</td>
                      <td className="py-2 text-right tabular">{formatTaka(s.pricePerShare)}</td>
                      <td className="py-2 text-right tabular font-semibold">{formatTaka(s.quantity * s.pricePerShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Payment history */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#0e1523] font-bengali mb-3">পেমেন্ট ইতিহাস</h3>
            {m.payments.length === 0 ? (
              <p className="text-sm text-gray-400 font-bengali text-center py-6">কোনো পেমেন্ট নেই</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 font-bengali border-b border-gray-100">
                    <th className="pb-2 text-left">তারিখ</th>
                    <th className="pb-2 text-left">ধরন</th>
                    <th className="pb-2 text-left">রেফারেন্স</th>
                    <th className="pb-2 text-right">পরিমাণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {m.payments.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 text-gray-600">{formatDate(p.paymentDate)}</td>
                      <td className="py-2 text-gray-600 font-bengali">{p.paymentType}</td>
                      <td className="py-2 text-gray-400 text-xs font-mono">{p.referenceNo ?? '—'}</td>
                      <td className="py-2 text-right tabular font-semibold text-emerald-700">{formatTaka(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Personal info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-bengali flex items-center gap-1.5">
              <User size={13} /> ব্যক্তিগত তথ্য
            </h3>
            <InfoRow label="বাংলা নাম" value={m.user.fullNameBn} />
            <InfoRow label="NID নম্বর" value={m.nidNumber} />
            <InfoRow label="জন্ম তারিখ" value={m.dateOfBirth ? formatDate(m.dateOfBirth) : null} />
            <InfoRow label="লিঙ্গ" value={genderLabel} />
            <InfoRow label="ক্যাটাগরি" value={m.category.nameBn ?? m.category.name} />
            <InfoRow label="যোগদান" value={formatDate(m.membershipDate)} />
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-bengali flex items-center gap-1.5">
              <Phone size={13} /> যোগাযোগ
            </h3>
            <InfoRow label="ফোন" value={m.user.phone} />
            <InfoRow label="ইমেইল" value={m.user.email} />
            <InfoRow label="বর্তমান ঠিকানা" value={m.address} />
            <InfoRow label="স্থায়ী ঠিকানা" value={m.permanentAddress} />
          </div>

          {/* Nominee */}
          {m.nomineeName && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-bengali flex items-center gap-1.5">
                <Shield size={13} /> নমিনি
              </h3>
              <InfoRow label="নাম" value={m.nomineeName} />
              <InfoRow label="সম্পর্ক" value={m.nomineeRelation} />
              <InfoRow label="ফোন" value={m.nomineePhone} />
            </div>
          )}
        </div>
      </div>

      {/* Status change modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-[#0e1523] font-bengali mb-1">
              {showStatusModal === 'ACTIVE' ? 'সক্রিয় করুন' : 'স্থগিত করুন'}
            </h3>
            <p className="text-sm text-gray-500 font-bengali mb-4">কারণ লিখুন (ঐচ্ছিক)</p>
            <textarea
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-bengali focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/30 mb-4"
              rows={3}
              placeholder="কারণ লিখুন..."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowStatusModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600">বাতিল</button>
              <button
                onClick={() => statusMutation.mutate(showStatusModal)}
                disabled={statusMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0f2d5e] text-white text-sm font-bengali disabled:opacity-50"
              >
                {statusMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
