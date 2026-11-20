import routes from "@/constants/urls";
import { apiClient } from "@/lib/api/apiClient";
import type { FriendUser, FriendRequestItem } from "@/types/friend.types";

export async function getFriendsList(): Promise<FriendUser[]> {
	return apiClient<FriendUser[]>(routes.api.friends.toString(), {
		method: "GET",
	});
}

export async function getPendingRequests(): Promise<FriendRequestItem[]> {
	return apiClient<FriendRequestItem[]>(routes.api.friendRequest.pending, {
		method: "GET",
	});
}

export async function sendFriendRequest(receiverId: string): Promise<FriendRequestItem | null> {
	try {
		return await apiClient<FriendRequestItem>(routes.api.friendRequest.send, {
			method: "POST",
			payload: { receiverId },
		});
	} catch (err) {
		console.error("Failed to send friend request:", err);
		throw err;
	}
}

export async function acceptFriendRequest(requestId: string): Promise<unknown> {
	try {
		return await apiClient(routes.api.friendRequest.accept, {
			method: "POST",
			payload: { requestId },
		});
	} catch (err) {
		console.error("Failed to accept friend request:", err);
		throw err;
	}
}

export async function declineFriendRequest(requestId: string): Promise<void> {
	await apiClient<void>(routes.api.friendRequest.decline, {
		method: "POST",
		payload: { requestId },
	});
}
