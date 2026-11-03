'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { MemberListItem, MemberStatus } from '@yakin/types'
import { formatTaka, formatDate, getStatusLabelBn } from '@yakin/utils'
import { Plus, Search, Filter, Download, Eye, UserX } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS: Record<MemberStatus, string> = {
  ACTIVE:    'bg-emerald-50 text-emerald-700',
  PENDING:   'bg-amber-50 text-amber-700',
  SUSPENDED: 'bg-red-50 text-red-700',
  EXPIRED:   'bg-gray-100 text-gray-600',
  REJECTED:  'bg-red-100 text-red-800',
}

export default function MembersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['members', page, search, status],
    queryFn: () => api.get<{ data: MemberListItem[]; pagination: { total: number; totalPages: number } }>(
      `/api/members?page=${page}&limit=20&search=${search}&status=${status}`
    ).then(r => r.data),
  })

  const members = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">সদস্য ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-500 font-bengali mt-0.5">
            মোট {pagination?.total ?? 0} জন সদস্য
          </p>
        </div>
        <Link
          href="/members/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-medium font-bengali hover:bg-[#0a1c3b] transition"
        >
          <Plus size={15} />
          নতুন সদস্য
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="নাম, ফোন বা আইডি দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e] font-bengali"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e] font-bengali"
        >
          <option value="">সকল স্ট্যাটাস</option>
          <option value="ACTIVE">সক্রিয়</option>
          <option value="PENDING">অপেক্ষমান</option>
          <option value="SUSPENDED">স্থগিত</option>
          <option value="EXPIRED">মেয়াদোত্তীর্ণ</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider font-bengali">সদস্য আইডি</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider font-bengali">নাম</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider font-bengali">ফোন</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider font-bengali">ক্যাটাগরি</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider font-bengali">শেয়ার</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider font-bengali">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider font-bengali">যোগদান</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 font-bengali">
                    কোনো সদস্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : members.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-[#0f2d5e] font-semibold">{m.memberNo}</td>
                  <td className="px-4 py-3 font-medium text-[#0e1523]">{m.fullName}</td>
                  <td className="px-4 py-3 text-gray-600 tabular">{m.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 font-bengali">{m.categoryName}</td>
                  <td className="px-4 py-3 text-right tabular text-gray-700">{m.totalShares.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold font-bengali ${STATUS_COLORS[m.status]}`}>
                      {getStatusLabelBn(m.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(m.membershipDate)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/members/${m.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg inline-flex text-gray-500 hover:text-[#0f2d5e]">
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-bengali">
              পৃষ্ঠা {page} / {pagination.totalPages} (মোট {pagination.total} জন)
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 font-bengali">পূর্ববর্তী</button>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p+1))} disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 font-bengali">পরবর্তী</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
