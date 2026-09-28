'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { categories, formatPrice, listings } from '@/lib/mock-data'

export default function Marketplace() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All items')
  const [saved, setSaved] = useState<string[]>([])

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim()
    return listings.filter((listing) => {
      const matchesCategory = category === 'All items' || listing.category === category
      const matchesQuery = !normalizedQuery || `${listing.title} ${listing.description} ${listing.category}`.toLowerCase().includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })
  }, [category, query])

  function toggleSaved(id: string) {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f6f9]">
      <nav className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/marketplace" className="flex items-center gap-3 text-[#002855]">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fdb813] text-sm font-black text-[#002855]">TS</span>
          <span className="text-xl font-black tracking-[-0.06em]">Tatak<span className="text-[#fdb813]">.</span>Swap</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-semibold text-[#556070] md:flex">
          <a href="#browse" className="text-[#0f172a]">Browse</a>
          <a href="#how-it-works">How it works</a>
          <Link href="/account">My account</Link>
        </div>
        <Link href="/listings/new" className="rounded-full bg-[#002855] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#001d3d]">Sell an item <span className="ml-1">↗</span></Link>
      </nav>

      <section className="mx-auto max-w-[1320px] px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
        <div className="grid items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="fade-up">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.22em] text-[#fdb813]">The campus marketplace</p>
            <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-[-0.07em] text-[#002855] sm:text-7xl">Good finds.<br /><span className="text-[#fdb813]">Good people.</span></h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#556070]">A better way to buy, sell, and share useful things with the USTP community.</p>
          </div>
          <div className="paper-grid relative min-h-[230px] overflow-hidden rounded-[28px] bg-[#002855] p-7 text-white sm:p-10 shadow-lg">
            <div className="absolute -right-8 -top-14 h-44 w-44 rounded-full border-[28px] border-[#fdb813]/30" />
            <p className="relative max-w-xs text-3xl font-black leading-tight tracking-[-0.05em]">Your next favorite thing is already on campus.</p>
            <p className="relative mt-10 text-sm text-[#b0c4de]">Browse student listings, verified by the community.</p>
          </div>
        </div>
      </section>

      <section id="browse" className="border-y border-[#d2dce6] bg-white/60">
        <div className="mx-auto max-w-[1320px] px-5 py-7 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <span className="pointer-events-none absolute left-4 top-3.5 text-lg text-[#556070]">⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the marketplace" className="w-full rounded-full border border-[#d2dce6] bg-white px-11 py-3 text-sm outline-none transition placeholder:text-[#8896a6] focus:border-[#002855]" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${category === item ? 'bg-[#002855] text-white shadow-sm' : 'bg-[#e6edf5] text-[#556070] hover:bg-[#d2dce6]'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div><p className="text-sm font-bold text-[#fdb813]">Fresh on campus</p><h2 className="mt-1 text-3xl font-black tracking-[-0.06em] text-[#002855]">Explore listings</h2></div>
          <span className="text-sm text-[#556070]">{filteredListings.length} items</span>
        </div>
        {filteredListings.length ? <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing, index) => <article key={listing.id} className="fade-up group" style={{ animationDelay: `${index * 70}ms` }}>
            <div className="relative aspect-[1.12] overflow-hidden rounded-[20px] shadow-sm" style={{ backgroundColor: listing.accent }}>
              <button aria-label={saved.includes(listing.id) ? 'Remove from saved items' : 'Save item'} onClick={() => toggleSaved(listing.id)} className={`absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-lg shadow-sm transition ${saved.includes(listing.id) ? 'bg-[#fdb813] text-[#002855]' : 'bg-white/90 text-[#002855] hover:bg-[#fdb813]'}`}>{saved.includes(listing.id) ? '♥' : '♡'}</button>
              <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#002855] shadow-sm">{listing.category}</span>
            </div>
            <Link href={`/listings/${listing.id}`} className="mt-4 block">
              <div className="flex items-start justify-between gap-3"><h3 className="text-lg font-black tracking-[-0.03em] text-[#0f172a] group-hover:text-[#fdb813]">{listing.title}</h3><span className="whitespace-nowrap text-base font-black text-[#002855]">{formatPrice(listing.price)}</span></div>
              <p className="mt-2 text-sm text-[#556070]">{listing.condition} · {listing.location}</p>
            </Link>
          </article>)}
        </div> : <div className="rounded-3xl border border-dashed border-[#d2dce6] py-20 text-center"><p className="font-black text-[#002855]">No listings match that search.</p><button onClick={() => { setQuery(''); setCategory('All items') }} className="mt-3 text-sm font-bold text-[#fdb813]">Clear filters</button></div>}
      </section>

      <section id="how-it-works" className="bg-[#f4f6f9] px-5 py-16 sm:px-8 shadow-inner"><div className="mx-auto max-w-[1320px]"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#002855]">Simple by design</p><div className="mt-8 grid gap-8 md:grid-cols-3"><div><span className="text-5xl font-black text-[#002855]/25">01</span><h3 className="mt-4 text-xl font-black text-[#002855]">Find your thing</h3><p className="mt-2 max-w-xs text-sm leading-6 text-[#1a385c]">Search through useful finds from people around campus.</p></div><div><span className="text-5xl font-black text-[#002855]/25">02</span><h3 className="mt-4 text-xl font-black text-[#002855]">Meet locally</h3><p className="mt-2 max-w-xs text-sm leading-6 text-[#1a385c]">Message the seller and arrange a convenient campus pickup.</p></div><div><span className="text-5xl font-black text-[#002855]/25">03</span><h3 className="mt-4 text-xl font-black text-[#002855]">Pass it on</h3><p className="mt-2 max-w-xs text-sm leading-6 text-[#1a385c]">Have something useful? List it in less than a minute.</p></div></div></div></section>
      <footer className="mx-auto flex max-w-[1320px] flex-col gap-3 px-5 py-8 text-sm text-[#fdb813] sm:flex-row sm:items-center sm:justify-between sm:px-8"><span className="font-black text-[#002855]">Tatak Swap</span><span>Made for the USTP community · Cagayan de Oro</span></footer>
    </main>
  )
}