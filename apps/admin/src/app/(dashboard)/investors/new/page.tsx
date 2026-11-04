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
    fullName: '', fullNameBn: '', phone: '', email: '', password: '',
    nidNumber: '', address: '',
    bankName: '', bankAccount: '', bankBranch: '',
  })
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => api.post('/api/investors', {
      fullName: form.fullName,
      fullNameBn: form.fullNameBn || undefined,
      phone: form.phone,
      email: form.email || undefined,
      password: form.password || 'Yakin@2024',
      nidNumber: form.nidNumber || undefined,
      address: form.address || undefined,
      bankName: form.bankName || undefined,
      bankAccount: form.bankAccount || undefined,
      bankBranch: form.bankBranch || undefined,
    }),
    onSuccess: (res: { data: { data: { id: string } } }) => router.push(`/investors/${res.data.data.id}`),
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
            <input className={inputCls} value={form.nidNumber} onChange={e => set('nidNumber', e.target.value)} placeholder="NID নম্বর" />
          </Field>
          <Field label="লগইন পাসওয়ার্ড">
            <input type="password" className={inputCls} value={form.password} onChange={e => set('password', e.target.value)} placeholder="কমপক্ষে ৮ অক্ষর (খালি রাখলে ডিফল্ট)" />
          </Field>
        </div>
        <Field label="ঠিকানা">
          <textarea className={inputCls} rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="বর্তমান ঠিকানা" />
        </Field>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#0f2d5e] font-bengali border-b border-gray-100 pb-2">ব্যাংক তথ্য</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ব্যাংকের নাম">
            <input className={inputCls} value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="Bank Name" />
          </Field>
          <Field label="অ্যাকাউন্ট নম্বর">
            <input className={inputCls} value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} placeholder="Account Number" />
          </Field>
          <Field label="ব্রাঞ্চ">
            <input className={inputCls} value={form.bankBranch} onChange={e => set('bankBranch', e.target.value)} placeholder="Branch Name" />
          </Field>
        </div>
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
