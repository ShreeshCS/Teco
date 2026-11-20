import { Outlet } from "react-router-dom";
import "./AuthLayout.css";
import logo from "../assets/Teco_Logo.png";

interface AuthLayoutProps {
	isDark: boolean;
	onToggleTheme: () => void;
}

export default function AuthLayout({ isDark, onToggleTheme }: AuthLayoutProps) {
	return (
		<div className="auth-wrapper">
			<button
				type="button"
				className="theme-toggle auth-theme-toggle"
				onClick={onToggleTheme}
				title={isDark ? "Switch to light mode" : "Switch to dark mode"}
				aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
				aria-pressed={isDark}
			>
				<span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
				<span>{isDark ? "Light mode" : "Dark mode"}</span>
			</button>

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
