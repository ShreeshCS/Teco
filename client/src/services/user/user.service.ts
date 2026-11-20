import routes from "../../constants/urls";
import { apiClient } from "../../lib/api/apiClient";
import type { SafeUserDetails } from "../../types/auth.types";
import type { FriendUser } from "../../types/friend.types";

export const verifyMe = async () => {
	const verifyMeUrl = routes.api.user.me;
	return await apiClient<SafeUserDetails>(verifyMeUrl, {
		method: "GET",
	});
};

export const getAllUsers = async () => {
	return apiClient<FriendUser[]>("/api/user/details", { method: "GET" });
};
