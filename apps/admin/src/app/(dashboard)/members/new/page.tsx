'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Category { id: string; name: string; nameBn: string; membershipFee: number; sharePrice: number }

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'পুরুষ' },
  { value: 'FEMALE', label: 'মহিলা' },
  { value: 'OTHER', label: 'অন্যান্য' },
]

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

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/30 focus:border-[#0f2d5e] font-bengali'

export default function NewMemberPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '', fullNameBn: '', email: '', phone: '', password: '',
    categoryId: '', nidNumber: '', dateOfBirth: '', gender: '',
    address: '', permanentAddress: '',
    nomineeName: '', nomineeRelation: '', nomineePhone: '', nomineeNid: '',
  })
  const [error, setError] = useState('')

  const { data: cats } = useQuery({
    queryKey: ['member-categories'],
    queryFn: () => api.get<{ data: Category[] }>('/api/members/categories').then(r => r.data.data),
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => api.post('/api/members', {
      ...form,
      gender: form.gender || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      nidNumber: form.nidNumber || undefined,
      address: form.address || undefined,
      permanentAddress: form.permanentAddress || undefined,
      nomineeName: form.nomineeName || undefined,
      nomineeRelation: form.nomineeRelation || undefined,
      nomineePhone: form.nomineePhone || undefined,
      nomineeNid: form.nomineeNid || undefined,
      fullNameBn: form.fullNameBn || undefined,
    }),
    onSuccess: () => router.push('/members'),
    onError: (e: { response?: { data?: { messageBn?: string; message?: string } } }) => {
      setError(e.response?.data?.messageBn ?? e.response?.data?.message ?? 'ত্রুটি হয়েছে')
    },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/members" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">নতুন সদস্য নিবন্ধন</h1>
          <p className="text-sm text-gray-500 font-bengali">নতুন সদস্যের তথ্য পূরণ করুন</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-bengali">{error}</div>
      )}

      {/* Section: Basic Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#0f2d5e] font-bengali border-b border-gray-100 pb-2">ব্যক্তিগত তথ্য</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="পূর্ণ নাম (ইংরেজি)" required>
            <input className={inputCls} value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Full Name" />
          </Field>
          <Field label="পূর্ণ নাম (বাংলা)">
            <input className={inputCls} value={form.fullNameBn} onChange={e => set('fullNameBn', e.target.value)} placeholder="বাংলায় নাম" />
          </Field>
          <Field label="জাতীয় পরিচয়পত্র নম্বর">
            <input className={inputCls} value={form.nidNumber} onChange={e => set('nidNumber', e.target.value)} placeholder="NID নম্বর" />
          </Field>
          <Field label="জন্ম তারিখ">
            <input type="date" className={inputCls} value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
          </Field>
          <Field label="লিঙ্গ">
            <select className={inputCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
              <option value="">বাছাই করুন</option>
              {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </Field>
          <Field label="সদস্যপদ ক্যাটাগরি" required>
            <select className={inputCls} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">ক্যাটাগরি বাছাই করুন</option>
              {cats?.map(c => <option key={c.id} value={c.id}>{c.nameBn} ({(c.membershipFee / 100).toLocaleString('bn-BD')} ৳)</option>)}
            </select>
          </Field>
        </div>
        <Field label="বর্তমান ঠিকানা">
          <textarea className={inputCls} rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="বর্তমান ঠিকানা লিখুন" />
        </Field>
        <Field label="স্থায়ী ঠিকানা">
          <textarea className={inputCls} rows={2} value={form.permanentAddress} onChange={e => set('permanentAddress', e.target.value)} placeholder="স্থায়ী ঠিকানা লিখুন" />
        </Field>
      </div>

      {/* Section: Contact & Login */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#0f2d5e] font-bengali border-b border-gray-100 pb-2">যোগাযোগ ও লগইন তথ্য</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ইমেইল" required>
            <input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
          </Field>
          <Field label="ফোন নম্বর" required>
            <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="01XXXXXXXXX" />
          </Field>
          <Field label="পাসওয়ার্ড" required>
            <input type="password" className={inputCls} value={form.password} onChange={e => set('password', e.target.value)} placeholder="কমপক্ষে ৮ অক্ষর" />
          </Field>
        </div>
      </div>

      {/* Section: Nominee */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#0f2d5e] font-bengali border-b border-gray-100 pb-2">নমিনি তথ্য</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="নমিনির নাম">
            <input className={inputCls} value={form.nomineeName} onChange={e => set('nomineeName', e.target.value)} placeholder="নমিনির পূর্ণ নাম" />
          </Field>
          <Field label="সম্পর্ক">
            <input className={inputCls} value={form.nomineeRelation} onChange={e => set('nomineeRelation', e.target.value)} placeholder="যেমন: স্ত্রী, পিতা, ভাই" />
          </Field>
          <Field label="নমিনির ফোন">
            <input className={inputCls} value={form.nomineePhone} onChange={e => set('nomineePhone', e.target.value)} placeholder="01XXXXXXXXX" />
          </Field>
          <Field label="নমিনির NID">
            <input className={inputCls} value={form.nomineeNid} onChange={e => set('nomineeNid', e.target.value)} placeholder="NID নম্বর" />
          </Field>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pb-6">
        <Link href="/members" className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50">
          বাতিল
        </Link>
        <button
          onClick={() => { setError(''); mutation.mutate() }}
          disabled={mutation.isPending || !form.fullName || !form.email || !form.phone || !form.password || !form.categoryId}
          className="flex items-center gap-2 px-5 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#0a1c3b] disabled:opacity-50 transition"
        >
          {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
          সদস্য নিবন্ধন করুন
        </button>
      </div>
    </div>
  )
}
