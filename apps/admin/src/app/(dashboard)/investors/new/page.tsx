'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/30 focus:border-[#0f2d5e] font-bengali'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 font-bengali mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function NewInvestorPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '', fullNameBn: '', phone: '', email: '',
    nidNo: '', address: '', addressBn: '',
  })
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => api.post('/api/investors', {
      ...form,
      email: form.email || undefined,
      fullNameBn: form.fullNameBn || undefined,
      nidNo: form.nidNo || undefined,
      address: form.address || undefined,
      addressBn: form.addressBn || undefined,
    }),
    onSuccess: () => router.push('/investors'),
    onError: (e: { response?: { data?: { messageBn?: string; message?: string } } }) => {
      setError(e.response?.data?.messageBn ?? e.response?.data?.message ?? 'ত্রুটি হয়েছে')
    },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/investors" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">নতুন বিনিয়োগকারী</h1>
          <p className="text-sm text-gray-500 font-bengali">বিনিয়োগকারীর তথ্য যোগ করুন</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-bengali">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#0f2d5e] font-bengali border-b border-gray-100 pb-2">ব্যক্তিগত তথ্য</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="পূর্ণ নাম (ইংরেজি)" required>
            <input className={inputCls} value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Full Name" />
          </Field>
          <Field label="পূর্ণ নাম (বাংলা)">
            <input className={inputCls} value={form.fullNameBn} onChange={e => set('fullNameBn', e.target.value)} placeholder="বাংলায় নাম" />
          </Field>
          <Field label="ফোন নম্বর" required>
            <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="01XXXXXXXXX" />
          </Field>
          <Field label="ইমেইল">
            <input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
          </Field>
          <Field label="জাতীয় পরিচয়পত্র নম্বর">
            <input className={inputCls} value={form.nidNo} onChange={e => set('nidNo', e.target.value)} placeholder="NID নম্বর" />
          </Field>
        </div>
        <Field label="ঠিকানা (ইংরেজি)">
          <textarea className={inputCls} rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Address" />
        </Field>
        <Field label="ঠিকানা (বাংলা)">
          <textarea className={inputCls} rows={2} value={form.addressBn} onChange={e => set('addressBn', e.target.value)} placeholder="বাংলায় ঠিকানা লিখুন" />
        </Field>
      </div>

      <div className="flex gap-3 justify-end pb-6">
        <Link href="/investors" className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50">
          বাতিল
        </Link>
        <button
          onClick={() => { setError(''); mutation.mutate() }}
          disabled={mutation.isPending || !form.fullName || !form.phone}
          className="flex items-center gap-2 px-5 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#0a1c3b] disabled:opacity-50 transition"
        >
          {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
          বিনিয়োগকারী যোগ করুন
        </button>
      </div>
    </div>
  )
}
