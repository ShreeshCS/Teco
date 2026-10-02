import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute() {
	const { isAuthenticated, isLoading } = useAuth();

	// Show a blank screen or spinner while checking /auth/me on refresh
	if (isLoading) {
		return <div className="loading-screen">Loading session...</div>;
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return (
		<>
			<Outlet />
		</>
	);
}
