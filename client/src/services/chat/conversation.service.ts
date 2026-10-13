import routes from "@/constants/urls";
import { apiClient } from "@/lib/api/apiClient";
import type {
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
				messagePreview: res.messages[0]?.content,
				withUserId: cp.user.id,
				withUserName: cp.user.name,
			};
		});
	});

	return conversations;
}
