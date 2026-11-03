// Yakin Group — Shared Utility Functions

// ─── Currency ─────────────────────────────────
export function formatTaka(paisa: number, showSymbol = true): string {
  const taka = paisa / 100
  const formatted = taka.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return showSymbol ? `৳${formatted}` : formatted
}

export function paisaToTaka(paisa: number): number {
  return paisa / 100
}

export function takaToPaisa(taka: number): number {
  return Math.round(taka * 100)
}

// ─── Date formatting ──────────────────────────
export function formatDate(date: string | Date, locale: 'bn' | 'en' = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date, locale: 'bn' | 'en' = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getMonthYear(date: Date = new Date()): { month: number; year: number } {
  return { month: date.getMonth() + 1, year: date.getFullYear() }
}

// ─── ID generators ────────────────────────────
export function generateMemberNo(count: number, prefix = 'YGM'): string {
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`
}

export function generateInvestorNo(count: number): string {
  return generateMemberNo(count, 'YGI')
}

export function generateEmployeeNo(count: number): string {
  return generateMemberNo(count, 'YGE')
}

export function generateInvestmentNo(count: number): string {
  return generateMemberNo(count, 'YGN')
}

export function generatePropertyNo(count: number): string {
  return generateMemberNo(count, 'YGP')
}

export function generateJournalRefNo(count: number): string {
  const year = new Date().getFullYear()
  return `JE-${year}-${String(count + 1).padStart(5, '0')}`
}

// ─── Validation helpers ───────────────────────
export function isValidBDPhone(phone: string): boolean {
  return /^(\+880|880|0)?1[3-9]\d{8}$/.test(phone.replace(/\s/g, ''))
}

export function isValidNID(nid: string): boolean {
  return /^\d{10}$|^\d{13}$|^\d{17}$/.test(nid)
}

export function isStrongPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)
}

// ─── Bengali numerals ─────────────────────────
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

export function toBengaliNumber(n: number | string): string {
  return String(n).replace(/\d/g, (d) => BN_DIGITS[parseInt(d)])
}

export function toEnglishNumber(n: string): string {
  return n.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
}

// ─── Permission checking ──────────────────────
export function hasPermission(userPermissions: string[], required: string): boolean {
  if (userPermissions.includes('*:*')) return true
  if (userPermissions.includes(required)) return true
  const [resource, action] = required.split(':')
  if (userPermissions.includes(`${resource}:*`)) return true
  if (action !== '*' && userPermissions.includes(`*:${action}`)) return true
  return false
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some((p) => hasPermission(userPermissions, p))
}

// ─── Number formatting ────────────────────────
export function formatNumber(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} কোটি`
  if (n >= 100000)   return `${(n / 100000).toFixed(2)} লাখ`
  if (n >= 1000)     return `${(n / 1000).toFixed(2)}K`
  return String(n)
}

// ─── Status labels ────────────────────────────
export const STATUS_LABELS_BN: Record<string, string> = {
  PENDING:          'অপেক্ষমান',
  ACTIVE:           'সক্রিয়',
  SUSPENDED:        'স্থগিত',
  EXPIRED:          'মেয়াদোত্তীর্ণ',
  REJECTED:         'প্রত্যাখ্যাত',
  APPROVED:         'অনুমোদিত',
  UNDER_REVIEW:     'পর্যালোচনাধীন',
  AGREEMENT_PENDING:'চুক্তি অপেক্ষমান',
  PAYMENT_PENDING:  'পেমেন্ট অপেক্ষমান',
  MATURED:          'পরিপক্ব',
  CLOSED:           'বন্ধ',
  PLANNING:         'পরিকল্পনা',
  IN_PROGRESS:      'চলমান',
  ON_HOLD:          'স্থগিত',
  COMPLETED:        'সম্পন্ন',
  ARCHIVED:         'আর্কাইভ',
  DRAFT:            'খসড়া',
  PAID:             'পরিশোধিত',
  CANCELLED:        'বাতিল',
}

export function getStatusLabelBn(status: string): string {
  return STATUS_LABELS_BN[status] ?? status
}
