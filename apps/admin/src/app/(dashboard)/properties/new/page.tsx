'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'

export default function NewPropertyPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', nameBn: '',
    propertyType: 'LAND',
    location: '', locationBn: '',
    totalArea: '', areaUnit: 'DECIMAL',
    purchasePrice: '', currentValue: '',
    purchaseDate: '',
    registrationNo: '', mutationNo: '',
    sellerName: '', sellerPhone: '',
    notes: '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/api/properties', body),
    onSuccess: (res: { data: { data: { id: string } } }) => {
      router.push(`/properties/${res.data.data.id}`)
    },
    onError: (err: { response?: { data?: { messageBn?: string; message?: string } } }) => {
      setError(err.response?.data?.messageBn ?? err.response?.data?.message ?? 'ত্রুটি হয়েছে')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.location || !form.totalArea || !form.purchasePrice || !form.currentValue || !form.purchaseDate) {
      setError('নাম, অবস্থান, পরিমাণ, ক্রয়মূল্য, বর্তমান মূল্য ও ক্রয়ের তারিখ আবশ্যক')
      return
    }
    mutation.mutate({
      name: form.name,
      nameBn: form.nameBn || undefined,
      propertyType: form.propertyType,
      location: form.location,
      locationBn: form.locationBn || undefined,
      totalArea: parseFloat(form.totalArea),
      areaUnit: form.areaUnit,
      purchasePrice: Math.round(parseFloat(form.purchasePrice) * 100),
      currentValue: Math.round(parseFloat(form.currentValue) * 100),
      purchaseDate: form.purchaseDate,
      registrationNo: form.registrationNo || undefined,
      mutationNo: form.mutationNo || undefined,
      sellerName: form.sellerName || undefined,
      sellerPhone: form.sellerPhone || undefined,
      notes: form.notes || undefined,
    })
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20'
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1 font-bengali'
  const sel = inp + ' bg-white font-bengali'

  const PROPERTY_TYPES = [
    { value: 'LAND', label: 'জমি' }, { value: 'BUILDING', label: 'ভবন' },
    { value: 'APARTMENT', label: 'অ্যাপার্টমেন্ট' }, { value: 'COMMERCIAL', label: 'বাণিজ্যিক' },
    { value: 'AGRICULTURAL', label: 'কৃষি জমি' }, { value: 'OTHER', label: 'অন্যান্য' },
  ]
  const AREA_UNITS = [
    { value: 'DECIMAL', label: 'শতক' }, { value: 'KATHA', label: 'কাঠা' },
    { value: 'BIGHA', label: 'বিঘা' }, { value: 'ACRE', label: 'একর' },
    { value: 'SQFT', label: 'বর্গফুট' }, { value: 'SQMETER', label: 'বর্গমিটার' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/properties" className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">নতুন সম্পত্তি</h1>
          <p className="text-sm text-gray-500 font-bengali">জমি বা সম্পত্তির তথ্য যোগ করুন</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">

        {/* Basic */}
        <div>
          <h2 className="text-sm font-bold text-[#0f2d5e] font-bengali mb-4 flex items-center gap-2">
            <MapPin size={16} /> সম্পত্তির তথ্য
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>সম্পত্তির নাম (ইংরেজি) *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={inp} placeholder="Property Name" required />
              </div>
              <div>
                <label className={lbl}>সম্পত্তির নাম (বাংলা)</label>
                <input value={form.nameBn} onChange={e => setForm(f => ({ ...f, nameBn: e.target.value }))}
                  className={inp + ' font-bengali'} placeholder="সম্পত্তির নাম" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>সম্পত্তির ধরন</label>
                <select value={form.propertyType} onChange={e => setForm(f => ({ ...f, propertyType: e.target.value }))} className={sel}>
                  {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>ক্রয়ের তারিখ *</label>
                <input type="date" value={form.purchaseDate}
                  onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))}
                  className={inp} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>অবস্থান (ইংরেজি) *</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className={inp} placeholder="District, Division" required />
              </div>
              <div>
                <label className={lbl}>অবস্থান (বাংলা)</label>
                <input value={form.locationBn} onChange={e => setForm(f => ({ ...f, locationBn: e.target.value }))}
                  className={inp + ' font-bengali'} placeholder="জেলা, বিভাগ" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>মোট পরিমাণ *</label>
                <input type="number" min="0" step="0.001" value={form.totalArea}
                  onChange={e => setForm(f => ({ ...f, totalArea: e.target.value }))}
                  className={inp} placeholder="0.000" required />
              </div>
              <div>
                <label className={lbl}>একক</label>
                <select value={form.areaUnit} onChange={e => setForm(f => ({ ...f, areaUnit: e.target.value }))} className={sel}>
                  {AREA_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Value */}
        <div className="border-t border-gray-100 pt-5">
          <h2 className="text-sm font-bold text-[#0f2d5e] font-bengali mb-4">মূল্য তথ্য</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>ক্রয়মূল্য (টাকা) *</label>
              <input type="number" min="0" step="0.01" value={form.purchasePrice}
                onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))}
                className={inp} placeholder="0.00" required />
            </div>
            <div>
              <label className={lbl}>বর্তমান মূল্য (টাকা) *</label>
              <input type="number" min="0" step="0.01" value={form.currentValue}
                onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))}
                className={inp} placeholder="0.00" required />
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="border-t border-gray-100 pt-5">
          <h2 className="text-sm font-bold text-[#0f2d5e] font-bengali mb-4">আইনি তথ্য</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>দলিল নং (রেজিস্ট্রেশন)</label>
              <input value={form.registrationNo} onChange={e => setForm(f => ({ ...f, registrationNo: e.target.value }))}
                className={inp} placeholder="Reg. No." />
            </div>
            <div>
              <label className={lbl}>মিউটেশন নং</label>
              <input value={form.mutationNo} onChange={e => setForm(f => ({ ...f, mutationNo: e.target.value }))}
                className={inp} placeholder="Mutation No." />
            </div>
            <div>
              <label className={lbl}>বিক্রেতার নাম</label>
              <input value={form.sellerName} onChange={e => setForm(f => ({ ...f, sellerName: e.target.value }))}
                className={inp + ' font-bengali'} placeholder="বিক্রেতার নাম" />
            </div>
            <div>
              <label className={lbl}>বিক্রেতার ফোন</label>
              <input value={form.sellerPhone} onChange={e => setForm(f => ({ ...f, sellerPhone: e.target.value }))}
                className={inp} placeholder="01XXXXXXXXX" />
            </div>
          </div>
          <div className="mt-4">
            <label className={lbl}>নোট</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} className={inp + ' font-bengali resize-none'} placeholder="অতিরিক্ত তথ্য" />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-bengali bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link href="/properties" className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50 transition text-center">
            বাতিল
          </Link>
          <button type="submit" disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-lg bg-[#0f2d5e] text-white text-sm font-bengali hover:bg-[#1a3f7a] transition disabled:opacity-60">
            {mutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সম্পত্তি যোগ করুন'}
          </button>
        </div>
      </form>
    </div>
  )
}
