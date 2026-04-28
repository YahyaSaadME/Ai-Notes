'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
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

      if (data.success) {
        router.push('/profile')
        return
      }

      setError(data.error || 'Login failed')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Secure Access</p>
        <h1 className="mt-3 text-3xl font-semibold">Sign In</h1>
        <p className="mt-2 text-sm text-zinc-400">Access your organization notes workspace.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-zinc-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-white"
              placeholder="name@organization.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-zinc-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm outline-none focus:border-white"
              placeholder="Your password"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-300">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-white bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Admin or management account?{' '}
          <Link href="/admin/login" className="text-white underline underline-offset-4">
            Use organization login
          </Link>
        </p>
      </div>
    </div>
  )
}
