import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ROLES = [
  { name: 'super_admin',        displayName: 'সুপার অ্যাডমিন',      displayNameEn: 'Super Admin',        isSystem: true,  permissions: ['*:*'] },
  { name: 'chairman',           displayName: 'চেয়ারম্যান',           displayNameEn: 'Chairman',           isSystem: false, permissions: ['dashboard:read','members:read','investors:read','investments:read','businesses:read','projects:read','accounting:read','employees:read','approvals:read','approvals:manage','reports:read','meetings:read'] },
  { name: 'managing_director',  displayName: 'ব্যবস্থাপনা পরিচালক', displayNameEn: 'Managing Director',  isSystem: false, permissions: ['dashboard:read','members:*','investors:*','investments:*','businesses:*','projects:*','accounting:*','employees:*','approvals:*','reports:*','meetings:*','documents:*'] },
  { name: 'director',           displayName: 'পরিচালক',              displayNameEn: 'Director',           isSystem: false, permissions: ['dashboard:read','members:read','investors:read','investments:read','businesses:read','projects:read','accounting:read','employees:read','approvals:read','reports:read'] },
  { name: 'general_manager',    displayName: 'মহাব্যবস্থাপক',       displayNameEn: 'General Manager',    isSystem: false, permissions: ['dashboard:read','members:read','investors:read','projects:*','businesses:read','employees:read','accounting:read','reports:read','approvals:read'] },
  { name: 'accountant',         displayName: 'হিসাবরক্ষক',          displayNameEn: 'Accountant',         isSystem: false, permissions: ['accounting:*','reports:read','dashboard:read','members:read','investors:read','payroll:read','approvals:create'] },
  { name: 'investment_manager', displayName: 'বিনিয়োগ ব্যবস্থাপক',  displayNameEn: 'Investment Manager', isSystem: false, permissions: ['investments:*','investors:*','dashboard:read','reports:read','approvals:create','documents:read'] },
  { name: 'project_manager',    displayName: 'প্রজেক্ট ব্যবস্থাপক', displayNameEn: 'Project Manager',    isSystem: false, permissions: ['projects:*','properties:*','dashboard:read','reports:read','documents:*','approvals:create'] },
  { name: 'hr_manager',         displayName: 'এইচআর ব্যবস্থাপক',   displayNameEn: 'HR Manager',         isSystem: false, permissions: ['employees:*','attendance:*','payroll:*','leave:*','dashboard:read','reports:read','approvals:create'] },
  { name: 'employee',           displayName: 'কর্মী',               displayNameEn: 'Employee',           isSystem: false, permissions: ['profile:read','profile:update','attendance:self','payroll:self','leave:self','tasks:self','notifications:read'] },
  { name: 'member',             displayName: 'সদস্য',               displayNameEn: 'Member',             isSystem: false, permissions: ['profile:read','profile:update','shares:read','transactions:read','notices:read','notifications:read'] },
  { name: 'investor',           displayName: 'বিনিয়োগকারী',        displayNameEn: 'Investor',           isSystem: false, permissions: ['profile:read','profile:update','investments:self','reports:self','notifications:read'] },
]

const SYSTEM_SETTINGS = [
  { key: 'org_name',           value: 'Yakin Group' },
  { key: 'org_name_bn',        value: 'ইয়াকিন গ্রুপ' },
  { key: 'org_address',        value: 'Bangladesh' },
  { key: 'org_phone',          value: '' },
  { key: 'org_email',          value: '' },
  { key: 'currency',           value: 'BDT' },
  { key: 'currency_symbol',    value: '৳' },
  { key: 'fiscal_year_start',  value: '07' }, // July
  { key: 'share_face_value',   value: '100000' }, // ৳1000 in paisa
  { key: 'member_id_prefix',   value: 'YGM' },
  { key: 'investor_id_prefix', value: 'YGI' },
  { key: 'employee_id_prefix', value: 'YGE' },
  { key: 'investment_id_prefix', value: 'YGN' },
  { key: 'property_id_prefix', value: 'YGP' },
]

const BUSINESS_CATEGORIES = [
  { name: 'real_estate', nameBn: 'রিয়েল এস্টেট' },
  { name: 'trading',     nameBn: 'ট্রেডিং' },
  { name: 'technology',  nameBn: 'প্রযুক্তি' },
  { name: 'agriculture', nameBn: 'কৃষি' },
  { name: 'services',    nameBn: 'সেবা' },
  { name: 'manufacturing', nameBn: 'উৎপাদন' },
]

const MEMBER_CATEGORIES = [
  { name: 'general',    nameBn: 'সাধারণ সদস্য',  membershipFee: 50000, sharePrice: 100000 },
  { name: 'associate',  nameBn: 'সহযোগী সদস্য',  membershipFee: 100000, sharePrice: 100000 },
  { name: 'life',       nameBn: 'আজীবন সদস্য',   membershipFee: 500000, sharePrice: 100000 },
]

const INVESTMENT_PLANS = [
  {
    name: 'Standard Plan', nameBn: 'স্ট্যান্ডার্ড প্ল্যান',
    description: 'Fixed duration investment with profit sharing',
    minimumAmount: 5000000, // ৳50,000
    durationMonths: 12,
    profitRule: { type: 'profit_share', description: 'Profit distributed per board approval' },
  },
  {
    name: 'Premium Plan', nameBn: 'প্রিমিয়াম প্ল্যান',
    description: 'Long-term investment with quarterly reviews',
    minimumAmount: 25000000, // ৳2,50,000
    durationMonths: 24,
    profitRule: { type: 'profit_share', description: 'Profit distributed per board approval' },
  },
]

const DEPARTMENTS = [
  { name: 'Management',  nameBn: 'ব্যবস্থাপনা' },
  { name: 'Finance',     nameBn: 'অর্থ বিভাগ' },
  { name: 'Operations',  nameBn: 'পরিচালনা' },
  { name: 'HR',          nameBn: 'মানব সম্পদ' },
  { name: 'IT',          nameBn: 'তথ্যপ্রযুক্তি' },
  { name: 'Marketing',   nameBn: 'বিপণন' },
]

const DESIGNATIONS = [
  { name: 'CEO',           nameBn: 'প্রধান নির্বাহী কর্মকর্তা' },
  { name: 'Manager',       nameBn: 'ব্যবস্থাপক' },
  { name: 'Officer',       nameBn: 'কর্মকর্তা' },
  { name: 'Executive',     nameBn: 'নির্বাহী' },
  { name: 'Assistant',     nameBn: 'সহকারী' },
  { name: 'Accountant',    nameBn: 'হিসাবরক্ষক' },
]

const LEAVE_TYPES = [
  { name: 'Annual Leave',  nameBn: 'বার্ষিক ছুটি',  maxDays: 15, isPaid: true },
  { name: 'Sick Leave',    nameBn: 'অসুস্থতাজনিত ছুটি', maxDays: 10, isPaid: true },
  { name: 'Casual Leave',  nameBn: 'আনানুষ্ঠানিক ছুটি', maxDays: 10, isPaid: true },
  { name: 'Maternity',     nameBn: 'মাতৃত্বকালীন ছুটি',  maxDays: 112, isPaid: true },
  { name: 'Unpaid Leave',  nameBn: 'বিনা বেতনে ছুটি',    maxDays: 30, isPaid: false },
]

const DOCUMENT_CATEGORIES = [
  { name: 'National ID',        nameBn: 'জাতীয় পরিচয়পত্র' },
  { name: 'Deed',               nameBn: 'দলিল' },
  { name: 'Agreement',          nameBn: 'চুক্তিপত্র' },
  { name: 'Certificate',        nameBn: 'সনদপত্র' },
  { name: 'License',            nameBn: 'লাইসেন্স' },
  { name: 'Meeting Minutes',    nameBn: 'সভার কার্যবিবরণী' },
  { name: 'Financial Document', nameBn: 'আর্থিক দলিল' },
  { name: 'Employee Document',  nameBn: 'কর্মী দলিল' },
  { name: 'Other',              nameBn: 'অন্যান্য' },
]

// Chart of Accounts (standard double-entry)
const ACCOUNTS = [
  // Assets (1xxx)
  { code: '1000', name: 'Assets',              nameBn: 'সম্পদ',         type: 'ASSET',     parentCode: null },
  { code: '1100', name: 'Current Assets',      nameBn: 'চলতি সম্পদ',   type: 'ASSET',     parentCode: '1000' },
  { code: '1101', name: 'Cash in Hand',         nameBn: 'হাতে নগদ',     type: 'ASSET',     parentCode: '1100' },
  { code: '1102', name: 'Cash at Bank',         nameBn: 'ব্যাংকে নগদ',  type: 'ASSET',     parentCode: '1100' },
  { code: '1103', name: 'Accounts Receivable',  nameBn: 'পাওনা হিসাব',  type: 'ASSET',     parentCode: '1100' },
  { code: '1200', name: 'Fixed Assets',         nameBn: 'স্থায়ী সম্পদ', type: 'ASSET',    parentCode: '1000' },
  { code: '1201', name: 'Land & Property',      nameBn: 'জমি ও সম্পত্তি', type: 'ASSET',   parentCode: '1200' },
  { code: '1202', name: 'Furniture & Fixtures', nameBn: 'আসবাবপত্র',   type: 'ASSET',     parentCode: '1200' },
  { code: '1203', name: 'Vehicles',             nameBn: 'যানবাহন',      type: 'ASSET',     parentCode: '1200' },
  // Liabilities (2xxx)
  { code: '2000', name: 'Liabilities',          nameBn: 'দায়',           type: 'LIABILITY', parentCode: null },
  { code: '2100', name: 'Current Liabilities',  nameBn: 'চলতি দায়',    type: 'LIABILITY', parentCode: '2000' },
  { code: '2101', name: 'Accounts Payable',     nameBn: 'দেনা হিসাব',   type: 'LIABILITY', parentCode: '2100' },
  { code: '2102', name: 'Member Deposits',      nameBn: 'সদস্য আমানত',  type: 'LIABILITY', parentCode: '2100' },
  { code: '2103', name: 'Investor Capital',     nameBn: 'বিনিয়োগ মূলধন', type: 'LIABILITY', parentCode: '2100' },
  // Equity (3xxx)
  { code: '3000', name: 'Equity',               nameBn: 'মূলধন',         type: 'EQUITY',    parentCode: null },
  { code: '3001', name: 'Share Capital',         nameBn: 'শেয়ার মূলধন', type: 'EQUITY',    parentCode: '3000' },
  { code: '3002', name: 'Retained Earnings',     nameBn: 'সঞ্চিত লাভ',  type: 'EQUITY',    parentCode: '3000' },
  // Income (4xxx)
  { code: '4000', name: 'Income',               nameBn: 'আয়',            type: 'INCOME',    parentCode: null },
  { code: '4001', name: 'Business Income',      nameBn: 'ব্যবসায়িক আয়', type: 'INCOME',   parentCode: '4000' },
  { code: '4002', name: 'Investment Income',    nameBn: 'বিনিয়োগ আয়',  type: 'INCOME',    parentCode: '4000' },
  { code: '4003', name: 'Property Income',      nameBn: 'সম্পত্তি আয়',  type: 'INCOME',   parentCode: '4000' },
  { code: '4004', name: 'Other Income',         nameBn: 'অন্যান্য আয়',  type: 'INCOME',   parentCode: '4000' },
  // Expenses (5xxx)
  { code: '5000', name: 'Expenses',             nameBn: 'ব্যয়',           type: 'EXPENSE',   parentCode: null },
  { code: '5001', name: 'Salaries & Wages',     nameBn: 'বেতন ও মজুরি',  type: 'EXPENSE',   parentCode: '5000' },
  { code: '5002', name: 'Rent & Utilities',     nameBn: 'ভাড়া ও আনুষঙ্গিক', type: 'EXPENSE', parentCode: '5000' },
  { code: '5003', name: 'Office Expenses',      nameBn: 'অফিস ব্যয়',    type: 'EXPENSE',   parentCode: '5000' },
  { code: '5004', name: 'Marketing Expenses',   nameBn: 'বিপণন ব্যয়',   type: 'EXPENSE',   parentCode: '5000' },
  { code: '5005', name: 'Depreciation',         nameBn: 'অবচয়',          type: 'EXPENSE',   parentCode: '5000' },
  { code: '5006', name: 'Bank Charges',         nameBn: 'ব্যাংক চার্জ',   type: 'EXPENSE',   parentCode: '5000' },
  { code: '5007', name: 'Project Expenses',     nameBn: 'প্রজেক্ট ব্যয়', type: 'EXPENSE',  parentCode: '5000' },
  { code: '5008', name: 'Other Expenses',       nameBn: 'অন্যান্য ব্যয়', type: 'EXPENSE',  parentCode: '5000' },
]

async function main() {
  console.log('🌱 Seeding Yakin Group database...')

  // Roles
  console.log('  Creating roles...')
  const roleMap: Record<string, string> = {}
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name, displayName: r.displayName, displayNameEn: r.displayNameEn, isSystem: r.isSystem, permissions: r.permissions },
    })
    roleMap[r.name] = role.id
  }

  // Super Admin user
  console.log('  Creating super admin user...')
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@yakingroup.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345'
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Super Admin'
  const passwordHash = await bcrypt.hash(adminPassword, 12)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      roleId: roleMap['super_admin'],
      email: adminEmail,
      passwordHash,
      fullName: adminName,
      fullNameBn: 'সুপার অ্যাডমিন',
      isEmailVerified: true,
      isActive: true,
    },
  })

  // System settings
  console.log('  Creating system settings...')
  for (const s of SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value },
    })
  }

  // Business categories
  console.log('  Creating business categories...')
  for (const c of BUSINESS_CATEGORIES) {
    await prisma.businessCategory.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    })
  }

  // Member categories
  console.log('  Creating member categories...')
  for (const c of MEMBER_CATEGORIES) {
    await prisma.memberCategory.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    })
  }

  // Investment plans
  console.log('  Creating investment plans...')
  for (const p of INVESTMENT_PLANS) {
    await prisma.investmentPlan.upsert({
      where: { id: p.name },
      update: {},
      create: { name: p.name, nameBn: p.nameBn, description: p.description, minimumAmount: p.minimumAmount, durationMonths: p.durationMonths, profitRule: p.profitRule },
    }).catch(() => prisma.investmentPlan.create({ data: { name: p.name, nameBn: p.nameBn, description: p.description, minimumAmount: p.minimumAmount, durationMonths: p.durationMonths, profitRule: p.profitRule } }))
  }

  // Departments
  console.log('  Creating departments...')
  for (const d of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    })
  }

  // Designations
  console.log('  Creating designations...')
  for (const d of DESIGNATIONS) {
    await prisma.designation.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    })
  }

  // Leave types
  console.log('  Creating leave types...')
  for (const l of LEAVE_TYPES) {
    await prisma.leaveType.upsert({
      where: { name: l.name },
      update: {},
      create: l,
    })
  }

  // Document categories
  console.log('  Creating document categories...')
  for (const d of DOCUMENT_CATEGORIES) {
    await prisma.documentCategory.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    })
  }

  // Chart of accounts
  console.log('  Creating chart of accounts...')
  const accountIdMap: Record<string, string> = {}
  for (const a of ACCOUNTS) {
    const acc = await prisma.account.upsert({
      where: { code: a.code },
      update: {},
      create: {
        code: a.code,
        name: a.name,
        nameBn: a.nameBn,
        type: a.type as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE',
        isSystem: true,
        parentId: a.parentCode ? accountIdMap[a.parentCode] : undefined,
      },
    })
    accountIdMap[a.code] = acc.id
  }

  console.log('\n✅ Seed completed successfully!')
  console.log(`   Admin email:    ${adminEmail}`)
  console.log(`   Admin password: ${adminPassword}`)
  console.log('   ⚠️  Change the admin password immediately after first login!')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
