// src/pages/auth/LoginPage.tsx
import { Link } from "react-router-dom";
import LoginForm from "../../components/forms/LoginForm";
import "./LoginPage.scss"; // Reuses .retro-pixel-text styling

export default function LoginPage() {
	return (
		<div className="retro-pixel-text">
			<LoginForm />
			<p className="auth-switch-prompt">
				Don&apos;t have an account?{" "}
				<Link to="/register">Create one</Link>
			</p>
		</div>
	);
}
