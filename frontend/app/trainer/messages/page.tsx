'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messageApi, trainerApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'

export default function MessagesPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [newMessage, setNewMessage] = useState('')

  const { data: students } = useQuery({
    queryKey: ['trainer', 'students'],
    queryFn: async () => {
      const response = await trainerApi.getStudents()
      return response.data
    },
  })

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', selectedStudent],
    queryFn: async () => {
      const response = await messageApi.getAll()
      return response.data.filter((m: any) =>
        m.sender_id === selectedStudent || m.receiver_id === selectedStudent
      )
    },
    enabled: !!selectedStudent,
  })

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await messageApi.send({
        recipientId: selectedStudent,
        message: content,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Message sent')
      setNewMessage('')
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })

  const handleSend = () => {
    if (!newMessage.trim() || !selectedStudent) return
    sendMutation.mutate(newMessage)
  }

  if (isLoading && selectedStudent) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Communicate with your students
        </p>
      </div>

      <div className="space-y-4">
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger>
            <SelectValue placeholder="Select a student to message" />
          </SelectTrigger>
          <SelectContent>
            {students?.map((student: any) => (
              <SelectItem key={student.id} value={student.profile.id}>
                {student.profile.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedStudent && (
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>
                Conversation with {students?.find((s: any) => s.profile.id === selectedStudent)?.profile.full_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages && messages.length > 0 ? (
                  messages.map((message: any) => {
                    const isMe = message.sender_id === user?.id
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{isMe ? 'T' : 'S'}</AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                          <div
                            className={`rounded-lg px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
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
                    <p className="text-muted-foreground">No messages yet</p>
                  </div>
                )}
              </div>

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
        )}
      </div>
    </div>
  )
}

