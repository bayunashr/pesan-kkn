export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Clear cookie
  res.setHeader('Set-Cookie', [
    'auth-token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
  ])

  res.status(200).json({ message: 'Logged out successfully' })
}