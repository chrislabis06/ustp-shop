import { notFound, redirect } from 'next/navigation'
import ChatRoom from './chat-room'
import { hasSupabaseConfiguration } from '@/lib/marketplace-data'
import { createClient } from '@/lib/supabase/server'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const conversationId = Number(id)
  if (!Number.isSafeInteger(conversationId) || conversationId < 1) notFound()
  if (!hasSupabaseConfiguration()) redirect('/auth')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth?next=${encodeURIComponent(`/messages/${id}`)}`)

  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id,listing_id,buyer_id,seller_id')
    .eq('id', conversationId)
    .maybeSingle()
  if (error || !conversation) notFound()

  const otherUserId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id
  const [{ data: messages, error: messagesError }, { data: profile }, { data: listing }] = await Promise.all([
    supabase.from('messages').select('id,body,sender_id,created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(100),
    supabase.from('profiles').select('full_name').eq('id', otherUserId).maybeSingle(),
    supabase.from('listings').select('title').eq('id', conversation.listing_id).maybeSingle(),
  ])
  if (messagesError) throw new Error(`Could not load messages: ${messagesError.message}`)

  return <ChatRoom conversationId={String(conversationId)} currentUserId={user.id} otherName={profile?.full_name || 'USTP student'} listingTitle={listing?.title || 'Campus listing'} initialMessages={messages || []} />
}