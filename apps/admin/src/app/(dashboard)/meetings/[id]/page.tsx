'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDateTime, formatDate } from '@yakin/utils'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, MapPin, Users, Clock } from 'lucide-react'

interface MeetingDetail {
  id: string; title: string; titleBn?: string; type: string; status: string
  scheduledAt: string; venue?: string; agenda?: string; agendaBn?: string
  minutes?: string; decisions?: string
  organizer: { fullName: string; fullNameBn?: string }
  attendees: Array<{ id: string; user: { fullName: string; fullNameBn?: string } }>
}

const STATUS_BN: Record<string, string> = {
  SCHEDULED: 'নির্ধারিত', ONGOING: 'চলমান', COMPLETED: 'সম্পন্ন', CANCELLED: 'বাতিল',
}
const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700', ONGOING: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700', CANCELLED: 'bg-red-50 text-red-600',
}
const TYPE_BN: Record<string, string> = {
  BOARD: 'বোর্ড সভা', GENERAL: 'সাধারণ সভা', EMERGENCY: 'জরুরি সভা',
  COMMITTEE: 'কমিটি সভা', TEAM: 'দলীয় সভা',
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [minutes, setMinutes] = useState('')
  const [decisions, setDecisions] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => api.get<{ data: MeetingDetail }>(`/api/meetings/${id}`).then(r => r.data.data),
  })

  const statusMutation = useMutation({
    mutationFn: (body: { status: string; minutes?: string; decisions?: string }) =>
      api.patch(`/api/meetings/${id}/status`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] })
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      setShowStatusModal(false)
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-1/3" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!data) return <p className="text-gray-500 font-bengali text-center py-16">সভা পাওয়া যায়নি</p>

  const meeting = data

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/meetings" className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[#0e1523] font-bengali">{meeting.titleBn || meeting.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-bengali ${STATUS_COLORS[meeting.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {STATUS_BN[meeting.status] ?? meeting.status}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 font-bengali">
              {TYPE_BN[meeting.type] ?? meeting.type}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-bengali mt-0.5">আয়োজক: {meeting.organizer.fullNameBn || meeting.organizer.fullName}</p>
        </div>
        {meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED' && (
          <button onClick={() => { setNewStatus(''); setShowStatusModal(true) }}
            className="px-4 py-2 rounded-lg bg-[#0f2d5e] text-white text-sm font-bengali hover:bg-[#1a3f7a] transition">
            স্ট্যাটাস পরিবর্তন
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <div className="flex items-start gap-2">
            <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-bengali">তারিখ ও সময়</p>
              <p className="text-sm font-medium text-gray-700">{formatDateTime(meeting.scheduledAt)}</p>
            </div>
          </div>
          {meeting.venue && (
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-bengali">স্থান</p>
                <p className="text-sm font-medium text-gray-700 font-bengali">{meeting.venue}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Users size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-bengali">অংশগ্রহণকারী</p>
              <p className="text-sm font-medium text-gray-700 font-bengali">{meeting.attendees.length} জন</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Agenda */}
        {(meeting.agenda || meeting.agendaBn) && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-[#0e1523] font-bengali mb-3 flex items-center gap-2">
              <CalendarDays size={15} /> আলোচ্য সূচি
            </h2>
            {meeting.agendaBn && <p className="text-sm text-gray-600 font-bengali whitespace-pre-line leading-relaxed">{meeting.agendaBn}</p>}
            {meeting.agenda && !meeting.agendaBn && <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{meeting.agenda}</p>}
          </div>
        )}

        {/* Attendees */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0e1523] font-bengali">অংশগ্রহণকারীগণ</h2>
          </div>
          {meeting.attendees.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-400 font-bengali text-sm">কোনো অংশগ্রহণকারী নেই</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {meeting.attendees.map(att => (
                <div key={att.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#0f2d5e]/10 flex items-center justify-center text-xs font-bold text-[#0f2d5e]">
                    {(att.user.fullNameBn || att.user.fullName).charAt(0)}
                  </div>
                  <span className="text-sm text-gray-700 font-bengali">{att.user.fullNameBn || att.user.fullName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Minutes */}
        {meeting.minutes && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-2">
            <h2 className="text-sm font-bold text-[#0e1523] font-bengali mb-3">কার্যবিবরণী</h2>
            <p className="text-sm text-gray-600 font-bengali whitespace-pre-line leading-relaxed">{meeting.minutes}</p>
          </div>
        )}

        {/* Decisions */}
        {meeting.decisions && (
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5 lg:col-span-2">
            <h2 className="text-sm font-bold text-emerald-800 font-bengali mb-3">সিদ্ধান্তসমূহ</h2>
            <p className="text-sm text-emerald-700 font-bengali whitespace-pre-line leading-relaxed">{meeting.decisions}</p>
          </div>
        )}
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0e1523] font-bengali">সভার স্ট্যাটাস পরিবর্তন</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 font-bengali">নতুন স্ট্যাটাস</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bengali bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20">
                <option value="">— বেছে নিন —</option>
                <option value="ONGOING">চলমান</option>
                <option value="COMPLETED">সম্পন্ন</option>
                <option value="CANCELLED">বাতিল</option>
              </select>
            </div>
            {newStatus === 'COMPLETED' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 font-bengali">কার্যবিবরণী</label>
                  <textarea value={minutes} onChange={e => setMinutes(e.target.value)} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bengali resize-none focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20"
                    placeholder="সভার কার্যবিবরণী লিখুন..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 font-bengali">সিদ্ধান্তসমূহ</label>
                  <textarea value={decisions} onChange={e => setDecisions(e.target.value)} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bengali resize-none focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20"
                    placeholder="সভায় গৃহীত সিদ্ধান্ত লিখুন..." />
                </div>
              </>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowStatusModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50 transition">
                বাতিল
              </button>
              <button
                onClick={() => statusMutation.mutate({ status: newStatus, minutes: minutes || undefined, decisions: decisions || undefined })}
                disabled={!newStatus || statusMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-[#0f2d5e] text-white text-sm font-bengali hover:bg-[#1a3f7a] transition disabled:opacity-60">
                {statusMutation.isPending ? 'আপডেট হচ্ছে...' : 'পরিবর্তন করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
