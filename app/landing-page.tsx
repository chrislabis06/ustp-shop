import Image from 'next/image'
import Link from 'next/link'
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const services = [
  {
    title: 'Affordable Campus Attire',
    description: 'Easily buy or sell preloved USTP uniforms, PE shirts, and organization shirts. Save money and promote sustainability within the student community.',
  },
  {
    title: 'Books & Study Materials',
    description: 'Find semester textbooks, reference books, modules, and review materials from senior students at a fraction of the original price.',
  },
  {
    title: 'Safe Student-to-Student Trading',
    description: 'Connect directly with fellow USTP students through a trusted platform designed for convenient on-campus exchanges.',
  },
]

const siteLinks = [
  { label: 'HOME', href: '#home' },
  { label: 'ABOUT', href: '#about' },
  { label: 'SERVICE', href: '#services' },
  { label: 'CONTACT', href: '#contact' },
]

export default function LandingPage() {
  return (
    <main className={`${poppins.className} bg-white text-[#101323]`}>
      <section id="home" className="relative isolate flex min-h-[720px] min-h-screen flex-col overflow-hidden bg-[#04044a] text-white">
        <Image
          src="/xtra.webp"
          alt="University students spending time together on campus"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <header className="mx-auto flex w-full max-w-[1368px] items-center justify-between px-5 py-5 sm:px-8">
          <Link href="#home" aria-label="Tatak Swap home" className="flex h-[47px] w-28 items-center justify-center text-sm font-bold text-[#FFFFFF]">
            Tatak.Swap
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
            {siteLinks.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-medium text-white transition hover:text-[#f4bb2d] xl:text-lg">
                {item.label}
              </a>
            ))}
            <Link href="/auth" className="rounded-full border border-white px-5 py-2 text-sm font-medium transition hover:bg-white hover:text-[#04044a] xl:text-lg">
              LOG IN
            </Link>
          </nav>
          <details className="relative lg:hidden">
            <summary className="cursor-pointer list-none rounded-full border border-white px-4 py-2 text-sm font-medium">MENU</summary>
            <nav aria-label="Mobile navigation" className="absolute right-0 top-12 z-20 grid min-w-44 gap-1 rounded-lg bg-white p-2 text-[#04044a] shadow-xl">
              {siteLinks.map((item) => (
                <a key={item.label} href={item.href} className="rounded px-3 py-2 text-sm font-medium hover:bg-[#eef0f5]">
                  {item.label}
                </a>
              ))}
              <Link href="/auth" className="rounded px-3 py-2 text-sm font-semibold hover:bg-[#eef0f5]">LOG IN</Link>
            </nav>
          </details>
        </header>

        <div className="mx-auto flex w-full max-w-[1368px] flex-1 flex-col items-center justify-start px-5 pt-8 pb-20 text-center sm:px-8">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.22em] text-white/85">A marketplace built for USTP</p>
          <h1 className="text-7xl font-bold leading-none sm:text-8xl xl:text-[150px]">WELCOME</h1>
          <Link href="/marketplace" className="mt-2 rounded-full border border-white px-7 py-2.5 text-sm font-medium transition hover:bg-white hover:text-[#04044a] sm:text-lg">
            GET STARTED
          </Link>
        </div>
        <a href="#about" className=" left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-[0.18em] text-white/80">
          Discover Tatak.Swap
        </a>
      </section>

      <section id="about" className="scroll-mt-8 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1213px] rounded-[24px] bg-[#f4f5f8] px-6 py-12 sm:px-12 sm:py-16 lg:px-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#777b88]">Home / About</p>
          <h2 className="mt-5 text-center text-3xl font-bold text-[#04044a] sm:text-4xl">ABOUT</h2>
          <p className="mx-auto mt-10 max-w-[997px] text-lg font-light leading-8 text-[#20212b] sm:text-2xl sm:leading-10">
            Tatak.Swap is an exclusive, student-driven digital marketplace built specifically for the USTP community. It provides a safe, reliable, and convenient platform where students can buy, sell, and trade preloved academic essentials right on campus.
            <br /><br />
            Whether you are looking to save money on textbooks, pass down your uniforms to incoming freshmen, or find affordable school supplies from fellow peers, Tatak.Swap connects the campus community for smart and sustainable student trading.
          </p>
        </div>
      </section>

      <section id="services" className="scroll-mt-8 px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto max-w-[1213px] rounded-[24px] bg-[#04044a] px-6 py-12 text-white sm:px-12 sm:py-16">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-white/65">Home / Our service</p>
          <h2 className="mt-4 text-center text-4xl font-bold sm:text-5xl">Our Service</h2>
          <p className="mx-auto mt-5 max-w-md text-center text-base leading-7 text-white/75">A wide range of campus marketplace services.</p>
          <h3 className="mt-12 text-center text-2xl font-bold sm:mt-16 sm:text-3xl">Features Services</h3>
          <div className="mt-8 grid gap-5 md:grid-cols-3 md:gap-7">
            {services.map((service, index) => (
              <article key={service.title} className="flex min-h-[284px] flex-col items-center justify-center rounded-[20px] bg-white px-6 py-8 text-center text-[#04044a]">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f4bb2d] text-lg font-bold">0{index + 1}</span>
                <h4 className="mt-5 text-lg font-bold leading-6">{service.title}</h4>
                <p className="mt-4 text-sm leading-6 text-[#383b48]">{service.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/marketplace" className="inline-flex rounded-full border border-white px-6 py-3 text-sm font-medium transition hover:bg-white hover:text-[#04044a]">Explore the marketplace</Link>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-8 px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto grid max-w-[1213px] gap-10 rounded-[24px] bg-[#04044a] p-6 text-white sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:p-14">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/65">Home / Get in touch</p>
            <h2 className="mt-4 text-4xl font-bold sm:text-5xl">Contact Us</h2>
            <h3 className="mt-12 text-2xl font-bold">Get In Touch</h3>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/80">Got questions, feedback, or need help with a listing? Reach out to our team and let’s keep the USTP community connected.</p>
            <dl className="mt-8 grid gap-5 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold">Address</dt><dd className="mt-1 text-white/75">USTP, Cagayan de Oro City</dd></div>
              <div><dt className="font-semibold">Email</dt><dd className="mt-1"><a href="mailto:tatak.swap@gmail.com" className="text-white/75 underline decoration-[#f4bb2d] underline-offset-4">tatak.swap@gmail.com</a></dd></div>
              <div><dt className="font-semibold">Instagram</dt><dd className="mt-1 text-white/75">@Tatak.Swap</dd></div>
            </dl>
          </div>

          <form action="mailto:tatak.swap@gmail.com" method="post" encType="text/plain" className="rounded-[18px] bg-white p-6 text-[#04044a] sm:p-8">
            <label className="mb-5 block text-sm font-semibold">Name<input name="Name" autoComplete="name" required className="mt-2 min-h-12 w-full rounded-xl border-2 border-[#d9d9d9] bg-white px-4 text-sm outline-none focus:border-[#04044a]" /></label>
            <label className="mb-5 block text-sm font-semibold">Email<input name="Email" type="email" autoComplete="email" required className="mt-2 min-h-12 w-full rounded-xl border-2 border-[#d9d9d9] bg-white px-4 text-sm outline-none focus:border-[#04044a]" /></label>
            <label className="mb-5 block text-sm font-semibold">Subject<input name="Subject" required className="mt-2 min-h-12 w-full rounded-xl border-2 border-[#d9d9d9] bg-white px-4 text-sm outline-none focus:border-[#04044a]" /></label>
            <label className="mb-6 block text-sm font-semibold">Message<textarea name="Message" required rows={4} className="mt-2 w-full resize-y rounded-xl border-2 border-[#d9d9d9] bg-white px-4 py-3 text-sm outline-none focus:border-[#04044a]" /></label>
            <button type="submit" className="min-h-12 w-full rounded-xl bg-[#04044a] px-5 text-sm font-semibold text-white transition hover:bg-[#17175d]">Send Now</button>
          </form>
        </div>
      </section>

      <footer className="relative isolate overflow-hidden bg-[#04044a] text-white">
        <Image src="/CONTACT.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover object-center" />
        <div className="mx-auto grid max-w-[1368px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.1fr_0.8fr_0.8fr]">
          <div><Link href="#home" className="inline-flex h-[47px] w-28 items-center justify-center px-2 text-sm font-bold text-[#FFFFFF]">Tatak.Swap</Link><p className="mt-5 max-w-xs text-sm leading-6 text-white/75">An exclusive marketplace built for the USTP community, making it easier to trade useful things on campus.</p></div>
          <div><h2 className="font-bold">Links</h2><div className="mt-4 grid justify-start gap-3 text-sm text-white/75"><a href="#about" className="hover:text-white">About Us</a><a href="#services" className="hover:text-white">Services</a><a href="#contact" className="hover:text-white">Contact Us</a><Link href="/marketplace" className="hover:text-white">Browse items</Link></div></div>
          <div><h2 className="font-bold">Get In Touch</h2><p className="mt-4 text-sm leading-6 text-white/75">USTP, Cagayan de Oro City<br /><a href="mailto:tatak.swap@gmail.com" className="underline decoration-[#f4bb2d] underline-offset-4">tatak.swap@gmail.com</a></p></div>
        </div>
      </footer>
    </main>
  )
}