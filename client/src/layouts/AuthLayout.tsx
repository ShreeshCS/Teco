import { Outlet } from "react-router-dom";
import "./AuthLayout.css";
import logo from "../assets/Teco_Logo.png";

export default function AuthLayout() {
	return (
		<div className="auth-wrapper">
			{/* 1. Header / Branding */}
			<header className="auth-header">
				<img src={logo} className="retro-logo" alt="Teco Logo" />
			</header>

			{/* 2. Centered Card Container */}
			<main className="auth-card">
				{/* React Router mounts LoginPage or RegisterPage here */}
				<Outlet />
			</main>

			{/* 3. Common Footer */}
			<footer className="auth-footer">
				<p>
					&copy; {new Date().getFullYear()} Teco. All rights reserved.
				</p>
			</footer>
		</div>
	);
}
