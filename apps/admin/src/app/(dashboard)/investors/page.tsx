'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { InvestorListItem } from '@yakin/types'
import { formatTaka, formatDate, toBengaliNumber } from '@yakin/utils'
import { TrendingUp, Search, Plus, Eye } from 'lucide-react'

export default function InvestorsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['investors', search, page],
    queryFn: () =>
      api.get<{ data: InvestorListItem[]; pagination: { total: number; pages: number } }>(
        `/api/investors?search=${search}&page=${page}&limit=20`
      ).then(r => r.data),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">বিনিয়োগকারী</h1>
          <p className="text-sm text-gray-500 font-bengali mt-0.5">সকল বিনিয়োগকারীর তালিকা</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#1a3f7a] transition">
          <Plus size={16} /> নতুন বিনিয়োগকারী
        </button>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
          className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm font-bengali focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">বিনিয়োগকারী আইডি</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">নাম</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">মোট বিনিয়োগ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">সক্রিয় পরিকল্পনা</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">যোগদান</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : (data?.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <TrendingUp size={32} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 font-bengali">কোনো বিনিয়োগকারী পাওয়া যায়নি</p>
                  </td>
                </tr>
              ) : (data?.data ?? []).map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.investorNo}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#0e1523]">{inv.fullName}</div>
                    <div className="text-xs text-gray-400 font-bengali">{inv.fullNameBn}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#0f2d5e] font-bengali">{formatTaka(inv.totalInvestment)}</td>
                  <td className="px-4 py-3 text-center font-bengali">{toBengaliNumber(inv.activeInvestments)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold font-bengali ${
                      inv.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                      inv.status === 'INACTIVE' ? 'bg-gray-100 text-gray-500' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {inv.status === 'ACTIVE' ? 'সক্রিয়' : inv.status === 'INACTIVE' ? 'নিষ্ক্রিয়' : inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(inv.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-bengali">মোট {toBengaliNumber(data.pagination.total)} জন বিনিয়োগকারী</p>
            <div className="flex gap-1">
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded text-xs font-semibold ${page === p ? 'bg-[#0f2d5e] text-white' : 'hover:bg-gray-100 text-gray-500'}`}>
                  {toBengaliNumber(p)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
