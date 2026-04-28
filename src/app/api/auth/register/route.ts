import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { hashPassword, normalizeRole, verifyToken } from '@/lib/auth'
import { canAccessAdminPanel, roleOf } from '@/lib/rbac'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !canAccessAdminPanel(payload)) {
      return NextResponse.json({ error: 'Admin or manager access required' }, { status: 403 })
    }

    const { name, email, password, role } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const requestedRole = normalizeRole(role)
    const actorRole = roleOf(payload)

    const assignableByActor: Record<string, string[]> = {
      admin: ['admin', 'owner', 'manager', 'operator', 'viewer'],
      owner: ['manager', 'operator', 'viewer'],
      manager: ['operator', 'viewer'],
    }

    if (!name || !normalizedEmail || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    if (!assignableByActor[actorRole]?.includes(requestedRole)) {
      return NextResponse.json({ error: 'You cannot assign this role' }, { status: 403 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: requestedRole,
    })

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

