import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { formatPrice } from '@/lib/mock-data'
import { hasSupabaseConfiguration } from '@/lib/marketplace-data'
import { createClient } from '@/lib/supabase/server'

type AdminAccount = {
  user_id: string
  email: string | null
  full_name: string
  created_at: string
}

export default async function AdminPage() {
  if (!hasSupabaseConfiguration()) redirect('/auth')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/admin')

  const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin')
  if (roleError) throw new Error(`Admin access is not configured. Apply the Supabase migration first: ${roleError.message}`)
  if (!isAdmin) notFound()

  const [{ data: accounts, error: accountsError }, { data: listings, error: listingsError }] = await Promise.all([
    supabase.rpc('admin_list_accounts'),
    supabase.from('listings').select('id,title,category,price,status,created_at,owner_id').order('created_at', { ascending: false }),
  ])
  if (accountsError) throw new Error(`Could not load accounts: ${accountsError.message}`)
  if (listingsError) throw new Error(`Could not load listings: ${listingsError.message}`)

  const typedAccounts = accounts as AdminAccount[]
  const accountsById = new Map(typedAccounts.map((account) => [account.user_id, account]))

  return (
    <main className="min-h-screen bg-[#f4f6f9] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-[1200px]">
        <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d2dce6] pb-5">
          <Link href="/marketplace" className="text-xl font-black tracking-[-0.06em] text-[#002855]">Tatak Swap</Link>
          <div className="flex items-center gap-5 text-sm font-bold text-[#556070]">
            <Link href="/marketplace" className="hover:text-[#002855]">Student storefront</Link>
            <Link href="/account" className="hover:text-[#002855]">My account</Link>
          </div>
        </nav>

        <header className="flex flex-wrap items-end justify-between gap-5 py-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c48a00]">Restricted access</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#002855]">Administration</h1>
            <p className="mt-3 text-sm text-[#556070]">Read-only account and listing overview. No user impersonation.</p>
          </div>
          <div className="flex gap-8 text-right">
            <div><p className="text-sm text-[#556070]">Accounts</p><p className="mt-1 text-3xl font-black text-[#002855]">{typedAccounts.length}</p></div>
            <div><p className="text-sm text-[#556070]">Listings</p><p className="mt-1 text-3xl font-black text-[#002855]">{listings.length}</p></div>
          </div>
        </header>

        <section aria-labelledby="accounts-heading" className="border-t-2 border-[#002855] pt-5">
          <h2 id="accounts-heading" className="text-xl font-black text-[#002855]">Student accounts</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-[#d2dce6] text-xs uppercase text-[#556070]"><th className="py-3 pr-5">Name</th><th className="py-3 pr-5">Email</th><th className="py-3">Joined</th></tr></thead>
              <tbody>{typedAccounts.map((account) => <tr key={account.user_id} className="border-b border-[#d2dce6] bg-white/70"><td className="py-3 pr-5 font-semibold text-[#002855]">{account.full_name || 'USTP student'}</td><td className="py-3 pr-5 text-[#38485c]">{account.email || 'No email'}</td><td className="py-3 text-[#556070]">{new Date(account.created_at).toLocaleDateString()}</td></tr>)}</tbody>
            </table>
            {!typedAccounts.length && <p className="py-6 text-sm text-[#556070]">No registered accounts found.</p>}
          </div>
        </section>

        <section aria-labelledby="listings-heading" className="mt-12 border-t-2 border-[#002855] pt-5">
          <h2 id="listings-heading" className="text-xl font-black text-[#002855]">All listings</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-[#d2dce6] text-xs uppercase text-[#556070]"><th className="py-3 pr-5">Item</th><th className="py-3 pr-5">Seller</th><th className="py-3 pr-5">Category</th><th className="py-3 pr-5">Price</th><th className="py-3">Status</th></tr></thead>
              <tbody>{listings.map((listing) => {
                const owner = accountsById.get(listing.owner_id)
                return <tr key={listing.id} className="border-b border-[#d2dce6] bg-white/70"><td className="py-3 pr-5"><Link href={`/listings/${listing.id}`} className="font-semibold text-[#002855] hover:underline">{listing.title}</Link></td><td className="py-3 pr-5 text-[#38485c]">{owner?.email || 'Legacy listing'}</td><td className="py-3 pr-5 text-[#556070]">{listing.category}</td><td className="py-3 pr-5 font-semibold text-[#002855]">{formatPrice(Number(listing.price))}</td><td className="py-3 capitalize text-[#556070]">{listing.status}</td></tr>
              })}</tbody>
            </table>
            {!listings.length && <p className="py-6 text-sm text-[#556070]">No listings found.</p>}
          </div>
        </section>
      </div>
    </main>
  )
}