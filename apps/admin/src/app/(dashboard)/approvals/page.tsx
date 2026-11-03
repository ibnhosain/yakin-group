'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ApprovalListItem, ApprovalStatus, ApprovalType } from '@yakin/types'
import { formatDateTime, getStatusLabelBn } from '@yakin/utils'
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react'

const TYPE_LABELS: Record<ApprovalType, string> = {
  NEW_MEMBERSHIP:        'নতুন সদস্যপদ',
  INVESTMENT_APPLICATION:'বিনিয়োগ আবেদন',
  INVESTMENT_WITHDRAWAL: 'বিনিয়োগ উত্তোলন',
  SHARE_TRANSFER:        'শেয়ার হস্তান্তর',
  LAND_PURCHASE:         'জমি ক্রয়',
  LAND_SALE:             'জমি বিক্রয়',
  PROJECT_BUDGET:        'প্রজেক্ট বাজেট',
  EXPENSE_APPROVAL:      'ব্যয় অনুমোদন',
  LEAVE_REQUEST:         'ছুটির আবেদন',
  SALARY_PAYMENT:        'বেতন পরিশোধ',
  FINANCIAL_ADJUSTMENT:  'আর্থিক সমন্বয়',
  OTHER:                 'অন্যান্য',
}

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  PENDING:      'bg-amber-50 text-amber-700',
  UNDER_REVIEW: 'bg-blue-50 text-blue-700',
  APPROVED:     'bg-emerald-50 text-emerald-700',
  REJECTED:     'bg-red-50 text-red-700',
  CANCELLED:    'bg-gray-100 text-gray-500',
}

export default function ApprovalsPage() {
  const [status, setStatus] = useState('PENDING')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['approvals', status],
    queryFn: () => api.get<{ data: ApprovalListItem[] }>(`/api/approvals?status=${status}`).then(r => r.data.data),
  })

  const decide = useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: 'APPROVED' | 'REJECTED'; note?: string }) =>
      api.patch(`/api/approvals/${id}/decide`, { status: decision, decisionNote: note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  })

  const handleDecide = (id: string, decision: 'APPROVED' | 'REJECTED') => {
    const note = decision === 'REJECTED' ? window.prompt('প্রত্যাখ্যানের কারণ লিখুন:') ?? '' : ''
    decide.mutate({ id, decision, note })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0e1523] font-bengali">অনুমোদন ব্যবস্থাপনা</h1>
        <p className="text-sm text-gray-500 font-bengali mt-0.5">সকল অনুমোদনের অনুরোধ</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {['PENDING','UNDER_REVIEW','APPROVED','REJECTED'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold font-bengali transition ${status === s ? 'bg-white shadow-sm text-[#0f2d5e]' : 'text-gray-500 hover:text-gray-700'}`}>
            {getStatusLabelBn(s)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">ধরন</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">আবেদনকারী</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">বিবরণ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">তারিখ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase font-bengali">স্ট্যাটাস</th>
                {status === 'PENDING' && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase font-bengali">সিদ্ধান্ত</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({length: 5}).map((_,j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : (data ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 font-bengali">কোনো {getStatusLabelBn(status)} অনুরোধ নেই</td></tr>
              ) : (data ?? []).map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bengali font-medium text-[#0e1523]">{TYPE_LABELS[a.type]}</td>
                  <td className="px-4 py-3 text-gray-700">{a.requesterName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{a.requestNote ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(a.requestedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold font-bengali ${STATUS_COLORS[a.status]}`}>
                      {getStatusLabelBn(a.status)}
                    </span>
                  </td>
                  {status === 'PENDING' && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleDecide(a.id, 'APPROVED')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold font-bengali hover:bg-emerald-100 transition">
                          <CheckCircle size={13} /> অনুমোদন
                        </button>
                        <button onClick={() => handleDecide(a.id, 'REJECTED')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold font-bengali hover:bg-red-100 transition">
                          <XCircle size={13} /> প্রত্যাখ্যান
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
