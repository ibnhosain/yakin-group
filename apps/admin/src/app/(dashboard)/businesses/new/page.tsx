'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/30 focus:border-[#0f2d5e] font-bengali'
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 font-bengali mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      {children}
    </div>
  )
}

interface BizCategory { id: string; name: string; nameBn: string }

export default function NewBusinessPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', nameBn: '', categoryId: '', description: '',
    location: '', capital: '', licenseNo: '', taxId: '', startedAt: '',
  })
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: cats } = useQuery({
    queryKey: ['biz-categories'],
    queryFn: () => api.get<{ data: BizCategory[] }>('/api/businesses/categories').then(r => r.data.data),
  })

  const mutation = useMutation({
    mutationFn: () => api.post('/api/businesses', {
      name: form.name,
      nameBn: form.nameBn || undefined,
      categoryId: form.categoryId,
      description: form.description || undefined,
      location: form.location || undefined,
      capital: form.capital ? Math.round(parseFloat(form.capital) * 100) : 0,
      licenseNo: form.licenseNo || undefined,
      taxId: form.taxId || undefined,
      startedAt: form.startedAt || undefined,
    }),
    onSuccess: (res: { data: { data: { id: string } } }) => router.push(`/businesses/${res.data.data.id}`),
    onError: (e: { response?: { data?: { messageBn?: string; message?: string } } }) => {
      setError(e.response?.data?.messageBn ?? e.response?.data?.message ?? 'ত্রুটি হয়েছে')
    },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/businesses" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">নতুন ব্যবসা ইউনিট</h1>
          <p className="text-sm text-gray-500 font-bengali">ব্যবসার তথ্য যোগ করুন</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-bengali">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#0f2d5e] font-bengali border-b border-gray-100 pb-2">মূল তথ্য</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ব্যবসার নাম (ইংরেজি)" required>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Business Name" />
          </Field>
          <Field label="ব্যবসার নাম (বাংলা)">
            <input className={inputCls} value={form.nameBn} onChange={e => set('nameBn', e.target.value)} placeholder="বাংলায় নাম" />
          </Field>
          <Field label="ক্যাটাগরি" required>
            <select className={inputCls} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">ক্যাটাগরি বাছাই করুন</option>
              {cats?.map(c => <option key={c.id} value={c.id}>{c.nameBn}</option>)}
            </select>
          </Field>
          <Field label="প্রতিষ্ঠার তারিখ">
            <input type="date" className={inputCls} value={form.startedAt} onChange={e => set('startedAt', e.target.value)} />
          </Field>
          <Field label="অবস্থান / ঠিকানা">
            <input className={inputCls} value={form.location} onChange={e => set('location', e.target.value)} placeholder="জেলা, বিভাগ" />
          </Field>
          <Field label="মূলধন (টাকা)">
            <input type="number" min="0" step="0.01" className={inputCls} value={form.capital} onChange={e => set('capital', e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="ট্রেড লাইসেন্স নম্বর">
            <input className={inputCls} value={form.licenseNo} onChange={e => set('licenseNo', e.target.value)} placeholder="লাইসেন্স নম্বর" />
          </Field>
          <Field label="ট্যাক্স আইডি">
            <input className={inputCls} value={form.taxId} onChange={e => set('taxId', e.target.value)} placeholder="TIN / Tax ID" />
          </Field>
        </div>
        <Field label="বিবরণ">
          <textarea className={inputCls} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="ব্যবসার সংক্ষিপ্ত বিবরণ" />
        </Field>
      </div>

      <div className="flex gap-3 justify-end pb-6">
        <Link href="/businesses" className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50">বাতিল</Link>
        <button
          onClick={() => { setError(''); mutation.mutate() }}
          disabled={mutation.isPending || !form.name || !form.categoryId}
          className="flex items-center gap-2 px-5 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#0a1c3b] disabled:opacity-50 transition"
        >
          {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
          ব্যবসা যোগ করুন
        </button>
      </div>
    </div>
  )
}
