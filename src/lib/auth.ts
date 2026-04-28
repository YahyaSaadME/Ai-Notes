import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET!

export type UserRole = 'admin' | 'owner' | 'manager' | 'operator' | 'viewer' | 'user'

export interface TokenPayload {
  userId?: string
  email: string
  role: UserRole
  name?: string
}

export function normalizeRole(role?: string): UserRole {
  if (!role) return 'operator'
  const normalized = role.toLowerCase()
  if (normalized === 'user') return 'operator'
  if (['admin', 'owner', 'manager', 'operator', 'viewer'].includes(normalized)) {
    return normalized as UserRole
  }
  return 'operator'
}

export function createToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      ...payload,
      role: normalizeRole(payload.role),
      email: payload.email.toLowerCase(),
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload
    return {
      ...payload,
      email: payload.email.toLowerCase(),
      role: normalizeRole(payload.role),
    }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function isAdmin(email: string, password: string): boolean {
  return (
    email.toLowerCase() === String(process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase() &&
    password === process.env.NEXT_PUBLIC_ADMIN_PASS
  )
}
