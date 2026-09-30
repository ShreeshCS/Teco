export interface RegistrationUserData {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
}

export interface LoginUserData {
	email: string;
	password: string;
}
export interface SafeUserDetails {
	id: string;
	name: string;
	email: string;
	createdAt: string;
}

export interface LoginResponseDetails {
	user: { id: string; email: string };
	token: string;
}
