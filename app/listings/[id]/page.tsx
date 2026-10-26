import Link from 'next/link'
import { notFound } from 'next/navigation'
import { startConversation } from '@/app/actions'
import { formatPrice } from '@/lib/mock-data'
import { getMarketplaceListing, hasSupabaseConfiguration } from '@/lib/marketplace-data'
import { createClient } from '@/lib/supabase/server'

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getMarketplaceListing(id)
  if (!listing) notFound()

  const user = hasSupabaseConfiguration()
    ? (await createClient()).auth.getUser().then(({ data }) => data.user)
    : Promise.resolve(null)
  const currentUser = await user
  const isOwner = currentUser?.id === listing.sellerId

  return (
    <main className="min-h-screen bg-[#f4f6f9] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-[1100px]">
        <nav className="flex items-center justify-between"><Link href="/marketplace" className="text-xl font-black tracking-[-0.06em] text-[#002855]">Tatak Swap</Link><Link href="/marketplace" className="text-sm font-bold text-[#556070]">Back to browse</Link></nav>
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div role="img" aria-label={listing.imageUrl ? `Photo of ${listing.title}` : 'No listing photo'} className="aspect-square overflow-hidden rounded-[28px] bg-[#e6edf5] bg-cover bg-center" style={listing.imageUrl ? { backgroundImage: `url("${listing.imageUrl}")` } : undefined} />
          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full bg-[#fdb813] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#002855]">{listing.category}</span>
            <h1 className="mt-5 text-5xl font-black leading-none tracking-[-0.07em] text-[#002855]">{listing.title}</h1>
            <p className="mt-5 text-3xl font-black text-[#002855]">{formatPrice(listing.price)}</p>
            <p className="mt-6 max-w-lg leading-7 text-[#556070]">{listing.description}</p>
            <div className="mt-8 grid grid-cols-2 gap-3 border-y border-[#d2dce6] py-5 text-sm"><div><p className="text-[#8896a6]">Condition</p><p className="mt-1 font-bold text-[#0f172a]">{listing.condition}</p></div><div><p className="text-[#8896a6]">Pickup</p><p className="mt-1 font-bold text-[#0f172a]">{listing.location}</p></div></div>
            <div className="mt-7 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-[#002855] font-black text-[#fdb813]">{listing.seller.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div><div><p className="text-sm text-[#8896a6]">Listed by</p><p className="font-bold text-[#0f172a]">{listing.seller}</p></div></div>
            {isOwner ? <Link href="/account" className="mt-8 w-fit rounded-full border border-[#002855] px-6 py-4 font-bold text-[#002855]">Manage your listing</Link> : <form action={startConversation}><input type="hidden" name="listingId" value={listing.id} /><button className="mt-8 rounded-full bg-[#002855] px-6 py-4 font-bold text-white transition hover:bg-[#001d3d]">Message seller</button></form>}
          </div>
        </div>
      </div>
    </main>
  )
}