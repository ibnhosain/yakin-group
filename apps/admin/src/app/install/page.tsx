'use client'
import { useEffect, useState } from 'react'

export default function InstallPage() {
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | 'unknown'>('unknown')
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt?: () => void } | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Detect platform
    const ua = navigator.userAgent
    if (/iPhone|iPad|iPod/.test(ua)) setPlatform('ios')
    else if (/Android/.test(ua)) setPlatform('android')
    else setPlatform('desktop')

    // Capture install prompt (Android/Desktop Chrome)
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (installPrompt && 'prompt' in installPrompt) {
      installPrompt.prompt?.()
      setInstallPrompt(null)
    } else {
      window.location.href = '/'
    }
  }

  if (installed) {
    return (
      <div className="min-h-screen bg-[#0f2d5e] flex items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">ইনস্টল হয়ে গেছে!</h1>
          <p className="text-blue-200 mb-6">আপনার ফোনের হোম স্ক্রিনে দেখুন</p>
          <a href="/dashboard" className="bg-white text-[#0f2d5e] px-6 py-3 rounded-xl font-bold">
            অ্যাপ খুলুন
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f2d5e] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
          <span className="text-[#0f2d5e] text-4xl font-bold">ই</span>
        </div>
        <h1 className="text-3xl font-bold text-white">ইয়াকিন গ্রুপ</h1>
        <p className="text-blue-200 mt-1">ব্যবসা ব্যবস্থাপনা সিস্টেম</p>
      </div>

      {/* Install Card */}
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">

        {/* Android / Desktop */}
        {(platform === 'android' || platform === 'desktop') && (
          <div className="text-center">
            <div className="text-5xl mb-4">📲</div>
            <h2 className="text-xl font-bold text-[#0e1523] mb-2">অ্যাপ ইনস্টল করুন</h2>
            <p className="text-gray-500 text-sm mb-6">
              হোম স্ক্রিনে যোগ করুন — ইন্টারনেট ছাড়াও দ্রুত খুলবে
            </p>
            <button
              onClick={handleInstall}
              className="w-full py-4 bg-[#0f2d5e] text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition"
            >
              ইনস্টল করুন
            </button>
            {!installPrompt && (
              <p className="text-xs text-gray-400 mt-3">
                ইনস্টল হয় না? Browser menu → &quot;Add to Home Screen&quot;
              </p>
            )}
          </div>
        )}

        {/* iOS */}
        {platform === 'ios' && (
          <div>
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">📱</div>
              <h2 className="text-xl font-bold text-[#0e1523]">iPhone-এ ইনস্টল করুন</h2>
              <p className="text-gray-500 text-sm mt-1">Safari browser-এ এই পেজ খুলুন</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <p className="font-semibold text-[#0e1523]">Share বাটন চাপুন</p>
                  <p className="text-sm text-gray-500">নিচের মাঝখানে <span className="text-blue-500 font-bold">⬆</span> আইকন</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <p className="font-semibold text-[#0e1523]">Add to Home Screen</p>
                  <p className="text-sm text-gray-500">নিচে স্ক্রোল করে খুঁজুন</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <p className="font-semibold text-[#0e1523]">Add চাপুন</p>
                  <p className="text-sm text-gray-500">হোম স্ক্রিনে অ্যাপ যোগ হবে</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <a href="/login" className="text-[#0f2d5e] font-medium text-sm">
            লগইন করুন →
          </a>
        </div>
      </div>

      <p className="text-blue-300 text-xs mt-6">Yakin Group © {new Date().getFullYear()}</p>
    </div>
  )
}
