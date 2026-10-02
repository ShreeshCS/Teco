import type { SafeUserDetails } from "./auth.types";

export type AuthContextType = {
	user: SafeUserDetails | null;
	token: string | null;
	setToken: (token: string | null) => void;
	setUser: (user: SafeUserDetails | null) => void;
	isLoading: boolean;
	isAuthenticated: boolean;
};
