import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { comparePassword, createToken, isAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Check if admin login
    if (isAdmin(email, password)) {
      const token = createToken({ email, role: 'admin', name: 'Administrator' })
      
      const response = NextResponse.json({ 
        success: true, 
        user: { email, role: 'admin', name: 'Administrator' }
      })
      
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      return response
    }

    // Check user login
    await connectDB()
    const user = await User.findOne({ email })

    if (!user || !(await comparePassword(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = createToken({ 
      userId: user._id.toString(), 
      email: user.email, 
      role: 'user',
      name: user.name 
    })

    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: 'user' 
      }
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

