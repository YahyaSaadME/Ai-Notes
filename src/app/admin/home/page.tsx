'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/app/components/DashboardLayout'

type UserRole = 'admin' | 'owner' | 'manager' | 'operator' | 'viewer'

interface User {
  _id: string
  name: string
  email: string
  role: UserRole | 'user'
  createdAt: string
}

const roleOptions: UserRole[] = ['admin', 'owner', 'manager', 'operator', 'viewer']

export default function AdminHomePage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator' as UserRole,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) {
        router.push('/admin/login')
        return
      }

      const data = await response.json()
      setUsers(
        (data.users || []).map((user: User & { role?: string }) => ({
          ...user,
          role: user.role === 'user' ? 'operator' : (user.role as UserRole),
        }))
      )
    } catch {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAddUser = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()
      if (!data.success) {
        setError(data.error || 'Failed to add user')
        return
      }

      setSuccess('User created successfully')
      setNewUser({ name: '', email: '', password: '', role: 'operator' })
      setShowAddUser(false)
      fetchUsers()
    } catch {
      setError('Network error. Please try again.')
    }
  }

  const updateUserRole = async (userId: string, role: UserRole) => {
    setSavingRoleId(userId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to update role')
        return
      }

      setSuccess('Role updated successfully')
      fetchUsers()
    } catch {
      setError('Network error while updating role')
    } finally {
      setSavingRoleId(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-zinc-300">Loading users...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 text-white">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Organization Management</p>
          <h1 className="mt-2 text-3xl font-semibold">Role Assignment Workspace</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage users and assign organization roles for your team.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-black p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Users</h2>
            <button
              type="button"
              onClick={() => setShowAddUser((value) => !value)}
              className="rounded-lg border border-white bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-300"
            >
              {showAddUser ? 'Close Form' : 'Add User'}
            </button>
          </div>

          {error && <p className="mb-3 text-sm text-zinc-300">{error}</p>}
          {success && <p className="mb-3 text-sm text-zinc-300">{success}</p>}

          {showAddUser && (
            <form onSubmit={handleAddUser} className="mb-6 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-4">
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
                className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-white"
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
                className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-white"
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
                className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-white"
                minLength={6}
                required
              />

              <select
                value={newUser.role}
                onChange={(event) => setNewUser({ ...newUser, role: event.target.value as UserRole })}
                className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-white"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="md:col-span-4 rounded-lg border border-white bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-300"
              >
                Create User
              </button>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="border-b border-zinc-800 px-4 py-3 font-medium">User</th>
                  <th className="border-b border-zinc-800 px-4 py-3 font-medium">Role</th>
                  <th className="border-b border-zinc-800 px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="bg-black">
                    <td className="border-b border-zinc-900 px-4 py-3">
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-zinc-400">{user.email}</p>
                    </td>
                    <td className="border-b border-zinc-900 px-4 py-3">
                      <select
                        value={user.role}
                        disabled={savingRoleId === user._id}
                        onChange={(event) => updateUserRole(user._id, event.target.value as UserRole)}
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs uppercase tracking-[0.12em] outline-none focus:border-white"
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border-b border-zinc-900 px-4 py-3 text-zinc-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
