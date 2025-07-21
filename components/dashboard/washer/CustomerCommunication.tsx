'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  Send,
  Search,
  Phone,
  Clock,
  User,
  Package
} from 'lucide-react'

interface Message {
  id: string
  booking_id: string
  sender_id: string
  recipient_id: string
  content: string
  message_type: 'text' | 'image' | 'system'
  is_read: boolean
  created_at: string
  sender: {
    full_name: string
    avatar_url?: string
  }
}

interface Conversation {
  booking_id: string
  customer: {
    id: string
    full_name: string
    avatar_url?: string
  }
  booking: {
    service_type: string
    status: string
    requested_date: string
  }
  last_message: Message
  unread_count: number
  messages: Message[]
}

interface CustomerCommunicationProps {
  washerId: string
}

export function CustomerCommunication({ washerId }: CustomerCommunicationProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [washerId])

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/washer/conversations?washerId=${washerId}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/washer/messages?bookingId=${bookingId}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(prev => prev.map(conv => 
          conv.booking_id === bookingId 
            ? { ...conv, messages: data.messages, unread_count: 0 }
            : conv
        ))
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/washer/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedConversation,
          content: newMessage.trim(),
          washerId
        })
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages(selectedConversation)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleConversationSelect = (bookingId: string) => {
    setSelectedConversation(bookingId)
    fetchMessages(bookingId)
  }

  const filteredConversations = conversations.filter(conv =>
    conv.customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.booking.service_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedConv = conversations.find(conv => conv.booking_id === selectedConversation)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Customer Communication</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Conversations</span>
            {conversations.reduce((total, conv) => total + conv.unread_count, 0) > 0 && (
              <Badge variant="destructive">
                {conversations.reduce((total, conv) => total + conv.unread_count, 0)}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Messages from your customers
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No conversations yet</p>
                <p className="text-sm">Messages will appear here when customers contact you</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.booking_id}
                  onClick={() => handleConversationSelect(conversation.booking_id)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation === conversation.booking_id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conversation.customer.avatar_url} />
                      <AvatarFallback>
                        {conversation.customer.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">
                          {conversation.customer.full_name}
                        </p>
                        <div className="flex items-center space-x-1">
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs px-1">
                              {conversation.unread_count}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.last_message.created_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {conversation.booking.service_type} • {conversation.booking.status}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="lg:col-span-2">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConv.customer.avatar_url} />
                    <AvatarFallback>
                      {selectedConv.customer.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedConv.customer.full_name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedConv.booking.service_type} • {selectedConv.booking.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {new Date(selectedConv.booking.requested_date).toLocaleDateString()}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0">
              <div className="h-80 overflow-y-auto p-4 space-y-4">
                {selectedConv.messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === washerId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === washerId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === washerId ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    className="flex-1 min-h-[40px] max-h-32 resize-none"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Select a conversation to start messaging</p>
              <p className="text-sm">Choose a customer from the list to view your conversation</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}