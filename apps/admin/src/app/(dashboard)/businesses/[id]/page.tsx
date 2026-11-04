'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatTaka, formatDate, toBengaliNumber } from '@yakin/utils'
import { ArrowLeft, Loader2, AlertTriangle, Building2, Users, FolderKanban } from 'lucide-react'
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

  const { data: biz, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: () => api.get<{ data: BusinessDetail }>(`/api/businesses/${id}`).then(r => r.data.data),
  })

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
        <span className={`px-3 py-1 rounded-full text-xs font-semibold font-bengali border ${biz.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
          {biz.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
        </span>
      </div>

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
