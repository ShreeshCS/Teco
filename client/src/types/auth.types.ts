export interface RegistrationUserData {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
}

export interface SafeUser {
	id: string;
	name: string;
	email: string;
	createdAt: string;
}
