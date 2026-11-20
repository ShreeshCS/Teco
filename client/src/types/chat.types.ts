export type ConversationResultResponse = {
  id: string
  createdAt: string
  updatedAt: string
  conversationParticipants: Array<{
    user: {
      id: string
      name: string
    }
  }>
  messages: Array<{
    id: string
    content: string
    createdAt: string
  }>
}

export type ChatMessage = {
  id: string
  content: string
  createdAt: string
  createdById: string
  createdBy: {
    id: string
    name: string
  }
}

export type Conversation = {
  id: string
  messagePreview: string
  withUserId: string
  withUserName: string
}
