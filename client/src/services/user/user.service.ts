import routes from "../../constants/urls";
import { apiClient } from "../../lib/api/apiClient";
import type { SafeUserDetails } from "../../types/auth.types";

export const verifyMe = async () => {
	const verifyMeUrl = routes.api.user.me;
	return await apiClient<SafeUserDetails>(verifyMeUrl, {
		method: "GET",
	});
};
