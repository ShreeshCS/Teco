import routes from "@/constants/urls";
import { apiClient } from "@/lib/api/apiClient";
import type {
	ChatMessage,
	Conversation,
	ConversationResultResponse,
} from "@/types/chat.types";

const url = routes.api.conversations.toString();
export async function getConversationList() {
	const response = await apiClient<ConversationResultResponse[]>(url, {
		method: "GET",
	});

	const conversations: Conversation[] = response.flatMap((res) => {
		return res.conversationParticipants.map((cp) => {
			return {
				id: res.id,
				messagePreview: res.messages?.[0]?.content ?? "",
				withUserId: cp.user.id,
				withUserName: cp.user.name,
			};
		});
	});

	return conversations;
}

export async function createConversation(friendId: string): Promise<{ id: string }> {
	return apiClient<{ id: string }>(url, {
		method: "POST",
		payload: { friendId },
	});
}

export async function getConversationMessages(
	conversationId: string,
): Promise<ChatMessage[]> {
	return apiClient<ChatMessage[]>(
		`${url}/${encodeURIComponent(conversationId)}/messages`,
		{ method: "GET" },
	);
}
