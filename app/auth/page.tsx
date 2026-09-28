import { Poppins } from 'next/font/google'
import AuthExperience from './auth-experience'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function AuthPage() {
  return (
    <main className={`${poppins.className} min-h-screen bg-[#f0f3f8] px-4 py-5 text-[#17243a] sm:px-8 sm:py-8`}>
      <AuthExperience />
    </main>
  )
}