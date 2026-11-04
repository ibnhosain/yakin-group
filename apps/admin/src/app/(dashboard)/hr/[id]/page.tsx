'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatTaka, formatDate } from '@yakin/utils'
import { ArrowLeft, Loader2, AlertTriangle, User, Phone, Briefcase, DollarSign } from 'lucide-react'
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

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-400 font-bengali w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-[#0e1523] font-bengali">{value}</span>
    </div>
  )
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: raw, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get<{ data: Record<string, unknown> }>(`/api/hr/employees/${id}`).then(r => r.data.data),
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0f2d5e]" size={28} /></div>
  if (!raw) return <div className="text-center py-16 text-gray-400 font-bengali"><AlertTriangle size={36} className="mx-auto mb-3" />কর্মী পাওয়া যায়নি</div>

  const emp = raw as {
    id: string; employeeNo: string; fullName: string; fullNameBn?: string;
    phone?: string; email?: string; nidNo?: string; address?: string; addressBn?: string;
    department: string; designation: string; joinDate: string;
    basicSalary: number; bankAccount?: string; status: string;
    emergencyContact?: string;
    attendances: { id: string; date: string; status: string; checkIn?: string; checkOut?: string }[];
    leaveRequests: { id: string; leaveType?: { name: string }; startDate: string; endDate: string; status: string }[];
    payrollRecords: { id: string; month: number; year: number; grossSalary: number; netSalary: number; status: string }[];
  }

  const MONTH_NAMES = ['জানু', 'ফেব্র', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগস', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে']

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/hr" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-bold text-[#0e1523] font-bengali">{emp.fullName}</h1>
            <p className="text-sm text-gray-500 font-mono">{emp.employeeNo} · {emp.designation}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold font-bengali ${STATUS_COLORS[emp.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {STATUS_LABEL[emp.status] ?? emp.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-bengali mb-1 flex items-center gap-1"><DollarSign size={12} /> মূল বেতন</p>
              <p className="text-2xl font-bold text-[#0f2d5e]">{formatTaka(emp.basicSalary)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-bengali mb-1">বিভাগ</p>
              <p className="text-lg font-bold text-[#0e1523] font-bengali">{emp.department}</p>
            </div>
          </div>

          {/* Attendance */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#0e1523] font-bengali mb-3">সাম্প্রতিক উপস্থিতি</h3>
            {!emp.attendances?.length ? (
              <p className="text-sm text-gray-400 font-bengali text-center py-6">কোনো রেকর্ড নেই</p>
            ) : (
              <div className="space-y-1">
                {emp.attendances.slice(0, 15).map(a => (
                  <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{formatDate(a.date)}</span>
                    <div className="flex items-center gap-3">
                      {a.checkIn && <span className="text-xs text-gray-400">{a.checkIn.slice(0, 5)} – {a.checkOut?.slice(0, 5) ?? '—'}</span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bengali ${
                        a.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                        a.status === 'ABSENT' ? 'bg-red-50 text-red-700' :
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
            <InfoRow label="বাংলা নাম" value={emp.fullNameBn} />
            <InfoRow label="ফোন" value={emp.phone} />
            <InfoRow label="ইমেইল" value={emp.email} />
            <InfoRow label="NID নম্বর" value={emp.nidNo} />
            <InfoRow label="জরুরি যোগাযোগ" value={emp.emergencyContact} />
            <InfoRow label="ঠিকানা" value={emp.addressBn ?? emp.address} />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-bengali flex items-center gap-1.5"><Briefcase size={13} /> চাকরি</h3>
            <InfoRow label="বিভাগ" value={emp.department} />
            <InfoRow label="পদবি" value={emp.designation} />
            <InfoRow label="যোগদান" value={formatDate(emp.joinDate)} />
            <InfoRow label="ব্যাংক অ্যাকাউন্ট" value={emp.bankAccount} />
          </div>
        </div>
      </div>
    </div>
  )
}
