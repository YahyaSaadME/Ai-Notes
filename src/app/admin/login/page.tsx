'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      const allowed = ['admin', 'owner', 'manager']

      if (data.success && allowed.includes(data.user?.role)) {
        router.push('/admin/home')
      } else {
        setError('Invalid organization management credentials')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Organization Console</p>
        <h1 className="mt-3 text-3xl font-semibold">Management Sign In</h1>
        <p className="mt-2 text-sm text-zinc-400">For admin, owner, and manager roles.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-white"
            placeholder="Management email"
          />

          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-white"
            placeholder="Password"
          />

          {error && <p className="text-sm text-zinc-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-white bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Standard user account?{' '}
          <Link href="/login" className="text-white underline underline-offset-4">
            User login
          </Link>
        </p>
      </div>
    </div>
  )
}
