'use client'

import Link from 'next/link'
import { useState } from 'react'
import { categories } from '@/lib/mock-data'

export default function NewListingPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <main className="min-h-screen bg-[#f4f6f9] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-[820px]"><nav className="flex items-center justify-between"><Link href="/" className="text-xl font-black tracking-[-0.06em] text-[#002855]">Tatak Swap</Link><Link href="/" className="text-sm font-bold text-[#556070]">Cancel</Link></nav>
        <div className="mt-14"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#fdb813]">Share something useful</p><h1 className="mt-3 text-5xl font-black tracking-[-0.07em] text-[#002855]">Post an item.</h1><p className="mt-4 text-[#556070]">Give your pre-loved things a second life around campus.</p></div>
        {submitted ? <div className="mt-10 rounded-[28px] bg-[#fdb813] p-8"><p className="text-3xl font-black tracking-[-0.05em] text-[#002855]">Your listing is ready to go.</p><p className="mt-3 text-[#1a385c]">This frontend preview does not save to a database yet, but the listing flow is ready to connect.</p><Link href="/" className="mt-6 inline-block rounded-full bg-[#002855] px-5 py-3 text-sm font-bold text-white">Back to marketplace</Link></div> : <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }} className="mt-10 space-y-7 rounded-[28px] border border-[#d2dce6] bg-white p-6 shadow-sm sm:p-10"><div className="grid gap-7 sm:grid-cols-2"><label className="sm:col-span-2"><span className="label">Item title</span><input required placeholder="e.g. USTP college uniform" className="field" /></label><label><span className="label">Category</span><select className="field" defaultValue="Uniforms">{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></label><label><span className="label">Price</span><input required type="number" min="0" placeholder="₱ 0" className="field" /></label><label><span className="label">Condition</span><select className="field"><option>Like new</option><option>Good</option><option>Fair</option></select></label><label><span className="label">Meetup location</span><input required placeholder="e.g. Main Campus" className="field" /></label><label className="sm:col-span-2"><span className="label">Description</span><textarea required rows={5} placeholder="Tell buyers what they should know..." className="field resize-none" /></label><label className="sm:col-span-2"><span className="label">Photo</span><div className="flex h-28 items-center justify-center rounded-2xl border-2 border-dashed border-[#b0c4de] bg-[#f8fafc] text-sm text-[#556070]">Photo upload will be connected later</div></label></div><button className="w-full rounded-full bg-[#002855] px-6 py-4 font-bold text-white transition hover:bg-[#001d3d]">Preview listing <span className="ml-2">↗</span></button></form>}
      </div>
    </main>
  )
}
