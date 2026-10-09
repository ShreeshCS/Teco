export type ConversationResult = {
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
}[]
