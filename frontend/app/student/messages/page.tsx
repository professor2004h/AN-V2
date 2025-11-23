'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messageApi, studentApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, Send } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function MessagesPage() {
  const queryClient = useQueryClient()
  const [newMessage, setNewMessage] = useState('')

  const { data: student } = useQuery({
    queryKey: ['student', 'me'],
    queryFn: async () => {
      const response = await studentApi.getMe()
      return response.data
    },
  })

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const response = await messageApi.getAll()
      return response.data
    },
  })

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!student?.trainer_id) {
        throw new Error('No trainer assigned')
      }
      const response = await messageApi.send({
        recipientId: student.trainer_id,
        message: content,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Message sent')
      setNewMessage('')
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message')
    },
  })

  const handleSend = () => {
    if (!newMessage.trim()) return
    sendMutation.mutate(newMessage)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!student?.trainer_id) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        <EmptyState
          icon={MessageSquare}
          title="No trainer assigned"
          description="You'll be able to message your trainer once one is assigned to you."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Chat with your trainer
        </p>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>Conversation with {student.trainer?.profile?.full_name || 'Trainer'}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages && messages.length > 0 ? (
              messages.map((message: any) => {
                const isMe = message.sender_id === student.profile.id
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {isMe ? 'Me' : 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${isMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                          }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="resize-none"
              rows={3}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMutation.isPending}
              size="icon"
              className="h-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

