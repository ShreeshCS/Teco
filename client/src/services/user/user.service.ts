import routes from "../../constants/urls";
import { apiClient } from "../../lib/api/apiClient";
import type { SafeUserDetails } from "../../types/auth.types";

export const pingMe = async (storedToken: string) => {
	const pingMeUrl = routes.api.user.me;
	return await apiClient<SafeUserDetails>(pingMeUrl, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${storedToken}`,
		},
	});
};
