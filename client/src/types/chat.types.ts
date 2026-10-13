export type ConversationResultResponse = {
  id: string
  createdAt: Date
  updatedAt: Date
  conversationParticipants: Array<{
    user: {
      id: string
      name: string
    }
  }>
  messages: Array<{
    id: string
    content: string
    createdAt: Date
  }>
}

export type Conversation = {
    id: string,
    messagePreview: string,
    withUserId: string,
    withUserName: string
}
