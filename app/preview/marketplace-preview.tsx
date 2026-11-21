'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Backpack,
  BookOpen,
  Dumbbell,
  Heart,
  Lock,
  MapPin,
  Search,
  Shirt,
  Tag,
  X,
} from 'lucide-react'
import { Poppins, Syne } from 'next/font/google'
import { categories, formatPrice } from '@/lib/mock-data'
import type { MarketplaceListing } from '@/lib/marketplace-data'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
})

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case 'Uniforms':
      return <Shirt className="h-10 w-10 text-[#16284c]/45" strokeWidth={1.6} />
    case 'PE gear':
      return <Dumbbell className="h-10 w-10 text-[#16284c]/45" strokeWidth={1.6} />
    case 'Books':
      return <BookOpen className="h-10 w-10 text-[#16284c]/45" strokeWidth={1.6} />
    default:
      return <Backpack className="h-10 w-10 text-[#16284c]/45" strokeWidth={1.6} />
  }
}

export default function MarketplacePreview({
  initialListings,
  isAuthenticated,
}: {
  initialListings: MarketplaceListing[]
  isAuthenticated: boolean
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All items')
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null)
  const [gateActionLabel, setGateActionLabel] = useState('view full item details & message sellers')
  const [isGateOpen, setIsGateOpen] = useState(false)

  const filteredListings = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    return initialListings.filter((item) => {
      const matchesCat = category === 'All items' || item.category === category
      const matchesQuery =
        !normalized ||
        `${item.title} ${item.description} ${item.category} ${item.location}`
          .toLowerCase()
          .includes(normalized)
      return matchesCat && matchesQuery
    })
  }, [category, initialListings, query])

  function openGate(listing: MarketplaceListing | null, action: string) {
    setSelectedListing(listing)
    setGateActionLabel(action)
    setIsGateOpen(true)
  }

  function closeGate() {
    setIsGateOpen(false)
    setSelectedListing(null)
  }

  return (
    <main className={`${poppins.className} min-h-screen bg-[#f4f6f9] text-[#101323]`}>
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#d9e0ea] bg-white/95">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#16284c] transition hover:text-[#2a4a85]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <span className="h-4 w-px bg-[#d9e0ea]" aria-hidden="true" />
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#16284c] p-1.5">
                <Image
                  src="/ts-monogram.png"
                  alt=""
                  width={20}
                  height={21}
                  referrerPolicy="no-referrer"
                  className="h-full w-auto object-contain"
                />
              </span>
              <span className={`${syne.className} text-base font-extrabold tracking-[-0.03em] text-[#16284c]`}>
                Tatak.Swap
              </span>
              <span className="hidden rounded-full bg-[#efe8da] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#16284c] sm:inline-block">
                Preview
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#16284c] px-4 py-2 text-xs font-semibold text-[#ffb547] transition hover:bg-[#0f1c37] sm:px-5 sm:text-sm"
              >
                <span>Open Full Marketplace</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth?next=/marketplace"
                  className="rounded-full border border-[#16284c]/25 px-4 py-2 text-xs font-semibold text-[#16284c] transition hover:border-[#16284c] sm:text-sm"
                >
                  Log in
                </Link>
                <Link
                  href="/auth?mode=signup&next=/marketplace"
                  className="rounded-full bg-[#16284c] px-4 py-2 text-xs font-semibold text-[#ffb547] transition hover:bg-[#0f1c37] sm:px-5 sm:text-sm"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Preview Hero Banner */}
      <section className="mx-auto max-w-[1320px] px-5 pt-8 sm:px-8 sm:pt-10">
        <div className="relative overflow-hidden rounded-[24px] bg-[#16284c] p-6 text-white shadow-lg sm:p-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#ffb547]">
                <Lock className="h-3.5 w-3.5" />
                <span>Read-Only Marketplace Preview</span>
              </div>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                See what USTP students are trading on campus.
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/80 sm:text-base">
                Browse categories and sample listings below. Sign in with your student account to unlock full listing details, save favorites, message sellers, or post your own items.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              {isAuthenticated ? (
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#ffb547] px-6 py-3 text-sm font-bold text-[#16284c] transition hover:bg-[#ffc368]"
                >
                  <span>Enter Marketplace</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth?mode=signup&next=/marketplace"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ffb547] px-6 py-3 text-sm font-bold text-[#16284c] transition hover:bg-[#ffc368]"
                  >
                    <span>Create Account to Join</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openGate(null, 'post a campus listing')}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <Tag className="h-4 w-4 text-[#ffb547]" />
                    <span>Sell an item</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search & Category Filters */}
      <section className="mx-auto max-w-[1320px] px-5 pt-7 sm:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#d9e0ea] bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search preview items (uniforms, books, PE)..."
              className="w-full rounded-xl border border-[#d2dce6] bg-[#f8fafc] py-2.5 pl-10 pr-4 text-sm text-[#101323] outline-none transition placeholder:text-[#8896a6] focus:border-[#16284c] focus:bg-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                  category === item
                    ? 'bg-[#16284c] text-[#ffb547] shadow-xs'
                    : 'bg-[#eef2f6] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Listings Grid */}
      <section className="mx-auto max-w-[1320px] px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#16284c]/70">
              Sample campus finds
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#16284c]">
              Explore Listings Preview
            </h2>
          </div>
          <span className="text-sm font-medium text-[#64748b]">
            {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {filteredListings.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <article
                key={listing.id}
                className="group flex flex-col overflow-hidden rounded-[20px] border border-[#dce3ec] bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="relative flex aspect-[1.2] items-center justify-center overflow-hidden bg-[#efe8da]/60"
                  style={
                    listing.imageUrl
                      ? {
                          backgroundImage: `url("${listing.imageUrl}")`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                        }
                      : undefined
                  }
                >
                  {!listing.imageUrl && (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/85 shadow-xs">
                        <CategoryIcon category={listing.category} />
                      </div>
                      <span className="text-xs font-medium text-[#16284c]/60">
                        {listing.category}
                      </span>
                    </div>
                  )}

                  <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#16284c] shadow-xs">
                    {listing.category}
                  </span>

                  <button
                    type="button"
                    aria-label="Sign in to save listing"
                    onClick={() => openGate(listing, 'save items to your favorites')}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#16284c] shadow-xs transition hover:bg-[#ffb547]"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-[#16284c]">{listing.title}</h3>
                    <span className="whitespace-nowrap text-base font-bold text-[#16284c]">
                      {formatPrice(listing.price)}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#525d76]">
                    {listing.description}
                  </p>

                  <div className="mt-4 flex items-center gap-3 text-xs font-medium text-[#64748b]">
                    <span className="rounded bg-[#eef2f6] px-2 py-0.5 text-[#16284c]">
                      {listing.condition}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {listing.location}
                    </span>
                  </div>

                  <div className="mt-5 border-t border-[#eef2f6] pt-4">
                    {isAuthenticated ? (
                      <Link
                        href={`/listings/${listing.id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#16284c] px-4 py-2.5 text-sm font-semibold text-[#ffb547] transition hover:bg-[#0f1c37]"
                      >
                        <span>View full listing</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openGate(listing, 'message the seller and view full details')}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#16284c]/20 bg-[#f8fafc] px-4 py-2.5 text-sm font-semibold text-[#16284c] transition hover:border-[#16284c] hover:bg-[#16284c] hover:text-[#ffb547]"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Sign in to view &amp; message</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white py-16 text-center">
            <p className="text-base font-bold text-[#16284c]">No preview items match that search.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategory('All items')
              }}
              className="mt-3 text-sm font-semibold text-[#16284c] underline decoration-[#ffb547] decoration-2 underline-offset-4"
            >
              Reset preview filters
            </button>
          </div>
        )}
      </section>

      {/* Bottom Unlock Strip */}
      {!isAuthenticated && (
        <section className="mx-auto max-w-[1320px] px-5 pb-14 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#efe8da] px-6 py-6 text-[#16284c] sm:flex-row sm:items-center sm:px-8">
            <div>
              <h2 className="text-lg font-bold">Ready to trade on campus?</h2>
              <p className="mt-1 text-sm text-[#525d76]">
                Full marketplace listings, direct campus chat, and posting require a verified Tatak.Swap account.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link
                href="/auth?next=/marketplace"
                className="rounded-xl border border-[#16284c]/25 bg-white px-5 py-2.5 text-sm font-semibold text-[#16284c] transition hover:border-[#16284c]"
              >
                Log in
              </Link>
              <Link
                href="/auth?mode=signup&next=/marketplace"
                className="rounded-xl bg-[#16284c] px-5 py-2.5 text-sm font-semibold text-[#ffb547] transition hover:bg-[#0f1c37]"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Auth Prompt Modal for Preview Interactions */}
      {isGateOpen && !isAuthenticated && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-gate-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1c37]/65 p-4"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 text-[#16284c] shadow-2xl sm:p-7">
            <button
              type="button"
              aria-label="Close modal"
              onClick={closeGate}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[#64748b] transition hover:bg-[#eef2f6] hover:text-[#16284c]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#16284c] text-[#ffb547]">
              <Lock className="h-5 w-5" />
            </div>

            <h2 id="preview-gate-title" className="mt-4 text-xl font-bold">
              Sign in to continue
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#525d76]">
              Log in or create a Tatak.Swap account to {gateActionLabel}.
            </p>

            {selectedListing && (
              <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[#16284c]">{selectedListing.title}</span>
                  <span className="text-sm font-bold text-[#16284c]">
                    {formatPrice(selectedListing.price)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#64748b]">
                  {selectedListing.category} · {selectedListing.condition} · {selectedListing.location}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              <Link
                href="/auth?next=/marketplace"
                className="inline-flex items-center justify-center rounded-xl bg-[#16284c] px-4 py-2.5 text-sm font-semibold text-[#ffb547] transition hover:bg-[#0f1c37]"
              >
                Log in
              </Link>
              <Link
                href="/auth?mode=signup&next=/marketplace"
                className="inline-flex items-center justify-center rounded-xl border border-[#16284c]/25 bg-white px-4 py-2.5 text-sm font-semibold text-[#16284c] transition hover:border-[#16284c]"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
