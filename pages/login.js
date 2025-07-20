import { useState } from 'react'
import { useRouter } from 'next/router'
import { setAuthCookie, verifyAuthFromCookies } from '../lib/auth'

export async function getServerSideProps({ req }) {
  const user = verifyAuthFromCookies(req)
  
  if (user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return { props: {} }
}

export default function Login() {
  const [step, setStep] = useState(1)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const checkUsername = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })

      const data = await response.json()

      if (response.ok) {
        setUserInfo(data.user)
        setStep(data.hasPassword ? 3 : 2)
      } else {
        alert(data.message)
      }
    } catch (error) {
      alert('Terjadi kesalahan')
    }

    setLoading(false)
  }

  const setNewPassword = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      alert('Password tidak sama')
      return
    }

    if (password.length < 6) {
      alert('Password minimal 6 karakter')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        if (process.env.NODE_ENV === 'production') {
          router.push('/')
        } else {
          setAuthCookie(data.user)
          router.push('/')
        }
      } else {
        alert(data.message)
      }
    } catch (error) {
      alert('Terjadi kesalahan')
    }

    setLoading(false)
  }

  const loginUser = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        if (process.env.NODE_ENV === 'production') {
          router.push('/')
        } else {
          setAuthCookie(data.user)
          router.push('/')
        }
      } else {
        alert(data.message)
      }
    } catch (error) {
      alert('Terjadi kesalahan')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Pesan KKN</h1>
          <p className="text-slate-400">Kirim kesan dan pesan anonim</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {step === 1 && (
            <form onSubmit={checkUsername} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukkan username kamu"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Memproses...
                  </div>
                ) : 'Lanjut'}
              </button>
            </form>
          )}

          {step === 2 && (
            <>
              <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
                <p className="text-white font-medium">Halo {userInfo?.name}! 👋</p>
                <p className="text-slate-300 text-sm mt-1">Silakan buat password untuk akun kamu</p>
              </div>
              <form onSubmit={setNewPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password Baru</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Konfirmasi Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Ulangi password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Membuat Password...
                    </div>
                  ) : 'Buat Password'}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl">
                <p className="text-white font-medium">Selamat datang kembali, {userInfo?.name}! 👋</p>
                <p className="text-slate-300 text-sm mt-1">Masukkan password kamu untuk melanjutkan</p>
              </div>
              <form onSubmit={loginUser} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Masukkan password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Masuk...
                    </div>
                  ) : 'Masuk'}
                </button>
              </form>
            </>
          )}

          {step > 1 && (
            <button
              onClick={() => {setStep(1); setPassword(''); setConfirmPassword('')}}
              className="w-full mt-4 text-slate-400 hover:text-white text-sm transition-colors flex items-center justify-center group"
            >
              <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali
            </button>
          )}
        </div>

        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>Platform untuk berbagi kesan dan pesan secara anonim</p>
        </div>
      </div>
    </div>
  )
}