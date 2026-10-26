import { Poppins } from 'next/font/google'
import AuthExperience from './auth-experience'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ recovery?: string }> }) {
  const { recovery } = await searchParams
  return (
    <main className={`${poppins.className} min-h-screen bg-[#04044a] text-white`}>
      <AuthExperience recovery={recovery === '1'} />
    </main>
  )
}