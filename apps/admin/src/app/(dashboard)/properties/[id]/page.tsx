'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatTaka, formatDate } from '@yakin/utils'
import Link from 'next/link'
import { ArrowLeft, MapPin, FileText } from 'lucide-react'

interface PropertyDetail {
  id: string; propertyNo: string; name: string; nameBn?: string
  propertyType: string; status: string
  location: string; locationBn?: string
  totalArea: number; areaUnit: string
  purchasePrice: number; currentValue: number
  purchaseDate: string; registrationNo?: string; mutationNo?: string
  sellerName?: string; sellerPhone?: string; notes?: string
  owners: Array<{ id: string; name: string; sharePercent: number }>
  transactions: Array<{ id: string; type: string; amount: number; date: string; description?: string }>
}

const TYPE_BN: Record<string, string> = {
  LAND: 'জমি', BUILDING: 'ভবন', APARTMENT: 'অ্যাপার্টমেন্ট',
  COMMERCIAL: 'বাণিজ্যিক', AGRICULTURAL: 'কৃষি জমি', OTHER: 'অন্যান্য',
}
const STATUS_BN: Record<string, string> = {
  OWNED: 'মালিকানা', MORTGAGED: 'বন্ধকী', SOLD: 'বিক্রীত', LEASED: 'ইজারা',
}
const STATUS_COLORS: Record<string, string> = {
  OWNED: 'bg-emerald-50 text-emerald-700', MORTGAGED: 'bg-amber-50 text-amber-700',
  SOLD: 'bg-gray-100 text-gray-500', LEASED: 'bg-blue-50 text-blue-700',
}
const AREA_UNIT_BN: Record<string, string> = {
  DECIMAL: 'শতক', KATHA: 'কাঠা', BIGHA: 'বিঘা', ACRE: 'একর', SQFT: 'বর্গফুট', SQMETER: 'বর্গমিটার',
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => api.get<{ data: PropertyDetail }>(`/api/properties/${id}`).then(r => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!data) return <p className="text-gray-500 font-bengali text-center py-16">সম্পত্তি পাওয়া যায়নি</p>

  const prop = data
  const appreciation = prop.currentValue - prop.purchasePrice
  const appreciationPct = prop.purchasePrice > 0 ? ((appreciation / prop.purchasePrice) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/properties" className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[#0e1523] font-bengali">{prop.nameBn || prop.name}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-bengali ${STATUS_COLORS[prop.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {STATUS_BN[prop.status] ?? prop.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-mono mt-0.5">{prop.propertyNo} · {TYPE_BN[prop.propertyType] ?? prop.propertyType}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'ক্রয়মূল্য', value: formatTaka(prop.purchasePrice), color: 'text-gray-700' },
          { label: 'বর্তমান মূল্য', value: formatTaka(prop.currentValue), color: 'text-[#0f2d5e]' },
          { label: 'মূল্যবৃদ্ধি', value: `${appreciation >= 0 ? '+' : ''}${formatTaka(Math.abs(appreciation))}`, color: appreciation >= 0 ? 'text-emerald-600' : 'text-red-500' },
          { label: 'পরিমাণ', value: `${prop.totalArea} ${AREA_UNIT_BN[prop.areaUnit] ?? prop.areaUnit}`, color: 'text-gray-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-bengali mb-1">{s.label}</p>
            <p className={`text-lg font-bold font-bengali ${s.color}`}>{s.value}</p>
            {s.label === 'মূল্যবৃদ্ধি' && <p className="text-xs text-gray-400 font-bengali">{appreciationPct}%</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0e1523] font-bengali">লেনদেন ইতিহাস</h2>
          </div>
          {prop.transactions.length === 0 ? (
            <div className="py-12 text-center">
              <FileText size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 font-bengali text-sm">কোনো লেনদেন নেই</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">তারিখ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">ধরন</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">পরিমাণ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">বিবরণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {prop.transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3 font-bengali text-gray-700">{tx.type}</td>
                      <td className="px-4 py-3 font-semibold text-[#0f2d5e] font-bengali">{formatTaka(tx.amount)}</td>
                      <td className="px-4 py-3 text-gray-500 font-bengali text-xs">{tx.description ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-[#0e1523] font-bengali mb-3 flex items-center gap-2">
              <MapPin size={15} /> অবস্থান
            </h2>
            <p className="text-sm font-bengali text-gray-700">{prop.locationBn || prop.location}</p>
            <p className="text-xs text-gray-400 mt-1">{formatDate(prop.purchaseDate)} তে ক্রয়</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-[#0e1523] font-bengali mb-3">আইনি তথ্য</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bengali">দলিল নং</span>
                <span className="text-gray-700 font-mono text-xs">{prop.registrationNo ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bengali">মিউটেশন নং</span>
                <span className="text-gray-700 font-mono text-xs">{prop.mutationNo ?? '—'}</span>
              </div>
              {prop.sellerName && (
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bengali">বিক্রেতা</span>
                  <span className="text-gray-700 font-bengali text-xs">{prop.sellerName}</span>
                </div>
              )}
            </div>
          </div>

          {prop.owners.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-[#0e1523] font-bengali mb-3">মালিকানা</h2>
              <div className="space-y-2">
                {prop.owners.map(owner => (
                  <div key={owner.id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-bengali">{owner.name}</span>
                    <span className="text-xs font-semibold text-[#0f2d5e] bg-[#0f2d5e]/5 px-2 py-0.5 rounded-full font-bengali">
                      {owner.sharePercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {prop.notes && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-[#0e1523] font-bengali mb-2">নোট</h2>
              <p className="text-sm text-gray-600 font-bengali leading-relaxed">{prop.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
