// In-app messaging service for real-time communication

import { createSupabaseServerClient } from '@/utils/supabase/server'
import { webSocketManager } from './websocket-manager'
import { PlatformEvent } from './types'

export interface Message {
  id: string
  bookingId: string
  senderId: string
  recipientId: string
  content: string
  messageType: 'text' | 'image' | 'system'
  attachments?: string[]
  isRead: boolean
  readAt?: string
  createdAt: string
}

export interface MessageThread {
  bookingId: string
  participants: {
    customerId: string
    washerId: string
    customerName: string
    washerName: string
  }
  lastMessage?: Message
  unreadCount: number
  messages: Message[]
}

export class MessagingService {
  /**
   * Send a message between customer and washer
   */
  async sendMessage(
    bookingId: string,
    senderId: string,
    recipientId: string,
    content: string,
    messageType: 'text' | 'image' = 'text',
    attachments: string[] = []
  ): Promise<Message | null> {
    const supabase = createClient()

    // Validate that sender is part of the booking
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_profiles!inner(user_id),
        washer_profiles!inner(user_id)
      `)
      .eq('id', bookingId)
      .single()

    if (!booking) {
      throw new Error('Booking not found')
    }

    const isCustomer = booking.customer_profiles.user_id === senderId
    const isWasher = booking.washer_profiles.user_id === senderId
    
    if (!isCustomer && !isWasher) {
      throw new Error('Sender is not authorized for this booking')
    }

    // Insert message into database
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: senderId,
        recipient_id: recipientId,
        content,
        message_type: messageType,
        attachments: attachments.length > 0 ? attachments : null
      })
      .select(`
        *,
        sender:profiles!sender_id(full_name, avatar_url),
        recipient:profiles!recipient_id(full_name, avatar_url)
      `)
      .single()

    if (error || !message) {
      console.error('Failed to send message:', error)
      return null
    }

    // Create real-time event
    const messageEvent: PlatformEvent = {
      type: 'message_received',
      messageId: message.id,
      bookingId: bookingId.toString(),
      senderId,
      recipientId,
      content,
      messageType,
      timestamp: message.created_at
    }

    // Send real-time notification to recipient
    await webSocketManager.broadcastToUser(recipientId, messageEvent)

    // Create push notification for recipient if they're offline
    if (!webSocketManager.isUserOnline(recipientId)) {
      await this.createMessageNotification(recipientId, message, booking)
    }

    return {
      id: message.id,
      bookingId: message.booking_id.toString(),
      senderId: message.sender_id,
      recipientId: message.recipient_id,
      content: message.content,
      messageType: message.message_type as 'text' | 'image' | 'system',
      attachments: message.attachments || [],
      isRead: message.is_read,
      readAt: message.read_at,
      createdAt: message.created_at
    }
  }

  /**
   * Send system message (automated messages)
   */
  async sendSystemMessage(
    bookingId: string,
    recipientId: string,
    content: string,
    data?: Record<string, any>
  ): Promise<void> {
    const supabase = createClient()

    // Insert system message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: null, // System messages have no sender
        recipient_id: recipientId,
        content,
        message_type: 'system',
        attachments: data ? [JSON.stringify(data)] : null
      })
      .select()
      .single()

    if (error || !message) {
      console.error('Failed to send system message:', error)
      return
    }

    // Send real-time notification
    const systemEvent: PlatformEvent = {
      type: 'message_received',
      messageId: message.id,
      bookingId: bookingId.toString(),
      senderId: 'system',
      recipientId,
      content,
      messageType: 'system',
      timestamp: message.created_at
    }

    await webSocketManager.broadcastToUser(recipientId, systemEvent)
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('recipient_id', userId)

    if (error) {
      console.error('Failed to mark message as read:', error)
    }
  }

  /**
   * Mark all messages in a thread as read
   */
  async markThreadAsRead(bookingId: string, userId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('booking_id', bookingId)
      .eq('recipient_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('Failed to mark thread as read:', error)
    }
  }

  /**
   * Get message thread for a booking
   */
  async getMessageThread(bookingId: string, userId: string): Promise<MessageThread | null> {
    const supabase = createClient()

    // Get booking participants
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_profiles!inner(
          user_id,
          profiles!inner(full_name, avatar_url)
        ),
        washer_profiles!inner(
          user_id,
          profiles!inner(full_name, avatar_url)
        )
      `)
      .eq('id', bookingId)
      .single()

    if (!booking) return null

    // Verify user is part of this booking
    const isCustomer = booking.customer_profiles.user_id === userId
    const isWasher = booking.washer_profiles.user_id === userId
    
    if (!isCustomer && !isWasher) {
      throw new Error('User is not authorized to view this thread')
    }

    // Get messages
    const { data: messages } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(full_name, avatar_url)
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    const messageList: Message[] = (messages || []).map(msg => ({
      id: msg.id,
      bookingId: msg.booking_id.toString(),
      senderId: msg.sender_id || 'system',
      recipientId: msg.recipient_id,
      content: msg.content,
      messageType: msg.message_type as 'text' | 'image' | 'system',
      attachments: msg.attachments || [],
      isRead: msg.is_read,
      readAt: msg.read_at,
      createdAt: msg.created_at
    }))

    // Count unread messages for current user
    const unreadCount = messageList.filter(msg => 
      msg.recipientId === userId && !msg.isRead
    ).length

    const lastMessage = messageList[messageList.length - 1]

    return {
      bookingId: bookingId.toString(),
      participants: {
        customerId: booking.customer_profiles.user_id,
        washerId: booking.washer_profiles.user_id,
        customerName: booking.customer_profiles.profiles.full_name,
        washerName: booking.washer_profiles.profiles.full_name
      },
      lastMessage,
      unreadCount,
      messages: messageList
    }
  }

  /**
   * Get all message threads for a user
   */
  async getUserMessageThreads(userId: string): Promise<MessageThread[]> {
    const supabase = createClient()

    // Get user's bookings with messages
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        service_type,
        customer_profiles!inner(
          user_id,
          profiles!inner(full_name, avatar_url)
        ),
        washer_profiles!inner(
          user_id,
          profiles!inner(full_name, avatar_url)
        ),
        messages(
          id,
          sender_id,
          recipient_id,
          content,
          message_type,
          is_read,
          created_at
        )
      `)
      .or(`customer_profiles.user_id.eq.${userId},washer_profiles.user_id.eq.${userId}`)
      .not('messages', 'is', null)
      .order('created_at', { ascending: false })

    if (!bookings) return []

    const threads: MessageThread[] = []

    for (const booking of bookings) {
      if (!booking.messages || booking.messages.length === 0) continue

      const messages = booking.messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      const lastMessage = messages[messages.length - 1]
      const unreadCount = messages.filter(msg => 
        msg.recipient_id === userId && !msg.is_read
      ).length

      threads.push({
        bookingId: booking.id.toString(),
        participants: {
          customerId: booking.customer_profiles.user_id,
          washerId: booking.washer_profiles.user_id,
          customerName: booking.customer_profiles.profiles.full_name,
          washerName: booking.washer_profiles.profiles.full_name
        },
        lastMessage: {
          id: lastMessage.id,
          bookingId: booking.id.toString(),
          senderId: lastMessage.sender_id || 'system',
          recipientId: lastMessage.recipient_id,
          content: lastMessage.content,
          messageType: lastMessage.message_type as 'text' | 'image' | 'system',
          attachments: [],
          isRead: lastMessage.is_read,
          readAt: null,
          createdAt: lastMessage.created_at
        },
        unreadCount,
        messages: []
      })
    }

    return threads.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
      return bTime - aTime
    })
  }

  /**
   * Get unread message count for user
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    const supabase = createClient()

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)

    return count || 0
  }

  /**
   * Send automated booking status messages
   */
  async sendBookingStatusMessage(
    bookingId: string,
    status: string,
    customerId: string,
    washerId: string
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      assigned: 'A washer has been assigned to your booking. They will contact you shortly.',
      confirmed: 'Your booking has been confirmed. The washer will arrive at the scheduled time.',
      in_progress: 'Your laundry service has started.',
      pickup_complete: 'Your items have been picked up and are being processed.',
      washing: 'Your items are currently being washed.',
      ready_for_delivery: 'Your items are clean and ready for delivery.',
      out_for_delivery: 'Your items are on the way back to you.',
      completed: 'Your laundry service has been completed. Thank you for using our service!'
    }

    const message = statusMessages[status]
    if (!message) return

    // Send to customer
    await this.sendSystemMessage(bookingId, customerId, message)

    // Send different message to washer for some statuses
    const washerMessages: Record<string, string> = {
      confirmed: 'Booking confirmed. Please arrive at the scheduled time.',
      completed: 'Great job! The booking has been marked as completed.'
    }

    const washerMessage = washerMessages[status]
    if (washerMessage) {
      await this.sendSystemMessage(bookingId, washerId, washerMessage)
    }
  }

  /**
   * Upload message attachment
   */
  async uploadMessageAttachment(
    file: File,
    bookingId: string,
    userId: string
  ): Promise<string | null> {
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${bookingId}/${userId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('message-attachments')
      .upload(fileName, file)

    if (error) {
      console.error('Failed to upload attachment:', error)
      return null
    }

    const { data: publicUrl } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(data.path)

    return publicUrl.publicUrl
  }

  /**
   * Private helper methods
   */
  private async createMessageNotification(
    recipientId: string,
    message: any,
    booking: any
  ): Promise<void> {
    const supabase = createClient()

    const senderName = message.sender?.full_name || 'System'
    const serviceType = booking.service_type || 'laundry service'

    await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'message',
        title: `New message from ${senderName}`,
        body: message.content.length > 50 
          ? `${message.content.substring(0, 50)}...` 
          : message.content,
        data: {
          bookingId: booking.id,
          messageId: message.id,
          senderId: message.sender_id,
          serviceType
        },
        channels: ['push'],
        status: 'pending'
      })
  }
}

export const messagingService = new MessagingService()