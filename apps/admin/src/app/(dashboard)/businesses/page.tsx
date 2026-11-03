'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { BusinessListItem } from '@yakin/types'
import { formatTaka, formatDate, toBengaliNumber } from '@yakin/utils'
import { Building2, Search, Plus, Eye } from 'lucide-react'

export default function BusinessesPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['businesses', search],
    queryFn: () =>
      api.get<{ data: BusinessListItem[] }>(`/api/businesses?search=${search}`).then(r => r.data),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">ব্যবসা প্রতিষ্ঠান</h1>
          <p className="text-sm text-gray-500 font-bengali mt-0.5">সকল ব্যবসা ইউনিটের তালিকা</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#1a3f7a] transition">
          <Plus size={16} /> নতুন ব্যবসা
        </button>
      </div>

      <div className="relative w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="নাম দিয়ে খুঁজুন..."
          className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm font-bengali focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <div className="h-5 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          ))
        ) : (data?.data ?? []).length === 0 ? (
          <div className="col-span-3 py-16 text-center">
            <Building2 size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-bengali">কোনো ব্যবসা পাওয়া যায়নি</p>
          </div>
        ) : (data?.data ?? []).map(biz => (
          <div key={biz.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0f2d5e]/30 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-[#0e1523] font-bengali">{biz.nameBn || biz.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{biz.category}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-bengali ${
                biz.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {biz.status === 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
              </span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-bengali">মোট বিনিয়োগ</span>
                <span className="font-semibold text-[#0f2d5e] font-bengali">{formatTaka(biz.totalInvestment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bengali">প্রতিষ্ঠার তারিখ</span>
                <span className="text-gray-700 text-xs">{biz.establishedDate ? formatDate(biz.establishedDate) : '—'}</span>
              </div>
            </div>
            <button className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition font-bengali">
              <Eye size={13} /> বিস্তারিত দেখুন
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
