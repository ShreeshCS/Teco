import { createContext } from "react";
import type { AuthContextType } from "../types/auth.context.types";

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined,
);
