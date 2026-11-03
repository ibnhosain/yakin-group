'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ProjectListItem } from '@yakin/types'
import { formatTaka, formatDate, toBengaliNumber } from '@yakin/utils'
import { FolderKanban, Search, Plus, Eye } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  PLANNING:    'bg-blue-50 text-blue-700',
  ACTIVE:      'bg-emerald-50 text-emerald-700',
  ON_HOLD:     'bg-amber-50 text-amber-700',
  COMPLETED:   'bg-gray-100 text-gray-600',
  CANCELLED:   'bg-red-50 text-red-600',
}
const STATUS_BN: Record<string, string> = {
  PLANNING: 'পরিকল্পনা', ACTIVE: 'চলমান', ON_HOLD: 'স্থগিত', COMPLETED: 'সম্পন্ন', CANCELLED: 'বাতিল',
}

export default function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, status],
    queryFn: () =>
      api.get<{ data: ProjectListItem[] }>(`/api/projects?search=${search}&status=${status}`).then(r => r.data),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">প্রজেক্ট ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-500 font-bengali mt-0.5">সকল প্রজেক্টের অগ্রগতি</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#1a3f7a] transition">
          <Plus size={16} /> নতুন প্রজেক্ট
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="প্রজেক্টের নাম..."
            className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm font-bengali focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20"
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bengali bg-white focus:outline-none">
          <option value="">সব স্ট্যাটাস</option>
          {Object.entries(STATUS_BN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <div className="h-5 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))
        ) : (data?.data ?? []).length === 0 ? (
          <div className="col-span-2 py-16 text-center">
            <FolderKanban size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-bengali">কোনো প্রজেক্ট পাওয়া যায়নি</p>
          </div>
        ) : (data?.data ?? []).map(proj => (
          <div key={proj.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0f2d5e]/30 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-[#0e1523] font-bengali">{proj.nameBn || proj.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-bengali ${STATUS_COLORS[proj.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {STATUS_BN[proj.status] ?? proj.status}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 font-bengali mb-1">
                <span>অগ্রগতি</span>
                <span>{toBengaliNumber(proj.progressPercent ?? 0)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0f2d5e] rounded-full transition-all"
                  style={{ width: `${proj.progressPercent ?? 0}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-bengali">বাজেট</p>
                <p className="font-semibold text-[#0f2d5e] font-bengali">{formatTaka(proj.budget)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bengali">সময়সীমা</p>
                <p className="text-gray-700 text-xs">{proj.endDate ? formatDate(proj.endDate) : '—'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
