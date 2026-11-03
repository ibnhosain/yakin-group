'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated, logout } from '@/lib/auth'
import {
  LayoutDashboard, Users, TrendingUp, Building2, MapPin, FolderKanban,
  Calculator, UserCheck, FileText, Bell, CalendarDays, CheckSquare,
  Settings, LogOut, Menu, X, ChevronDown
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',      label: 'ড্যাশবোর্ড',     icon: LayoutDashboard, permission: 'dashboard:read' },
  { href: '/members',        label: 'সদস্য',           icon: Users,           permission: 'members:read' },
  { href: '/investors',      label: 'বিনিয়োগকারী',    icon: TrendingUp,      permission: 'investors:read' },
  { href: '/businesses',     label: 'ব্যবসা',          icon: Building2,       permission: 'businesses:read' },
  { href: '/properties',     label: 'জমি ও সম্পত্তি',  icon: MapPin,          permission: 'properties:read' },
  { href: '/projects',       label: 'প্রজেক্ট',        icon: FolderKanban,    permission: 'projects:read' },
  { href: '/accounting',     label: 'হিসাব',           icon: Calculator,      permission: 'accounting:read' },
  { href: '/hr',             label: 'এইচআর',           icon: UserCheck,       permission: 'employees:read' },
  { href: '/documents',      label: 'দলিলপত্র',        icon: FileText,        permission: 'documents:read' },
  { href: '/meetings',       label: 'সভা',             icon: CalendarDays,    permission: 'meetings:read' },
  { href: '/notifications',  label: 'বিজ্ঞপ্তি',      icon: Bell,            permission: 'notifications:read' },
  { href: '/approvals',      label: 'অনুমোদন',        icon: CheckSquare,     permission: 'approvals:read' },
  { href: '/settings',       label: 'সেটিংস',         icon: Settings,        permission: 'settings:read' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login')
  }, [router])

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-[#f8f9fb] overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0f2d5e] text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-white font-bold text-lg">ই</span>
            </div>
            <div>
              <div className="font-bold text-sm leading-none font-bengali">ইয়াকিন গ্রুপ</div>
              <div className="text-xs text-white/50 mt-0.5">Management System</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-colors font-bengali text-sm
                  ${active ? 'bg-white/15 text-white font-medium' : 'text-white/65 hover:bg-white/08 hover:text-white'}
                `}
              >
                <Icon size={17} className="flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-white/65 hover:bg-red-500/20 hover:text-red-300 transition-colors font-bengali text-sm"
          >
            <LogOut size={17} />
            {loggingOut ? 'অপেক্ষা করুন...' : 'লগআউট'}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
