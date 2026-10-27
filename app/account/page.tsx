import Link from 'next/link'
import { redirect } from 'next/navigation'
import { archiveListing, signOut } from '@/app/actions'
import { formatPrice } from '@/lib/mock-data'
import { hasSupabaseConfiguration } from '@/lib/marketplace-data'
import { createClient } from '@/lib/supabase/server'

export default async function AccountPage() {
  if (!hasSupabaseConfiguration()) redirect('/auth')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/account')

  const [{ data: profile }, { data: listings, error: listingsError }, { count: savedCount, error: favoritesError }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('listings').select('id,title,price,status,created_at').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('favorites').select('listing_id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])
  if (listingsError) throw new Error(`Could not load your listings: ${listingsError.message}`)
  if (favoritesError) throw new Error(`Could not load your saved items: ${favoritesError.message}`)
  const fullName: string = profile?.full_name || user.email || 'USTP member'
  const initials = fullName.split(/[\s@]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('')

  return (
    <main className="min-h-screen bg-[#f4f6f9] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-[1100px]">
        <nav className="flex items-center justify-between">
          <Link href="/marketplace" className="text-xl font-black tracking-[-0.06em] text-[#002855]">Tatak Swap</Link>
          <div className="flex items-center gap-4"><Link href="/messages" className="text-sm font-bold text-[#556070]">Messages</Link><Link href="/marketplace" className="text-sm font-bold text-[#556070]">Browse</Link><form action={signOut}><button className="text-sm font-bold text-[#556070]">Sign out</button></form></div>
        </nav>
        <div className="mt-14 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="h-fit rounded-[24px] bg-[#002855] p-8 text-white sm:p-10">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#fdb813] font-black text-[#002855]">{initials}</div>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#fdb813]">Your account</p>
            <h1 className="mt-3 break-words text-3xl font-black tracking-[-0.05em]">{profile?.full_name || 'Welcome'}</h1>
            <p className="mt-2 break-all text-sm text-[#b0c4de]">{user.email}</p>
            <p className="mt-5 leading-7 text-[#b0c4de]">Your listings and saved finds are connected to this account.</p>
          </section>
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-sm font-bold text-[#fdb813]">Overview</p><h2 className="mt-1 text-3xl font-black tracking-[-0.06em] text-[#002855]">Your activity</h2></div>
              <Link href="/listings/new" className="rounded-full bg-[#002855] px-4 py-2.5 text-sm font-bold text-white">New listing</Link>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#d2dce6] bg-white p-6"><p className="text-sm text-[#556070]">Your listings</p><p className="mt-3 text-4xl font-black text-[#002855]">{listings.length}</p></div>
              <Link href="/marketplace" className="rounded-xl border border-[#d2dce6] bg-white p-6"><p className="text-sm text-[#556070]">Saved items</p><p className="mt-3 text-4xl font-black text-[#002855]">{savedCount || 0}</p></Link>
            </div>
            <div className="mt-8 flex items-end justify-between"><h2 className="text-xl font-black text-[#002855]">Your listings</h2><span className="text-sm text-[#556070]">{listings.filter((listing) => listing.status === 'active').length} active</span></div>
            {listings.length ? <ul className="mt-4 divide-y divide-[#d2dce6] border-y border-[#d2dce6]">{listings.map((listing) => <li key={listing.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><Link href={`/listings/${listing.id}`} className="font-bold text-[#002855] hover:underline">{listing.title}</Link><p className="mt-1 text-xs capitalize text-[#556070]">{listing.status}</p></div><div className="flex shrink-0 items-center gap-4"><span className="font-bold text-[#002855]">{formatPrice(Number(listing.price))}</span>{listing.status === 'active' && <form action={archiveListing}><input type="hidden" name="listingId" value={listing.id} /><button className="text-sm font-bold text-red-700 underline underline-offset-2">Archive</button></form>}</div></li>)}</ul> : <div className="mt-4 border-y border-dashed border-[#b0c4de] py-10 text-center"><p className="font-bold text-[#002855]">No listings yet.</p><Link href="/listings/new" className="mt-2 inline-block text-sm font-bold text-[#556070] underline">Post your first item</Link></div>}
          </section>
        </div>
      </div>
    </main>
  )
}