'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { login } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন'),
  password: z.string().min(1, 'পাসওয়ার্ড দিন'),
  totpCode: z.string().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError('')
    setLoading(true)
    try {
      const result = await login(data)
      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true)
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { messageBn?: string; message?: string } } })?.response?.data?.messageBn
        ?? (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'লগইন ব্যর্থ হয়েছে'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f2d5e] mb-4">
            <span className="text-white text-2xl font-bold">ই</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0e1523] font-bengali">ইয়াকিন গ্রুপ</h1>
          <p className="text-[#4a5568] mt-1 text-sm">ব্যবসা ব্যবস্থাপনা সিস্টেম</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-semibold text-[#0e1523] mb-1 font-bengali">লগইন করুন</h2>
          <p className="text-sm text-[#4a5568] mb-6">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bengali">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0e1523] mb-1.5 font-bengali">
                ইমেইল ঠিকানা
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@yakingroup.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-[#0e1523] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f2d5e] focus:border-transparent transition"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600 font-bengali">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0e1523] mb-1.5 font-bengali">পাসওয়ার্ড</label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-[#0e1523] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f2d5e] focus:border-transparent transition"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600 font-bengali">{errors.password.message}</p>}
            </div>

            {requiresTwoFactor && (
              <div>
                <label className="block text-sm font-medium text-[#0e1523] mb-1.5 font-bengali">
                  দুই-ধাপ যাচাই কোড
                </label>
                <input
                  {...register('totpCode')}
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#0f2d5e] text-[#0e1523] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f2d5e] transition text-center text-lg tracking-widest tabular"
                />
                <p className="mt-1 text-xs text-[#4a5568] font-bengali">অথেনটিকেটর অ্যাপ থেকে ৬ সংখ্যার কোড দিন</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0f2d5e] text-white rounded-lg font-medium font-bengali hover:bg-[#0a1c3b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f2d5e] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'অপেক্ষা করুন...' : 'লগইন করুন'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#8a96a8] mt-6">
          Yakin Group © {new Date().getFullYear()} · সকল তথ্য সুরক্ষিত
        </p>
      </div>
    </div>
  )
}
