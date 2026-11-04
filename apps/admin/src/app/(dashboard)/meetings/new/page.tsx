'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, CalendarDays } from 'lucide-react'

export default function NewMeetingPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', titleBn: '',
    type: 'BOARD',
    scheduledAt: '', scheduledTime: '',
    venue: '',
    agenda: '', agendaBn: '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/api/meetings', body),
    onSuccess: (res: { data: { data: { id: string } } }) => {
      router.push(`/meetings/${res.data.data.id}`)
    },
    onError: (err: { response?: { data?: { messageBn?: string; message?: string } } }) => {
      setError(err.response?.data?.messageBn ?? err.response?.data?.message ?? 'ত্রুটি হয়েছে')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.title || !form.scheduledAt || !form.scheduledTime) {
      setError('সভার নাম ও সময় আবশ্যক')
      return
    }
    const scheduledAt = `${form.scheduledAt}T${form.scheduledTime}:00`
    mutation.mutate({
      title: form.title,
      titleBn: form.titleBn || undefined,
      type: form.type,
      scheduledAt,
      venue: form.venue || undefined,
      agenda: form.agenda || undefined,
      agendaBn: form.agendaBn || undefined,
    })
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20'
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1 font-bengali'

  const MEETING_TYPES = [
    { value: 'BOARD', label: 'বোর্ড সভা' },
    { value: 'GENERAL', label: 'সাধারণ সভা' },
    { value: 'EMERGENCY', label: 'জরুরি সভা' },
    { value: 'COMMITTEE', label: 'কমিটি সভা' },
    { value: 'TEAM', label: 'দলীয় সভা' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/meetings" className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">নতুন সভা নির্ধারণ</h1>
          <p className="text-sm text-gray-500 font-bengali">সভার বিস্তারিত তথ্য পূরণ করুন</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">

        <div>
          <h2 className="text-sm font-bold text-[#0f2d5e] font-bengali mb-4 flex items-center gap-2">
            <CalendarDays size={16} /> সভার তথ্য
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>সভার শিরোনাম (ইংরেজি) *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className={inp} placeholder="Meeting Title" required />
              </div>
              <div>
                <label className={lbl}>সভার শিরোনাম (বাংলা)</label>
                <input value={form.titleBn} onChange={e => setForm(f => ({ ...f, titleBn: e.target.value }))}
                  className={inp + ' font-bengali'} placeholder="সভার নাম" />
              </div>
            </div>

            <div>
              <label className={lbl}>সভার ধরন</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className={inp + ' bg-white font-bengali'}>
                {MEETING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>সভার তারিখ *</label>
                <input type="date" value={form.scheduledAt}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  className={inp} required />
              </div>
              <div>
                <label className={lbl}>সময় *</label>
                <input type="time" value={form.scheduledTime}
                  onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))}
                  className={inp} required />
              </div>
            </div>

            <div>
              <label className={lbl}>স্থান / ভেন্যু</label>
              <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                className={inp + ' font-bengali'} placeholder="কনফারেন্স রুম / ঠিকানা" />
            </div>
          </div>
        </div>

        {/* Agenda */}
        <div className="border-t border-gray-100 pt-5">
          <h2 className="text-sm font-bold text-[#0f2d5e] font-bengali mb-4">আলোচ্য সূচি</h2>
          <div className="space-y-4">
            <div>
              <label className={lbl}>আলোচ্য সূচি (ইংরেজি)</label>
              <textarea value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
                rows={3} className={inp + ' resize-none'} placeholder="1. Topic One&#10;2. Topic Two" />
            </div>
            <div>
              <label className={lbl}>আলোচ্য সূচি (বাংলা)</label>
              <textarea value={form.agendaBn} onChange={e => setForm(f => ({ ...f, agendaBn: e.target.value }))}
                rows={3} className={inp + ' font-bengali resize-none'} placeholder="১. প্রথম বিষয়&#10;২. দ্বিতীয় বিষয়" />
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-bengali bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link href="/meetings" className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50 transition text-center">
            বাতিল
          </Link>
          <button type="submit" disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-lg bg-[#0f2d5e] text-white text-sm font-bengali hover:bg-[#1a3f7a] transition disabled:opacity-60">
            {mutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সভা নির্ধারণ করুন'}
          </button>
        </div>
      </form>
    </div>
  )
}
