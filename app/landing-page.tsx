import Image from 'next/image'
import Link from 'next/link'
import { Poppins, Syne } from 'next/font/google'
import HeroClouds3D from './hero-clouds-3d'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
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
  { label: 'SERVICES', href: '#services' },
  { label: 'CONTACT', href: '#contact' },
]

export default function LandingPage() {
  return (
    <main className={`${poppins.className} bg-white text-[#101323]`}>
      <section id="home" className="relative isolate flex min-h-[720px] min-h-screen flex-col overflow-hidden bg-[#16284c] text-white">
        {/* Layer 1: Original full-bleed /xtra.webp USTP building photo */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-30 overflow-hidden">
          <Image
            src="/xtra.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="hero-ustp-photo object-cover object-[50%_58%]"
          />
        </div>

        {/* Layer 2: Muted slate-blue sky & building color grading + animated shades-of-blue sky shift */}
        <div aria-hidden="true" className="hero-blue-light-cycle pointer-events-none absolute inset-0 -z-[25]" />

        {/* Layer 3: White Three.js 3D volumetric cumulus clouds overlapping the upper skyline naturally */}
        <HeroClouds3D />

        {/* Layer 4: Subtle top/bottom scrim for crisp header & headline contrast */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0f1c37]/55 via-transparent to-[#0f1c37]/30"
        />

        <header className="mx-auto flex w-full max-w-[1368px] items-center justify-between gap-8 px-5 py-6 sm:px-8">
          <Link
            href="#home"
            aria-label="Tatak Swap home"
            className="inline-flex shrink-0 items-center transition hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffb547]"
          >
            <Image
              src="/ts-monogram.png"
              alt="Tatak Swap"
              width={28}
              height={29}
              priority
              referrerPolicy="no-referrer"
              className="h-6 w-auto object-contain drop-shadow-[0_2px_10px_rgba(8,18,44,0.65)] sm:h-7"
            />
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
            {siteLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="whitespace-nowrap shrink-0 text-xs font-semibold tracking-[0.14em] text-white/95 drop-shadow-[0_2px_10px_rgba(8,18,44,0.65)] transition hover:text-[#ffb547]"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/auth"
              className="whitespace-nowrap shrink-0 rounded-full border border-white/80 bg-[#12264f]/45 px-5 py-2 text-xs font-semibold tracking-[0.12em] text-white backdrop-blur-xs transition hover:border-white hover:bg-white hover:text-[#16284c]"
            >
              LOG IN
            </Link>
          </nav>

          <details className="relative lg:hidden">
            <summary className="cursor-pointer list-none rounded-full border border-white/80 bg-[#12264f]/45 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white">
              MENU
            </summary>
            <nav aria-label="Mobile navigation" className="absolute right-0 top-12 z-20 grid min-w-44 gap-1 rounded-xl border border-[#dce3ec] bg-white p-2 text-[#16284c] shadow-xl">
              {siteLinks.map((item) => (
                <a key={item.label} href={item.href} className="rounded-lg px-3 py-2 text-xs font-semibold tracking-[0.08em] hover:bg-[#f4f6f9]">
                  {item.label}
                </a>
              ))}
              <Link href="/auth" className="mt-1 rounded-lg bg-[#16284c] px-3 py-2 text-center text-xs font-semibold tracking-[0.08em] text-[#ffb547]">
                LOG IN
              </Link>
            </nav>
          </details>
        </header>

        <div className="mx-auto flex w-full max-w-[1368px] flex-1 flex-col items-center justify-start px-5 pt-14 pb-20 text-center sm:px-8 sm:pt-16 lg:pt-20">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.26em] text-white/95 drop-shadow-[0_2px_12px_rgba(8,18,44,0.72)] sm:mb-4 sm:text-sm">
            A marketplace built for USTP
          </p>
          <h1 className={`${syne.className} text-[2.6rem] font-extrabold leading-[0.95] tracking-[-0.03em] drop-shadow-[0_6px_24px_rgba(8,18,44,0.58)] sm:text-6xl lg:text-7xl xl:text-[116px]`}>
            TATAK.SWAP
          </h1>
          <Link
            href="/preview"
            className="mt-5 rounded-full border border-white/75 bg-[#12264f]/45 px-5 py-2 text-xs font-medium tracking-[0.1em] backdrop-blur-xs transition hover:border-white hover:bg-white hover:text-[#16284c] sm:mt-6 sm:text-sm"
          >
            BROWSE MARKETPLACE
          </Link>
        </div>
      </section>

      <section id="about" className="scroll-mt-8 px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1213px] rounded-[24px] border border-[#dce3ec] bg-[#f4f6f9] px-6 py-12 sm:px-12 sm:py-16 lg:px-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#525d76]">
            About the platform
          </p>
          <h2 className={`${syne.className} mt-4 text-center text-3xl font-extrabold tracking-[-0.02em] text-[#16284c] sm:text-4xl`}>
            Built for the USTP Community
          </h2>
          <p className="mx-auto mt-8 max-w-[820px] text-center text-base font-normal leading-8 text-[#384359] sm:text-lg sm:leading-9">
            Tatak.Swap is an exclusive, student-driven digital marketplace built specifically for the USTP community. It provides a safe, reliable, and convenient platform where students can buy, sell, and trade preloved academic essentials right on campus.
            <br /><br />
            Whether you are looking to save money on textbooks, pass down your uniforms to incoming freshmen, or find affordable school supplies from fellow peers, Tatak.Swap connects the campus community for smart and sustainable student trading.
          </p>
        </div>
      </section>

      <section id="services" className="scroll-mt-8 px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-[1213px] rounded-[24px] bg-[#16284c] px-6 py-12 text-white sm:px-12 sm:py-16">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#ffb547]">
            What we offer
          </p>
          <h2 className={`${syne.className} mt-4 text-center text-3xl font-extrabold tracking-[-0.02em] sm:text-5xl`}>
            Campus Services
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm leading-7 text-white/75 sm:text-base">
            Practical ways for students to trade campus essentials without the hassle.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-7">
            {services.map((service, index) => (
              <article
                key={service.title}
                className="group flex min-h-[268px] flex-col items-center justify-center rounded-[20px] border border-transparent bg-white px-6 py-8 text-center text-[#16284c] shadow-sm transition-all duration-200 ease-out hover:-translate-y-1.5 hover:border-[#ffb547]/70 hover:shadow-[0_18px_40px_rgba(8,18,44,0.32)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <span className={`${syne.className} grid h-11 w-11 place-items-center rounded-full bg-[#ffb547] text-base font-extrabold text-[#16284c] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:bg-[#ffc368] motion-reduce:transition-none motion-reduce:group-hover:scale-100`}>
                  0{index + 1}
                </span>
                <h3 className="mt-5 text-lg font-bold leading-6 text-[#16284c] transition-colors duration-200 group-hover:text-[#0f1c37]">{service.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#525d76]">{service.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/preview"
              className="inline-flex rounded-full bg-[#ffb547] px-6 py-3 text-xs font-bold tracking-[0.1em] text-[#16284c] transition hover:bg-[#ffc368] sm:text-sm"
            >
              BROWSE MARKETPLACE
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-8 px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto grid max-w-[1213px] gap-10 rounded-[24px] border border-[#dce3ec] bg-[#f4f6f9] p-6 text-[#16284c] sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:p-14">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#525d76]">
              Get in touch
            </p>
            <h2 className={`${syne.className} mt-4 text-3xl font-extrabold tracking-[-0.02em] text-[#16284c] sm:text-5xl`}>
              Contact Us
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#525d76] sm:text-base">
              Got questions, feedback, or need help with a listing? Reach out to our team and let’s keep the USTP community connected.
            </p>
            <dl className="mt-8 grid gap-5 border-t border-[#dce3ec] pt-7 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#525d76]">Address</dt>
                <dd className="mt-1.5 font-medium text-[#16284c]">USTP, Cagayan de Oro City</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#525d76]">Email</dt>
                <dd className="mt-1.5 font-medium">
                  <a href="mailto:tatak.swap@gmail.com" className="text-[#16284c] underline decoration-[#ffb547] decoration-2 underline-offset-4 hover:opacity-80">
                    tatak.swap@gmail.com
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#525d76]">Instagram</dt>
                <dd className="mt-1.5 font-medium text-[#16284c]">@Tatak.Swap</dd>
              </div>
            </dl>
          </div>

          <form action="mailto:tatak.swap@gmail.com" method="post" encType="text/plain" className="rounded-[18px] border border-[#dce3ec] bg-white p-6 text-[#16284c] sm:p-8">
            <label className="mb-4 block text-sm font-semibold">
              Name
              <input name="Name" autoComplete="name" required className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d2dce6] bg-[#f8fafc] px-4 text-sm outline-none transition focus:border-[#16284c] focus:bg-white" />
            </label>
            <label className="mb-4 block text-sm font-semibold">
              Email
              <input name="Email" type="email" autoComplete="email" required className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d2dce6] bg-[#f8fafc] px-4 text-sm outline-none transition focus:border-[#16284c] focus:bg-white" />
            </label>
            <label className="mb-4 block text-sm font-semibold">
              Subject
              <input name="Subject" required className="mt-1.5 min-h-11 w-full rounded-xl border border-[#d2dce6] bg-[#f8fafc] px-4 text-sm outline-none transition focus:border-[#16284c] focus:bg-white" />
            </label>
            <label className="mb-5 block text-sm font-semibold">
              Message
              <textarea name="Message" required rows={4} className="mt-1.5 w-full resize-y rounded-xl border border-[#d2dce6] bg-[#f8fafc] px-4 py-3 text-sm outline-none transition focus:border-[#16284c] focus:bg-white" />
            </label>
            <button type="submit" className="min-h-11 w-full rounded-xl bg-[#16284c] px-5 text-sm font-semibold text-[#ffb547] transition hover:bg-[#0f1c37]">
              Send Now
            </button>
          </form>
        </div>
      </section>

      <footer className="relative isolate overflow-hidden bg-[#0f1c37] text-white">
        <Image src="/CONTACT.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover object-center" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[#0f1c37]/80" />
        <div className="mx-auto grid max-w-[1368px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.1fr_0.8fr_0.8fr]">
          <div>
            <Link href="#home" className={`${syne.className} inline-flex items-center gap-2.5 text-xl font-extrabold tracking-[-0.03em] text-white`}>
              <Image
                src="/ts-monogram.png"
                alt=""
                width={24}
                height={25}
                referrerPolicy="no-referrer"
                className="h-5 w-auto object-contain"
              />
              <span>Tatak.Swap</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/75">
              An exclusive marketplace built for the USTP community, making it easier to trade useful things on campus.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#ffb547]">Links</h2>
            <div className="mt-4 grid justify-start gap-2.5 text-sm text-white/80">
              <a href="#about" className="transition hover:text-white">About Us</a>
              <a href="#services" className="transition hover:text-white">Services</a>
              <a href="#contact" className="transition hover:text-white">Contact Us</a>
              <Link href="/preview" className="transition hover:text-white">Browse Marketplace</Link>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#ffb547]">Get In Touch</h2>
            <p className="mt-4 text-sm leading-6 text-white/80">
              USTP, Cagayan de Oro City<br />
              <a href="mailto:tatak.swap@gmail.com" className="transition hover:text-white">tatak.swap@gmail.com</a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}