import { Inter } from 'next/font/google'
import AuthExperience from './auth-experience'

const authFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

type AuthSearchParams = { recovery?: string; mode?: string; next?: string }

export default async function AuthPage({ searchParams }: { searchParams: Promise<AuthSearchParams> }) {
  const { recovery, mode, next } = await searchParams
  return (
    <main className={`${authFont.className} min-h-screen bg-[#16284c] text-white`}>
      <AuthExperience
        recovery={recovery === '1'}
        initialMode={mode === 'signup' ? 'signup' : 'login'}
        nextPath={next && next.startsWith('/') && !next.startsWith('//') ? next : ''}
      />
    </main>
  )
}