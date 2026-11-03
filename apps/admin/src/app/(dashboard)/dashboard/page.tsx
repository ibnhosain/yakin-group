'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { DashboardStats, MonthlyFinancial } from '@yakin/types'
import { formatTaka } from '@yakin/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Users, Briefcase, Building2, Clock, AlertCircle } from 'lucide-react'

function StatCard({ label, value, sub, color = 'navy', icon: Icon, trend }: {
  label: string; value: string; sub?: string; color?: 'navy' | 'green' | 'gold' | 'red'
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  trend?: 'up' | 'down'
}) {
  const colors = {
    navy:  { bg: 'bg-[#0f2d5e]/5',   text: 'text-[#0f2d5e]',   icon: 'bg-[#0f2d5e]/10' },
    green: { bg: 'bg-emerald-50',     text: 'text-emerald-700',  icon: 'bg-emerald-100' },
    gold:  { bg: 'bg-amber-50',       text: 'text-amber-700',    icon: 'bg-amber-100' },
    red:   { bg: 'bg-red-50',         text: 'text-red-600',      icon: 'bg-red-100' },
  }
  const c = colors[color]
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 ${c.bg}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-gray-500 font-bengali mb-2">{label}</div>
          <div className={`text-2xl font-bold tabular ${c.text}`}>{value}</div>
          {sub && <div className="text-xs text-gray-500 mt-1 font-bengali">{sub}</div>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg ${c.icon} flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className={c.text} />
          </div>
        )}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span className="font-bengali">{trend === 'up' ? 'বৃদ্ধি পাচ্ছে' : 'হ্রাস পাচ্ছে'}</span>
        </div>
      )}
    </div>
  )
}

function formatMonth(m: string): string {
  const d = new Date(m + '-01')
  return d.toLocaleDateString('bn-BD', { month: 'short' })
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<{ data: DashboardStats }>('/api/dashboard/stats').then(r => r.data.data),
  })

  const { data: monthly } = useQuery({
    queryKey: ['dashboard-monthly'],
    queryFn: () => api.get<{ data: MonthlyFinancial[] }>('/api/dashboard/monthly-financials').then(r => r.data.data),
  })

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0f2d5e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-bengali">লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  const s = stats
  const chartData = monthly?.map(m => ({
    name: formatMonth(m.month),
    আয়: Math.round(m.income / 100),
    ব্যয়: Math.round(m.expense / 100),
    লাভ: Math.round(m.profit / 100),
  })) ?? []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0e1523] font-bengali">ড্যাশবোর্ড</h1>
        <p className="text-sm text-gray-500 font-bengali mt-1">ইয়াকিন গ্রুপের সামগ্রিক পরিস্থিতি</p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="মোট ব্যবসায়িক মূল্য"    value={formatTaka(s?.totalBusinessValue ?? 0)}   color="navy"  icon={Building2} />
        <StatCard label="মোট বিনিয়োগ"             value={formatTaka(s?.totalInvestment ?? 0)}      color="green" icon={TrendingUp} trend="up" />
        <StatCard label="মোট সম্পদ"               value={formatTaka(s?.totalAssets ?? 0)}          color="navy" />
        <StatCard label="মোট দায়"                 value={formatTaka(s?.totalLiabilities ?? 0)}     color="gold" />
        <StatCard label="মোট আয় (চলতি বছর)"      value={formatTaka(s?.totalIncome ?? 0)}          color="green" trend="up" />
        <StatCard label="মোট ব্যয় (চলতি বছর)"    value={formatTaka(s?.totalExpenses ?? 0)}        color="gold" />
        <StatCard label="নিট লাভ/ক্ষতি"           value={formatTaka(s?.netProfitLoss ?? 0)}        color={(s?.netProfitLoss ?? 0) >= 0 ? 'green' : 'red'} />
        <StatCard label="সক্রিয় প্রজেক্ট"        value={String(s?.activeProjects ?? 0)}           color="navy"  icon={Briefcase} />
      </div>

      {/* People KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="মোট সদস্য"              value={String(s?.totalMembers ?? 0)}         sub={`সক্রিয়: ${s?.activeMembers ?? 0}`}   color="navy"  icon={Users} />
        <StatCard label="মোট বিনিয়োগকারী"       value={String(s?.totalInvestors ?? 0)}       sub={`সক্রিয়: ${s?.activeInvestors ?? 0}`} color="green" icon={TrendingUp} />
        <StatCard label="মোট কর্মী"             value={String(s?.totalEmployees ?? 0)}       color="navy"  icon={Users} />
        <StatCard label="অনুমোদন অপেক্ষমান"     value={String(s?.pendingApprovals ?? 0)}     color={s?.pendingApprovals ? 'gold' : 'navy'} icon={Clock} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Income vs Expense */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-[#0e1523] font-bengali mb-4">মাসিক আয় ও ব্যয়</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="আয়" fill="#0d7c5f" radius={[4,4,0,0]} />
                <Bar dataKey="ব্যয়" fill="#c9902a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm font-bengali">তথ্য নেই</div>
          )}
        </div>

        {/* Profit trend */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-[#0e1523] font-bengali mb-4">লাভ/ক্ষতি প্রবণতা</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f2d5e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0f2d5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="লাভ" stroke="#0f2d5e" fill="url(#profitGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm font-bengali">তথ্য নেই</div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {(s?.pendingApprovals ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-bengali">
            <strong>{s?.pendingApprovals}</strong> টি অনুমোদন অপেক্ষমান আছে।
          </p>
          <a href="/approvals" className="ml-auto text-xs text-amber-700 underline font-bengali">দেখুন</a>
        </div>
      )}
    </div>
  )
}
