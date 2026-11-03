'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate, formatDateTime, toBengaliNumber } from '@yakin/utils'
import { CalendarDays, Plus, Users, Clock, MapPin } from 'lucide-react'

interface Meeting {
  id: string; title: string; titleBn?: string; agenda?: string
  scheduledAt: string; location?: string; locationBn?: string
  status: string; attendeeCount: number; meetingType: string
}

const TYPE_BN: Record<string, string> = {
  BOARD: 'বোর্ড সভা', GENERAL: 'সাধারণ সভা', EMERGENCY: 'জরুরি সভা',
  DEPARTMENT: 'বিভাগীয় সভা', OTHER: 'অন্যান্য',
}
const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700', ONGOING: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700', CANCELLED: 'bg-red-50 text-red-600',
}
const STATUS_BN: Record<string, string> = {
  SCHEDULED: 'নির্ধারিত', ONGOING: 'চলমান', COMPLETED: 'সম্পন্ন', CANCELLED: 'বাতিল',
}

export default function MeetingsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  const { data, isLoading } = useQuery({
    queryKey: ['meetings', tab],
    queryFn: () =>
      api.get<{ data: Meeting[] }>(`/api/meetings?type=${tab}`).then(r => r.data.data),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">সভা ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-500 font-bengali mt-0.5">সকল সভার সময়সূচী</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#1a3f7a] transition">
          <Plus size={16} /> নতুন সভা
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['upcoming', 'past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold font-bengali transition ${tab === t ? 'bg-white shadow-sm text-[#0f2d5e]' : 'text-gray-500'}`}>
            {t === 'upcoming' ? 'আসন্ন সভা' : 'পূর্ববর্তী সভা'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="h-5 bg-gray-100 rounded animate-pulse mb-3 w-2/3" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          ))
        ) : (data ?? []).length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-gray-100">
            <CalendarDays size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-bengali">কোনো সভা পাওয়া যায়নি</p>
          </div>
        ) : (data ?? []).map(meeting => (
          <div key={meeting.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0f2d5e]/20 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[#0e1523] font-bengali">{meeting.titleBn || meeting.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-bengali ${STATUS_COLORS[meeting.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_BN[meeting.status] ?? meeting.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-bengali mb-3">{TYPE_BN[meeting.meetingType] ?? meeting.meetingType}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Clock size={13} className="text-gray-400" />
                    <span className="text-xs">{formatDateTime(meeting.scheduledAt)}</span>
                  </div>
                  {meeting.locationBn && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MapPin size={13} className="text-gray-400" />
                      <span className="text-xs font-bengali">{meeting.locationBn}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Users size={13} className="text-gray-400" />
                    <span className="text-xs font-bengali">{toBengaliNumber(meeting.attendeeCount)} জন অংশগ্রহণকারী</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
