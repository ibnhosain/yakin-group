'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, FileText, Link as LinkIcon } from 'lucide-react'

interface DocCategory { id: string; name: string; nameBn?: string }

export default function NewDocumentPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', description: '',
    categoryId: '',
    fileUrl: '', fileName: '',
    mimeType: 'application/pdf',
    ownerType: '', ownerId: '',
    expiresAt: '',
    isPublic: false,
  })
  const [error, setError] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['doc-categories'],
    queryFn: () => api.get<{ data: DocCategory[] }>('/api/documents/categories').then(r => r.data.data),
  })

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/api/documents', body),
    onSuccess: () => {
      router.push('/documents')
    },
    onError: (err: { response?: { data?: { messageBn?: string; message?: string } } }) => {
      setError(err.response?.data?.messageBn ?? err.response?.data?.message ?? 'ত্রুটি হয়েছে')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.title || !form.fileUrl || !form.fileName) {
      setError('শিরোনাম, ফাইলের নাম ও URL আবশ্যক')
      return
    }
    mutation.mutate({
      title: form.title,
      description: form.description || undefined,
      categoryId: form.categoryId || undefined,
      fileUrl: form.fileUrl,
      fileName: form.fileName,
      mimeType: form.mimeType,
      ownerType: form.ownerType || undefined,
      ownerId: form.ownerId || undefined,
      expiresAt: form.expiresAt || undefined,
    })
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20'
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1 font-bengali'

  const MIME_TYPES = [
    { value: 'application/pdf', label: 'PDF' },
    { value: 'image/jpeg', label: 'JPEG Image' },
    { value: 'image/png', label: 'PNG Image' },
    { value: 'application/msword', label: 'Word (.doc)' },
    { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word (.docx)' },
    { value: 'application/vnd.ms-excel', label: 'Excel (.xls)' },
    { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel (.xlsx)' },
    { value: 'application/octet-stream', label: 'অন্যান্য' },
  ]

  const OWNER_TYPES = [
    { value: '', label: '— কোনোটি নয় —' },
    { value: 'MEMBER', label: 'সদস্য' },
    { value: 'INVESTOR', label: 'বিনিয়োগকারী' },
    { value: 'EMPLOYEE', label: 'কর্মী' },
    { value: 'BUSINESS', label: 'ব্যবসা' },
    { value: 'PROPERTY', label: 'সম্পত্তি' },
    { value: 'PROJECT', label: 'প্রজেক্ট' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/documents" className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">নতুন দলিল যোগ করুন</h1>
          <p className="text-sm text-gray-500 font-bengali">URL দিয়ে দলিল রেজিস্ট্রি করুন</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">

        {/* Title */}
        <div>
          <h2 className="text-sm font-bold text-[#0f2d5e] font-bengali mb-4 flex items-center gap-2">
            <FileText size={16} /> দলিলের তথ্য
          </h2>
          <div className="space-y-4">
            <div>
              <label className={lbl}>দলিলের শিরোনাম *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className={inp + ' font-bengali'} placeholder="দলিলের নাম / বিবরণ" required />
            </div>
            <div>
              <label className={lbl}>ক্যাটাগরি</label>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className={inp + ' bg-white font-bengali'}>
                <option value="">— ক্যাটাগরি বেছে নিন —</option>
                {(categories ?? []).map(c => (
                  <option key={c.id} value={c.id}>{c.nameBn || c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>বিবরণ</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} className={inp + ' font-bengali resize-none'} placeholder="সংক্ষিপ্ত বিবরণ" />
            </div>
          </div>
        </div>

        {/* File URL */}
        <div className="border-t border-gray-100 pt-5">
          <h2 className="text-sm font-bold text-[#0f2d5e] font-bengali mb-4 flex items-center gap-2">
            <LinkIcon size={16} /> ফাইলের তথ্য
          </h2>
          <div className="space-y-4">
            <div>
              <label className={lbl}>ফাইল URL *</label>
              <input type="url" value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                className={inp} placeholder="https://drive.google.com/..." required />
              <p className="text-xs text-gray-400 font-bengali mt-1">Google Drive, Dropbox বা অন্য যেকোনো URL</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>ফাইলের নাম *</label>
                <input value={form.fileName} onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))}
                  className={inp} placeholder="document.pdf" required />
              </div>
              <div>
                <label className={lbl}>ফাইলের ধরন</label>
                <select value={form.mimeType} onChange={e => setForm(f => ({ ...f, mimeType: e.target.value }))}
                  className={inp + ' bg-white'}>
                  {MIME_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Owner / Expiry */}
        <div className="border-t border-gray-100 pt-5">
          <h2 className="text-sm font-bold text-[#0f2d5e] font-bengali mb-4">সংযুক্তি ও মেয়াদ</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>সম্পর্কিত বিভাগ</label>
              <select value={form.ownerType} onChange={e => setForm(f => ({ ...f, ownerType: e.target.value }))}
                className={inp + ' bg-white font-bengali'}>
                {OWNER_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>সম্পর্কিত আইডি</label>
              <input value={form.ownerId} onChange={e => setForm(f => ({ ...f, ownerId: e.target.value }))}
                className={inp} placeholder="ID (যদি প্রযোজ্য)" />
            </div>
            <div>
              <label className={lbl}>মেয়াদ শেষের তারিখ</label>
              <input type="date" value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className={inp} />
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-bengali bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link href="/documents" className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50 transition text-center">
            বাতিল
          </Link>
          <button type="submit" disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-lg bg-[#0f2d5e] text-white text-sm font-bengali hover:bg-[#1a3f7a] transition disabled:opacity-60">
            {mutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'দলিল যোগ করুন'}
          </button>
        </div>
      </form>
    </div>
  )
}
