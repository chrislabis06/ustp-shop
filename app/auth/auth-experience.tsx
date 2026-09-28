'use client'

import Image from 'next/image'
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

const demoAuthActive = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
      if (demoAuthActive) {
        router.replace('/marketplace')
        announce('Demo mode is active. You can continue without Supabase configured.')
        return
      }

      const supabase = createClient()
      const credentials = { password }
      const result = identifier.includes('@')
        ? await supabase.auth.signInWithPassword({ ...credentials, email: identifier.trim() })
        : await supabase.auth.signInWithPassword({ ...credentials, phone: identifier.trim() })
      if (result.error) throw result.error
      router.replace('/marketplace')
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
      if (demoAuthActive) {
        setPurpose('signup')
        setChannel('email')
        setCode(['', '', '', '', ''])
        setSecondsLeft(40)
        announce('Demo mode is active. Use the verification screen to continue.')
        setScreen('verify')
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: identifier.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      })
      if (error) throw error
      if (data.session) {
        router.replace('/marketplace')
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
      if (demoAuthActive) {
        setPurpose('recovery')
        setChannel(nextChannel)
        setCode(['', '', '', '', ''])
        setSecondsLeft(40)
        announce(`Demo mode is active. A verification code is ready for your ${nextChannel === 'email' ? 'email' : 'phone'}.`)
        setScreen('verify')
        return
      }

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
      if (demoAuthActive) {
        if (purpose === 'signup') {
          router.replace('/marketplace')
          return
        }
        openScreen('password')
        return
      }

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
        router.replace('/marketplace')
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
      if (demoAuthActive) {
        setCode(['', '', '', '', ''])
        setSecondsLeft(40)
        announce('Demo mode is active. A new verification code is ready.')
        codeInputs.current[0]?.focus()
        return
      }

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
      if (demoAuthActive) {
        router.replace('/marketplace')
        announce('Demo mode is active. Your password has been updated locally.')
        return
      }

      const { error } = await createClient().auth.updateUser({ password })
      if (error) throw error
      router.replace('/marketplace')
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
    <div className="relative isolate h-dvh overflow-hidden text-white">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image src="/xxtra.webp" alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className="mx-auto h-full max-w-[1440px] overflow-hidden">
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-1 lg:grid-cols-[1fr_1fr]">
          <aside className="relative flex h-[18dvh] min-h-[88px] flex-col overflow-hidden p-5 lg:h-full lg:min-h-0 lg:justify-between lg:p-8 xl:p-12">
            <Link href="/" className="relative z-10 flex h-[47px] w-28 items-center justify-center px-2 text-sm font-bold text-[#FFFFFF]">Tatak.Swap</Link>
            <div className="relative z-10 mt-auto hidden max-w-md rounded-r-lg border-l-4 border-[#f4bb2d] bg-white/90 py-4 pr-5 pl-5 text-[#04044a] shadow-lg backdrop-blur-sm lg:block">
              <p className="text-sm font-semibold uppercase tracking-[0.2em]">USTP Community</p>
              <p className="mt-4 text-3xl font-semibold leading-tight">Useful things find a new home here.</p>
            </div>
          </aside>

          <section className="relative flex min-h-0 overflow-y-auto px-5 py-4 text-white sm:px-8 sm:py-6 lg:h-full lg:px-12 lg:py-10">
            <div className="relative z-10 mx-auto flex max-w-[510px] items-center justify-center min-h-full lg:translate-x-0 xl:translate-x-8" style={{ zoom: 0.85 }}>
              <div className="w-full py-5 sm:py-8">
                <div className="mb-8 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f4bb2d]">Tatak.Swap account</p>
                    <h2 className="mt-2 text-[28px] font-semibold text-white">{heading}</h2>
                  </div>
                  <Link href="/marketplace" className="text-[11px] font-semibold text-white/75 transition hover:text-white">Back to marketplace</Link>
                </div>

                {isLoginOrSignup && (
                  <div className="mb-8 grid grid-cols-2 border-b border-white/25" role="tablist" aria-label="Account access">
                    <button type="button" role="tab" aria-selected={screen === 'login'} onClick={() => openScreen('login')} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${screen === 'login' ? 'border-[#f4bb2d] text-white' : 'border-transparent text-white/60 hover:text-white'}`}>Sign in</button>
                    <button type="button" role="tab" aria-selected={screen === 'signup'} onClick={() => openScreen('signup')} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${screen === 'signup' ? 'border-[#f4bb2d] text-white' : 'border-transparent text-white/60 hover:text-white'}`}>Create account</button>
                  </div>
                )}

                <p className="mb-6 text-sm leading-6 text-white/75">{supportingText}</p>

                {screen === 'login' && (
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label htmlFor="login-identifier" className="mb-2 block text-sm font-semibold text-white">Email / Phone number</label>
                      <input id="login-identifier" type="text" autoComplete="username" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@ustp.edu.ph or +63" className="auth-field" />
                    </div>
                    <div>
                      <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-white">Password</label>
                      <div className="relative">
                        <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="auth-field pr-20" />
                        <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-3 text-xs font-semibold text-white/70 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
                      </div>
                    </div>
                    <div className="-mt-1 flex justify-end">
                      <button type="button" onClick={() => openScreen('forgot')} className="text-xs font-semibold text-white underline decoration-[#f4bb2d] decoration-2 underline-offset-4 hover:text-[#f4bb2d]">Forgot password?</button>
                    </div>
                    <SubmitButton busy={busy}>{busy ? 'Signing in…' : 'Sign in'}</SubmitButton>
                  </form>
                )}

                {screen === 'signup' && (
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <label htmlFor="signup-name" className="mb-2 block text-sm font-semibold text-white">Full name</label>
                      <input id="signup-name" type="text" autoComplete="name" required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" className="auth-field" />
                    </div>
                    <div>
                      <label htmlFor="signup-email" className="mb-2 block text-sm font-semibold text-white">USTP email</label>
                      <input id="signup-email" type="email" autoComplete="email" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@ustp.edu.ph" className="auth-field" />
                    </div>
                    <div>
                      <label htmlFor="signup-password" className="mb-2 block text-sm font-semibold text-white">Password</label>
                      <div className="relative">
                        <input id="signup-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" className="auth-field pr-20" />
                        <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-3 text-xs font-semibold text-white/70 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-white/65">Use 8+ characters, upper and lowercase letters, and a number.</p>
                    </div>
                    <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-xs leading-5 text-white/75">
                      <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#f4bb2d]" />
                      <span>I agree to the Terms of Service and Privacy Policy.</span>
                    </label>
                    <SubmitButton busy={busy}>{busy ? 'Creating account…' : 'Create account'}</SubmitButton>
                    <p className="pt-1 text-center text-xs text-white/70">Already have an account? <button type="button" onClick={() => openScreen('login')} className="font-semibold text-white underline decoration-[#f4bb2d] underline-offset-4">Sign in</button></p>
                  </form>
                )}

                {screen === 'forgot' && (
                  <form onSubmit={handleForgot} className="space-y-5">
                    <div>
                      <label htmlFor="recovery-identifier" className="mb-2 block text-sm font-semibold text-white">Email / Phone number</label>
                      <input id="recovery-identifier" type="text" autoComplete="username" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@ustp.edu.ph or +63" className="auth-field" />
                    </div>
                    <SubmitButton busy={busy}>{busy ? 'Sending code…' : 'Send verification code'}</SubmitButton>
                    <button type="button" onClick={() => openScreen('login')} className="w-full text-center text-xs font-semibold text-white hover:underline">← Back to sign in</button>
                  </form>
                )}

                {screen === 'verify' && (
                  <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-white" htmlFor="verification-code-0">Verification code</label>
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
                            className="h-12 min-w-0 flex-1 rounded-xl border-2 border-white/65 bg-transparent text-center text-lg font-semibold text-white outline-none transition focus:border-[#f4bb2d] focus:ring-4 focus:ring-[#f4bb2d]/15 sm:h-14"
                          />
                        ))}
                      </div>
                    </div>
                    <SubmitButton busy={busy}>{busy ? 'Verifying…' : 'Verify code'}</SubmitButton>
                    <p className="text-center text-xs text-white/70">
                      {secondsLeft > 0 ? `Resend after ${secondsLeft} seconds` : 'Didn’t receive a code?'}{' '}
                      <button type="button" disabled={secondsLeft > 0 || busy} onClick={handleResend} className="font-semibold text-[#0d1d3b] underline decoration-[#f4bb2d] underline-offset-4 disabled:cursor-not-allowed disabled:text-[#a4adba] disabled:no-underline">Resend code</button>
                    </p>
                    <button type="button" onClick={() => openScreen(purpose === 'signup' ? 'signup' : 'forgot')} className="w-full text-center text-xs font-semibold text-white hover:underline">← Back</button>
                  </form>
                )}

                {screen === 'password' && (
                  <form onSubmit={handleSetPassword} className="space-y-5">
                    <div>
                      <p className="mb-3 text-sm font-semibold text-white">Your password should have:</p>
                      <ul className="space-y-2">
                        {passwordRules.map((rule) => {
                          const met = rule.test(password)
                          return <li key={rule.label} className={`flex items-center gap-2 text-xs ${met ? 'text-[#86d6ad]' : 'text-white/60'}`}><span aria-hidden="true" className="grid h-4 w-4 place-items-center rounded-full border text-[10px]">{met ? '✓' : ''}</span>{rule.label}</li>
                        })}
                      </ul>
                    </div>
                    <div>
                      <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-white">New password</label>
                      <div className="relative">
                        <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a new password" className="auth-field pr-20" />
                        <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-3 text-xs font-semibold text-white/70 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-white">Confirm new password</label>
                      <div className="relative">
                        <input id="confirm-password" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter it again" className="auth-field pr-20" />
                        <button type="button" onClick={() => setShowConfirmation((visible) => !visible)} className="absolute inset-y-0 right-3 text-xs font-semibold text-white/70 hover:text-white" aria-label={showConfirmation ? 'Hide confirmation' : 'Show confirmation'}>{showConfirmation ? 'Hide' : 'Show'}</button>
                      </div>
                    </div>
                    <SubmitButton busy={busy}>{busy ? 'Updating password…' : 'Set new password'}</SubmitButton>
                  </form>
                )}

                {demoAuthActive && (
                  <p className="mt-4 rounded-xl border border-[#f4bb2d]/30 bg-[#fff7d6] px-3.5 py-3 text-[11px] leading-5 text-[#7a5400]">
                    Demo mode is active. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment to enable real authentication.
                  </p>
                )}

                {message && <p role="status" aria-live="polite" className={`mt-5 rounded-xl px-3.5 py-3 text-xs leading-5 ${isError ? 'bg-[#fff1ef] text-[#a33d31]' : 'bg-[#eef7f2] text-[#236648]'}`}>{message}</p>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function SubmitButton({ children, busy }: { children: React.ReactNode; busy: boolean }) {
  return <button type="submit" disabled={busy} className="flex min-h-12 w-full items-center justify-center rounded-[20px] bg-white px-5 py-3 text-sm font-semibold text-[#04044a] transition hover:bg-[#f4bb2d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4bb2d] disabled:cursor-wait disabled:opacity-70">{children}</button>
}