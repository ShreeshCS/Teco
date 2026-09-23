import type { RegistrationUserData, SafeUser } from "../../types/auth.types";

interface ApiErrorResponse {
	message?: string;
	error?: string;
}

const appUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const authServiceUrl = `${appUrl}/auth`;
const registerEndpoint = `${authServiceUrl}/register`;
const loginEndpoint = `${authServiceUrl}/login`;

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

	const response = await fetch(registerEndpoint, {
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

	const response = await fetch(loginEndpoint, {
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
				`Login failed with status ${response.status}`,
		);
	}

	return data.success as boolean;
}
