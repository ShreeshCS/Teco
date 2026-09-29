import type { RegistrationUserData, SafeUser } from "../../types/auth.types";
import routes from "../../constants/urls";
interface ApiErrorResponse {
	message?: string;
	error?: string;
}

const appUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
const registerUrl = `${appUrl}${routes.api.auth.register}`;
const loginUrl = `${appUrl}${routes.api.auth.login}`;

export async function registerUser(
	userData: RegistrationUserData,
): Promise<SafeUser> {
	if (!userData) {
		throw new Error("Invalid user data");
	}

	const payload = {
		name: userData.name,
		email: userData.email,
		password: userData.password,
	};

	const response = await fetch(registerUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	const data = await response.json().catch(() => null);

	if (!response.ok) {
		const errorData = data as ApiErrorResponse | null;
		throw new Error(
			errorData?.message ||
				errorData?.error ||
				`Registration failed with status ${response.status}`,
		);
	}

	return data as SafeUser;
}

export async function loginUser(userData: {
	email: string;
	password: string;
}): Promise<boolean> {
	const { email, password } = userData;
	if (!email || !password) {
		throw new Error("Email and password are required");
	}

	const payload = { email, password };

	const response: Response = await fetch(loginUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	const data: {
		user: string;
		token: string;
	} = await response.json().catch(() => null);

	if (!response.ok) {
		const errorData = data as ApiErrorResponse | null;
		throw new Error(
			errorData?.message ||
				errorData?.error ||
				`Login failed with status ${response.status}`,
		);
	}

	localStorage.setItem("token", data.token);

	return data ? true : false;
}
