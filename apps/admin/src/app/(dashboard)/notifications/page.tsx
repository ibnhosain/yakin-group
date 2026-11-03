'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { NotificationItem } from '@yakin/types'
import { formatDateTime } from '@yakin/utils'
import { Bell, BellOff, CheckCheck } from 'lucide-react'

const TYPE_ICONS: Record<string, string> = {
  INFO: '💬', SUCCESS: '✅', WARNING: '⚠️', ERROR: '❌', APPROVAL: '📋', SYSTEM: '⚙️',
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<{ data: NotificationItem[] }>('/api/notifications?limit=50').then(r => r.data.data),
  })

  const markAll = useMutation({
    mutationFn: () => api.patch('/api/notifications/mark-all-read'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = (data ?? []).filter(n => !n.isRead).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">বিজ্ঞপ্তি</h1>
          <p className="text-sm text-gray-500 font-bengali mt-0.5">
            {unreadCount > 0 ? `${unreadCount}টি অপঠিত বিজ্ঞপ্তি` : 'সব বিজ্ঞপ্তি পড়া হয়েছে'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bengali text-gray-600 hover:bg-gray-50 transition">
            <CheckCheck size={16} /> সব পঠিত করুন
          </button>
        )}
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          ))
        ) : (data ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <BellOff size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-bengali">কোনো বিজ্ঞপ্তি নেই</p>
          </div>
        ) : (data ?? []).map(notif => (
          <div
            key={notif.id}
            onClick={() => !notif.isRead && markOne.mutate(notif.id)}
            className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
              notif.isRead ? 'border-gray-100 opacity-70' : 'border-[#0f2d5e]/20 bg-blue-50/30 hover:bg-blue-50/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{TYPE_ICONS[notif.type] ?? '🔔'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-bengali font-medium ${notif.isRead ? 'text-gray-600' : 'text-[#0e1523]'}`}>
                    {notif.titleBn || notif.title}
                  </p>
                  {!notif.isRead && <div className="w-2 h-2 bg-[#0f2d5e] rounded-full flex-shrink-0" />}
                </div>
                {notif.bodyBn && (
                  <p className="text-xs text-gray-500 font-bengali mt-0.5 line-clamp-2">{notif.bodyBn}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
