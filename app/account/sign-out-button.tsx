'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSignOut() {
    if (busy) return
    setBusy(true)
    setError('')

    try {
      const { error: signOutError } = await createClient().auth.signOut({ scope: 'local' })
      if (signOutError) throw signOutError
      window.location.replace('/')
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Could not sign out. Please try again.')
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button type="button" onClick={handleSignOut} disabled={busy} className="text-sm font-bold text-[#556070] disabled:cursor-wait disabled:opacity-60">
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
      {error && <span role="alert" className="max-w-56 text-right text-xs text-red-700">{error}</span>}
    </span>
  )
}