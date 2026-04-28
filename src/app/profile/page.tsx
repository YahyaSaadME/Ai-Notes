import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token || !verifyToken(token)) {
    redirect('/login')
  }

  return <ProfileClient />
}