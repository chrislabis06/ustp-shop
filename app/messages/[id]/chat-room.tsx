'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  body: string
  sender_id: string
  created_at: string
}

export default function ChatRoom({
  conversationId,
  currentUserId,
  otherName,
  listingTitle,
  initialMessages,
}: {
  conversationId: string
  currentUserId: string
  otherName: string
  listingTitle: string
  initialMessages: Message[]
}) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let supabaseClient: ReturnType<typeof createClient> | null = null
    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null

    async function connectToConversation() {
      try {
        supabaseClient = createClient()
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (!active) return
        if (authError || !user || user.id !== currentUserId) {
          router.replace(`/auth?next=${encodeURIComponent(`/messages/${conversationId}`)}`)
          return
        }

        channel = supabaseClient.channel(`conversation-${conversationId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          }, (payload) => {
            const incoming = payload.new as Message
            setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, incoming])
          })
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setError('Live updates are unavailable. You can still try sending a message.')
            }
          })
      } catch {
        if (active) setError('Could not connect to messaging. Please sign in and try again.')
      }
    }

    void connectToConversation()
    return () => {
      active = false
      if (channel && supabaseClient) void supabaseClient.removeChannel(channel)
    }
  }, [conversationId, currentUserId, router])

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const body = String(new FormData(form).get('body') || '').trim()
    if (!body || busy) return
    setBusy(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user || user.id !== currentUserId) {
        router.push(`/auth?next=${encodeURIComponent(`/messages/${conversationId}`)}`)
        return
      }
      const { data, error: sendError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        body,
      }).select('id,body,sender_id,created_at').single()

      if (sendError) {
        setError('Message could not be sent. Please try again.')
      } else {
        setMessages((current) => current.some((message) => message.id === data.id) ? current : [...current, data])
        form.reset()
      }
    } catch {
      setError('Could not connect to messaging. Please sign in and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f4f6f9] px-5 py-6 sm:px-8">
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col">
        <nav className="flex items-center justify-between"><Link href="/marketplace" className="text-xl font-black tracking-[-0.06em] text-[#002855]">Tatak Swap</Link><Link href="/messages" className="text-sm font-bold text-[#556070]">All messages</Link></nav>
        <header className="mt-10 border-b border-[#d2dce6] pb-5"><h1 className="text-2xl font-black text-[#002855]">{otherName}</h1><p className="mt-1 text-sm text-[#556070]">About: {listingTitle}</p></header>
        <ol aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto py-6">
          {messages.length ? messages.map((message) => <li key={message.id} className={`max-w-[85%] rounded-xl px-4 py-3 sm:max-w-[70%] ${message.sender_id === currentUserId ? 'ml-auto bg-[#002855] text-white' : 'mr-auto bg-white text-[#0f172a] shadow-sm'}`}><p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p><time className={`mt-2 block text-right text-[10px] ${message.sender_id === currentUserId ? 'text-white/65' : 'text-[#8896a6]'}`} dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time></li>) : <li className="m-auto text-center text-sm text-[#556070]">Start the conversation about this listing.</li>}
        </ol>
        <form onSubmit={sendMessage} className="border-t border-[#d2dce6] pt-4">
          <div className="flex items-end gap-3"><label className="sr-only" htmlFor="message-body">Write a message</label><textarea id="message-body" name="body" required maxLength={4000} rows={2} placeholder="Write a message" className="min-h-12 flex-1 resize-y rounded-xl border border-[#d2dce6] bg-white px-4 py-3 text-sm outline-none focus:border-[#002855]" /><button disabled={busy} className="rounded-full bg-[#002855] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Sending' : 'Send'}</button></div>
          {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
        </form>
      </div>
    </main>
  )
}