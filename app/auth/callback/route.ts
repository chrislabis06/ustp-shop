import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const otpType = request.nextUrl.searchParams.get('type')
  const requestedPath = request.nextUrl.searchParams.get('next') || '/marketplace'
  const next = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/marketplace'

  const supabase = await createClient()
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) redirect(next)
  }
  if (tokenHash && ['signup', 'recovery', 'email', 'email_change', 'invite', 'magiclink'].includes(otpType || '')) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as 'signup' | 'recovery' | 'email' | 'email_change' | 'invite' | 'magiclink',
    })
    if (!error) redirect(next)
  }

  redirect('/auth')
}