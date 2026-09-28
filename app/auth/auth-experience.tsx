'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

type Screen = 'login' | 'signup' | 'forgot' | 'verify' | 'password'
type VerifyPurpose = 'signup' | 'recovery'
type VerifyChannel = 'email' | 'phone'

const passwordRules = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'One uppercase and one lowercase letter', test: (value: string) => /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { label: 'At least one number', test: (value: string) => /\d/.test(value) },
]

export default function AuthExperience() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('login')
  const [identifier, setIdentifier] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [code, setCode] = useState(['', '', '', '', ''])
  const [secondsLeft, setSecondsLeft] = useState(40)
  const [purpose, setPurpose] = useState<VerifyPurpose>('signup')
  const [channel, setChannel] = useState<VerifyChannel>('email')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const codeInputs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (screen !== 'verify' || secondsLeft <= 0) return
    const timer = window.setTimeout(() => setSecondsLeft((remaining) => remaining - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [screen, secondsLeft])

  function announce(nextMessage: string, error = false) {
    setMessage(nextMessage)
    setIsError(error)
  }

  function openScreen(nextScreen: Screen) {
    setScreen(nextScreen)
    setMessage('')
    setIsError(false)
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    announce('')
    try {
      const supabase = createClient()
      const credentials = { password }
      const result = identifier.includes('@')
        ? await supabase.auth.signInWithPassword({ ...credentials, email: identifier.trim() })
        : await supabase.auth.signInWithPassword({ ...credentials, phone: identifier.trim() })
      if (result.error) throw result.error
      router.replace('/account')
    } catch (error) {
      announce(error instanceof Error ? error.message : 'We could not sign you in. Please try again.', true)
    } finally {
      setBusy(false)
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!acceptedTerms) {
      announce('Please accept the Terms of Service to create an account.', true)
      return
    }
    if (!passwordRules.every((rule) => rule.test(password))) {
      announce('Choose a password that meets all the requirements.', true)
      return
    }
    setBusy(true)
    announce('')
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: identifier.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      })
      if (error) throw error
      if (data.session) {
        router.replace('/account')
        return
      }
      setPurpose('signup')
      setChannel('email')
      setCode(['', '', '', '', ''])
      setSecondsLeft(40)
      announce('We sent a verification code to your email.')
      setScreen('verify')
    } catch (error) {
      announce(error instanceof Error ? error.message : 'We could not create your account. Please try again.', true)
    } finally {
      setBusy(false)
    }
  }

  async function handleForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    announce('')
    const nextChannel: VerifyChannel = identifier.includes('@') ? 'email' : 'phone'
    try {
      const supabase = createClient()
      const result = nextChannel === 'email'
        ? await supabase.auth.resetPasswordForEmail(identifier.trim())
        : await supabase.auth.signInWithOtp({ phone: identifier.trim(), options: { shouldCreateUser: false } })
      if (result.error) throw result.error
      setPurpose('recovery')
      setChannel(nextChannel)
      setCode(['', '', '', '', ''])
      setSecondsLeft(40)
      announce(`We sent a verification code to your ${nextChannel === 'email' ? 'email' : 'phone'}.`)
      setScreen('verify')
    } catch (error) {
      announce(error instanceof Error ? error.message : 'We could not send a code. Check your details and try again.', true)
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = code.join('')
    if (token.length !== 5) {
      announce('Enter all 5 digits from your message.', true)
      return
    }
    setBusy(true)
    announce('')
    try {
      const supabase = createClient()
      const result = channel === 'email'
        ? await supabase.auth.verifyOtp({
            email: identifier.trim(),
            token,
            type: purpose === 'signup' ? 'signup' : 'recovery',
          })
        : await supabase.auth.verifyOtp({ phone: identifier.trim(), token, type: 'sms' })
      if (result.error) throw result.error
      if (purpose === 'signup') {
        router.replace('/account')
        return
      }
      openScreen('password')
    } catch (error) {
      announce(error instanceof Error ? error.message : 'That code could not be verified. Try again.', true)
    } finally {
      setBusy(false)
    }
  }

  async function handleResend() {
    if (secondsLeft > 0 || busy) return
    setBusy(true)
    announce('')
    try {
      const supabase = createClient()
      const result = channel === 'email'
        ? purpose === 'signup'
          ? await supabase.auth.resend({ type: 'signup', email: identifier.trim() })
          : await supabase.auth.resetPasswordForEmail(identifier.trim())
        : await supabase.auth.signInWithOtp({ phone: identifier.trim(), options: { shouldCreateUser: false } })
      if (result.error) throw result.error
      setCode(['', '', '', '', ''])
      setSecondsLeft(40)
      announce('A new verification code is on its way.')
      codeInputs.current[0]?.focus()
    } catch (error) {
      announce(error instanceof Error ? error.message : 'We could not resend your code. Please try again.', true)
    } finally {
      setBusy(false)
    }
  }

  async function handleSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!passwordRules.every((rule) => rule.test(password))) {
      announce('Choose a password that meets all the requirements.', true)
      return
    }
    if (password !== confirmPassword) {
      announce('Your passwords do not match.', true)
      return
    }
    setBusy(true)
    announce('')
    try {
      const { error } = await createClient().auth.updateUser({ password })
      if (error) throw error
      router.replace('/account')
    } catch (error) {
      announce(error instanceof Error ? error.message : 'We could not update your password. Please try again.', true)
    } finally {
      setBusy(false)
    }
  }

  function updateCode(index: number, value: string) {
    const digits = value.replace(/\D/g, '')
    if (!digits) {
      setCode((current) => current.map((digit, position) => position === index ? '' : digit))
      return
    }
    const nextCode = [...code]
    digits.slice(0, 5 - index).split('').forEach((digit, offset) => { nextCode[index + offset] = digit })
    setCode(nextCode)
    codeInputs.current[Math.min(index + digits.length, 4)]?.focus()
  }

  function handleCodeKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === 'Backspace' && !code[index] && index > 0) codeInputs.current[index - 1]?.focus()
    if (event.key === 'ArrowLeft' && index > 0) codeInputs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < 4) codeInputs.current[index + 1]?.focus()
  }

  function handleCodePaste(event: ClipboardEvent<HTMLInputElement>, index: number) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '')
    if (!pasted) return
    event.preventDefault()
    updateCode(index, pasted)
  }

  const isLoginOrSignup = screen === 'login' || screen === 'signup'
  const heading = {
    login: 'Welcome back',
    signup: 'Create your account',
    forgot: 'Reset your password',
    verify: purpose === 'signup' ? 'Verify your email' : 'Check your inbox',
    password: 'Set a new password',
  }[screen]
  const supportingText = {
    login: 'Sign in to pick up where campus life left off.',
    signup: 'Join the USTP community and make room for good finds.',
    forgot: 'Enter the email or phone linked to your account.',
    verify: `Enter the 5-digit code sent to ${identifier}.`,
    password: 'Choose a strong password you have not used before.',
  }[screen]

  return (
    <div className="mx-auto flex min-h-[calc(100svh-2.5rem)] max-w-[1160px] flex-col sm:min-h-[calc(100svh-4rem)]">
      <header className="mb-5 flex items-center justify-between sm:mb-7">
        <Link href="/" aria-label="Tatak Swap home" className="flex items-center gap-2.5 text-[#08234b]">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fdb813] text-xs font-bold text-[#08234b]">TS</span>
          <span className="text-lg font-bold">Tatak<span className="text-[#d89b00]">.</span>Swap</span>
        </Link>
        <Link href="/" className="text-xs font-semibold text-[#637086] transition hover:text-[#08234b] sm:text-sm">Back to marketplace <span aria-hidden="true">↗</span></Link>
      </header>

      <div className="grid flex-1 overflow-hidden rounded-[24px] bg-white shadow-[0_20px_70px_rgba(8,35,75,0.10)] lg:min-h-[660px] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="auth-grid relative flex min-h-[250px] flex-col justify-between overflow-hidden bg-[#08234b] p-7 text-white sm:min-h-[290px] sm:p-10 lg:min-h-[660px] lg:p-12">
          <div className="absolute -right-14 top-16 h-56 w-56 rotate-45 border border-white/10" aria-hidden="true" />
          <div className="absolute -right-5 top-28 h-40 w-40 rotate-45 border border-[#fdb813]/35" aria-hidden="true" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fdb813]">A little closer to home</p>
            <h1 className="mt-5 max-w-md text-3xl font-semibold leading-[1.16] sm:text-4xl lg:text-[2.75rem]">Good things find their way around campus.</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#c3d1e4]">A trusted place for the USTP community to pass useful things along.</p>
          </div>
          <div className="relative mt-8 flex items-center gap-3 border-t border-white/15 pt-5">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-[#fdb813]/60 text-sm font-semibold text-[#fdb813]">U</span>
            <div>
              <p className="text-xs font-semibold text-white">Made for USTP</p>
              <p className="mt-0.5 text-[11px] text-[#aebfd5]">Cagayan de Oro · Mindanao</p>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="w-full max-w-[420px]">
            {isLoginOrSignup && (
              <div className="mb-8 grid grid-cols-2 rounded-xl bg-[#f0f3f8] p-1" role="tablist" aria-label="Account access">
                <button type="button" role="tab" aria-selected={screen === 'login'} onClick={() => openScreen('login')} className={`rounded-[9px] px-4 py-2.5 text-sm font-semibold transition ${screen === 'login' ? 'bg-white text-[#08234b] shadow-sm' : 'text-[#68768a] hover:text-[#08234b]'}`}>Sign in</button>
                <button type="button" role="tab" aria-selected={screen === 'signup'} onClick={() => openScreen('signup')} className={`rounded-[9px] px-4 py-2.5 text-sm font-semibold transition ${screen === 'signup' ? 'bg-white text-[#08234b] shadow-sm' : 'text-[#68768a] hover:text-[#08234b]'}`}>Create account</button>
              </div>
            )}

            <div className="mb-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c18a00]">Tatak.Swap account</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#102748] sm:text-[28px]">{heading}</h2>
              <p className="mt-2 text-sm leading-6 text-[#69778b]">{supportingText}</p>
            </div>

            {screen === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="login-identifier" className="mb-2 block text-xs font-semibold text-[#293b55]">Email or phone number</label>
                  <input id="login-identifier" type="text" autoComplete="username" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@ustp.edu.ph or +63" className="auth-field" />
                </div>
                <div>
                  <label htmlFor="login-password" className="mb-2 block text-xs font-semibold text-[#293b55]">Password</label>
                  <div className="relative">
                    <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="auth-field pr-20" />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-3 text-xs font-semibold text-[#66758a] hover:text-[#08234b]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
                  </div>
                </div>
                <div className="-mt-1 flex justify-end">
                  <button type="button" onClick={() => openScreen('forgot')} className="text-xs font-semibold text-[#08234b] underline decoration-[#fdb813] decoration-2 underline-offset-4 hover:text-[#b17f00]">Forgot password?</button>
                </div>
                <SubmitButton busy={busy}>{busy ? 'Signing in…' : 'Sign in'}</SubmitButton>
              </form>
            )}

            {screen === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label htmlFor="signup-name" className="mb-2 block text-xs font-semibold text-[#293b55]">Full name</label>
                  <input id="signup-name" type="text" autoComplete="name" required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" className="auth-field" />
                </div>
                <div>
                  <label htmlFor="signup-email" className="mb-2 block text-xs font-semibold text-[#293b55]">USTP email</label>
                  <input id="signup-email" type="email" autoComplete="email" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@ustp.edu.ph" className="auth-field" />
                </div>
                <div>
                  <label htmlFor="signup-password" className="mb-2 block text-xs font-semibold text-[#293b55]">Password</label>
                  <div className="relative">
                    <input id="signup-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" className="auth-field pr-20" />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-3 text-xs font-semibold text-[#66758a] hover:text-[#08234b]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-[#778498]">Use 8+ characters, upper and lowercase letters, and a number.</p>
                </div>
                <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-xs leading-5 text-[#5c6b80]">
                  <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#08234b]" />
                  <span>I agree to the Terms of Service and Privacy Policy.</span>
                </label>
                <SubmitButton busy={busy}>{busy ? 'Creating account…' : 'Create account'}</SubmitButton>
                <p className="pt-1 text-center text-xs text-[#718096]">Already have an account? <button type="button" onClick={() => openScreen('login')} className="font-semibold text-[#08234b] underline decoration-[#fdb813] underline-offset-4">Sign in</button></p>
              </form>
            )}

            {screen === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-5">
                <div>
                  <label htmlFor="recovery-identifier" className="mb-2 block text-xs font-semibold text-[#293b55]">Email or phone number</label>
                  <input id="recovery-identifier" type="text" autoComplete="username" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@ustp.edu.ph or +63" className="auth-field" />
                </div>
                <SubmitButton busy={busy}>{busy ? 'Sending code…' : 'Send verification code'}</SubmitButton>
                <button type="button" onClick={() => openScreen('login')} className="w-full text-center text-xs font-semibold text-[#08234b] hover:underline">← Back to sign in</button>
              </form>
            )}

            {screen === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <label className="mb-3 block text-xs font-semibold text-[#293b55]" htmlFor="verification-code-0">Verification code</label>
                  <div className="flex justify-between gap-2 sm:gap-3" aria-label="5-digit verification code">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => { codeInputs.current[index] = element }}
                        id={`verification-code-${index}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                        aria-label={`Verification code digit ${index + 1}`}
                        maxLength={index === 0 ? 5 : 1}
                        required
                        value={digit}
                        onChange={(event) => updateCode(index, event.target.value)}
                        onKeyDown={(event) => handleCodeKeyDown(event, index)}
                        onPaste={(event) => handleCodePaste(event, index)}
                        className="h-12 min-w-0 flex-1 rounded-xl border border-[#d8e0eb] bg-[#fbfcfe] text-center text-lg font-semibold text-[#102748] outline-none transition focus:border-[#08234b] focus:ring-4 focus:ring-[#08234b]/10 sm:h-14"
                      />
                    ))}
                  </div>
                </div>
                <SubmitButton busy={busy}>{busy ? 'Verifying…' : 'Verify code'}</SubmitButton>
                <p className="text-center text-xs text-[#738095]">
                  {secondsLeft > 0 ? `Resend after ${secondsLeft} seconds` : 'Didn’t receive a code?'}{' '}
                  <button type="button" disabled={secondsLeft > 0 || busy} onClick={handleResend} className="font-semibold text-[#08234b] underline decoration-[#fdb813] underline-offset-4 disabled:cursor-not-allowed disabled:text-[#a4adba] disabled:no-underline">Resend code</button>
                </p>
                <button type="button" onClick={() => openScreen(purpose === 'signup' ? 'signup' : 'forgot')} className="w-full text-center text-xs font-semibold text-[#08234b] hover:underline">← Back</button>
              </form>
            )}

            {screen === 'password' && (
              <form onSubmit={handleSetPassword} className="space-y-5">
                <div>
                  <p className="mb-3 text-xs font-semibold text-[#293b55]">Your password should have:</p>
                  <ul className="space-y-2">
                    {passwordRules.map((rule) => {
                      const met = rule.test(password)
                      return <li key={rule.label} className={`flex items-center gap-2 text-xs ${met ? 'text-[#176b4d]' : 'text-[#778498]'}`}><span aria-hidden="true" className="grid h-4 w-4 place-items-center rounded-full border text-[10px]">{met ? '✓' : ''}</span>{rule.label}</li>
                    })}
                  </ul>
                </div>
                <div>
                  <label htmlFor="new-password" className="mb-2 block text-xs font-semibold text-[#293b55]">New password</label>
                  <div className="relative">
                    <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a new password" className="auth-field pr-20" />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-3 text-xs font-semibold text-[#66758a] hover:text-[#08234b]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="mb-2 block text-xs font-semibold text-[#293b55]">Confirm new password</label>
                  <div className="relative">
                    <input id="confirm-password" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it again" className="auth-field pr-20" />
                    <button type="button" onClick={() => setShowConfirmation((visible) => !visible)} className="absolute inset-y-0 right-3 text-xs font-semibold text-[#66758a] hover:text-[#08234b]" aria-label={showConfirmation ? 'Hide confirmation' : 'Show confirmation'}>{showConfirmation ? 'Hide' : 'Show'}</button>
                  </div>
                </div>
                <SubmitButton busy={busy}>{busy ? 'Updating password…' : 'Set new password'}</SubmitButton>
              </form>
            )}

            {message && <p role="status" aria-live="polite" className={`mt-5 rounded-xl px-3.5 py-3 text-xs leading-5 ${isError ? 'bg-[#fff1ef] text-[#a33d31]' : 'bg-[#eef7f2] text-[#236648]'}`}>{message}</p>}
          </div>
        </section>
      </div>

      <footer className="flex flex-col items-center justify-between gap-2 py-5 text-[11px] text-[#758196] sm:flex-row">
        <span>© 2026 Tatak.Swap · USTP Community</span>
        <span>Built for good finds and second chances.</span>
      </footer>
    </div>
  )
}

function SubmitButton({ children, busy }: { children: React.ReactNode; busy: boolean }) {
  return <button type="submit" disabled={busy} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#08234b] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(8,35,75,0.16)] transition hover:bg-[#103563] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c18a00] disabled:cursor-wait disabled:opacity-70">{children}</button>
}