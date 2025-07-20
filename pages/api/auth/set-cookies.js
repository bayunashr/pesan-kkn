import { signToken } from '../../../lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { user } = req.body

  if (!user) {
    return res.status(400).json({ message: 'User required' })
  }

  const token = signToken(user)

  // Set httpOnly cookie
  res.setHeader('Set-Cookie', [
    `auth-token=${token}; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
  ])

  res.status(200).json({ message: 'Cookie set successfully' })
}