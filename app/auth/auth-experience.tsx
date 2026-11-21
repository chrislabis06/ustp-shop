'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Eye, EyeOff, Mail } from 'lucide-react'
import { useEffect, useRef, useState, type ClipboardEvent, type CSSProperties, type FormEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseConfig } from '@/lib/supabase/config'

type Screen = 'login' | 'signup' | 'sent' | 'forgot' | 'verify' | 'password'
type VerifyPurpose = 'signup' | 'recovery'
type VerifyChannel = 'email' | 'phone'
type FieldKey = 'fullName' | 'identifier' | 'password' | 'confirmPassword' | 'terms'
type FieldErrors = Partial<Record<FieldKey, string>>

const passwordRules = [
  { label: 'At least 8 characters', short: '8+ characters', test: (value: string) => value.length >= 8 },
  { label: 'One uppercase and one lowercase letter', short: 'Upper & lowercase', test: (value: string) => /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { label: 'At least one number', short: 'A number', test: (value: string) => /\d/.test(value) },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/
const EMAIL_PROBLEM = 'Enter a valid email address, like you@ustp.edu.ph.'

const demoAuthActive = !getSupabaseConfig()

const delay = (seconds: number) => ({ '--d': `${seconds}s` }) as CSSProperties

function validateIdentifier(value: string, allowPhone: boolean) {
  const trimmed = value.trim()
  if (!trimmed) return allowPhone ? 'Enter your email or phone number.' : 'Enter your email address.'
  if (trimmed.includes('@') || !allowPhone) return EMAIL_PATTERN.test(trimmed) ? '' : EMAIL_PROBLEM
  return PHONE_PATTERN.test(trimmed.replace(/[\s-]/g, '')) ? '' : 'Enter a valid email, or a phone number with country code (for example +639171234567).'
}

function validateFullName(value: string) {
  const trimmed = value.trim()
  if (trimmed.length < 2) return 'Enter your full name (at least 2 characters).'
  if (trimmed.length > 80) return 'Your name is too long. Please keep it under 80 characters.'
  if (!Array.from(trimmed).some((character) => character.toLowerCase() !== character.toUpperCase())) return 'Your name should contain letters.'
  return ''
}

function cleanIdentifier(value: string) {
  const trimmed = value.trim()
  return trimmed.includes('@') ? trimmed : trimmed.replace(/[\s-]/g, '')
}

function compact(errors: FieldErrors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as FieldErrors
}

function friendlyError(error: unknown, fallback: string) {
  const text = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message: unknown }).message) : ''
  if (!text) return fallback
  if (/invalid login credentials/i.test(text)) return 'The email/phone or password you entered is incorrect.'
  if (/email not confirmed/i.test(text)) return 'Your email isn’t confirmed yet. Open the confirmation link we sent you, then sign in.'
  if (/already (been )?registered|already exists/i.test(text)) return 'An account with this email already exists. Try signing in, or reset your password.'
  if (/rate limit|too many|security purposes/i.test(text)) return 'Too many attempts. Please wait a moment and try again.'
  return text
}

function focusField(id: string) {
  window.requestAnimationFrame(() => document.getElementById(id)?.focus())
}

export default function AuthExperience({ recovery = false, initialMode = 'login', nextPath = '' }: { recovery?: boolean; initialMode?: 'login' | 'signup'; nextPath?: string }) {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>(recovery ? 'password' : initialMode)
  const [identifier, setIdentifier] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [secondsLeft, setSecondsLeft] = useState(40)
  const [purpose, setPurpose] = useState<VerifyPurpose>(recovery ? 'recovery' : 'signup')
  const [channel, setChannel] = useState<VerifyChannel>('email')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const codeInputs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if ((screen !== 'verify' && screen !== 'sent') || secondsLeft <= 0) return
    const timer = window.setTimeout(() => setSecondsLeft((remaining) => remaining - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [screen, secondsLeft])

  function postAuthPath() {
    const next = nextPath || new URLSearchParams(window.location.search).get('next')
    return next?.startsWith('/') && !next.startsWith('//') ? next : '/marketplace'
  }

  function announce(nextMessage: string, error = false) {
    setMessage(nextMessage)
    setIsError(error)
  }

  function openScreen(nextScreen: Screen) {
    setScreen(nextScreen)
    setMessage('')
    setIsError(false)
    setErrors({})
  }

  function modeLink(target: 'login' | 'signup') {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
      event.preventDefault()
      openScreen(target)
    }
  }

  function modeHref(target: 'login' | 'signup') {
    const params = new URLSearchParams()
    if (target === 'signup') params.set('mode', 'signup')
    if (nextPath) params.set('next', nextPath)
    const query = params.toString()
    return query ? `/auth?${query}` : '/auth'
  }

  function failValidation(found: FieldErrors, order: Array<[FieldKey, string]>) {
    const visible = compact(found)
    setErrors(visible)
    announce('')
    const first = order.find(([key]) => visible[key])
    if (first) focusField(first[1])
  }

  function clearError(key: FieldKey) {
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current))
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found: FieldErrors = {
      identifier: validateIdentifier(identifier, true),
      password: password ? '' : 'Enter your password.',
    }
    if (Object.values(found).some(Boolean)) {
      failValidation(found, [['identifier', 'login-identifier'], ['password', 'login-password']])
      return
    }
    setErrors({})
    setBusy(true)
    announce('')
    try {
      if (demoAuthActive) {
        announce('Sign-in is unavailable until Supabase is configured.', true)
        return
      }

      const supabase = createClient()
      const credentials = { password }
      const cleaned = cleanIdentifier(identifier)
      const result = cleaned.includes('@')
        ? await supabase.auth.signInWithPassword({ ...credentials, email: cleaned })
        : await supabase.auth.signInWithPassword({ ...credentials, phone: cleaned })
      if (result.error) throw result.error
      router.replace(postAuthPath())
      router.refresh()
    } catch (error) {
      announce(friendlyError(error, 'We could not sign you in. Please try again.'), true)
    } finally {
      setBusy(false)
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found: FieldErrors = {
      fullName: validateFullName(fullName),
      identifier: validateIdentifier(identifier, false),
      password: passwordRules.every((rule) => rule.test(password)) ? '' : 'Use at least 8 characters with uppercase, lowercase, and a number.',
      confirmPassword: !confirmPassword ? 'Re-enter your password to confirm it.' : confirmPassword !== password ? 'Your passwords do not match.' : '',
      terms: acceptedTerms ? '' : 'Please accept the Terms of Service to create an account.',
    }
    if (Object.values(found).some(Boolean)) {
      failValidation(found, [['fullName', 'signup-name'], ['identifier', 'signup-email'], ['password', 'signup-password'], ['confirmPassword', 'signup-confirm'], ['terms', 'signup-terms']])
      return
    }
    setErrors({})
    setBusy(true)
    announce('')
    try {
      if (demoAuthActive) {
        announce('Account creation is unavailable until Supabase is configured.', true)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: identifier.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(postAuthPath())}`,
        },
      })
      if (error) throw error
      if (data.session) {
        announce('Account created! Taking you in…')
        router.replace(postAuthPath())
        router.refresh()
        return
      }
      if (data.user?.identities?.length === 0) {
        announce('An account with this email already exists. Try signing in, or reset your password.', true)
        return
      }
      setPurpose('signup')
      setChannel('email')
      setSecondsLeft(40)
      setPassword('')
      setConfirmPassword('')
      setMessage('')
      setIsError(false)
      setScreen('sent')
    } catch (error) {
      announce(friendlyError(error, 'We could not create your account. Please try again.'), true)
    } finally {
      setBusy(false)
    }
  }

  async function handleForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const problem = validateIdentifier(identifier, true)
    if (problem) {
      failValidation({ identifier: problem }, [['identifier', 'recovery-identifier']])
      return
    }
    setErrors({})
    setBusy(true)
    announce('')
    const cleaned = cleanIdentifier(identifier)
    const nextChannel: VerifyChannel = cleaned.includes('@') ? 'email' : 'phone'
    try {
      if (demoAuthActive) {
        setPurpose('recovery')
        setChannel(nextChannel)
        setCode(['', '', '', '', '', ''])
        setSecondsLeft(40)
        announce(`Demo mode is active. A verification code is ready for your ${nextChannel === 'email' ? 'email' : 'phone'}.`)
        setScreen('verify')
        return
      }

      const supabase = createClient()
      const result = nextChannel === 'email'
        ? await supabase.auth.resetPasswordForEmail(cleaned, { redirectTo: `${window.location.origin}/auth/callback?next=/auth?recovery=1` })
        : await supabase.auth.signInWithOtp({ phone: cleaned, options: { shouldCreateUser: false } })
      if (result.error) throw result.error
      if (nextChannel === 'email') {
        announce('We sent a password reset link to your email.')
        return
      }
      setPurpose('recovery')
      setChannel(nextChannel)
      setCode(['', '', '', '', '', ''])
      setSecondsLeft(40)
      announce('We sent a verification code to your phone.')
      setScreen('verify')
    } catch (error) {
      announce(friendlyError(error, 'We could not send a code. Check your details and try again.'), true)
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = code.join('')
    if (token.length !== 6) {
      announce('Enter all 6 digits from your message.', true)
      return
    }
    setBusy(true)
    announce('')
    try {
      if (demoAuthActive) {
        if (purpose === 'signup') {
          router.replace(postAuthPath())
          return
        }
        openScreen('password')
        return
      }

      const supabase = createClient()
      const cleaned = cleanIdentifier(identifier)
      const result = channel === 'email'
        ? await supabase.auth.verifyOtp({
            email: cleaned,
            token,
            type: purpose === 'signup' ? 'signup' : 'recovery',
          })
        : await supabase.auth.verifyOtp({ phone: cleaned, token, type: 'sms' })
      if (result.error) throw result.error
      if (purpose === 'signup') {
        router.replace(postAuthPath())
        return
      }
      openScreen('password')
    } catch (error) {
      announce(friendlyError(error, 'That code could not be verified. Try again.'), true)
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
        setCode(['', '', '', '', '', ''])
        setSecondsLeft(40)
        announce('Demo mode is active. A new verification code is ready.')
        codeInputs.current[0]?.focus()
        return
      }

      const supabase = createClient()
      const cleaned = cleanIdentifier(identifier)
      const result = channel === 'email'
        ? purpose === 'signup'
          ? await supabase.auth.resend({ type: 'signup', email: cleaned, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(postAuthPath())}` } })
          : await supabase.auth.signInWithOtp({ email: cleaned, options: { shouldCreateUser: false } })
        : await supabase.auth.signInWithOtp({ phone: cleaned, options: { shouldCreateUser: false } })
      if (result.error) throw result.error
      setCode(['', '', '', '', '', ''])
      setSecondsLeft(40)
      announce(screen === 'sent' ? 'We sent the confirmation email again.' : 'A new verification code is on its way.')
      codeInputs.current[0]?.focus()
    } catch (error) {
      announce(friendlyError(error, 'We could not resend. Please try again.'), true)
    } finally {
      setBusy(false)
    }
  }

  async function handleSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found: FieldErrors = {
      password: passwordRules.every((rule) => rule.test(password)) ? '' : 'Choose a password that meets all the requirements.',
      confirmPassword: !confirmPassword ? 'Re-enter your password to confirm it.' : confirmPassword !== password ? 'Your passwords do not match.' : '',
    }
    if (Object.values(found).some(Boolean)) {
      failValidation(found, [['password', 'new-password'], ['confirmPassword', 'confirm-password']])
      return
    }
    setErrors({})
    setBusy(true)
    announce('')
    try {
      if (demoAuthActive) {
        router.replace(postAuthPath())
        announce('Demo mode is active. Your password has been updated locally.')
        return
      }

      const { error } = await createClient().auth.updateUser({ password })
      if (error) throw error
      router.replace(postAuthPath())
    } catch (error) {
      announce(friendlyError(error, 'We could not update your password. Please try again.'), true)
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
    digits.slice(0, 6 - index).split('').forEach((digit, offset) => { nextCode[index + offset] = digit })
    setCode(nextCode)
    codeInputs.current[Math.min(index + digits.length, 5)]?.focus()
  }

  function handleCodeKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === 'Backspace' && !code[index] && index > 0) codeInputs.current[index - 1]?.focus()
    if (event.key === 'ArrowLeft' && index > 0) codeInputs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < 5) codeInputs.current[index + 1]?.focus()
  }

  function handleCodePaste(event: ClipboardEvent<HTMLInputElement>, index: number) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '')
    if (!pasted) return
    event.preventDefault()
    updateCode(index, pasted)
  }

  const isLoginOrSignup = screen === 'login' || screen === 'signup'
  const heading = {
    login: 'Welcome Back!',
    signup: 'Create your account',
    sent: 'Check your email',
    forgot: 'Reset your password',
    verify: purpose === 'signup' ? 'Verify your email' : 'Check your inbox',
    password: 'Set a new password',
  }[screen]
  const supportingText = {
    login: 'Sign in to pick up where campus life left off.',
    signup: 'Join the USTP community and make room for good finds.',
    sent: `We sent a confirmation link to ${identifier.trim()}.`,
    forgot: 'Enter the email or phone linked to your account.',
    verify: `Enter the 6-digit code sent to ${identifier.trim()}.`,
    password: 'Choose a strong password you have not used before.',
  }[screen]

  return (
    <div className="auth-root">
      <div className="auth-plate" aria-hidden="true">
        <Image src="/xtra.webp" alt="" fill priority sizes="100vw" className="auth-plate-img" />
      </div>
      <div className="auth-fx" aria-hidden="true">
        <span className="auth-orb auth-orb-a" />
        <span className="auth-orb auth-orb-b" />
        <span className="auth-orb auth-orb-c" />
      </div>
      <div className="auth-shade" aria-hidden="true" />

      <div className="auth-layout">
        <section className="auth-hero">
          <header className="auth-topbar">
            <Link href="/" className="auth-logo a-in" style={delay(0)}>
              <span className="auth-logo-tile" aria-hidden="true">T</span>
              <span>Tatak.Swap</span>
            </Link>
            <Link href="/" className="auth-back a-in" style={delay(0.08)}>
              <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
              <span>Back to Home</span>
            </Link>
          </header>

          <div className="auth-pitch">
            <h1 className="auth-headline">
              {['Useful things find', 'a new home here.'].map((line, index) => (
                <span key={line} className="auth-line"><span className="auth-line-in" style={delay(0.35 + index * 0.12)}>{line}</span></span>
              ))}
            </h1>
            <p className="auth-subline a-in" style={delay(0.7)}>Buy, sell and swap everyday finds with fellow USTP students, safely and close to campus.</p>
          </div>
        </section>

        <section className="auth-card a-card">
          <div className="auth-form">
            <h2 className="auth-heading a-in" style={delay(0.5)}>{heading}</h2>
            <p className="auth-support a-in" style={delay(0.58)}>{supportingText}</p>

            {isLoginOrSignup && (
              <nav className="auth-tabs a-in" style={delay(0.64)} aria-label="Account access">
                <Link href={modeHref('login')} prefetch={false} onClick={modeLink('login')} aria-current={screen === 'login' ? 'page' : undefined} className="auth-tab">Sign in</Link>
                <Link href={modeHref('signup')} prefetch={false} onClick={modeLink('signup')} aria-current={screen === 'signup' ? 'page' : undefined} className="auth-tab">Create account</Link>
              </nav>
            )}

            {screen === 'login' && (
              <form onSubmit={handleLogin} noValidate className="auth-stack">
                <Field id="login-identifier" label="Email / Phone number" error={errors.identifier} delay={0.7}>
                  <input id="login-identifier" type="text" inputMode="email" autoComplete="username" value={identifier} onChange={(event) => { setIdentifier(event.target.value); clearError('identifier') }} placeholder="you@ustp.edu.ph or +63" className="auth-field" {...aria('login-identifier', errors.identifier)} />
                </Field>
                <Field id="login-password" label="Password" error={errors.password} delay={0.78}>
                  <PasswordInput id="login-password" autoComplete="current-password" value={password} onChange={(value) => { setPassword(value); clearError('password') }} placeholder="Enter your password" error={errors.password} />
                </Field>
                <div className="auth-row a-in" style={delay(0.86)}>
                  <button type="button" onClick={() => openScreen('forgot')} className="auth-link">Forgot password?</button>
                </div>
                <SubmitButton busy={busy} delaySeconds={0.94}>{busy ? 'Signing in…' : 'Login'}</SubmitButton>
              </form>
            )}

            {screen === 'signup' && (
              <form onSubmit={handleSignup} noValidate className="auth-stack auth-stack-tight">
                <Field id="signup-name" label="Full name" error={errors.fullName} delay={0.7}>
                  <input id="signup-name" type="text" autoComplete="name" maxLength={80} value={fullName} onChange={(event) => { setFullName(event.target.value); clearError('fullName') }} placeholder="Your name" className="auth-field" {...aria('signup-name', errors.fullName)} />
                </Field>
                <Field id="signup-email" label="USTP email" error={errors.identifier} delay={0.76}>
                  <input id="signup-email" type="email" autoComplete="email" value={identifier} onChange={(event) => { setIdentifier(event.target.value); clearError('identifier') }} placeholder="you@ustp.edu.ph" className="auth-field" {...aria('signup-email', errors.identifier)} />
                </Field>
                <Field id="signup-password" label="Password" error={errors.password} delay={0.82}>
                  <PasswordInput id="signup-password" autoComplete="new-password" value={password} onChange={(value) => { setPassword(value); clearError('password') }} placeholder="Create a password" error={errors.password} />
                  {!errors.password && <p className="auth-hint">Use at least 8 characters with uppercase, lowercase, and a number.</p>}
                </Field>
                <Field id="signup-confirm" label="Confirm password" error={errors.confirmPassword} delay={0.88}>
                  <PasswordInput id="signup-confirm" autoComplete="new-password" value={confirmPassword} onChange={(value) => { setConfirmPassword(value); clearError('confirmPassword') }} placeholder="Enter it again" error={errors.confirmPassword} />
                </Field>
                <div className="a-in" style={delay(0.92)}>
                  <label className="auth-check">
                    <input id="signup-terms" type="checkbox" checked={acceptedTerms} onChange={(event) => { setAcceptedTerms(event.target.checked); clearError('terms') }} {...aria('signup-terms', errors.terms)} />
                    <span className="auth-check-box" aria-hidden="true">
                      <Check size={12} strokeWidth={3} aria-hidden="true" />
                    </span>
                    <span>I agree to the Terms of Service and Privacy Policy.</span>
                  </label>
                  {errors.terms && <p id="signup-terms-error" className="auth-error" role="alert">{errors.terms}</p>}
                </div>
                <SubmitButton busy={busy} delaySeconds={0.96}>{busy ? 'Creating account…' : 'Create account'}</SubmitButton>
                <p className="auth-foot a-in" style={delay(1)}>Already have an account? <Link href={modeHref('login')} prefetch={false} onClick={modeLink('login')} className="auth-link">Sign in</Link></p>
              </form>
            )}

            {screen === 'sent' && (
              <div className="auth-stack">
                <div className="auth-sent a-in" style={delay(0.66)}>
                  <span className="auth-sent-icon" aria-hidden="true">
                    <Mail size={22} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <p>Open the link in that email to activate your account, then come back and sign in. It can take a minute to arrive, so check your spam folder too.</p>
                </div>
                <button type="button" onClick={() => openScreen('login')} className="auth-submit a-in" style={delay(0.74)}>Back to sign in</button>
                <p className="auth-foot a-in" style={delay(0.82)}>
                  {secondsLeft > 0 ? `Resend available in ${secondsLeft}s` : 'Didn’t get the email?'}{' '}
                  <button type="button" disabled={secondsLeft > 0 || busy} onClick={handleResend} className="auth-link">Resend email</button>
                </p>
                <button type="button" onClick={() => openScreen('signup')} className="auth-link auth-center a-in" style={delay(0.9)}>Use a different email</button>
              </div>
            )}

            {screen === 'forgot' && (
              <form onSubmit={handleForgot} noValidate className="auth-stack">
                <Field id="recovery-identifier" label="Email / Phone number" error={errors.identifier} delay={0.7}>
                  <input id="recovery-identifier" type="text" inputMode="email" autoComplete="username" value={identifier} onChange={(event) => { setIdentifier(event.target.value); clearError('identifier') }} placeholder="you@ustp.edu.ph or +63" className="auth-field" {...aria('recovery-identifier', errors.identifier)} />
                </Field>
                <SubmitButton busy={busy} delaySeconds={0.78}>{busy ? 'Sending code…' : 'Send verification code'}</SubmitButton>
                <button type="button" onClick={() => openScreen('login')} className="auth-link auth-center a-in" style={delay(0.86)}>Back to sign in</button>
              </form>
            )}

            {screen === 'verify' && (
              <form onSubmit={handleVerify} noValidate className="auth-stack">
                <div className="a-in" style={delay(0.7)}>
                  <label className="auth-label" htmlFor="verification-code-0">Verification code</label>
                  <div className="auth-code" role="group" aria-label="6-digit verification code">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => { codeInputs.current[index] = element }}
                        id={`verification-code-${index}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                        aria-label={`Verification code digit ${index + 1}`}
                        maxLength={index === 0 ? 6 : 1}
                        value={digit}
                        onChange={(event) => updateCode(index, event.target.value)}
                        onKeyDown={(event) => handleCodeKeyDown(event, index)}
                        onPaste={(event) => handleCodePaste(event, index)}
                        className="auth-field auth-code-digit"
                      />
                    ))}
                  </div>
                </div>
                <SubmitButton busy={busy} delaySeconds={0.78}>{busy ? 'Verifying…' : 'Verify code'}</SubmitButton>
                <p className="auth-foot a-in" style={delay(0.86)}>
                  {secondsLeft > 0 ? `Resend after ${secondsLeft} seconds` : 'Didn’t receive a code?'}{' '}
                  <button type="button" disabled={secondsLeft > 0 || busy} onClick={handleResend} className="auth-link">Resend code</button>
                </p>
                <button type="button" onClick={() => openScreen(purpose === 'signup' ? 'signup' : 'forgot')} className="auth-link auth-center a-in" style={delay(0.92)}>Back</button>
              </form>
            )}

            {screen === 'password' && (
              <form onSubmit={handleSetPassword} noValidate className="auth-stack">
                <div className="a-in" style={delay(0.7)}>
                  <p className="auth-label">Your password should have:</p>
                  <PasswordRules password={password} />
                </div>
                <Field id="new-password" label="New password" error={errors.password} delay={0.76}>
                  <PasswordInput id="new-password" autoComplete="new-password" value={password} onChange={(value) => { setPassword(value); clearError('password') }} placeholder="Create a new password" error={errors.password} />
                </Field>
                <Field id="confirm-password" label="Confirm new password" error={errors.confirmPassword} delay={0.82}>
                  <PasswordInput id="confirm-password" autoComplete="new-password" value={confirmPassword} onChange={(value) => { setConfirmPassword(value); clearError('confirmPassword') }} placeholder="Enter it again" error={errors.confirmPassword} />
                </Field>
                <SubmitButton busy={busy} delaySeconds={0.9}>{busy ? 'Updating password…' : 'Set new password'}</SubmitButton>
              </form>
            )}

            {demoAuthActive && (
              <p className="auth-notice auth-notice-demo">
                Demo mode is active. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in your environment to enable real authentication.
              </p>
            )}

            {message && <p role="status" aria-live="polite" className={`auth-notice ${isError ? 'auth-notice-error' : 'auth-notice-ok'}`}>{message}</p>}
          </div>
        </section>
      </div>
    </div>
  )
}

function aria(id: string, error?: string) {
  return { 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-error` : undefined } as const
}

function Field({ id, label, error, delay: delaySeconds, children }: { id: string; label: string; error?: string; delay: number; children: ReactNode }) {
  return (
    <div className="a-in" style={delay(delaySeconds)}>
      <label htmlFor={id} className="auth-label">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="auth-error" role="alert">{error}</p>}
    </div>
  )
}

function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="auth-rules" aria-label="Password requirements">
      {passwordRules.map((rule) => {
        const met = rule.test(password)
        return (
          <li key={rule.label} className={met ? 'is-met' : ''}>
            <span aria-hidden="true">{met ? <Check size={10} strokeWidth={3} /> : null}</span>
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}

function PasswordInput({ id, autoComplete, value, onChange, placeholder, error }: {
  id: string
  autoComplete: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  error?: string
}) {
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const label = visible ? 'Hide password' : 'Show password'

  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    const input = inputRef.current
    const selectionStart = input?.selectionStart ?? null
    const selectionEnd = input?.selectionEnd ?? null
    const wasFocused = typeof document !== 'undefined' && document.activeElement === input

    setVisible((current) => !current)

    if (wasFocused && input && selectionStart !== null && selectionEnd !== null) {
      window.requestAnimationFrame(() => {
        if (document.activeElement === input) {
          try {
            input.setSelectionRange(selectionStart, selectionEnd)
          } catch {
            // Ignore selection restoration errors on unsupported input states
          }
        }
      })
    }
  }

  return (
    <div className="auth-pw">
      <input
        ref={inputRef}
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="auth-field auth-field-pw"
        {...aria(id, error)}
      />
      <button
        type="button"
        className="auth-eye"
        aria-label={label}
        aria-controls={id}
        aria-pressed={visible}
        title={label}
        onMouseDown={(event) => event.preventDefault()}
        onClick={handleToggle}
      >
        {visible ? <Eye size={18} strokeWidth={2} aria-hidden="true" /> : <EyeOff size={18} strokeWidth={2} aria-hidden="true" />}
      </button>
    </div>
  )
}

function SubmitButton({ children, busy, delaySeconds }: { children: ReactNode; busy: boolean; delaySeconds: number }) {
  return <button type="submit" disabled={busy} className="auth-submit a-in" style={delay(delaySeconds)}>{children}</button>
}