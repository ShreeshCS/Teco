import {
	useState,
	useEffect,
	type ReactNode,
	useCallback,
	useMemo,
} from "react";
import { AuthContext } from "./AuthContext";
import type { SafeUserDetails } from "../types/auth.types";
import { pingMe } from "../services/user/user.service";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<SafeUserDetails | null>(null);
	const [token, setToken] = useState<string | null>(() =>
		localStorage.getItem("token"),
	);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

	const signIn = useCallback(
		(nextUser: SafeUserDetails, nextToken: string) => {
			localStorage.setItem("token", nextToken);
			setUser(nextUser);
			setToken(nextToken);
			setIsAuthenticated(true);
			setIsLoading(false);
		},
		[],
	);

	const signOut = useCallback(() => {
		localStorage.removeItem("token");
		setUser(null);
		setToken(null);
		setIsAuthenticated(false);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		const verifySession = async () => {
			const storedToken = localStorage.getItem("token");

			if (!storedToken) {
				setIsLoading(false);
				return;
			}
			try {
				const response = await pingMe(storedToken);
				if (response) {
					signIn(response, storedToken);
					console.log("Session verification success");
				}
			} catch (error) {
				signOut();
				console.error("Session verification failed:", error);
			}
		};

		verifySession();
	}, [signIn, signOut]);

	const value = useMemo(
		() => ({
			user,
			token,
			isLoading,
			isAuthenticated,
			signIn,
			signOut,
		}),
		[user, token, isLoading, isAuthenticated, signIn, signOut],
	);

	return <AuthContext value={value}>{children}</AuthContext>;
}
