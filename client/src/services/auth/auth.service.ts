import type {
	LoginResponseDetails,
	LoginUserData,
	RegistrationUserData,
	SafeUserDetails,
} from "../../types/auth.types";
import routes from "../../constants/urls";
import { apiClient } from "../../lib/api/apiClient";

const registerUrl = routes.api.auth.register;
const loginUrl = routes.api.auth.login;

export async function registerUser(userData: RegistrationUserData) {
	if (!userData) {
		throw new Error("Invalid user data");
	}

	const payload = {
		name: userData.name,
		email: userData.email,
		password: userData.password,
	};

	return await apiClient<SafeUserDetails>(registerUrl, {
		method: "POST",
		payload,
	});
}

export async function loginUser(userData: LoginUserData) {
	const { email, password } = userData;
	if (!email || !password) {
		throw new Error("Email and password are required");
	}

	const response = await apiClient<LoginResponseDetails>(loginUrl, {
		method: "POST",
		payload: userData,
	});

	if (response && response.user && response.token) {
		localStorage.setItem("token", response.token); // Setting fresh token on Log in
	}
	return response;
}

export function logoutUser() {
	localStorage.removeItem("token");
}
