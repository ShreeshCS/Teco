export interface FriendUser {
	id: string;
	name: string;
	email: string;
	createdAt: string;
}

export interface FriendRequestItem {
	id: string;
	senderId: string;
	recipientId: string;
	senderName?: string;
	senderEmail?: string;
	status: "PENDING" | "ACCEPTED";
	createdAt: string;
}
