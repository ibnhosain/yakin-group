// Yakin Group — Shared TypeScript Types
// Used by all three apps: API, Admin, Mobile

// ─── Auth ─────────────────────────────────────
export interface AuthUser {
  id: string
  email: string
  phone: string | null
  fullName: string
  fullNameBn: string | null
  avatarUrl: string | null
  roleId: string
  roleName: string
  permissions: string[]
  isActive: boolean
  twoFactorEnabled: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginRequest {
  email: string
  password: string
  totpCode?: string
}

export interface LoginResponse {
  user: AuthUser
  tokens: AuthTokens
  requiresTwoFactor?: boolean
}

// ─── Roles ────────────────────────────────────
export type RoleName =
  | 'super_admin'
  | 'chairman'
  | 'managing_director'
  | 'director'
  | 'general_manager'
  | 'accountant'
  | 'investment_manager'
  | 'project_manager'
  | 'hr_manager'
  | 'employee'
  | 'member'
  | 'investor'

// ─── Pagination ───────────────────────────────
export interface PaginationQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── API Response ─────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  messageBn?: string
  data?: T
  error?: string
}

// ─── Members ──────────────────────────────────
export type MemberStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REJECTED'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface MemberListItem {
  id: string
  memberNo: string
  fullName: string
  phone: string | null
  email: string | null
  categoryName: string
  status: MemberStatus
  totalShares: number
  membershipDate: string
}

export interface MemberDetail extends MemberListItem {
  fullNameBn: string | null
  nidNumber: string | null
  dateOfBirth: string | null
  gender: Gender | null
  address: string | null
  photoUrl: string | null
  nomineeName: string | null
  nomineeRelation: string | null
  nomineePhone: string | null
  totalInvested: number // paisa
}

export interface CreateMemberRequest {
  email: string
  phone: string
  password: string
  fullName: string
  fullNameBn?: string
  categoryId: string
  nidNumber?: string
  dateOfBirth?: string
  gender?: Gender
  address?: string
  nomineeName?: string
  nomineeRelation?: string
  nomineePhone?: string
}

// ─── Investors ────────────────────────────────
export type InvestorStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED'
export type InvestmentStatus = 'PENDING' | 'UNDER_REVIEW' | 'AGREEMENT_PENDING' | 'PAYMENT_PENDING' | 'ACTIVE' | 'MATURED' | 'CLOSED' | 'REJECTED'

export interface InvestorListItem {
  id: string
  investorNo: string
  fullName: string
  fullNameBn: string | null
  phone: string | null
  email: string | null
  totalInvestment: number // paisa (active investments total)
  totalInvested: number // paisa (all time)
  totalWithdrawn: number // paisa
  activeInvestments: number // count
  status: InvestorStatus
  createdAt: string
}

export interface InvestmentListItem {
  id: string
  investmentNo: string
  investorName: string
  planName: string
  principalAmount: number // paisa
  startDate: string
  endDate: string | null
  status: InvestmentStatus
}

// ─── Businesses ───────────────────────────────
export type BusinessStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED'

export interface BusinessListItem {
  id: string
  name: string
  nameBn: string | null
  category: string
  categoryName: string
  location: string | null
  capital: number // paisa
  totalInvestment: number // paisa
  status: BusinessStatus
  establishedDate: string | null
  createdAt: string
}

// ─── Projects ─────────────────────────────────
export type ProjectStatus = 'PLANNING' | 'APPROVED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'

export interface ProjectListItem {
  id: string
  name: string
  nameBn: string | null
  businessName: string
  managerName: string | null
  budget: number // paisa
  progressPercent: number | null
  status: ProjectStatus
  startDate: string | null
  endDate: string | null
  expectedEndDate: string | null
}

// ─── Properties ───────────────────────────────
export type PropertyType = 'LAND' | 'BUILDING' | 'APARTMENT' | 'COMMERCIAL' | 'AGRICULTURAL' | 'OTHER'
export type PropertyStatus = 'ACTIVE' | 'SOLD' | 'MORTGAGED' | 'DISPUTED'
export type AreaUnit = 'DECIMAL' | 'KATHA' | 'BIGHA' | 'ACRE' | 'SQFT' | 'SQMETER'

export interface PropertyListItem {
  id: string
  propertyNo: string
  name: string
  nameBn: string | null
  location: string
  district: string | null
  division: string | null
  propertyType: PropertyType
  area: number
  areaUnit: AreaUnit
  totalArea: number
  purchasePrice: number // paisa
  currentValue: number | null // paisa
  status: PropertyStatus
}

// ─── Employees ────────────────────────────────
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED'

export interface EmployeeListItem {
  id: string
  employeeNo: string
  fullName: string
  fullNameBn: string | null
  phone: string | null
  department: string | null
  designation: string | null
  departmentName: string | null
  designationName: string | null
  basicSalary: number // paisa
  status: EmployeeStatus
  joinDate: string
  joiningDate: string
  createdAt: string
}

// ─── Accounting ───────────────────────────────
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'

export interface AccountListItem {
  id: string
  code: string
  name: string
  nameBn: string | null
  type: AccountType
  balance: number // paisa
  parentName: string | null
  level: number | null
}

export interface JournalEntryRequest {
  date: string
  description: string
  descriptionBn?: string
  voucherType: 'JOURNAL' | 'PAYMENT' | 'RECEIPT' | 'CONTRA'
  lines: {
    accountId: string
    debit: number // paisa
    credit: number // paisa
    narration?: string
  }[]
}

// ─── Approvals ────────────────────────────────
export type ApprovalType = 'NEW_MEMBERSHIP' | 'INVESTMENT_APPLICATION' | 'INVESTMENT_WITHDRAWAL' | 'SHARE_TRANSFER' | 'LAND_PURCHASE' | 'LAND_SALE' | 'PROJECT_BUDGET' | 'EXPENSE_APPROVAL' | 'LEAVE_REQUEST' | 'SALARY_PAYMENT' | 'FINANCIAL_ADJUSTMENT' | 'OTHER'
export type ApprovalStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface ApprovalListItem {
  id: string
  type: ApprovalType
  requesterName: string
  reviewerName: string | null
  requestNote: string | null
  decisionNote: string | null
  status: ApprovalStatus
  requestedAt: string
  decidedAt: string | null
}

// ─── Dashboard ────────────────────────────────
export interface DashboardStats {
  totalBusinessValue: number // paisa
  totalInvestment: number    // paisa
  totalAssets: number        // paisa
  totalLiabilities: number   // paisa
  totalIncome: number        // paisa (current fiscal year)
  totalExpenses: number      // paisa (current fiscal year)
  netProfitLoss: number      // paisa (current fiscal year)
  activeProjects: number
  totalMembers: number
  activeMembers: number
  totalInvestors: number
  activeInvestors: number
  totalEmployees: number
  pendingApprovals: number
  pendingInvestments: number
}

export interface MonthlyFinancial {
  year: number
  month: number  // 1-12
  income: number  // paisa
  expense: number // paisa
  profit: number  // paisa
}

// ─── Notifications ───────────────────────────
export type NotificationType = 'GENERAL' | 'INVESTMENT_UPDATE' | 'MEMBER_UPDATE' | 'PAYMENT_REMINDER' | 'APPROVAL_REQUEST' | 'APPROVAL_DECISION' | 'MEETING_INVITE' | 'TASK_ASSIGNED' | 'SALARY_PROCESSED' | 'LEAVE_DECISION' | 'SYSTEM'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  titleBn: string | null
  body: string | null
  bodyBn: string | null
  isRead: boolean
  sentAt: string
  createdAt: string
  readAt: string | null
}

// ─── Utility types ────────────────────────────
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_BANKING' | 'ONLINE' | 'OTHER'

// Format paisa to ৳ display string
export function formatTaka(paisa: number): string {
  return '৳' + (paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Format paisa to number
export function paisaToTaka(paisa: number): number {
  return paisa / 100
}

export function takaToPaisa(taka: number): number {
  return Math.round(taka * 100)
}
