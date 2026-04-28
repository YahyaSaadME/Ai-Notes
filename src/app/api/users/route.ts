import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { normalizeRole, verifyToken } from '@/lib/auth'
import { canAccessAdminPanel, roleOf } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !canAccessAdminPanel(payload)) {
      return NextResponse.json({ error: 'Management access required' }, { status: 403 })
    }

    await connectDB()
    const users = await User.find({}).select('-password').sort({ createdAt: -1 })
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !canAccessAdminPanel(payload)) {
      return NextResponse.json({ error: 'Management access required' }, { status: 403 })
    }

    const { userId, role } = await request.json()
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 })
    }

    const normalizedRole = normalizeRole(role)
    const actorRole = roleOf(payload)
    const assignableByActor: Record<string, string[]> = {
      admin: ['admin', 'owner', 'manager', 'operator', 'viewer'],
      owner: ['manager', 'operator', 'viewer'],
      manager: ['operator', 'viewer'],
    }

    if (!assignableByActor[actorRole]?.includes(normalizedRole)) {
      return NextResponse.json({ error: 'You cannot assign this role' }, { status: 403 })
    }

    await connectDB()

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: normalizedRole },
      { new: true }
    ).select('-password')

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error('Update user role error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

