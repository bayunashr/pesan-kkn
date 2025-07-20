import { supabase } from '../../../lib/supabase'
import { verifyPassword, signToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { username, password } = req.body

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, name, password_hash')
      .eq('username', username)
      .single()

    if (error || !user || !user.password_hash) {
      return res.status(401).json({ message: 'Username atau password salah' })
    }

    const isValidPassword = await verifyPassword(password, user.password_hash)
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Username atau password salah' })
    }

    const { password_hash, ...userWithoutPassword } = user
    
    // Set cookie untuk production
    if (process.env.NODE_ENV === 'production') {
      const token = signToken(userWithoutPassword)
      res.setHeader('Set-Cookie', [
        `auth-token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
      ])
    }

    res.status(200).json({ user: userWithoutPassword })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}