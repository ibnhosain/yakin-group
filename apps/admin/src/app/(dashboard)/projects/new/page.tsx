'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, FolderKanban } from 'lucide-react'

interface Business { id: string; name: string; nameBn?: string }

export default function NewProjectPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    businessId: '', name: '', nameBn: '', description: '', category: '',
    location: '', budget: '', estimatedCost: '', startDate: '', expectedEndDate: '',
  })
  const [error, setError] = useState('')

  const { data: businesses } = useQuery({
    queryKey: ['businesses-list'],
    queryFn: () => api.get<{ data: Business[] }>('/api/businesses').then(r => r.data.data),
  })

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/api/projects', body),
    onSuccess: (res: { data: { data: { id: string } } }) => {
      router.push(`/projects/${res.data.data.id}`)
    },
    onError: (err: { response?: { data?: { messageBn?: string; message?: string } } }) => {
      setError(err.response?.data?.messageBn ?? err.response?.data?.message ?? 'ত্রুটি হয়েছে')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.businessId || !form.name) { setError('ব্যবসা ও প্রজেক্ট নাম আবশ্যক'); return }
    mutation.mutate({
      businessId: form.businessId,
      name: form.name,
      nameBn: form.nameBn || undefined,
      description: form.description || undefined,
      category: form.category || undefined,
      location: form.location || undefined,
      budget: form.budget ? Math.round(parseFloat(form.budget) * 100) : 0,
      estimatedCost: form.estimatedCost ? Math.round(parseFloat(form.estimatedCost) * 100) : 0,
      startDate: form.startDate || undefined,
      expectedEndDate: form.expectedEndDate || undefined,
    })
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20'
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1 font-bengali'

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/projects" className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">নতুন প্রজেক্ট</h1>
          <p className="text-sm text-gray-500 font-bengali">নতুন প্রজেক্টের তথ্য পূরণ করুন</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">

        {/* Basic Info */}
        <div>
          <h2 className="text-sm font-bold text-[#0f2d5e] font-bengali mb-4 flex items-center gap-2">
            <FolderKanban size={16} /> প্রজেক্ট তথ্য
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={lbl}>ব্যবসা প্রতিষ্ঠান *</label>
              <select value={form.businessId} onChange={e => setForm(f => ({ ...f, businessId: e.target.value }))}
                className={inp + ' bg-white font-bengali'} required>
                <option value="">— ব্যবসা বেছে নিন —</option>
                {(businesses ?? []).map(b => (
                  <option key={b.id} value={b.id}>{b.nameBn || b.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>প্রজেক্টের নাম (ইংরেজি) *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={inp} placeholder="Project Name" required />
              </div>
              <div>
                <label className={lbl}>প্রজেক্টের নাম (বাংলা)</label>
                <input value={form.nameBn} onChange={e => setForm(f => ({ ...f, nameBn: e.target.value }))}
                  className={inp + ' font-bengali'} placeholder="প্রজেক্টের নাম" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>ক্যাটাগরি</label>
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className={inp + ' font-bengali'} placeholder="যেমন: নির্মাণ, কৃষি" />
              </div>
              <div>
                <label className={lbl}>অবস্থান</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className={inp + ' font-bengali'} placeholder="জেলা / এলাকা" />
              </div>
            </div>
            <div>
              <label className={lbl}>বিবরণ</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} className={inp + ' font-bengali resize-none'} placeholder="প্রজেক্ট সম্পর্কে সংক্ষিপ্ত বিবরণ" />
            </div>
          </div>
        </div>

        {/* Budget & Dates */}
        <div className="border-t border-gray-100 pt-5">
          <h2 className="text-sm font-bold text-[#0f2d5e] font-bengali mb-4">বাজেট ও সময়সূচী</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>মোট বাজেট (টাকা)</label>
              <input type="number" min="0" step="0.01" value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                className={inp} placeholder="0.00" />
            </div>
            <div>
              <label className={lbl}>প্রাক্কলিত খরচ (টাকা)</label>
              <input type="number" min="0" step="0.01" value={form.estimatedCost}
                onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))}
                className={inp} placeholder="0.00" />
            </div>
            <div>
              <label className={lbl}>শুরুর তারিখ</label>
              <input type="date" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>শেষ হওয়ার তারিখ (প্রত্যাশিত)</label>
              <input type="date" value={form.expectedEndDate}
                onChange={e => setForm(f => ({ ...f, expectedEndDate: e.target.value }))}
                className={inp} />
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-bengali bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link href="/projects" className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50 transition text-center">
            বাতিল
          </Link>
          <button type="submit" disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-lg bg-[#0f2d5e] text-white text-sm font-bengali hover:bg-[#1a3f7a] transition disabled:opacity-60">
            {mutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'প্রজেক্ট তৈরি করুন'}
          </button>
        </div>
      </form>
    </div>
  )
}
