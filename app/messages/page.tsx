import Link from 'next/link'
import { redirect } from 'next/navigation'
import { hasSupabaseConfiguration } from '@/lib/marketplace-data'
import { createClient } from '@/lib/supabase/server'

export default async function MessagesPage() {
  if (!hasSupabaseConfiguration()) redirect('/auth')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/messages')

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id,listing_id,buyer_id,seller_id,created_at')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Could not load conversations: ${error.message}`)

  const listingIds = [...new Set(conversations.map((item) => item.listing_id))]
  const otherIds = [...new Set(conversations.map((item) => item.buyer_id === user.id ? item.seller_id : item.buyer_id))]
  const [{ data: listings }, { data: profiles }] = await Promise.all([
    listingIds.length ? supabase.from('listings').select('id,title').in('id', listingIds) : Promise.resolve({ data: [] }),
    otherIds.length ? supabase.from('profiles').select('id,full_name').in('id', otherIds) : Promise.resolve({ data: [] }),
  ])
  const listingTitles = new Map((listings || []).map((item) => [item.id, item.title]))
  const profileNames = new Map((profiles || []).map((profile) => [profile.id, profile.full_name]))

  return (
    <main className="min-h-screen bg-[#f4f6f9] px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-[900px]">
        <nav className="flex items-center justify-between"><Link href="/marketplace" className="text-xl font-black tracking-[-0.06em] text-[#002855]">Tatak Swap</Link><Link href="/account" className="text-sm font-bold text-[#556070]">My account</Link></nav>
        <header className="mt-14"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#fdb813]">Your conversations</p><h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-[#002855]">Messages</h1></header>
        {conversations.length ? <ul className="mt-8 divide-y divide-[#d2dce6] border-y border-[#d2dce6]">{conversations.map((conversation) => {
          const otherId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id
          return <li key={conversation.id}><Link href={`/messages/${conversation.id}`} className="flex items-center justify-between gap-5 py-5 hover:bg-white/60"><div><p className="font-bold text-[#002855]">{profileNames.get(otherId) || 'USTP student'}</p><p className="mt-1 text-sm text-[#556070]">{listingTitles.get(conversation.listing_id) || 'Campus listing'}</p></div><span className="text-sm font-bold text-[#002855]">Open</span></Link></li>
        })}</ul> : <div className="mt-8 border-y border-dashed border-[#b0c4de] py-14 text-center"><p className="font-bold text-[#002855]">No conversations yet.</p><Link href="/marketplace" className="mt-2 inline-block text-sm text-[#556070] underline">Browse listings</Link></div>}
      </div>
    </main>
  )
}