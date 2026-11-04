'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate } from '@yakin/utils'
import Link from 'next/link'
import { ArrowLeft, Download, Trash2, ExternalLink, FileText, Calendar, User, Tag } from 'lucide-react'

interface DocumentDetail {
  id: string; title: string; description?: string
  categoryName?: string; fileName: string; fileSize: number
  mimeType: string; fileUrl: string; ownerType?: string; ownerId?: string
  uploadedByName: string; expiresAt?: string; createdAt: string
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

const OWNER_TYPE_BN: Record<string, string> = {
  MEMBER: 'সদস্য', INVESTOR: 'বিনিয়োগকারী', EMPLOYEE: 'কর্মী',
  BUSINESS: 'ব্যবসা', PROPERTY: 'সম্পত্তি', PROJECT: 'প্রজেক্ট',
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const docs = await api.get<{ data: DocumentDetail[] }>(`/api/documents?search=`).then(r => r.data.data)
      return docs.find(d => d.id === id) ?? null
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      router.push('/documents')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-1/3" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!data) return <p className="text-gray-500 font-bengali text-center py-16">দলিল পাওয়া যায়নি</p>

  const doc = data

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/documents" className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#0e1523] font-bengali">{doc.title}</h1>
          {doc.description && <p className="text-sm text-gray-500 font-bengali mt-0.5">{doc.description}</p>}
        </div>
      </div>

      {/* File Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-5">
          <span className="text-4xl">{fileIcon(doc.mimeType)}</span>
          <div className="flex-1">
            <p className="font-semibold text-[#0e1523]">{doc.fileName}</p>
            <p className="text-sm text-gray-400">{fileSize(doc.fileSize)} · {doc.mimeType}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <a href={doc.fileUrl} target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0f2d5e] text-white text-sm font-bengali hover:bg-[#1a3f7a] transition">
            <ExternalLink size={15} /> খুলুন
          </a>
          <a href={doc.fileUrl} download={doc.fileName} target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50 transition">
            <Download size={15} /> ডাউনলোড
          </a>
          <button onClick={() => setConfirmDelete(true)}
            className="p-2.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#0e1523] font-bengali">বিস্তারিত তথ্য</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: <Tag size={14} className="text-gray-400" />, label: 'ক্যাটাগরি', value: doc.categoryName ?? '—' },
            { icon: <User size={14} className="text-gray-400" />, label: 'আপলোডকারী', value: doc.uploadedByName },
            { icon: <Calendar size={14} className="text-gray-400" />, label: 'আপলোডের তারিখ', value: formatDate(doc.createdAt) },
            { icon: <Calendar size={14} className="text-gray-400" />, label: 'মেয়াদ শেষ', value: doc.expiresAt ? formatDate(doc.expiresAt) : '—' },
            ...(doc.ownerType ? [{
              icon: <FileText size={14} className="text-gray-400" />,
              label: 'সম্পর্কিত বিভাগ',
              value: `${OWNER_TYPE_BN[doc.ownerType] ?? doc.ownerType}${doc.ownerId ? ` (${doc.ownerId.slice(0,8)}...)` : ''}`,
            }] : []),
          ].map(item => (
            <div key={item.label} className="flex items-start gap-2">
              <div className="mt-0.5">{item.icon}</div>
              <div>
                <p className="text-xs text-gray-400 font-bengali">{item.label}</p>
                <p className="text-sm text-gray-700 font-bengali">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
            <Trash2 size={32} className="mx-auto text-red-500" />
            <h3 className="text-base font-bold text-[#0e1523] font-bengali">দলিল মুছে ফেলবেন?</h3>
            <p className="text-sm text-gray-500 font-bengali">এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50 transition">
                বাতিল
              </button>
              <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bengali hover:bg-red-600 transition disabled:opacity-60">
                {deleteMutation.isPending ? 'মুছছে...' : 'মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
