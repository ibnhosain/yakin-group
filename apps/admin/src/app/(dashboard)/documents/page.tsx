'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate, toBengaliNumber } from '@yakin/utils'
import { FileText, Search, Plus, Download, Eye } from 'lucide-react'

interface Document {
  id: string; title: string; titleBn?: string; category: string; categoryBn?: string
  fileSize: number; mimeType: string; uploadedAt: string; uploaderName: string
  isPublic: boolean; tags: string[]
}

function fileIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('image')) return '🖼️'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
  return '📁'
}

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['documents', search, category],
    queryFn: () =>
      api.get<{ data: Document[] }>(`/api/documents?search=${search}&category=${category}`).then(r => r.data.data),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">দলিলপত্র ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-500 font-bengali mt-0.5">সকল গুরুত্বপূর্ণ দস্তাবেজ</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#1a3f7a] transition">
          <Plus size={16} /> আপলোড করুন
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="নাম দিয়ে খুঁজুন..."
            className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm font-bengali focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/20"
          />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bengali bg-white focus:outline-none">
          <option value="">সব ক্যাটাগরি</option>
          <option value="LEGAL">আইনি দলিল</option>
          <option value="FINANCIAL">আর্থিক রেকর্ড</option>
          <option value="PROPERTY">সম্পত্তি দলিল</option>
          <option value="EMPLOYEE">কর্মী রেকর্ড</option>
          <option value="OTHER">অন্যান্য</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="h-5 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
            </div>
          ))
        ) : (data ?? []).length === 0 ? (
          <div className="col-span-3 py-16 text-center">
            <FileText size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-bengali">কোনো দলিল পাওয়া যায়নি</p>
          </div>
        ) : (data ?? []).map(doc => (
          <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#0f2d5e]/20 hover:shadow-sm transition-all">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{fileIcon(doc.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#0e1523] font-bengali text-sm truncate">{doc.titleBn || doc.title}</p>
                <p className="text-xs text-gray-400 font-bengali mt-0.5">{doc.categoryBn || doc.category}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{fileSize(doc.fileSize)}</span>
                  <span>{formatDate(doc.uploadedAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bengali text-gray-600 hover:bg-gray-50 transition">
                <Eye size={13} /> দেখুন
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bengali text-gray-600 hover:bg-gray-50 transition">
                <Download size={13} /> ডাউনলোড
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
