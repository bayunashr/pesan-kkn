import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { getAuthUser, clearAuth, verifyAuthFromCookies } from '../lib/auth'

// Server-side auth check untuk production
export async function getServerSideProps({ req }) {
  if (process.env.NODE_ENV === 'production') {
    const user = verifyAuthFromCookies(req)
    
    if (!user) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      }
    }

    return {
      props: { user }
    }
  }

  // Development fallback
  return {
    props: { user: null }
  }
}

export default function Home({ user: serverUser }) {
  const [user, setUser] = useState(serverUser)
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(!serverUser)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(false)
  const [fetchingMessages, setFetchingMessages] = useState(false)
  const router = useRouter()

  // Initialize user only once
  useEffect(() => {
    let mounted = true

    const initializeUser = async () => {
      try {
        // Development fallback
        if (process.env.NODE_ENV !== 'production' && !serverUser) {
          const currentUser = getAuthUser()
          if (!currentUser && mounted) {
            router.push('/login')
            return
          }
          if (mounted && currentUser) {
            setUser(currentUser)
          }
        }
      } catch (error) {
        console.error('User initialization error:', error)
        if (mounted) {
          router.push('/login')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeUser()

    return () => {
      mounted = false
    }
  }, []) // Run only once on mount

  // Fetch data when user is available
  useEffect(() => {
    if (user?.id) {
      fetchUsers()
      fetchMessages(user.id)
    }
  }, [user?.id]) // Only depend on user ID

  const fetchUsers = async () => {
    if (fetchingUsers) return // Prevent concurrent requests
    
    setFetchingUsers(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, name')
        .order('name')
      
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setFetchingUsers(false)
    }
  }

  const fetchMessages = async (userId) => {
    if (!userId || fetchingMessages) return // Prevent concurrent requests
    
    setFetchingMessages(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setFetchingMessages(false)
    }
  }

  const refreshMessages = async () => {
    if (!user?.id || refreshing) return
    
    setRefreshing(true)
    await fetchMessages(user.id)
    setRefreshing(false)
    
    // Show refresh notification
    showNotification('Pesan berhasil diperbarui!', 'info')
  }

  const showNotification = (message, type = 'success') => {
    // Remove existing notifications first
    const existingNotifications = document.querySelectorAll('.toast-notification')
    existingNotifications.forEach(notif => notif.remove())
    
    const notification = document.createElement('div')
    notification.classList.add('toast-notification')
    
    // Inline styles untuk memastikan tampil
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 350px;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      z-index: 9999;
      transform: translateX(100%);
      transition: all 0.3s ease;
      font-family: inherit;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid;
    `
    
    // Set colors based on type
    switch (type) {
      case 'success':
        notification.style.backgroundColor = '#10b981'
        notification.style.borderColor = '#059669'
        notification.style.color = '#ffffff'
        break
      case 'error':
        notification.style.backgroundColor = '#ef4444'
        notification.style.borderColor = '#dc2626'
        notification.style.color = '#ffffff'
        break
      case 'info':
        notification.style.backgroundColor = '#3b82f6'
        notification.style.borderColor = '#2563eb'
        notification.style.color = '#ffffff'
        break
      case 'warning':
        notification.style.backgroundColor = '#f59e0b'
        notification.style.borderColor = '#d97706'
        notification.style.color = '#ffffff'
        break
      default:
        notification.style.backgroundColor = '#6b7280'
        notification.style.borderColor = '#4b5563'
        notification.style.color = '#ffffff'
    }
    
    // Create icon based on type
    let iconSvg = ''
    switch (type) {
      case 'success':
        iconSvg = `<svg style="width: 20px; height: 20px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>`
        break
      case 'error':
        iconSvg = `<svg style="width: 20px; height: 20px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>`
        break
      case 'info':
        iconSvg = `<svg style="width: 20px; height: 20px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`
        break
      case 'warning':
        iconSvg = `<svg style="width: 20px; height: 20px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 18.333 3.924 20 5.464 20z"></path>
        </svg>`
        break
    }
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="flex-shrink: 0;">
          ${iconSvg}
        </div>
        <div style="flex: 1; line-height: 1.4;">
          ${message}
        </div>
        <button onclick="this.closest('.toast-notification').remove()" style="flex-shrink: 0; background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; padding: 4px; border-radius: 4px; transition: color 0.2s;" onmouseover="this.style.color='rgba(255,255,255,1)'" onmouseout="this.style.color='rgba(255,255,255,0.7)'">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // Show notification
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 50)
    
    // Auto hide after 4 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.transform = 'translateX(100%)'
        setTimeout(() => {
          if (document.body.contains(notification)) {
            notification.remove()
          }
        }, 300)
      }
    }, 4000)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    
    if (!selectedUser || !messageText.trim()) {
      showNotification('Pilih penerima dan tulis pesan terlebih dahulu!', 'warning')
      return
    }

    if (messageText.length > 500) {
      showNotification('Pesan maksimal 500 karakter!', 'error')
      return
    }

    setSending(true)
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          receiver_id: selectedUser,
          message: messageText.trim()
        })
      
      if (error) throw error

      // Success
      showNotification('Pesan berhasil dikirim!', 'success')
      setMessageText('')
      setSelectedUser('')
      
      // Refresh messages if sending to self (for testing)
      if (selectedUser === user.id) {
        await fetchMessages(user.id)
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      showNotification('Gagal mengirim pesan. Coba lagi!', 'error')
    }
    
    setSending(false)
  }

  const logout = async () => {
    try {
      await clearAuth()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect anyway
      router.push('/login')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      return diffInMinutes <= 0 ? 'Baru saja' : `${diffInMinutes} menit yang lalu`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} jam yang lalu`
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Sesi tidak valid</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition-all"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-red-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Cihuy 😙😗😘</h1>
                <p className="text-slate-400">Halo, <span className="text-blue-400 font-medium">{user?.name}</span>!</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshMessages}
                disabled={refreshing || fetchingMessages}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Memuat...' : 'Refresh'}
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Kirim Pesan - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white">Kirim Pesan</h2>
              </div>
              
              <form onSubmit={sendMessage} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Untuk:</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="" className="bg-slate-800">Pilih penerima</option>
                    {users.filter(u => u.id !== user?.id).map(u => (
                      <option key={u.id} value={u.id} className="bg-slate-800">
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Pesan:</label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Seng sopan yo rek, ojok kelewatan"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none h-32"
                    required
                    maxLength={500}
                  />
                  <div className="text-right mt-1">
                    <span className={`text-xs ${messageText.length > 450 ? 'text-red-400' : 'text-slate-400'}`}>
                      {messageText.length}/500
                    </span>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={sending || !selectedUser || !messageText.trim()}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Kirim
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Pesan Masuk - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white">Pesan Masuk</h2>
                </div>
                <div className="flex items-center gap-3">
                  {fetchingMessages && (
                    <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  )}
                  <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                    {messages.length} pesan
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h3 className="text-slate-300 font-medium text-lg mb-2">Belum Ada Pesan</h3>
                    <p className="text-slate-500 mb-6">Pesan anonim akan muncul di sini</p>
                    <button
                      onClick={refreshMessages}
                      disabled={refreshing || fetchingMessages}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all disabled:opacity-50"
                    >
                      <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Cek Pesan Baru
                    </button>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div 
                      key={message.id} 
                      className="group bg-gradient-to-r from-slate-700/50 to-slate-600/30 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 hover:from-slate-600/50 hover:to-slate-500/30 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="mb-3">
                        <p className="text-white leading-relaxed break-words whitespace-pre-wrap text-base">
                          {message.message}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xs text-slate-500">
                            {formatDate(message.created_at)}
                          </p>
                        </div>
                        <div className="text-xs text-slate-600">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}