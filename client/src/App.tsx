import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AuthLayout from "./layouts/AuthLayout";
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./layouts/ProtectedRoute";
import PublicRoute from "./layouts/PublicRoute";
import { AuthProvider } from "./context/AuthProvider";
import ChatLayout from "./layouts/ChatLayout";
import ChatInterface from "./pages/chat/ChatInterface";

function App() {
	const [isDark, setIsDark] = useState(true);

	return (
		<div className={`app-shell ${isDark ? "theme-dark" : "theme-light"}`}>
			<button
				type="button"
				className="theme-toggle"
				onClick={() => setIsDark((current) => !current)}
			>
				{isDark ? "☀️ Light mode" : "🌙 Dark mode"}
			</button>
			<AuthProvider>
				<BrowserRouter>
					<Routes>
						{/* PublicRoute redirects authenticated users to chat page */}
						<Route element={<PublicRoute />}>
							{/* Auth routes share the AuthLayout shell */}
							<Route element={<AuthLayout />}>
								<Route
									path="/register"
									element={<RegisterPage />}
								/>
								<Route path="/login" element={<LoginPage />} />
							</Route>
						</Route>

						{/* Default route redirect */}
						<Route
							path="/"
							element={<Navigate to="/login" replace />}
						/>
						<Route element={<ProtectedRoute />}>
							<Route element={<ChatLayout />}>
								<Route
									path="/chat"
									element={<ChatInterface />}
								/>
							</Route>
						</Route>
						<Route path="*" element={<div>404: Not Found</div>} />
					</Routes>
				</BrowserRouter>
			</AuthProvider>
		</div>
	);
}

export default App;
