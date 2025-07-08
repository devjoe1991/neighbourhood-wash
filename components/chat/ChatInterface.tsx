'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, MessageCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Message {
  id: number
  created_at: string
  booking_id: number
  sender_id: string
  content: string
  sender_profile?: {
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

interface ChatInterfaceProps {
  bookingId: number
  currentUserId: string
}

export default function ChatInterface({
  bookingId,
  currentUserId,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('messages')
          .select(
            `
            *,
            sender_profile:profiles!messages_sender_id_fkey(
              first_name,
              last_name,
              avatar_url
            )
          `
          )
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error fetching messages:', error)
          setError('Failed to load messages')
          return
        }

        setMessages(data || [])
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Failed to load messages')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [supabase, bookingId])

  // Subscribe to real-time message updates
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        async (payload) => {
          // Fetch the sender profile for the new message
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single()

          const newMessage: Message = {
            ...(payload.new as Message),
            sender_profile: profileData || undefined,
          }

          setMessages((currentMessages) => [...currentMessages, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, bookingId])

  // Send message function
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || isSending) return

    try {
      setIsSending(true)
      setError(null)

      const { error } = await supabase.from('messages').insert({
        booking_id: bookingId,
        sender_id: currentUserId,
        content: newMessage.trim(),
      })

      if (error) {
        console.error('Error sending message:', error)
        setError('Failed to send message')
        return
      }

      setNewMessage('')
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )

    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else {
      return date.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2'>
          <MessageCircle className='h-5 w-5 text-blue-600' />
          Chat
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Messages Display Area */}
        <div className='h-96 overflow-y-auto rounded-lg border bg-gray-50 p-4 dark:bg-gray-900'>
          {isLoading ? (
            <div className='flex h-full items-center justify-center'>
              <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
              <span className='ml-2 text-gray-600'>Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className='flex h-full items-center justify-center text-gray-500'>
              <div className='text-center'>
                <MessageCircle className='mx-auto mb-2 h-12 w-12 text-gray-400' />
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              {messages.map((message) => {
                const isCurrentUser = message.sender_id === currentUserId
                const senderName = message.sender_profile
                  ? `${message.sender_profile.first_name} ${message.sender_profile.last_name}`
                  : 'Unknown User'
                const initials = message.sender_profile
                  ? `${message.sender_profile.first_name?.[0] || ''}${message.sender_profile.last_name?.[0] || ''}`
                  : 'U'

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex max-w-xs items-start gap-2 lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar className='h-8 w-8 flex-shrink-0'>
                        <AvatarImage
                          src={message.sender_profile?.avatar_url}
                          alt={senderName}
                        />
                        <AvatarFallback className='text-xs'>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`space-y-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}
                      >
                        <div
                          className={`inline-block rounded-lg px-3 py-2 ${
                            isCurrentUser
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                          }`}
                        >
                          <p className='text-sm break-words'>
                            {message.content}
                          </p>
                        </div>
                        <p className='text-xs text-gray-500'>
                          {!isCurrentUser && `${senderName} • `}
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Message Input Form */}
        <form onSubmit={sendMessage} className='flex gap-2'>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder='Type your message...'
            disabled={isSending}
            className='flex-1'
            maxLength={500}
          />
          <Button
            type='submit'
            disabled={!newMessage.trim() || isSending}
            size='icon'
          >
            {isSending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Send className='h-4 w-4' />
            )}
          </Button>
        </form>

        {/* Character count */}
        <div className='text-right text-xs text-gray-500'>
          {newMessage.length}/500
        </div>
      </CardContent>
    </Card>
  )
}
