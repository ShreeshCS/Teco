// src/pages/auth/RegisterPage.tsx
import { Link } from "react-router-dom";
import RegisterForm from "../../components/forms/RegisterForm";
import "./RegisterPage.scss";

export default function RegisterPage() {
	return (
		<div className="retro-pixel-text">
			<RegisterForm />
			<p className="auth-switch-prompt">
				Already have an account? <Link to="/login">Sign In</Link>
			</p>
		</div>
	);
}
