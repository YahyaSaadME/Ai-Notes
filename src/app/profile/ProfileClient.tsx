'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function ProfileClient() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.replace('/login')
        return
      }

      const data = await response.json()
      setUser(data.user)
    } catch {
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()
      if (!data.success) {
        setError(data.error || 'Failed to update password')
        return
      }

      setSuccess('Password updated successfully')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowChangePassword(false)
    } catch {
      setError('Network error. Please try again.')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-zinc-300">Loading profile...</div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 text-white">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Account</p>
          <h1 className="mt-2 text-3xl font-semibold">Profile</h1>
          <p className="mt-2 text-sm text-zinc-400">Manage your account and credentials.</p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-black p-6">
          <div className="grid gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Name</p>
              <p className="mt-1 text-sm text-white">{user.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
              <p className="mt-1 text-sm text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Role</p>
              <span className="mt-1 inline-flex rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-[0.12em] text-zinc-200">
                {user.role}
              </span>
            </div>
          </div>
        </section>

        {error && <p className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">{error}</p>}
        {success && <p className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">{success}</p>}

        <section className="rounded-2xl border border-zinc-800 bg-black p-6">
          <button
            type="button"
            onClick={() => setShowChangePassword((value) => !value)}
            className="rounded-lg border border-white bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-300"
          >
            {showChangePassword ? 'Cancel' : 'Change Password'}
          </button>

          {showChangePassword && (
            <form onSubmit={handleChangePassword} className="mt-4 grid gap-3">
              <input
                type="password"
                placeholder="Current password"
                value={passwordData.currentPassword}
                onChange={(event) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: event.target.value,
                  })
                }
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white"
                required
              />

              <input
                type="password"
                placeholder="New password"
                value={passwordData.newPassword}
                onChange={(event) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: event.target.value,
                  })
                }
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white"
                required
                minLength={6}
              />

              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChange={(event) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: event.target.value,
                  })
                }
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white"
                required
                minLength={6}
              />

              <button
                type="submit"
                className="w-fit rounded-lg border border-white bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-300"
              >
                Update Password
              </button>
            </form>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}