'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a confirmation link.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        router.push('/')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--color-background-tertiary)',
    }}>
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ marginBottom: '8px' }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 500,
            marginBottom: '4px',
          }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
          }}>
            {isSignUp
              ? 'Start building your context tree'
              : 'Sign in to contextree'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            style={{ width: '100%' }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && (
          <p style={{
            fontSize: '13px',
            color: 'var(--color-text-danger)',
            background: 'var(--color-background-danger)',
            padding: '10px 12px',
            borderRadius: '8px',
          }}>
            {error}
          </p>
        )}

        {message && (
          <p style={{
            fontSize: '13px',
            color: 'var(--color-text-success)',
            background: 'var(--color-background-success)',
            padding: '10px 12px',
            borderRadius: '8px',
          }}>
            {message}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          style={{
            width: '100%',
            padding: '10px',
            background: loading ? 'var(--color-background-secondary)' : '#7F77DD',
            color: loading ? 'var(--color-text-secondary)' : '#EEEDFE',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
        </button>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
            setMessage(null)
          }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
}