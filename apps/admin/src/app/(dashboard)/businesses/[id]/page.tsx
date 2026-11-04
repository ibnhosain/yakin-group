'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatTaka, formatDate, toBengaliNumber } from '@yakin/utils'
import { ArrowLeft, Loader2, AlertTriangle, Users, FolderKanban, Edit2, X, Check } from 'lucide-react'
import Link from 'next/link'

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/30 focus:border-[#0f2d5e] font-bengali'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-400 font-bengali w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[#0e1523] font-bengali">{value}</span>
    </div>
  )
}

interface BusinessDetail {
  id: string; name: string; nameBn?: string; status: string;
  description?: string; location?: string; capital: number;
  licenseNo?: string; taxId?: string; startedAt?: string; createdAt: string;
  category?: { name: string; nameBn?: string };
  projects: Array<{ id: string; name: string; nameBn?: string; status: string; progressPercent: number; budget: number }>;
  employees: Array<{ id: string; user: { fullName: string; fullNameBn?: string }; designation?: { name: string; nameBn?: string } }>;
}

const PROJECT_STATUS_BN: Record<string, string> = {
  PLANNING: 'পরিকল্পনা', ACTIVE: 'চলমান', ON_HOLD: 'স্থগিত', COMPLETED: 'সম্পন্ন', CANCELLED: 'বাতিল',
}
const PROJECT_STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-blue-50 text-blue-700', ACTIVE: 'bg-emerald-50 text-emerald-700',
  ON_HOLD: 'bg-amber-50 text-amber-700', COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-50 text-red-600',
}

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [editError, setEditError] = useState('')

  const { data: biz, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: () => api.get<{ data: BusinessDetail }>(`/api/businesses/${id}`).then(r => r.data.data),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/api/businesses/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business', id] }),
  })

  const editMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch(`/api/businesses/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['business', id] }); setEditing(false); setEditError('') },
    onError: (e: { response?: { data?: { messageBn?: string; message?: string } } }) => {
      setEditError(e.response?.data?.messageBn ?? e.response?.data?.message ?? 'ত্রুটি হয়েছে')
    },
  })

  function startEdit() {
    if (!biz) return
    setEditForm({
      name: biz.name, nameBn: biz.nameBn ?? '', description: biz.description ?? '',
      location: biz.location ?? '', capital: biz.capital ? String(biz.capital / 100) : '',
      licenseNo: biz.licenseNo ?? '', taxId: biz.taxId ?? '',
      startedAt: biz.startedAt ? biz.startedAt.slice(0, 10) : '',
    })
    setEditing(true)
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0f2d5e]" size={28} /></div>
  if (!biz) return <div className="text-center py-16 text-gray-400 font-bengali"><AlertTriangle size={36} className="mx-auto mb-3" />ব্যবসা পাওয়া যায়নি</div>

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
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold font-bengali border ${biz.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {biz.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
          </span>
          {biz.status === 'ACTIVE' ? (
            <button onClick={() => statusMutation.mutate('INACTIVE')} disabled={statusMutation.isPending}
              className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bengali">
              নিষ্ক্রিয় করুন
            </button>
          ) : (
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
              <button onClick={() => { setEditing(false); setEditError('') }}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              {editError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm font-bengali">{editError}</div>}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'name', label: 'নাম (ইংরেজি)' },
                  { key: 'nameBn', label: 'নাম (বাংলা)' },
                  { key: 'location', label: 'অবস্থান' },
                  { key: 'capital', label: 'মূলধন (৳)' },
                  { key: 'licenseNo', label: 'লাইসেন্স নম্বর' },
                  { key: 'taxId', label: 'ট্যাক্স আইডি' },
                  { key: 'startedAt', label: 'প্রতিষ্ঠার তারিখ', type: 'date' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 font-bengali mb-1">{label}</label>
                    <input type={type ?? (key === 'capital' ? 'number' : 'text')} className={inputCls}
                      value={editForm[key] ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 font-bengali mb-1">বিবরণ</label>
                <textarea className={inputCls} rows={3} value={editForm.description ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
              <button onClick={() => { setEditing(false); setEditError('') }} className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50">বাতিল</button>
              <button onClick={() => editMutation.mutate({
                ...editForm,
                capital: editForm.capital ? Math.round(parseFloat(editForm.capital) * 100) : undefined,
              })} disabled={editMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#0a1c3b] disabled:opacity-50">
                {editMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-bengali mb-1">মূলধন</p>
          <p className="text-xl font-bold text-[#0f2d5e] font-bengali">{formatTaka(biz.capital)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-bengali mb-1">প্রজেক্ট</p>
          <p className="text-xl font-bold text-emerald-600 font-bengali">{toBengaliNumber(biz.projects.length)} টি</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-bengali mb-1">কর্মী</p>
          <p className="text-xl font-bold text-amber-600 font-bengali">{toBengaliNumber(biz.employees.length)} জন</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {biz.description && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-[#0e1523] font-bengali mb-2">বিবরণ</h3>
              <p className="text-sm text-gray-600 font-bengali leading-relaxed">{biz.description}</p>
            </div>
          )}

          {/* Projects */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <FolderKanban size={15} className="text-[#0f2d5e]" />
              <h3 className="text-sm font-semibold text-[#0e1523] font-bengali">প্রজেক্টসমূহ</h3>
            </div>
            {biz.projects.length === 0 ? (
              <p className="text-sm text-gray-400 font-bengali text-center py-10">কোনো প্রজেক্ট নেই</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {biz.projects.map(proj => (
                  <Link key={proj.id} href={`/projects/${proj.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                    <div>
                      <p className="text-sm font-medium text-[#0e1523] font-bengali">{proj.nameBn || proj.name}</p>
                      <p className="text-xs text-gray-400 font-bengali">{formatTaka(proj.budget)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0f2d5e] rounded-full" style={{ width: `${proj.progressPercent ?? 0}%` }} />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bengali ${PROJECT_STATUS_COLORS[proj.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {PROJECT_STATUS_BN[proj.status] ?? proj.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Employees */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users size={15} className="text-[#0f2d5e]" />
              <h3 className="text-sm font-semibold text-[#0e1523] font-bengali">কর্মী তালিকা</h3>
            </div>
            {biz.employees.length === 0 ? (
              <p className="text-sm text-gray-400 font-bengali text-center py-10">কোনো কর্মী নেই</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {biz.employees.map(emp => (
                  <Link key={emp.id} href={`/hr/${emp.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#0f2d5e]/10 flex items-center justify-center text-xs font-bold text-[#0f2d5e]">
                        {(emp.user.fullNameBn || emp.user.fullName).charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-[#0e1523] font-bengali">{emp.user.fullNameBn || emp.user.fullName}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-bengali">{emp.designation?.nameBn ?? emp.designation?.name ?? '—'}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-bengali">তথ্য</h3>
            <InfoRow label="ক্যাটাগরি" value={biz.category?.nameBn ?? biz.category?.name} />
            <InfoRow label="প্রতিষ্ঠা" value={biz.startedAt ? formatDate(biz.startedAt) : null} />
            <InfoRow label="ট্রেড লাইসেন্স" value={biz.licenseNo} />
            <InfoRow label="ট্যাক্স আইডি" value={biz.taxId} />
            <InfoRow label="অবস্থান" value={biz.location} />
          </div>
        </div>
      </div>
    </div>
  )
}
