import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AuthLayout from "./layouts/AuthLayout";
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				{/* Auth routes share the AuthLayout shell */}
				<Route element={<AuthLayout />}>
					<Route path="/register" element={<RegisterPage />} />
					<Route path="/login" element={<LoginPage />} />
				</Route>
				
				{/* Default route redirect */}
				<Route path="/" element={<Navigate to="/login" replace />} />
				<Route path="*" element={<div>404: Not Found</div>} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
