import { useContext } from "react";
import type { AuthContextType } from "../types/auth.context.types";
import { AuthContext } from "../context/AuthContext";

// Custom hook for consuming auth in any component
export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
