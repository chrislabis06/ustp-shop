'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { hasSupabaseConfiguration } from '@/lib/marketplace-data'
import { createClient } from '@/lib/supabase/server'

export async function startConversation(formData: FormData) {
  const listingId = formData.get('listingId')
  if (!hasSupabaseConfiguration()) redirect('/auth')
  const parsedListingId = typeof listingId === 'string' ? Number(listingId) : NaN
  if (!Number.isSafeInteger(parsedListingId) || parsedListingId < 1) throw new Error('A valid listing is required.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth?next=${encodeURIComponent(`/listings/${listingId}`)}`)

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id,owner_id')
    .eq('id', parsedListingId)
    .eq('status', 'active')
    .single()

  if (listingError || !listing) throw new Error('This listing is no longer available.')
  if (listing.owner_id === user.id) throw new Error('You cannot message yourself about your own listing.')
  if (!listing.owner_id) throw new Error('Messaging is unavailable for this legacy listing until it has an assigned owner.')

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', parsedListingId)
    .eq('buyer_id', user.id)
    .maybeSingle()

  let conversationId = existing?.id
  if (!conversationId) {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({ listing_id: parsedListingId, buyer_id: user.id, seller_id: listing.owner_id })
      .select('id')
      .single()
    if (error) throw new Error(`Could not start conversation: ${error.message}`)
    conversationId = conversation.id
  }

  redirect(`/messages/${conversationId}`)
}

export async function archiveListing(formData: FormData) {
  const listingId = formData.get('listingId')
  const parsedListingId = typeof listingId === 'string' ? Number(listingId) : NaN
  if (!Number.isSafeInteger(parsedListingId) || parsedListingId < 1) throw new Error('A valid listing is required.')
  if (!hasSupabaseConfiguration()) redirect('/auth')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?next=/account')

  const { data, error } = await supabase
    .from('listings')
    .update({ status: 'archived' })
    .eq('id', parsedListingId)
    .eq('owner_id', user.id)
    .eq('status', 'active')
    .select('id')
    .maybeSingle()

  if (error) throw new Error(`Could not archive listing: ${error.message}`)
  if (!data) throw new Error('This listing is no longer active or does not belong to your account.')

  revalidatePath('/account')
  revalidatePath('/marketplace')
  revalidatePath(`/listings/${parsedListingId}`)
}