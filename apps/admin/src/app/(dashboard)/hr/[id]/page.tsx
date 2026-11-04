'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatTaka, formatDate } from '@yakin/utils'
import { ArrowLeft, Loader2, AlertTriangle, User, Briefcase, DollarSign, Edit2, X, Check } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  ON_LEAVE: 'bg-amber-50 text-amber-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  TERMINATED: 'bg-red-50 text-red-700',
}
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'সক্রিয়', ON_LEAVE: 'ছুটিতে', INACTIVE: 'নিষ্ক্রিয়', TERMINATED: 'বরখাস্ত',
}
const ATTEND_LABEL: Record<string, string> = {
  PRESENT: 'উপস্থিত', ABSENT: 'অনুপস্থিত', LATE: 'বিলম্বিত', HALF_DAY: 'অর্ধদিন', ON_LEAVE: 'ছুটি',
}
const MONTH_NAMES = ['জানু', 'ফেব্র', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগস', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে']

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2d5e]/30 focus:border-[#0f2d5e] font-bengali'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-400 font-bengali w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[#0e1523] font-bengali">{value}</span>
    </div>
  )
}

interface Dept { id: string; name: string; nameBn?: string }
interface Desig { id: string; name: string; nameBn?: string }

interface EmployeeDetail {
  id: string; employeeNo: string; nidNumber?: string; address?: string; emergencyPhone?: string;
  basicSalary: number; bankAccountNo?: string; bankName?: string; joiningDate: string; status: string;
  departmentId?: string; designationId?: string;
  user: { fullName: string; fullNameBn?: string; phone: string; email?: string };
  department?: { name: string; nameBn?: string };
  designation?: { name: string; nameBn?: string };
  attendance: Array<{ id: string; date: string; status: string; checkIn?: string; checkOut?: string }>;
  leaveRequests: Array<{ id: string; startDate: string; endDate: string; status: string; leaveType?: { name: string } }>;
  payrollRecords: Array<{ id: string; month: number; year: number; grossSalary: number; netSalary: number; status: string }>;
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [editError, setEditError] = useState('')

  const { data: emp, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get<{ data: EmployeeDetail }>(`/api/hr/employees/${id}`).then(r => r.data.data),
  })

  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<{ data: Dept[] }>('/api/hr/departments').then(r => r.data.data),
    enabled: editing,
  })
  const { data: desigs } = useQuery({
    queryKey: ['designations'],
    queryFn: () => api.get<{ data: Desig[] }>('/api/hr/designations').then(r => r.data.data),
    enabled: editing,
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/api/hr/employees/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee', id] }),
  })

  const editMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch(`/api/hr/employees/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employee', id] }); setEditing(false); setEditError('') },
    onError: (e: { response?: { data?: { messageBn?: string; message?: string } } }) => {
      setEditError(e.response?.data?.messageBn ?? e.response?.data?.message ?? 'ত্রুটি হয়েছে')
    },
  })

  function startEdit() {
    if (!emp) return
    setEditForm({
      fullName: emp.user.fullName,
      fullNameBn: emp.user.fullNameBn ?? '',
      phone: emp.user.phone,
      email: emp.user.email ?? '',
      nidNumber: emp.nidNumber ?? '',
      address: emp.address ?? '',
      emergencyPhone: emp.emergencyPhone ?? '',
      basicSalary: emp.basicSalary ? String(emp.basicSalary / 100) : '',
      bankName: emp.bankName ?? '',
      bankAccountNo: emp.bankAccountNo ?? '',
      departmentId: emp.departmentId ?? '',
      designationId: emp.designationId ?? '',
    })
    setEditing(true)
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0f2d5e]" size={28} /></div>
  if (!emp) return <div className="text-center py-16 text-gray-400 font-bengali"><AlertTriangle size={36} className="mx-auto mb-3" />কর্মী পাওয়া যায়নি</div>

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/hr" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-bold text-[#0e1523] font-bengali">{emp.user.fullNameBn ?? emp.user.fullName}</h1>
            <p className="text-sm text-gray-500 font-mono">{emp.employeeNo} · {emp.designation?.nameBn ?? emp.designation?.name ?? '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold font-bengali ${STATUS_COLORS[emp.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABEL[emp.status] ?? emp.status}
          </span>
          {emp.status === 'ACTIVE' && (
            <button onClick={() => statusMutation.mutate('INACTIVE')} disabled={statusMutation.isPending}
              className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bengali">
              নিষ্ক্রিয় করুন
            </button>
          )}
          {emp.status === 'INACTIVE' && (
            <button onClick={() => statusMutation.mutate('ACTIVE')} disabled={statusMutation.isPending}
              className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bengali">
              সক্রিয় করুন
            </button>
          )}
          <button onClick={startEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-bengali">
            <Edit2 size={12} /> সম্পাদনা
          </button>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-[#0e1523] font-bengali">তথ্য সম্পাদনা</h3>
              <button onClick={() => { setEditing(false); setEditError('') }}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              {editError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm font-bengali">{editError}</div>}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'fullName', label: 'নাম (ইংরেজি)' },
                  { key: 'fullNameBn', label: 'নাম (বাংলা)' },
                  { key: 'phone', label: 'ফোন' },
                  { key: 'email', label: 'ইমেইল' },
                  { key: 'nidNumber', label: 'NID নম্বর' },
                  { key: 'address', label: 'ঠিকানা' },
                  { key: 'emergencyPhone', label: 'জরুরি ফোন' },
                  { key: 'basicSalary', label: 'মূল বেতন (৳)' },
                  { key: 'bankName', label: 'ব্যাংক' },
                  { key: 'bankAccountNo', label: 'অ্যাকাউন্ট নম্বর' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 font-bengali mb-1">{label}</label>
                    <input type={key === 'basicSalary' ? 'number' : 'text'} className={inputCls}
                      value={editForm[key] ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 font-bengali mb-1">বিভাগ</label>
                  <select className={inputCls} value={editForm.departmentId ?? ''} onChange={e => setEditForm(f => ({ ...f, departmentId: e.target.value }))}>
                    <option value="">—</option>
                    {depts?.map(d => <option key={d.id} value={d.id}>{d.nameBn ?? d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 font-bengali mb-1">পদবি</label>
                  <select className={inputCls} value={editForm.designationId ?? ''} onChange={e => setEditForm(f => ({ ...f, designationId: e.target.value }))}>
                    <option value="">—</option>
                    {desigs?.map(d => <option key={d.id} value={d.id}>{d.nameBn ?? d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
              <button onClick={() => { setEditing(false); setEditError('') }} className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-bengali text-gray-600 hover:bg-gray-50">বাতিল</button>
              <button onClick={() => editMutation.mutate({
                ...editForm,
                basicSalary: editForm.basicSalary ? Math.round(parseFloat(editForm.basicSalary) * 100) : undefined,
              })} disabled={editMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-bengali hover:bg-[#0a1c3b] disabled:opacity-50">
                {editMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-bengali mb-1 flex items-center gap-1"><DollarSign size={12} /> মূল বেতন</p>
              <p className="text-2xl font-bold text-[#0f2d5e]">{formatTaka(emp.basicSalary)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-bengali mb-1">বিভাগ</p>
              <p className="text-lg font-bold text-[#0e1523] font-bengali">{emp.department?.nameBn ?? emp.department?.name ?? '—'}</p>
            </div>
          </div>

          {/* Attendance */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#0e1523] font-bengali mb-3">সাম্প্রতিক উপস্থিতি</h3>
            {!emp.attendance?.length ? (
              <p className="text-sm text-gray-400 font-bengali text-center py-6">কোনো রেকর্ড নেই</p>
            ) : (
              <div className="space-y-1">
                {emp.attendance.slice(0, 15).map(a => (
                  <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{formatDate(a.date)}</span>
                    <div className="flex items-center gap-3">
                      {a.checkIn && <span className="text-xs text-gray-400">{a.checkIn.slice(0, 5)} – {a.checkOut?.slice(0, 5) ?? '—'}</span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bengali ${
                        a.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                        a.status === 'ABSENT'  ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>{ATTEND_LABEL[a.status] ?? a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payroll */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#0e1523] font-bengali mb-3">বেতন ইতিহাস</h3>
            {!emp.payrollRecords?.length ? (
              <p className="text-sm text-gray-400 font-bengali text-center py-6">কোনো রেকর্ড নেই</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 font-bengali border-b border-gray-100">
                    <th className="pb-2 text-left">মাস/বছর</th>
                    <th className="pb-2 text-right">মোট বেতন</th>
                    <th className="pb-2 text-right">নেট বেতন</th>
                    <th className="pb-2 text-left">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {emp.payrollRecords.map(p => (
                    <tr key={p.id}>
                      <td className="py-2 font-bengali">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                      <td className="py-2 text-right tabular">{formatTaka(p.grossSalary)}</td>
                      <td className="py-2 text-right tabular font-semibold text-emerald-700">{formatTaka(p.netSalary)}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bengali ${p.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {p.status === 'PAID' ? 'পরিশোধিত' : 'বকেয়া'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-bengali flex items-center gap-1.5"><User size={13} /> ব্যক্তিগত</h3>
            <InfoRow label="বাংলা নাম" value={emp.user.fullNameBn} />
            <InfoRow label="ফোন" value={emp.user.phone} />
            <InfoRow label="ইমেইল" value={emp.user.email} />
            <InfoRow label="NID নম্বর" value={emp.nidNumber} />
            <InfoRow label="জরুরি যোগাযোগ" value={emp.emergencyPhone} />
            <InfoRow label="ঠিকানা" value={emp.address} />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-bengali flex items-center gap-1.5"><Briefcase size={13} /> চাকরি</h3>
            <InfoRow label="বিভাগ" value={emp.department?.nameBn ?? emp.department?.name} />
            <InfoRow label="পদবি" value={emp.designation?.nameBn ?? emp.designation?.name} />
            <InfoRow label="যোগদান" value={formatDate(emp.joiningDate)} />
            <InfoRow label="ব্যাংক" value={emp.bankName} />
            <InfoRow label="অ্যাকাউন্ট" value={emp.bankAccountNo} />
          </div>
        </div>
      </div>
    </div>
  )
}
