import routes from "@/constants/urls";
import { apiClient } from "@/lib/api/apiClient";
import type { ChatGroup } from "@/types/chat.types";

const url = routes.api.groups.toString();

export function getGroups() {
	return apiClient<ChatGroup[]>(url, { method: "GET" });
}

export function createGroup(input: {
	name: string;
	description: string;
	icon: string;
	memberIds: string[];
}) {
	return apiClient<{ id: string }>(url, { method: "POST", payload: input });
}

export function updateGroup(
	groupId: string,
	input: {
		name?: string;
		description?: string;
		icon?: string;
		memberIds?: string[];
		adminIds?: string[];
	},
) {
	return apiClient<void>(`${url}/${encodeURIComponent(groupId)}`, {
		method: "PATCH",
		payload: input,
	});
}

export function deleteGroup(groupId: string) {
	return apiClient<void>(`${url}/${encodeURIComponent(groupId)}`, {
		method: "DELETE",
	});
}
