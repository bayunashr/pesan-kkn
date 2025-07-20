import { supabase } from '../../../lib/supabase'
import { hashPassword, signToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { username, password } = req.body

  try {
    const hashedPassword = await hashPassword(password)
    
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('username', username)
      .select('id, username, name')
      .single()

    if (error) {
      return res.status(400).json({ message: 'Gagal set password' })
    }

    // Set cookie untuk production
    if (process.env.NODE_ENV === 'production') {
      const token = signToken(data)
      res.setHeader('Set-Cookie', [
        `auth-token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
      ])
    }

    res.status(200).json({ message: 'Password berhasil diset', user: data })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}