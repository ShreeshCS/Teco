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

export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

export type GroupMember = {
	userId: string;
	role: GroupRole;
	user: {
		id: string;
		name: string;
		email: string;
	};
};

export type ChatGroup = {
	id: string;
	name: string | null;
	description: string | null;
	icon: string | null;
	groupKey: string | null;
	ownerId: string | null;
	updatedAt: string;
	conversationParticipants: GroupMember[];
	messages: Array<{ content: string; createdAt: string }>;
};
