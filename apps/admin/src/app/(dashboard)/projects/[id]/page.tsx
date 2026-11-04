'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatTaka, formatDate, toBengaliNumber } from '@yakin/utils'
import Link from 'next/link'
import { ArrowLeft, FolderKanban, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface ProjectDetail {
  id: string; name: string; nameBn?: string; description?: string
  status: string; progressPercent: number; category?: string; location?: string
  budget: number; estimatedCost: number; actualExpenses: number
  startDate?: string; expectedEndDate?: string; actualEndDate?: string
  business: { id: string; name: string; nameBn?: string }
  tasks: Array<{
    id: string; title: string; status: string; priority: string; dueDate?: string
    assignedTo?: { fullName: string }
  }>
  milestones: Array<{
    id: string; title: string; status: string; targetDate?: string; completedDate?: string
  }>
}

const STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-blue-50 text-blue-700', ACTIVE: 'bg-emerald-50 text-emerald-700',
  ON_HOLD: 'bg-amber-50 text-amber-700', COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-50 text-red-600',
}
const STATUS_BN: Record<string, string> = {
  PLANNING: 'পরিকল্পনা', ACTIVE: 'চলমান', ON_HOLD: 'স্থগিত', COMPLETED: 'সম্পন্ন', CANCELLED: 'বাতিল',
}
const TASK_STATUS_BN: Record<string, string> = {
  TODO: 'করতে হবে', IN_PROGRESS: 'চলমান', REVIEW: 'পর্যালোচনা', DONE: 'সম্পন্ন',
}
const PRIORITY_BN: Record<string, string> = {
  LOW: 'কম', MEDIUM: 'মাঝারি', HIGH: 'উচ্চ', CRITICAL: 'জরুরি',
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get<{ data: ProjectDetail }>(`/api/projects/${id}`).then(r => r.data.data),
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

  if (!data) return <p className="text-gray-500 font-bengali text-center py-16">প্রজেক্ট পাওয়া যায়নি</p>

  const proj = data
  const spentPercent = proj.budget > 0 ? Math.min(100, Math.round((proj.actualExpenses / proj.budget) * 100)) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/projects" className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0e1523] font-bengali">{proj.nameBn || proj.name}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-bengali ${STATUS_COLORS[proj.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {STATUS_BN[proj.status] ?? proj.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-bengali mt-0.5">
            {proj.business.nameBn || proj.business.name} · {proj.category ?? '—'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'মোট বাজেট', value: formatTaka(proj.budget), color: 'text-[#0f2d5e]' },
          { label: 'প্রকৃত খরচ', value: formatTaka(proj.actualExpenses), color: 'text-amber-600' },
          { label: 'টাস্ক সংখ্যা', value: toBengaliNumber(proj.tasks.length) + ' টি', color: 'text-gray-700' },
          { label: 'মাইলস্টোন', value: toBengaliNumber(proj.milestones.length) + ' টি', color: 'text-gray-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-bengali mb-1">{s.label}</p>
            <p className={`text-lg font-bold font-bengali ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700 font-bengali">প্রজেক্টের অগ্রগতি</span>
          <span className="text-sm font-bold text-[#0f2d5e] font-bengali">{toBengaliNumber(proj.progressPercent ?? 0)}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-[#0f2d5e] rounded-full transition-all" style={{ width: `${proj.progressPercent ?? 0}%` }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-xs text-gray-400 font-bengali">শুরু</p><p className="font-bengali text-gray-700">{proj.startDate ? formatDate(proj.startDate) : '—'}</p></div>
          <div><p className="text-xs text-gray-400 font-bengali">শেষ (প্রত্যাশিত)</p><p className="font-bengali text-gray-700">{proj.expectedEndDate ? formatDate(proj.expectedEndDate) : '—'}</p></div>
          <div><p className="text-xs text-gray-400 font-bengali">অবস্থান</p><p className="font-bengali text-gray-700">{proj.location ?? '—'}</p></div>
          <div><p className="text-xs text-gray-400 font-bengali">বাজেট ব্যয়</p>
            <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${spentPercent > 90 ? 'bg-red-500' : spentPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${spentPercent}%` }} />
            </div>
            <p className="text-xs font-bengali text-gray-500 mt-0.5">{toBengaliNumber(spentPercent)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0e1523] font-bengali">টাস্কসমূহ ({toBengaliNumber(proj.tasks.length)})</h2>
          </div>
          {proj.tasks.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-400 font-bengali text-sm">কোনো টাস্ক নেই</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {proj.tasks.map(task => (
                <div key={task.id} className="px-5 py-3 flex items-center gap-3">
                  {task.status === 'DONE'
                    ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    : task.status === 'IN_PROGRESS'
                    ? <Clock size={16} className="text-amber-500 shrink-0" />
                    : <AlertCircle size={16} className="text-gray-300 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0e1523] truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 font-bengali">
                      {TASK_STATUS_BN[task.status] ?? task.status} · {task.assignedTo?.fullName ?? '—'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bengali ${
                    task.priority === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                    task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{PRIORITY_BN[task.priority] ?? task.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestones + Description */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-[#0e1523] font-bengali">মাইলস্টোন ({toBengaliNumber(proj.milestones.length)})</h2>
            </div>
            {proj.milestones.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-400 font-bengali text-sm">কোনো মাইলস্টোন নেই</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {proj.milestones.map(ms => (
                  <div key={ms.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0e1523]">{ms.title}</p>
                      {ms.targetDate && <p className="text-xs text-gray-400 font-bengali mt-0.5">{formatDate(ms.targetDate)}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bengali ${
                      ms.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                      ms.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{ms.status === 'COMPLETED' ? 'সম্পন্ন' : ms.status === 'IN_PROGRESS' ? 'চলমান' : 'অপেক্ষমান'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {proj.description && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-[#0e1523] font-bengali mb-2">বিবরণ</h2>
              <p className="text-sm text-gray-600 font-bengali leading-relaxed">{proj.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
