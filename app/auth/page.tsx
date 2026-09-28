import { Poppins } from 'next/font/google'
import AuthExperience from './auth-experience'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function AuthPage() {
  return (
    <main className={`${poppins.className} min-h-screen bg-[#04044a] text-white`}>
      <AuthExperience />
    </main>
  )
}