import bcrypt from 'bcryptjs'

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12)
}

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

// Production JWT functions
export const signToken = (user) => {
  if (typeof window === 'undefined') {
    const jwt = require('jsonwebtoken')
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
  }
  return null
}

export const verifyToken = (token) => {
  if (typeof window === 'undefined') {
    try {
      const jwt = require('jsonwebtoken')
      return jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      return null
    }
  }
  return null
}

// Universal auth functions
export const setAuthCookie = (user) => {
  if (typeof window !== 'undefined') {
    if (process.env.NODE_ENV === 'production') {
      // Production: Set cookie via API
      fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
      })
    } else {
      // Development: localStorage
      localStorage.setItem('currentUser', JSON.stringify(user))
    }
  }
}

export const getAuthUser = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const user = localStorage.getItem('currentUser')
    return user ? JSON.parse(user) : null
  }
  return null
}

export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/auth/logout', { method: 'POST' })
    } else {
      localStorage.removeItem('currentUser')
    }
  }
}

export const verifyAuthFromCookies = (req) => {
  if (typeof window === 'undefined') {
    const token = req.cookies?.['auth-token']
    if (!token) return null
    
    return verifyToken(token)
  }
  return null
}