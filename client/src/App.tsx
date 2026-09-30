import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AuthLayout from "./layouts/AuthLayout";
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
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

			<BrowserRouter>
				<Routes>
					{/* Auth routes share the AuthLayout shell */}
					<Route element={<AuthLayout />}>
						<Route path="/register" element={<RegisterPage />} />
						<Route path="/login" element={<LoginPage />} />
					</Route>

					{/* Default route redirect */}
					<Route
						path="/"
						element={<Navigate to="/login" replace />}
					/>
					<Route path="/chat" element={<ChatInterface />} />
					<Route path="*" element={<div>404: Not Found</div>} />
				</Routes>
			</BrowserRouter>
		</div>
	);
}

export default App;
