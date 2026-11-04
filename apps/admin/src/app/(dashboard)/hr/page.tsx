'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { EmployeeListItem } from '@yakin/types'
import { formatTaka, formatDate, toBengaliNumber } from '@yakin/utils'
import { UserCheck, Search, Plus, Eye } from 'lucide-react'
import Link from 'next/link'

export default function HRPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, page],
    queryFn: () =>
      api.get<{ data: EmployeeListItem[]; pagination: { total: number; pages: number } }>(
        `/api/hr/employees?search=${search}&page=${page}&limit=20`
      ).then(r => r.data),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">মানবসম্পদ ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-500 font-bengali mt-0.5">কর্মী তালিকা ও বেতন</p>
        </div>
        <Link href="/hr/new" className="flex items-center gap-2 px-4 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#1a3f7a] transition">
          <Plus size={16} /> নতুন কর্মী
        </Link>
      </div>

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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">কর্মী আইডি</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">নাম</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">বিভাগ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">পদবি</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">বেতন</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">স্ট্যাটাস</th>
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
                    <UserCheck size={32} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 font-bengali">কোনো কর্মী পাওয়া যায়নি</p>
                  </td>
                </tr>
              ) : (data?.data ?? []).map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.employeeNo}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#0e1523]">{emp.fullName}</div>
                    <div className="text-xs text-gray-400 font-bengali">{emp.fullNameBn}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-bengali">{emp.department}</td>
                  <td className="px-4 py-3 text-gray-700 font-bengali">{emp.designation}</td>
                  <td className="px-4 py-3 font-semibold text-[#0f2d5e] font-bengali">{formatTaka(emp.basicSalary)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold font-bengali ${
                      emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                      emp.status === 'ON_LEAVE' ? 'bg-amber-50 text-amber-700' :
                      emp.status === 'RESIGNED' ? 'bg-red-50 text-red-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {emp.status === 'ACTIVE' ? 'কর্মরত' :
                       emp.status === 'ON_LEAVE' ? 'ছুটিতে' :
                       emp.status === 'RESIGNED' ? 'পদত্যাগী' : emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/hr/${emp.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 inline-flex">
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
