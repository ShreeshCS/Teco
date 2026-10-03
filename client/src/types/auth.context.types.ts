import type { SafeUserDetails } from "./auth.types";

export type AuthContextType = {
	user: SafeUserDetails | null;
	token: string | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	signIn: (user: SafeUserDetails, token: string) => void;
	signOut: () => void;
};
