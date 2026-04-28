import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import NotesClient from './NotesClient'
import { verifyToken } from '@/lib/auth'

export default async function NotesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    redirect('/login')
  }

  const payload = verifyToken(token)
  if (!payload) {
    redirect('/login')
  }

  return <NotesClient />
}
