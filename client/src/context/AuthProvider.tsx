import { useState, useEffect, type ReactNode } from "react";
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
					setUser(response);
					setIsAuthenticated(true);
					console.log("Session verification success");
				}
			} catch (error) {
				setIsAuthenticated(false);
				console.error("Session verification failed:", error);
			} finally {
				setIsLoading(false);
			}
		};

		verifySession();
	}, []);

	return (
		<AuthContext
			value={{
				user,
				token,
				setToken,
				setUser,
				isLoading,
				isAuthenticated,
			}}
		>
			{children}
		</AuthContext>
	);
}
