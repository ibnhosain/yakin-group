'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PropertyListItem } from '@yakin/types'
import { formatTaka, formatDate } from '@yakin/utils'
import { MapPin, Search, Plus } from 'lucide-react'

const TYPE_BN: Record<string, string> = {
  AGRICULTURAL: 'কৃষি জমি', RESIDENTIAL: 'আবাসিক', COMMERCIAL: 'বাণিজ্যিক', INDUSTRIAL: 'শিল্প', OTHER: 'অন্যান্য',
}
const STATUS_BN: Record<string, string> = {
  OWNED: 'মালিকানা', MORTGAGED: 'বন্ধকী', SOLD: 'বিক্রীত', LEASED: 'ইজারা',
}

export default function PropertiesPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['properties', search],
    queryFn: () =>
      api.get<{ data: PropertyListItem[] }>(`/api/properties?search=${search}`).then(r => r.data),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">জমি ও সম্পত্তি</h1>
          <p className="text-sm text-gray-500 font-bengali mt-0.5">সকল জমি ও সম্পত্তির রেকর্ড</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#1a3f7a] transition">
          <Plus size={16} /> নতুন সম্পত্তি
        </button>
      </div>

      <div className="relative w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="নাম বা জেলা দিয়ে খুঁজুন..."
          className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm font-bengali focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">আইডি</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">নাম / অবস্থান</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">ধরন</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">পরিমাণ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">ক্রয়মূল্য</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">বর্তমান মূল্য</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : (data?.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <MapPin size={32} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 font-bengali">কোনো সম্পত্তি পাওয়া যায়নি</p>
                  </td>
                </tr>
              ) : (data?.data ?? []).map(prop => (
                <tr key={prop.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{prop.propertyNo}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#0e1523] font-bengali">{prop.nameBn || prop.name}</div>
                    <div className="text-xs text-gray-400 font-bengali">{prop.district}, {prop.division}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-bengali">{TYPE_BN[prop.propertyType] ?? prop.propertyType}</td>
                  <td className="px-4 py-3 text-gray-700 font-bengali">{prop.area} {prop.areaUnit}</td>
                  <td className="px-4 py-3 font-bengali">{formatTaka(prop.purchasePrice)}</td>
                  <td className="px-4 py-3 font-semibold text-[#0f2d5e] font-bengali">{prop.currentValue ? formatTaka(prop.currentValue) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold font-bengali ${
                      prop.status === 'OWNED' ? 'bg-emerald-50 text-emerald-700' :
                      prop.status === 'MORTGAGED' ? 'bg-amber-50 text-amber-700' :
                      prop.status === 'SOLD' ? 'bg-gray-100 text-gray-500' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {STATUS_BN[prop.status] ?? prop.status}
                    </span>
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
