import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { username } = req.body

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, name, password_hash')
      .eq('username', username)
      .single()

    if (error || !user) {
      return res.status(404).json({ message: 'Username tidak ditemukan' })
    }

    res.status(200).json({
      exists: true,
      hasPassword: !!user.password_hash,
      user: { id: user.id, username: user.username, name: user.name }
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}